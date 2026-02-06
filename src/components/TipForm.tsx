"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAccount, useChainId, useSwitchChain, useWalletClient, useBalance } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { TokenSelector, type Token } from "./TokenSelector";
import { usePaymentRequirements } from "@/hooks/usePaymentRequirements";
import { usePayment } from "@/hooks/usePayment";
import { useSupportedNetworks } from "@/hooks/useSupportedNetworks";
import { usePermit2 } from "@/hooks/usePermit2Approval";
import { CHAIN_TO_NETWORK, NETWORK_TO_CHAIN } from "@/lib/constants";

// Debounce delay for amount input (prevents API flooding on keystroke)
const AMOUNT_DEBOUNCE_MS = 500;

// Quick amount presets
const QUICK_AMOUNTS = ["1", "5", "10", "25"] as const;

// Format token amount with appropriate precision
function formatTokenAmount(value: number): string {
  if (value === 0) return "0";
  if (value < 0.0001) return "< 0.0001"; // Tiny values (bad quotes)
  if (value < 1) return value.toPrecision(4);
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

// Known aggregator addresses (Base mainnet)
const AGGREGATOR_NAMES: Record<string, string> = {
  "0x6a000f20005980200259b80c5102003040001068": "Paraswap", // Augustus V6.2
  "0x6ff5693b99212da76ad316178a184ab56d299b43": "Uniswap", // Universal Router
  "0x6352a56caadc4f1e25cd6c75970fa768a3304e64": "OpenOcean",
};

function getAggregatorName(address: string | undefined): string | null {
  if (!address) return null;
  return AGGREGATOR_NAMES[address.toLowerCase()] || null;
}

// Hoisted SVG icons (Vercel rule: rendering-hoist-jsx)
const InfoIcon = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const WarningIcon = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ErrorIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ArrowIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// Custom hook for debouncing values - prevents API flooding on keystroke
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface TipFormProps {
  recipient: string;
  recipientName?: string;
  initialAmount?: string;
  onSuccess: (txHash: string, amount: string) => void;
}

export function TipForm({ recipient, recipientName, initialAmount, onSuccess }: TipFormProps) {
  const [amount, setAmount] = useState(initialAmount || "5");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounce amount to prevent API flooding while typing
  const debouncedAmount = useDebounce(amount, AMOUNT_DEBOUNCE_MS);

  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();

  // Track previous chainId to detect network changes
  const prevChainIdRef = useRef<number | null>(null);

  const { data: networks, isLoading: isLoadingNetworks } = useSupportedNetworks();

  // Fetch token balance for selected token
  const { data: tokenBalance } = useBalance({
    address,
    token: selectedToken?.address as `0x${string}` | undefined,
    chainId,
  });
  const network = CHAIN_TO_NETWORK[chainId] || null;
  const currentNetwork = networks?.find((n) => n.network === network);
  const tokens = currentNetwork?.supportedInputTokens || [];

  // Reset selected token and invalidate queries when network changes
  useEffect(() => {
    if (prevChainIdRef.current !== null && prevChainIdRef.current !== chainId) {
      // Network changed - reset token selection
      setSelectedToken(null);
      setError(null);
      // Invalidate payment requirements queries to force refetch
      queryClient.invalidateQueries({ queryKey: ["paymentRequirements"] });
    }
    prevChainIdRef.current = chainId;
  }, [chainId, queryClient]);

  // Set default token when tokens list changes (after network switch or initial load)
  useEffect(() => {
    if (tokens.length > 0) {
      // Check if current selected token exists in new token list
      const tokenStillValid = selectedToken && tokens.some(
        (t) => t.address.toLowerCase() === selectedToken.address.toLowerCase()
      );
      if (!tokenStillValid) {
        const usdc = tokens.find((t) => t.symbol === "USDC");
        setSelectedToken(usdc || tokens[0]);
      }
    }
  }, [tokens, selectedToken]);

  const {
    data: paymentRequirements,
    isLoading: isLoadingRequirements,
    isFetching: isFetchingRequirements,
    error: requirementsError,
  } = usePaymentRequirements({
    recipient,
    amount: debouncedAmount, // Use debounced value for API calls
    network: network || "",
    enabled: !!network && !!debouncedAmount && parseFloat(debouncedAmount) > 0,
  });

  // Show loading when:
  // - Requirements are loading/fetching
  // - Amount changed but debounce hasn't fired yet
  // - We don't have a valid requirement for the selected token yet
  const isQuoteLoading = isLoadingRequirements || isFetchingRequirements || (amount !== debouncedAmount && parseFloat(amount) > 0);

  const payment = usePayment();

  // Check Permit2 allowance for non-USDC tokens (swap payments use Permit2)
  const needsPermit2 = selectedToken && selectedToken.symbol !== "USDC";
  const {
    hasAllowance: hasPermit2Allowance,
    isCheckingAllowance,
    approve: approvePermit2,
    isApproving,
    needsApproval,
    approvalStatus,
    approvalTxHash,
  } = usePermit2(needsPermit2 ? (selectedToken?.address as `0x${string}`) : undefined);

  // Select the appropriate payment requirement based on token
  // For USDC: prefer "exact" scheme (direct ERC-3009)
  // For other tokens: use "escrow" scheme (Permit2 swap)
  const selectedRequirement = useMemo(() => {
    if (!paymentRequirements || paymentRequirements.length === 0 || !selectedToken) return undefined;

    const isUSDC = selectedToken.symbol === "USDC";
    const tokenAddress = selectedToken.address.toLowerCase();

    if (isUSDC) {
      // For USDC, prefer exact scheme (direct payment, no swap needed)
      const exactReq = paymentRequirements.find(
        (req) => req.scheme === "exact" && req.asset.toLowerCase() === tokenAddress
      );
      if (exactReq) return exactReq;
    }

    // For non-USDC tokens, find escrow with matching swap inputToken
    // This MUST have swapData with the correct inputToken
    const swapReq = paymentRequirements.find((req) => {
      if (req.scheme !== "escrow") return false;

      const extra = req.extra as Record<string, unknown>;
      const swapData = extra?.swapData as { inputToken?: string; maxInputAmount?: string } | undefined;

      // Must have swapData with inputToken that matches selected token
      if (!swapData?.inputToken || !swapData?.maxInputAmount) return false;

      // Compare addresses case-insensitively
      const inputTokenLower = swapData.inputToken.toLowerCase();
      return inputTokenLower === tokenAddress;
    });

    if (swapReq) return swapReq;

    // Fallback for USDC via escrow (erc3009 collector, no swap)
    if (isUSDC) {
      return paymentRequirements.find(
        (req) => req.scheme === "escrow" && req.asset.toLowerCase() === tokenAddress
      );
    }

    return undefined;
  }, [paymentRequirements, selectedToken]);

  // Determine if this is a swap (non-USDC token selected)
  const isSwapPayment = selectedToken ? selectedToken.symbol !== "USDC" : false;

  // Calculate what user will pay (using viem's formatUnits for precision)
  const quoteInfo = useMemo(() => {
    if (!selectedToken) return null;

    const isUSDC = selectedToken.symbol === "USDC";

    // For direct USDC payments, amount equals tip amount
    if (isUSDC) {
      return {
        payAmount: amount,
        payDisplay: `${amount} USDC`,
        rate: null,
        hasLowLiquidity: false,
        aggregator: null,
      };
    }

    // For non-USDC (swap), we need selectedRequirement with swapData
    if (!selectedRequirement) return null;

    // For swaps, must have swapData with maxInputAmount
    const extra = selectedRequirement.extra as Record<string, unknown>;
    const swapData = extra?.swapData as { maxInputAmount?: string; aggregator?: string } | undefined;

    if (!swapData?.maxInputAmount) return null;

    // Use viem's formatUnits for precise BigInt conversion
    const formatted = formatUnits(BigInt(swapData.maxInputAmount), selectedToken.decimals);
    const numericValue = parseFloat(formatted);
    const formattedAmount = formatTokenAmount(numericValue);

    // Calculate rate (USD per token)
    const tipAmount = parseFloat(amount);
    const rate = tipAmount > 0 && numericValue > 0 ? tipAmount / numericValue : 0;
    const isValidRate = rate > 0.01 && rate < 1000000;

    // Get aggregator name
    const aggregator = getAggregatorName(swapData.aggregator);

    return {
      payAmount: formattedAmount,
      payDisplay: `${formattedAmount} ${selectedToken.symbol}`,
      rate: isValidRate ? rate : null,
      hasLowLiquidity: numericValue < 0.0000001,
      aggregator,
    };
  }, [selectedRequirement, selectedToken, amount]);

  // Handle Permit2 approval for non-USDC tokens
  const handleApprove = useCallback(async () => {
    setError(null);
    if (!approvePermit2) return;

    try {
      await approvePermit2();
    } catch (err) {
      setError(`Approval failed: ${(err as Error).message}`);
    }
  }, [approvePermit2]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!walletClient) {
        setError("Connect your wallet");
        return;
      }
      if (!paymentRequirements || paymentRequirements.length === 0) {
        setError("No payment options available");
        return;
      }
      if (!selectedToken) {
        setError("Select a token");
        return;
      }
      if (!amount || parseFloat(amount) <= 0) {
        setError("Enter a valid amount");
        return;
      }

      // Check if approval is needed for non-USDC tokens
      if (needsPermit2 && needsApproval) {
        setError("Please approve the token first");
        return;
      }

      try {
        // Pass all requirements + input token - x402 client handles selection via policy + selector
        const result = await payment.mutateAsync({
          recipient,
          amount,
          network: network!,
          inputToken: selectedToken.address,
          paymentRequirements,
          walletClient,
        });

        if (result.success && result.transaction) {
          onSuccess(result.transaction, amount);
        } else {
          setError(result.errorReason || "Payment failed");
        }
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [walletClient, paymentRequirements, selectedToken, amount, payment, recipient, network, onSuccess, needsPermit2, needsApproval]
  );

  const isNetworkSupported = networks?.some((n) => n.network === network);

  const handleSwitchNetwork = useCallback(() => {
    if (networks && networks.length > 0) {
      const targetChainId = NETWORK_TO_CHAIN[networks[0].network];
      if (targetChainId) {
        switchChain({ chainId: targetChainId });
      }
    }
  }, [networks, switchChain]);

  if (isLoadingNetworks) {
    return (
      <div className="tip-loading">
        <div className="spinner" style={{ width: "16px", height: "16px" }} />
        <span>Loading...</span>
      </div>
    );
  }

  if (!isNetworkSupported) {
    return (
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "12px" }}>
          Switch to a supported network
        </p>
        <button onClick={handleSwitchNetwork} className="tip-submit">
          Switch to {networks?.[0]?.name || "Base"}
        </button>
      </div>
    );
  }

  const displayRecipient = recipientName || `${recipient.slice(0, 6)}...${recipient.slice(-4)}`;

  return (
    <form onSubmit={handleSubmit} className="tip-form">
      {/* Amount section */}
      <div className="tip-section">
        <label className="tip-label">How much?</label>
        <div className="tip-form-row">
          <div className="tip-amount-input">
            <span className="prefix">$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mono"
              autoComplete="off"
              placeholder="0"
              aria-label="Tip amount in USD"
            />
          </div>
          <div className="tip-quick-amounts">
            {QUICK_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className={`tip-quick-btn ${amount === preset ? "active" : ""}`}
                aria-label={`Set amount to $${preset}`}
              >
                ${preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Token section */}
      <div className="tip-section">
        <div className="tip-token-row">
          <div className="tip-token-label">
            <label className="tip-label">Your token</label>
            {tokenBalance && address ? (
              <span className="tip-label-hint tip-balance">
                Balance: <span className="mono">{formatTokenAmount(parseFloat(tokenBalance.formatted))} {tokenBalance.symbol}</span>
              </span>
            ) : (
              <span className="tip-label-hint">We'll convert it automatically</span>
            )}
          </div>
          <TokenSelector
            tokens={tokens}
            selectedToken={selectedToken}
            onSelect={setSelectedToken}
            chainId={chainId}
            disabled={tokens.length === 0}
            compact
          />
        </div>
      </div>

      {/* Payment breakdown */}
      {selectedToken && parseFloat(amount) > 0 && (
        <div className="tip-breakdown">
          <div className="tip-breakdown-row">
            <span className="tip-breakdown-label">You pay</span>
            {isQuoteLoading || !quoteInfo ? (
              <span className="tip-breakdown-loading">
                <div className="spinner" style={{ width: "12px", height: "12px" }} />
              </span>
            ) : (
              <span className="tip-breakdown-value tip-breakdown-highlight mono">
                {quoteInfo.payDisplay}
              </span>
            )}
          </div>
          {isSwapPayment && quoteInfo?.rate && (
            <div className="tip-breakdown-row">
              <span className="tip-breakdown-label">Rate</span>
              <span className="tip-breakdown-value mono" style={{ fontSize: "13px" }}>
                1 {selectedToken.symbol} ≈ ${quoteInfo.rate.toFixed(2)}
              </span>
            </div>
          )}
          {isSwapPayment && quoteInfo?.aggregator && (
            <div className="tip-breakdown-row">
              <span className="tip-breakdown-label">Route</span>
              <span className="tip-breakdown-value tip-breakdown-route">
                {selectedToken?.symbol} → USDC
                <span className="tip-route-via">via {quoteInfo.aggregator}</span>
              </span>
            </div>
          )}
          {isSwapPayment && quoteInfo && !quoteInfo.hasLowLiquidity && (
            <div className="tip-breakdown-note">
              {InfoIcon}
              <span>Live quote. Refreshes every 30s.</span>
            </div>
          )}
          {isSwapPayment && quoteInfo?.hasLowLiquidity && (
            <div className="tip-breakdown-note" style={{ color: "var(--warning, #f59e0b)" }}>
              {WarningIcon}
              <span>
                {chainId === 84532 ? "Low liquidity on testnet" : "Low liquidity"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {(error || requirementsError) && (
        <div className="tip-error">
          {ErrorIcon}
          <span>{error || (requirementsError as Error)?.message}</span>
        </div>
      )}

      {/* Approval button for non-USDC tokens - standard Uniswap flow */}
      {needsPermit2 && needsApproval && selectedToken && (
        <div className="tip-approval-section">
          <button
            type="button"
            onClick={handleApprove}
            className="tip-submit tip-submit-approve"
            disabled={isApproving || isCheckingAllowance || approvalStatus === "pending-signature" || approvalStatus === "pending-confirmation"}
          >
            {approvalStatus === "pending-signature" ? (
              <>
                <div className="spinner spinner-light" style={{ width: "16px", height: "16px" }} />
                <span>Waiting for signature...</span>
              </>
            ) : approvalStatus === "pending-confirmation" ? (
              <>
                <div className="spinner spinner-light" style={{ width: "16px", height: "16px" }} />
                <span>Confirming approval...</span>
              </>
            ) : isCheckingAllowance ? (
              <>
                <div className="spinner spinner-light" style={{ width: "16px", height: "16px" }} />
                <span>Checking allowance...</span>
              </>
            ) : (
              <span>Approve {selectedToken.symbol} for Permit2</span>
            )}
          </button>
          {/* Show transaction link during confirmation */}
          {approvalStatus === "pending-confirmation" && approvalTxHash && (
            <a
              href={`https://basescan.org/tx/${approvalTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tip-tx-link"
            >
              View transaction →
            </a>
          )}
        </div>
      )}

      {/* Submit button (shown after approval or for USDC) */}
      {(!needsPermit2 || hasPermit2Allowance) && (
        <button
          type="submit"
          className="tip-submit"
          disabled={
            payment.isPending ||
            isQuoteLoading ||
            !paymentRequirements?.length ||
            !selectedToken ||
            !address ||
            !amount ||
            parseFloat(amount) <= 0
          }
        >
          {payment.isPending ? (
            <>
              <div className="spinner spinner-light" style={{ width: "16px", height: "16px" }} />
              <span>Confirming in wallet...</span>
            </>
          ) : (
            <>
              <span>Tip ${amount || "0"} to {displayRecipient}</span>
              {ArrowIcon}
            </>
          )}
        </button>
      )}

      {/* Microcopy hint */}
      <p className="tip-submit-hint">
        {needsPermit2 && needsApproval && approvalStatus === "pending-signature"
          ? "Please confirm the approval in your wallet."
          : needsPermit2 && needsApproval && approvalStatus === "pending-confirmation"
          ? "Waiting for on-chain confirmation..."
          : needsPermit2 && needsApproval
          ? "One-time approval lets Permit2 transfer tokens on your behalf."
          : "One signature. You pay zero gas. Funds go directly to recipient."}
      </p>
    </form>
  );
}
