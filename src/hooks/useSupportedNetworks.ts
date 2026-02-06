"use client";

import { useQuery } from "@tanstack/react-query";

export interface SupportedToken {
  address: string;
  symbol: string;
  decimals: number;
}

export interface NetworkConfig {
  network: string;
  chainId: number;
  name: string;
  supportedInputTokens: SupportedToken[];
  settlementTokens: SupportedToken[];
}

/**
 * Fetch all supported networks and their tokens
 */
export function useSupportedNetworks() {
  return useQuery({
    queryKey: ["supported"],
    queryFn: async (): Promise<NetworkConfig[]> => {
      const res = await fetch("/api/supported");

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch supported networks");
      }

      const data = await res.json();
      return data.networks;
    },
    staleTime: 60_000 * 5, // Cache for 5 minutes
  });
}

/**
 * Convenience hook for tokens on a specific network
 */
export function useSupportedTokens(network: string) {
  const { data: networks, ...rest } = useSupportedNetworks();
  const tokens =
    networks?.find((n) => n.network === network)?.supportedInputTokens || [];

  return { data: tokens, ...rest };
}
