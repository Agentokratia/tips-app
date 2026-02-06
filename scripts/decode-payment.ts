#!/usr/bin/env npx tsx
/**
 * Decode x402 Payment Requirements
 *
 * Usage:
 *   npx tsx scripts/decode-payment.ts <base64-string>
 *   echo "base64..." | npx tsx scripts/decode-payment.ts
 */

interface SwapData {
  inputToken: string;
  outputToken: string;
  outputAmount: string;
  maxInputAmount: string;
  aggregator: string;
  aggregatorCalldata: string;
}

interface PaymentRequirement {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: {
    collectorType?: string;
    escrowContract?: string;
    facilitator?: string;
    permit2?: string;
    refundWindow?: number;
    authorizationDuration?: number;
    tokenCollector?: string;
    swapData?: SwapData;
    name?: string;
    version?: string;
  };
}

// Token addresses on Base mainnet
const KNOWN_TOKENS: Record<string, string> = {
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": "USDC",
  "0x4200000000000000000000000000000000000006": "WETH",
  "0x50c5725949a6f0c72e6c4a641f24049a917db0cb": "DAI",
  "0xdff3c626de2ccd1ecf67e97abc8a74c102c86545": "KROM",
  "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2": "USDT",
};

// Aggregator addresses (Base mainnet)
const KNOWN_AGGREGATORS: Record<string, string> = {
  "0x6a000f20005980200259b80c5102003040001068": "Paraswap (Augustus V6.2)",
  "0x6ff5693b99212da76ad316178a184ab56d299b43": "Uniswap (Universal Router)",
  "0x6352a56caadc4f1e25cd6c75970fa768a3304e64": "OpenOcean",
};

function getTokenName(address: string): string {
  return KNOWN_TOKENS[address.toLowerCase()] || address.slice(0, 10) + "...";
}

function getAggregatorName(address: string | undefined): string {
  if (!address) return "N/A";
  return KNOWN_AGGREGATORS[address.toLowerCase()] || address.slice(0, 10) + "...";
}

function formatAmount(amount: string, decimals: number = 6): string {
  const value = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const fraction = value % divisor;
  const fractionStr = fraction.toString().padStart(decimals, "0");
  // For 18 decimals, show more precision
  const precision = decimals > 6 ? 8 : 4;
  return `${whole}.${fractionStr.slice(0, precision)}`;
}

function decodePaymentRequirements(base64: string): PaymentRequirement[] {
  const json = Buffer.from(base64, "base64").toString("utf8");
  return JSON.parse(json);
}

function printSummary(requirements: PaymentRequirement[]) {
  console.log("\n=== Payment Options ===\n");

  requirements.forEach((req, i) => {
    const extra = req.extra;
    const swapData = extra.swapData;

    console.log(`[${i + 1}] ${req.scheme.toUpperCase()}`);
    console.log(`    Network: ${req.network}`);
    console.log(`    Amount: ${formatAmount(req.amount)} USDC`);
    console.log(`    Pay To: ${req.payTo.slice(0, 10)}...`);

    if (extra.collectorType) {
      console.log(`    Collector: ${extra.collectorType}`);
    }

    if (swapData) {
      const inputDecimals = swapData.inputToken.toLowerCase() === "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" ? 6 : 18;
      console.log(`    Input Token: ${getTokenName(swapData.inputToken)}`);
      console.log(`    Max Input: ${formatAmount(swapData.maxInputAmount, inputDecimals)}`);
      console.log(`    Aggregator: ${getAggregatorName(swapData.aggregator)}`);
      if (swapData.aggregatorCalldata) {
        console.log(`    Calldata Length: ${swapData.aggregatorCalldata.length} chars`);
      }
    }

    console.log("");
  });
}

async function main() {
  let base64Input: string;

  // Check for argument or stdin
  if (process.argv[2]) {
    base64Input = process.argv[2];
  } else {
    // Read from stdin
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    base64Input = Buffer.concat(chunks).toString().trim();
  }

  if (!base64Input) {
    console.error("Usage: npx tsx scripts/decode-payment.ts <base64-string>");
    console.error("   or: echo 'base64...' | npx tsx scripts/decode-payment.ts");
    process.exit(1);
  }

  try {
    const requirements = decodePaymentRequirements(base64Input);
    printSummary(requirements);

    // Also output raw JSON for debugging
    if (process.argv.includes("--json")) {
      console.log("\n=== Raw JSON ===\n");
      console.log(JSON.stringify(requirements, null, 2));
    }
  } catch (error) {
    console.error("Failed to decode:", error);
    process.exit(1);
  }
}

main();
