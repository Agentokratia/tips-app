import { createPublicClient, http, isAddress, getAddress } from "viem";
import { mainnet, base } from "viem/chains";
import { normalize } from "viem/ens";
import { TipPageClient } from "./TipPageClient";

interface PageProps {
  params: Promise<{ recipient: string }>;
  searchParams: Promise<{ amount?: string; embed?: string }>;
}

// Mainnet client for .eth ENS resolution
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.MAINNET_RPC_URL || "https://eth.drpc.org"),
});

// Base client for .base.eth Basenames resolution
const baseClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || "https://mainnet.base.org"),
});

async function resolveBasename(name: string): Promise<{
  address: string | null;
  avatar: string | null;
}> {
  try {
    // Basenames (.base.eth) resolve via Ethereum mainnet using CCIP-read
    // The L1 resolver handles the cross-chain lookup to Base L2
    const address = await mainnetClient.getEnsAddress({
      name: normalize(name),
    });

    if (!address) {
      return { address: null, avatar: null };
    }

    let avatar: string | null = null;
    try {
      // Try to get avatar via CCIP-read as well
      avatar = await mainnetClient.getEnsText({
        name: normalize(name),
        key: "avatar",
      });
    } catch {
      // Avatar resolution can fail
    }

    return { address: getAddress(address), avatar };
  } catch (error) {
    console.error("[basename] Resolution error:", error);
    return { address: null, avatar: null };
  }
}

async function resolveEns(name: string): Promise<{
  address: string | null;
  avatar: string | null;
}> {
  try {
    const address = await mainnetClient.getEnsAddress({ name: normalize(name) });
    if (!address) {
      return { address: null, avatar: null };
    }

    let avatar: string | null = null;
    try {
      avatar = await mainnetClient.getEnsAvatar({ name: normalize(name) });
    } catch {
      // Avatar resolution can fail
    }

    return { address: getAddress(address), avatar };
  } catch {
    return { address: null, avatar: null };
  }
}

async function resolveRecipient(recipient: string) {
  const decoded = decodeURIComponent(recipient);

  // If it's already an address, return it
  if (isAddress(decoded)) {
    return {
      address: getAddress(decoded),
      ensName: null,
      ensAvatar: null,
    };
  }

  // Basenames: .base.eth (on Base L2)
  if (decoded.endsWith(".base.eth")) {
    const { address, avatar } = await resolveBasename(decoded);
    if (!address) {
      return { address: null, ensName: decoded, ensAvatar: null, error: "Basename not found" };
    }
    return {
      address,
      ensName: decoded,
      ensAvatar: avatar,
    };
  }

  // ENS: .eth (on Ethereum mainnet)
  if (decoded.endsWith(".eth")) {
    const { address, avatar } = await resolveEns(decoded);
    if (!address) {
      return { address: null, ensName: decoded, ensAvatar: null, error: "ENS name not found" };
    }
    return {
      address,
      ensName: decoded,
      ensAvatar: avatar,
    };
  }

  // Check if it looks like a basename without .base.eth suffix (e.g., "jesse")
  // Try to resolve as basename first
  if (/^[a-z0-9-]+$/i.test(decoded) && decoded.length >= 3) {
    const basenameAttempt = `${decoded}.base.eth`;
    const { address, avatar } = await resolveBasename(basenameAttempt);
    if (address) {
      return {
        address,
        ensName: basenameAttempt,
        ensAvatar: avatar,
      };
    }
  }

  return { address: null, ensName: null, ensAvatar: null, error: "Invalid address or name" };
}

export default async function TipPage({ params, searchParams }: PageProps) {
  const { recipient } = await params;
  const { amount, embed } = await searchParams;
  const resolved = await resolveRecipient(recipient);

  return (
    <TipPageClient
      address={resolved.address}
      ensName={resolved.ensName}
      ensAvatar={resolved.ensAvatar}
      error={"error" in resolved ? resolved.error : undefined}
      initialAmount={amount}
      embed={embed === "true"}
    />
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { recipient } = await params;
  const decoded = decodeURIComponent(recipient);

  return {
    title: `Tip ${decoded} | Agentokratia`,
    description: `Send a tip to ${decoded} using any token`,
  };
}
