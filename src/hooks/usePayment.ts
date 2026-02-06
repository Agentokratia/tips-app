"use client";

import { useMutation } from "@tanstack/react-query";
import { x402Client } from "@x402/core/client";
import { ExactEvmScheme, type ClientEvmSigner } from "@x402/evm";
import { EscrowScheme } from "@agentokratia/x402-escrow/client";
import type { WalletClient } from "viem";
import type { PaymentRequirements, PaymentResult } from "@/lib/types";

// Local type for policy requirements (matches x402 internal structure)
type PolicyRequirements = {
  scheme: string;
  asset?: string;
  extra?: Record<string, unknown>;
};

interface PaymentParams {
  recipient: string;
  amount: string;
  network: string;
  inputToken: string;
  paymentRequirements: PaymentRequirements[];
  walletClient: WalletClient;
}

/**
 * Create a policy that filters requirements to match the selected input token.
 * - For exact scheme: matches by asset address
 * - For escrow scheme: matches by swapData.inputToken or asset
 */
function createInputTokenPolicy(inputToken: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (_version: number, requirements: any[]): any[] => {
    const normalizedInput = inputToken.toLowerCase();

    return requirements.filter((req: PolicyRequirements) => {
      // For exact scheme, match by asset
      if (req.scheme === "exact") {
        return req.asset?.toLowerCase() === normalizedInput;
      }

      // For escrow scheme, check swapData.inputToken or asset
      const extra = req.extra as Record<string, unknown> | undefined;
      const swapData = extra?.swapData as { inputToken?: string } | undefined;

      if (swapData?.inputToken) {
        return swapData.inputToken.toLowerCase() === normalizedInput;
      }

      return req.asset?.toLowerCase() === normalizedInput;
    });
  };
}

/**
 * Selector that prefers exact scheme over escrow when both are available.
 * This ensures USDC payments use the simpler ERC-3009 path.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const preferExactSelector = (_version: number, requirements: any[]): any => {
  // Prefer exact scheme (simpler, no swap needed)
  const exact = requirements.find((r: PolicyRequirements) => r.scheme === "exact");
  if (exact) return exact;

  // Fallback to first available (escrow/swap)
  return requirements[0];
};

/**
 * Convert wagmi WalletClient to x402 ClientEvmSigner
 */
function walletClientToSigner(walletClient: WalletClient): ClientEvmSigner {
  if (!walletClient.account) {
    throw new Error("Wallet not connected");
  }

  return {
    address: walletClient.account.address,
    signTypedData: async (message) => {
      return walletClient.signTypedData({
        account: walletClient.account!,
        domain: message.domain as Parameters<typeof walletClient.signTypedData>[0]["domain"],
        types: message.types as Parameters<typeof walletClient.signTypedData>[0]["types"],
        primaryType: message.primaryType,
        message: message.message,
      });
    },
  };
}

/**
 * Sign and submit payment using x402 client.
 *
 * Uses x402Client with policies to automatically select the right scheme
 * based on the selected input token.
 */
export function usePayment() {
  return useMutation({
    mutationFn: async ({
      recipient,
      amount,
      network,
      inputToken,
      paymentRequirements,
      walletClient,
    }: PaymentParams): Promise<PaymentResult> => {
      if (!walletClient.account) {
        throw new Error("Wallet not connected");
      }

      // Convert wallet client to signer for x402 schemes
      const signer = walletClientToSigner(walletClient);

      // Create x402 client with selector that prefers exact scheme
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = new x402Client(preferExactSelector as any);

      // Register policy to filter by input token
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client.registerPolicy(createInputTokenPolicy(inputToken) as any);

      // Register exact scheme for direct USDC payments (requires signer)
      const exactScheme = new ExactEvmScheme(signer);
      client.register(network as `${string}:${string}`, exactScheme);

      // Register escrow scheme for swap payments
      const escrowScheme = new EscrowScheme(walletClient);
      client.register(network as `${string}:${string}`, escrowScheme);

      // Build PaymentRequired object for the client
      const paymentRequired = {
        x402Version: 2,
        resource: { url: `/api/tip`, description: "Tip payment", mimeType: "application/json" },
        accepts: paymentRequirements,
      };

      // Create payment payload - client automatically selects scheme based on filtered requirements
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paymentPayload = await client.createPaymentPayload(paymentRequired as any);

      // Encode as base64 for PAYMENT-SIGNATURE header
      const signature = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");

      // Make request with payment header
      const params = new URLSearchParams({
        to: recipient,
        amount,
        network,
      });

      const res = await fetch(`/api/tip?${params}`, {
        method: "GET",
        headers: {
          "PAYMENT-SIGNATURE": signature,
        },
      });

      // Check for PAYMENT-RESPONSE header
      const paymentResponse = res.headers.get("PAYMENT-RESPONSE");
      if (paymentResponse) {
        const result = JSON.parse(
          Buffer.from(paymentResponse, "base64").toString()
        ) as PaymentResult;
        return result;
      }

      // Fallback to JSON body
      const result = (await res.json()) as PaymentResult;
      return result;
    },
  });
}
