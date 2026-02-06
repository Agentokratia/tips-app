/**
 * Name Resolution Helper
 *
 * Resolves ENS names (.eth on mainnet) and Basenames (.base.eth on Base)
 * to addresses and validates Ethereum addresses.
 */

import { createPublicClient, http, isAddress, getAddress } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";

// Mainnet client for both ENS (.eth) and Basenames (.base.eth) resolution
// Basenames use CCIP-read via the L1 resolver on Ethereum mainnet
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.MAINNET_RPC_URL || "https://eth.drpc.org"),
});

/**
 * Resolve a recipient string to an Ethereum address.
 * Supports: Ethereum addresses, ENS names (.eth), Basenames (.base.eth or just name)
 *
 * @param to - Address, ENS name, or Basename
 * @returns The checksummed address, or null if invalid/not found
 */
export async function resolveRecipient(to: string): Promise<string | null> {
  // If it's already a valid address, return it checksummed
  if (isAddress(to)) {
    return getAddress(to);
  }

  // Basenames: .base.eth (resolves via CCIP-read on mainnet)
  if (to.endsWith(".base.eth")) {
    try {
      const address = await mainnetClient.getEnsAddress({ name: normalize(to) });
      return address ? getAddress(address) : null;
    } catch {
      return null;
    }
  }

  // ENS: .eth (but not .base.eth)
  if (to.endsWith(".eth")) {
    try {
      const address = await mainnetClient.getEnsAddress({ name: normalize(to) });
      return address ? getAddress(address) : null;
    } catch {
      return null;
    }
  }

  // Try as Basename without suffix (e.g., "jesse" -> "jesse.base.eth")
  if (/^[a-z0-9-]+$/i.test(to) && to.length >= 3) {
    try {
      const address = await mainnetClient.getEnsAddress({
        name: normalize(`${to}.base.eth`),
      });
      return address ? getAddress(address) : null;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Resolve name with full metadata (avatar, etc.)
 * Supports ENS (.eth) and Basenames (.base.eth)
 *
 * @param name - The name to resolve
 * @returns Object with address, avatar, and resolved name
 */
export async function resolveNameWithMetadata(name: string): Promise<{
  address: string | null;
  avatar: string | null;
  name: string;
}> {
  // Basenames: .base.eth (resolves via CCIP-read on mainnet)
  if (name.endsWith(".base.eth")) {
    try {
      const address = await mainnetClient.getEnsAddress({ name: normalize(name) });
      if (!address) {
        return { address: null, avatar: null, name };
      }

      let avatar: string | null = null;
      try {
        avatar = await mainnetClient.getEnsText({
          name: normalize(name),
          key: "avatar",
        });
      } catch {
        // Avatar resolution can fail
      }

      return { address: getAddress(address), avatar, name };
    } catch {
      return { address: null, avatar: null, name };
    }
  }

  // ENS: .eth
  if (name.endsWith(".eth")) {
    try {
      const address = await mainnetClient.getEnsAddress({ name: normalize(name) });
      if (!address) {
        return { address: null, avatar: null, name };
      }

      let avatar: string | null = null;
      try {
        avatar = await mainnetClient.getEnsAvatar({ name: normalize(name) });
      } catch {
        // Avatar resolution can fail
      }

      return { address: getAddress(address), avatar, name };
    } catch {
      return { address: null, avatar: null, name };
    }
  }

  // Try as Basename without suffix
  if (/^[a-z0-9-]+$/i.test(name) && name.length >= 3) {
    const fullName = `${name}.base.eth`;
    const result = await resolveNameWithMetadata(fullName);
    if (result.address) {
      return result;
    }
  }

  return { address: null, avatar: null, name };
}

// Legacy export for backwards compatibility
export const resolveEnsWithMetadata = resolveNameWithMetadata;
