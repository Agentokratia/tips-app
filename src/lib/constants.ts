/**
 * Constants
 *
 * Network IDs, token addresses, and other constants.
 */

// Default network (Base mainnet)
export const DEFAULT_NETWORK = "eip155:8453";

// USDC addresses by network (Base only - matches wagmi.ts config)
export const USDC_ADDRESSES: Record<string, string> = {
  "eip155:8453": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base
  "eip155:84532": "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
};

// Chain IDs to network IDs (Base only)
export const CHAIN_TO_NETWORK: Record<number, string> = {
  8453: "eip155:8453",
  84532: "eip155:84532",
};

// Network IDs to chain IDs (Base only)
export const NETWORK_TO_CHAIN: Record<string, number> = {
  "eip155:8453": 8453,
  "eip155:84532": 84532,
};

// Facilitator URL
export const FACILITATOR_URL =
  process.env.FACILITATOR_URL || "https://facilitator.agentokratia.com";
