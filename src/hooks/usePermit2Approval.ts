"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { erc20Abi, maxUint256, type Address } from "viem";

// Permit2 universal address (same on all EVM chains)
export const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as const;

/**
 * Check if a token has sufficient allowance to Permit2 contract.
 * Returns true if allowance >= requiredAmount.
 */
export function usePermit2Allowance(
  tokenAddress: Address | undefined,
  requiredAmount: bigint = maxUint256
) {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["permit2Allowance", tokenAddress, address],
    queryFn: async () => {
      if (!tokenAddress || !address || !publicClient) {
        return { allowance: BigInt(0), hasAllowance: false };
      }

      const allowance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, PERMIT2_ADDRESS],
      });

      return {
        allowance,
        hasAllowance: allowance >= requiredAmount,
      };
    },
    enabled: !!tokenAddress && !!address && !!publicClient,
    staleTime: 10_000, // 10 seconds
  });
}

/** Approval transaction state */
export type ApprovalStatus = "idle" | "pending-signature" | "pending-confirmation" | "confirmed" | "error";

/**
 * Approve a token to Permit2 contract.
 * Uses max uint256 for unlimited approval (standard practice for Permit2).
 * Tracks transaction status for proper UI feedback.
 */
export function usePermit2Approve() {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const [status, setStatus] = useState<ApprovalStatus>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const mutation = useMutation({
    mutationFn: async (tokenAddress: Address) => {
      if (!walletClient || !publicClient || !address) {
        throw new Error("Wallet not connected");
      }

      setStatus("pending-signature");
      setTxHash(null);

      // Simulate the transaction first
      const { request } = await publicClient.simulateContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [PERMIT2_ADDRESS, maxUint256],
        account: address,
      });

      // Execute the approval (waiting for wallet signature)
      const hash = await walletClient.writeContract(request);
      setTxHash(hash);
      setStatus("pending-confirmation");

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      setStatus("confirmed");

      return { hash, receipt };
    },
    onSuccess: (_, tokenAddress) => {
      // Invalidate allowance query to refetch
      queryClient.invalidateQueries({
        queryKey: ["permit2Allowance", tokenAddress],
      });
    },
    onError: () => {
      setStatus("error");
    },
  });

  // Reset status when mutation is reset
  const reset = () => {
    mutation.reset();
    setStatus("idle");
    setTxHash(null);
  };

  return {
    ...mutation,
    status,
    txHash,
    reset,
  };
}

/**
 * Combined hook for checking and approving Permit2 allowance.
 * Returns everything needed to handle the approval flow in UI.
 */
export function usePermit2(
  tokenAddress: Address | undefined,
  requiredAmount: bigint = maxUint256
) {
  const allowanceQuery = usePermit2Allowance(tokenAddress, requiredAmount);
  const approveMutation = usePermit2Approve();

  return {
    // Allowance state
    hasAllowance: allowanceQuery.data?.hasAllowance ?? false,
    allowance: allowanceQuery.data?.allowance ?? BigInt(0),
    isCheckingAllowance: allowanceQuery.isLoading,

    // Approval action
    approve: tokenAddress ? () => approveMutation.mutateAsync(tokenAddress) : undefined,
    isApproving: approveMutation.isPending,
    approvalError: approveMutation.error,

    // Approval transaction tracking (standard Uniswap flow)
    approvalStatus: approveMutation.status,
    approvalTxHash: approveMutation.txHash,
    resetApproval: approveMutation.reset,

    // Combined state
    needsApproval: !allowanceQuery.isLoading && !allowanceQuery.data?.hasAllowance,
  };
}
