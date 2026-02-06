"use client";

import { useQuery } from "@tanstack/react-query";
import type { PaymentRequirements } from "@/lib/types";

export type { PaymentRequirements };

// DEX aggregator quotes expire in ~60 seconds. Refresh every 30s for safety.
const QUOTE_REFRESH_INTERVAL_MS = 30_000;

interface UsePaymentRequirementsOptions {
  recipient: string;
  amount: string;
  network: string;
  enabled?: boolean;
}

/**
 * Fetch payment requirements (402 response) from the tip API.
 *
 * GET /api/tip without payment header returns 402 with requirements.
 */
export function usePaymentRequirements({
  recipient,
  amount,
  network,
  enabled = true,
}: UsePaymentRequirementsOptions) {
  return useQuery({
    queryKey: ["paymentRequirements", recipient, amount, network],
    queryFn: async (): Promise<PaymentRequirements[]> => {
      const params = new URLSearchParams({
        to: recipient,
        amount,
        network,
      });

      // GET without payment header → 402 with requirements
      const res = await fetch(`/api/tip?${params}`);

      if (res.status !== 402) {
        const error = await res.json();
        throw new Error(error.error || "Failed to get payment requirements");
      }

      // Parse from PAYMENT-REQUIRED header (x402 v2)
      const paymentRequired = res.headers.get("PAYMENT-REQUIRED");
      if (!paymentRequired) {
        throw new Error("Missing PAYMENT-REQUIRED header");
      }

      const requirements = JSON.parse(
        Buffer.from(paymentRequired, "base64").toString()
      ) as PaymentRequirements[];

      return requirements;
    },
    enabled: enabled && !!recipient && !!amount && !!network,
    staleTime: 0, // Always consider data stale - quotes change frequently
    gcTime: 0, // Don't cache - always fetch fresh quote
    refetchInterval: QUOTE_REFRESH_INTERVAL_MS, // Keep swap quotes fresh
    refetchIntervalInBackground: false, // Only refresh when tab is focused
  });
}
