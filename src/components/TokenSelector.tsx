"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import { formatUnits, type Address } from "viem";

export interface Token {
  address: string;
  symbol: string;
  decimals: number;
}

interface TokenSelectorProps {
  tokens: Token[];
  selectedToken: Token | null;
  onSelect: (token: Token) => void;
  chainId: number;
  disabled?: boolean;
  compact?: boolean;
}

export function TokenSelector({
  tokens,
  selectedToken,
  onSelect,
  chainId,
  disabled = false,
  compact = false,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { address } = useAccount();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (token: Token) => {
    onSelect(token);
    setIsOpen(false);
  };

  if (compact) {
    return (
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 10px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          {selectedToken && <TokenIcon symbol={selectedToken.symbol} size={18} />}
          <span>{selectedToken?.symbol || "Select"}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              right: 0,
              minWidth: "160px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-med)",
              borderRadius: "var(--radius-sm)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              zIndex: 100,
              padding: "4px",
            }}
          >
            {tokens.map((token) => (
              <button
                key={token.address}
                type="button"
                onClick={() => handleSelect(token)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 10px",
                  background: selectedToken?.address === token.address ? "var(--bg-card)" : "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                <TokenIcon symbol={token.symbol} size={20} />
                <span style={{ fontWeight: 500 }}>{token.symbol}</span>
              </button>
            ))}
            <a
              href="https://t.me/agentokratia"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                padding: "8px 10px",
                fontSize: "11px",
                color: "var(--text-muted)",
                textAlign: "center",
                textDecoration: "none",
                borderTop: "1px solid var(--border)",
                marginTop: "4px",
              }}
            >
              Not listed? <span style={{ textDecoration: "underline" }}>Contact us</span>
            </a>
          </div>
        )}
      </div>
    );
  }

  // Full token selector (original)
  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setIsOpen(false);
          if (e.key === "ArrowDown" && !isOpen) setIsOpen(true);
        }}
        disabled={disabled}
        aria-label="Select payment token"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-med)",
          borderRadius: "var(--radius-md)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.borderColor = "var(--text-subtle)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-med)";
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {selectedToken ? (
            <>
              <TokenIcon symbol={selectedToken.symbol} size={28} />
              <span>
                <span style={{ fontWeight: 500 }}>{selectedToken.symbol}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "13px", marginLeft: "8px" }}>
                  {getTokenName(selectedToken.symbol)}
                </span>
              </span>
            </>
          ) : (
            <span style={{ color: "var(--text-muted)" }}>Select token</span>
          )}
        </span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            color: "var(--text-muted)",
            transition: "transform 0.2s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Available tokens"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-med)",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            zIndex: 100,
            maxHeight: "280px",
            overflowY: "auto",
            padding: "6px",
          }}
        >
          {tokens.map((token) => (
            <TokenOption
              key={token.address}
              token={token}
              chainId={chainId}
              userAddress={address}
              isSelected={selectedToken?.address === token.address}
              onSelect={handleSelect}
            />
          ))}
          <a
            href="https://t.me/agentokratia"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              padding: "10px 14px",
              fontSize: "12px",
              color: "var(--text-muted)",
              textAlign: "center",
              textDecoration: "none",
              borderTop: "1px solid var(--border)",
              marginTop: "6px",
            }}
          >
            Token not listed? <span style={{ textDecoration: "underline" }}>Contact us</span>
          </a>
        </div>
      )}
    </div>
  );
}

interface TokenOptionProps {
  token: Token;
  chainId: number;
  userAddress?: Address;
  isSelected: boolean;
  onSelect: (token: Token) => void;
}

function TokenOption({
  token,
  chainId,
  userAddress,
  isSelected,
  onSelect,
}: TokenOptionProps) {
  const { data: balance } = useBalance({
    address: userAddress,
    token: token.address as Address,
    chainId,
  });

  const formattedBalance = balance
    ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)
    : "0";

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={() => onSelect(token)}
      style={{
        width: "100%",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: isSelected ? "var(--bg-card)" : "transparent",
        border: "none",
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card)")}
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = isSelected ? "var(--bg-card)" : "transparent")
      }
    >
      <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <TokenIcon symbol={token.symbol} size={32} />
        <span style={{ textAlign: "left" }}>
          <span style={{ display: "block", fontWeight: 500 }}>{token.symbol}</span>
          <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)" }}>
            {getTokenName(token.symbol)}
          </span>
        </span>
      </span>
      <span
        className="mono"
        style={{
          color: "var(--text-muted)",
          fontSize: "13px",
          background: "var(--bg-card)",
          padding: "4px 10px",
          borderRadius: "100px",
        }}
      >
        {formattedBalance}
      </span>
    </button>
  );
}

function getTokenName(symbol: string): string {
  const names: Record<string, string> = {
    USDC: "USD Coin",
    WETH: "Wrapped Ether",
    ETH: "Ether",
    DAI: "Dai Stablecoin",
    USDT: "Tether USD",
  };
  return names[symbol] || symbol;
}

interface TokenIconProps {
  symbol: string;
  size?: number;
}

function TokenIcon({ symbol, size = 24 }: TokenIconProps) {
  const colors: Record<string, { bg: string; text: string }> = {
    USDC: { bg: "#2775CA", text: "white" },
    WETH: { bg: "#627EEA", text: "white" },
    ETH: { bg: "#627EEA", text: "white" },
    DAI: { bg: "#F5AC37", text: "#1A1A1A" },
    USDT: { bg: "#26A17B", text: "white" },
  };

  const { bg, text } = colors[symbol] || { bg: "#6B6B6B", text: "white" };

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: text,
        fontSize: size * 0.4,
        fontWeight: 700,
        letterSpacing: "-0.5px",
      }}
    >
      {symbol.slice(0, 2)}
    </div>
  );
}
