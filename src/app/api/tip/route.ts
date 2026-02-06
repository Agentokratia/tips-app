/**
 * x402 Tip API Endpoint
 *
 * Single endpoint for both humans and agents:
 * - GET without PAYMENT-SIGNATURE header → 402 with payment requirements
 * - GET with PAYMENT-SIGNATURE header → 200 with payment receipt
 *
 * Query params:
 * - to: Recipient address or ENS name (required)
 * - amount: USD amount (required, e.g., "1.00")
 * - network: Network ID (optional, defaults to first supported network)
 */

import { NextRequest, NextResponse } from "next/server";
import { escrow, facilitator, getSupportedNetworks, getServer } from "@/lib/x402";
import { preprocessSwapPayload } from "@agentokratia/x402-escrow/server";
import { resolveRecipient } from "@/lib/ens";
import type { PaymentRequirements } from "@/lib/types";

// =============================================================================
// Payment Requirements Cache - DISABLED for debugging
// DEX calldata expires quickly, so always fetch fresh quotes
// =============================================================================

// Cache disabled - always return null
function getCachedRequirements(_key: string): PaymentRequirements[] | null {
  return null;
}

// Cache disabled - no-op
function cacheRequirements(_key: string, _requirements: PaymentRequirements[]): void {
  // no-op
}

function getCacheKey(network: string, amount: string, recipient: string): string {
  return `${network}:${amount}:${recipient.toLowerCase()}`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const to = searchParams.get("to");
  const amount = searchParams.get("amount");
  let network = searchParams.get("network");

  // Validate required params
  if (!to || !amount) {
    return NextResponse.json(
      { error: "Missing required parameters: to, amount" },
      { status: 400 }
    );
  }

  // Validate amount
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return NextResponse.json(
      { error: "Invalid amount. Must be a positive number." },
      { status: 400 }
    );
  }

  // Resolve recipient
  const recipientAddress = await resolveRecipient(to);
  if (!recipientAddress) {
    return NextResponse.json(
      { error: `Could not resolve recipient: ${to}` },
      { status: 400 }
    );
  }

  // Get supported networks
  const supportedNetworks = await getSupportedNetworks();
  if (supportedNetworks.length === 0) {
    return NextResponse.json(
      { error: "No networks supported by facilitator" },
      { status: 500 }
    );
  }

  // Default to first supported network if not specified
  if (!network) {
    network = supportedNetworks[0];
  }

  // Validate network format
  if (!network.match(/^eip155:\d+$/)) {
    return NextResponse.json(
      { error: "Invalid network format. Use eip155:CHAINID" },
      { status: 400 }
    );
  }

  // Validate network is supported
  if (!supportedNetworks.includes(network)) {
    return NextResponse.json(
      { error: `Network ${network} not supported`, supportedNetworks },
      { status: 400 }
    );
  }

  // Check for payment signature header (x402 v2)
  const paymentSignature = request.headers.get("payment-signature");

  if (!paymentSignature) {
    // No payment header → return 402 with payment requirements
    return handle402Response(to, amount, network, recipientAddress);
  }

  // Has payment header → verify and settle
  return handlePaymentSubmission(
    to,
    amount,
    network,
    recipientAddress,
    paymentSignature
  );
}

type Network = `${string}:${string}`;

/**
 * Handle 402 response - build and return payment requirements
 *
 * Builds accepts from both schemes:
 * - exact: For direct USDC payments (ERC-3009) via x402ResourceServer
 * - escrow: For swap payments (Permit2) via EscrowScheme.buildAccepts
 *
 * Results are cached until the earliest quote expires (from expiresAt).
 */
async function handle402Response(
  to: string,
  amount: string,
  network: string,
  recipientAddress: string
): Promise<NextResponse> {
  try {
    // Check cache first (uses expiresAt from quotes)
    const cacheKey = getCacheKey(network, amount, recipientAddress);
    const cached = getCachedRequirements(cacheKey);
    if (cached) {
      console.log(`[tip] Cache hit for ${cacheKey}`);
      const paymentRequired = Buffer.from(JSON.stringify(cached)).toString("base64");
      const response = NextResponse.json(
        { message: "Payment required (cached)", recipient: to, amount, network },
        { status: 402 }
      );
      response.headers.set("PAYMENT-REQUIRED", paymentRequired);
      response.headers.set("Access-Control-Expose-Headers", "PAYMENT-REQUIRED, PAYMENT-RESPONSE");
      return response;
    }

    const paymentRequirements: PaymentRequirements[] = [];

    // Fetch exact and escrow accepts in parallel (Vercel rule: async-parallel)
    const [exactResult, escrowResult] = await Promise.allSettled([
      // 1. Build exact accepts (USDC direct via ERC-3009)
      (async () => {
        const server = await getServer();
        return server.buildPaymentRequirements({
          scheme: "exact",
          network: network as Network,
          price: `$${amount}`,
          payTo: recipientAddress,
          maxTimeoutSeconds: 600,
        });
      })(),
      // 2. Build escrow accepts (swaps via Permit2) - resolved in parallel
      escrow.buildAcceptsResolved({
        network: network as Network,
        price: `$${amount}`,
        payTo: recipientAddress,
      }),
    ]);

    // Process exact requirements
    if (exactResult.status === "fulfilled") {
      for (const req of exactResult.value) {
        paymentRequirements.push({
          scheme: req.scheme,
          network: req.network,
          asset: req.asset || "",
          amount: req.amount,
          payTo: req.payTo,
          maxTimeoutSeconds: req.maxTimeoutSeconds || 600,
          extra: (req.extra as Record<string, unknown>) || {},
        });
      }
    } else {
      console.warn("Could not build exact requirements:", exactResult.reason?.message);
    }

    // Process escrow accepts (already resolved in parallel by buildAcceptsResolved)
    if (escrowResult.status === "fulfilled") {
      for (const accept of escrowResult.value) {
        const price = accept.price;
        const priceObj =
          typeof price === "object" && price !== null
            ? (price as { amount: string; asset: string; extra?: Record<string, unknown> })
            : { amount: String(price), asset: "", extra: {} };

        paymentRequirements.push({
          scheme: accept.scheme,
          network: accept.network,
          asset: priceObj.asset || "",
          amount: priceObj.amount,
          payTo: accept.payTo,
          maxTimeoutSeconds: accept.maxTimeoutSeconds || 600,
          extra: priceObj.extra || {},
        });
      }
    } else {
      console.warn("Could not build escrow accepts:", escrowResult.reason?.message);
    }

    if (paymentRequirements.length === 0) {
      return NextResponse.json(
        { error: "No payment options available" },
        { status: 500 }
      );
    }

    // Cache results using expiresAt from quotes
    cacheRequirements(cacheKey, paymentRequirements);

    // Encode as base64 for PAYMENT-REQUIRED header
    const paymentRequired = Buffer.from(
      JSON.stringify(paymentRequirements)
    ).toString("base64");

    // Return 402 with payment requirements
    const response = NextResponse.json(
      {
        message: "Payment required",
        recipient: to,
        amount,
        network,
      },
      { status: 402 }
    );

    response.headers.set("PAYMENT-REQUIRED", paymentRequired);
    response.headers.set("Access-Control-Expose-Headers", "PAYMENT-REQUIRED, PAYMENT-RESPONSE");

    return response;
  } catch (error) {
    console.error("Error building payment requirements:", error);
    return NextResponse.json(
      { error: `Failed to build payment requirements: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

/**
 * Handle payment submission - verify and settle
 */
async function handlePaymentSubmission(
  to: string,
  amount: string,
  network: string,
  recipientAddress: string,
  paymentSignature: string
): Promise<NextResponse> {
  try {
    // Decode payment payload from base64
    const paymentPayloadStr = Buffer.from(paymentSignature, "base64").toString();
    const paymentPayload = JSON.parse(paymentPayloadStr);

    const { accepted, payload } = paymentPayload;

    if (!accepted || !payload) {
      return NextResponse.json(
        { error: "Invalid payment payload: missing accepted or payload" },
        { status: 400 }
      );
    }

    // Build the full PaymentPayload object for the facilitator
    // The facilitator expects: { x402Version, resource, accepted, payload }
    const fullPaymentPayload = {
      x402Version: paymentPayload.x402Version || 2,
      resource: {
        url: `/api/tip?to=${to}&amount=${amount}&network=${network}`,
        description: `Tip of $${amount} to ${to}`,
        mimeType: "application/json",
      },
      accepted,
      payload,
    };

    // Preprocess to decompress swap calldata before forwarding to facilitator
    // Server compresses in buildAccepts, client passes through compressed,
    // server decompresses here before facilitator processes
    const processedPayload = preprocessSwapPayload(fullPaymentPayload);
    const processedAccepted = processedPayload.accepted;

    // Verify the payment with the facilitator
    // FacilitatorClient.verify takes (paymentPayload, paymentRequirements)
    const verifyResult = await facilitator.verify(processedPayload, processedAccepted);

    if (!verifyResult.isValid) {
      const errorResponse = {
        success: false,
        errorReason: verifyResult.invalidReason || "Payment verification failed",
      };
      const response = NextResponse.json(errorResponse, { status: 402 });
      response.headers.set(
        "PAYMENT-RESPONSE",
        Buffer.from(JSON.stringify(errorResponse)).toString("base64")
      );
      response.headers.set("Access-Control-Expose-Headers", "PAYMENT-REQUIRED, PAYMENT-RESPONSE");
      return response;
    }

    // Settle the payment with the facilitator
    const settleResult = await facilitator.settle(processedPayload, processedAccepted);

    if (!settleResult.success) {
      const errorResponse = {
        success: false,
        errorReason: settleResult.errorReason || "Payment settlement failed",
      };
      const response = NextResponse.json(errorResponse, { status: 402 });
      response.headers.set(
        "PAYMENT-RESPONSE",
        Buffer.from(JSON.stringify(errorResponse)).toString("base64")
      );
      response.headers.set("Access-Control-Expose-Headers", "PAYMENT-REQUIRED, PAYMENT-RESPONSE");
      return response;
    }

    // Success! Return 200 with receipt
    const successResponse = {
      success: true,
      message: `Tip of $${amount} received by ${to}`,
      transaction: settleResult.transaction,
      network: settleResult.network || network,
      recipient: recipientAddress,
      amount,
    };

    const response = NextResponse.json(successResponse, { status: 200 });
    response.headers.set(
      "PAYMENT-RESPONSE",
      Buffer.from(JSON.stringify(successResponse)).toString("base64")
    );
    response.headers.set("Access-Control-Expose-Headers", "PAYMENT-REQUIRED, PAYMENT-RESPONSE");

    return response;
  } catch (error) {
    console.error("Error processing payment:", error);
    const errorResponse = {
      success: false,
      errorReason: `Payment processing error: ${(error as Error).message}`,
    };
    const response = NextResponse.json(errorResponse, { status: 500 });
    response.headers.set(
      "PAYMENT-RESPONSE",
      Buffer.from(JSON.stringify(errorResponse)).toString("base64")
    );
    response.headers.set("Access-Control-Expose-Headers", "PAYMENT-REQUIRED, PAYMENT-RESPONSE");
    return response;
  }
}

/**
 * Handle OPTIONS for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, PAYMENT-SIGNATURE",
      "Access-Control-Expose-Headers": "PAYMENT-REQUIRED, PAYMENT-RESPONSE",
    },
  });
}
