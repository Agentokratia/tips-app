/**
 * x402 Server Configuration
 *
 * Sets up the facilitator client and payment schemes for processing.
 * Supports two schemes:
 * - exact: Direct USDC payments via ERC-3009
 * - escrow: Swap payments (WETH, DAI, etc. → USDC) via Permit2
 */

import { HTTPFacilitatorClient, EscrowScheme } from "@agentokratia/x402-escrow/server";
import { x402ResourceServer } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";

const FACILITATOR_URL = process.env.FACILITATOR_URL || "https://facilitator.agentokratia.com";
const FACILITATOR_API_KEY = process.env.FACILITATOR_API_KEY || "";

// 1. Create facilitator client (handles /supported, /verify, /settle)
export const facilitator = new HTTPFacilitatorClient({
  url: FACILITATOR_URL,
  createAuthHeaders: async () => ({
    verify: { Authorization: `Bearer ${FACILITATOR_API_KEY}` },
    settle: { Authorization: `Bearer ${FACILITATOR_API_KEY}` },
    supported: { Authorization: `Bearer ${FACILITATOR_API_KEY}` },
  }),
});

// 2. Create escrow scheme for swap payments (Permit2)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const escrow = new EscrowScheme({
  facilitator: facilitator as any,
  apiKey: FACILITATOR_API_KEY,
});

// 3. Create exact scheme instance
const exactScheme = new ExactEvmScheme();

// 4. Create x402 resource server with both exact and escrow schemes
let _server: x402ResourceServer | null = null;

/**
 * Get or create the x402 resource server with both schemes registered.
 * Uses lazy initialization to ensure facilitator is connected.
 */
export async function getServer(): Promise<x402ResourceServer> {
  if (_server) return _server;

  // Create server with facilitator
  _server = new x402ResourceServer(facilitator);

  // Fetch supported networks from facilitator
  const supported = await facilitator.getSupported();

  // Register schemes for each supported network
  for (const kind of supported.kinds) {
    if (kind.scheme === "exact") {
      // Register exact scheme for specific network
      _server.register(kind.network, exactScheme);
    } else if (kind.scheme === "escrow") {
      // Register escrow scheme for specific network
      _server.register(kind.network, escrow);
    }
  }

  // Initialize to fetch supported kinds
  await _server.initialize();

  return _server;
}

// Cache for supported networks
let _supportedNetworks: string[] | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supportedData: any = null;

interface SupportedInputToken {
  address: string;
  symbol: string;
  decimals: number;
}

interface SettlementToken {
  address: string;
  symbol: string;
  decimals: number;
}

/**
 * Get list of supported networks (for validation)
 * Networks that have either exact or escrow scheme
 */
export async function getSupportedNetworks(): Promise<string[]> {
  if (_supportedNetworks) return _supportedNetworks;

  const supported = await facilitator.getSupported();
  const networks = new Set<string>();

  for (const kind of supported.kinds) {
    if (kind.scheme === "exact" || kind.scheme === "escrow") {
      networks.add(kind.network);
    }
  }

  _supportedNetworks = Array.from(networks);
  return _supportedNetworks;
}

/**
 * Get full supported data (for /api/supported proxy)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSupportedData(): Promise<any> {
  if (_supportedData) return _supportedData;

  _supportedData = await facilitator.getSupported();
  return _supportedData;
}

/**
 * Network configuration extracted from facilitator
 */
export interface NetworkConfig {
  network: string;
  chainId: number;
  name: string;
  supportedInputTokens: SupportedInputToken[];
  settlementTokens: SettlementToken[];
}

/**
 * Get chain name from viem's chain registry (dynamic, no hardcoding)
 */
async function getChainName(chainId: number): Promise<string> {
  // Dynamic import to avoid bundling all chains
  const chains = await import("viem/chains");
  const chain = Object.values(chains).find(
    (c) => typeof c === "object" && c !== null && "id" in c && c.id === chainId
  );
  return (chain as { name?: string })?.name || `Chain ${chainId}`;
}

/**
 * Get network configs from facilitator (for UI)
 *
 * Combines tokens from both exact and escrow schemes:
 * - exact: USDC for direct payments
 * - escrow: Other tokens for swap payments
 */
export async function getNetworkConfigs(): Promise<NetworkConfig[]> {
  const supported = await getSupportedData();

  // Group by network
  const networkMap = new Map<string, {
    exactAsset?: string;
    exactExtra?: Record<string, unknown>;
    escrowExtra?: Record<string, unknown>;
  }>();

  for (const kind of supported.kinds) {
    if (kind.scheme !== "exact" && kind.scheme !== "escrow") continue;

    let entry = networkMap.get(kind.network);
    if (!entry) {
      entry = {};
      networkMap.set(kind.network, entry);
    }

    if (kind.scheme === "exact") {
      entry.exactAsset = kind.asset;
      entry.exactExtra = kind.extra as Record<string, unknown>;
    } else if (kind.scheme === "escrow") {
      entry.escrowExtra = kind.extra as Record<string, unknown>;
    }
  }

  const configs: NetworkConfig[] = [];

  for (const [network, entry] of networkMap) {
    const chainId = parseInt(network.split(":")[1], 10);
    const name = await getChainName(chainId);

    // Start with escrow's supportedInputTokens (for swaps)
    const inputTokens: SupportedInputToken[] = [
      ...((entry.escrowExtra?.supportedInputTokens as SupportedInputToken[]) || []),
    ];

    // Add USDC from exact scheme if not already present
    if (entry.exactAsset) {
      const usdcAlreadyIncluded = inputTokens.some(
        (t) => t.address.toLowerCase() === entry.exactAsset!.toLowerCase()
      );
      if (!usdcAlreadyIncluded) {
        // Add USDC at the beginning (preferred option)
        inputTokens.unshift({
          address: entry.exactAsset,
          symbol: "USDC",
          decimals: 6,
        });
      }
    }

    configs.push({
      network,
      chainId,
      name,
      supportedInputTokens: inputTokens,
      settlementTokens:
        (entry.escrowExtra?.settlementTokens as SettlementToken[]) || [],
    });
  }

  return configs;
}

/**
 * Clear cached data (useful for testing)
 */
export function clearCache(): void {
  _supportedNetworks = null;
  _supportedData = null;
}
