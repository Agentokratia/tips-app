"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { RecipientCard } from "@/components/RecipientCard";
import { TipForm } from "@/components/TipForm";

interface TipPageClientProps {
  address: string | null;
  ensName: string | null;
  ensAvatar: string | null;
  error?: string;
}

export function TipPageClient({ address, ensName, ensAvatar, error }: TipPageClientProps) {
  const { isConnected } = useAccount();
  const [success, setSuccess] = useState<{
    txHash: string;
    amount: string;
  } | null>(null);

  // Confetti effect on success
  useEffect(() => {
    if (success) {
      createConfetti();
    }
  }, [success]);

  const displayName = ensName || shortenAddress(address || "");

  if (error || !address) {
    return (
      <div className="tip-page">
        <div className="tip-card" style={{ textAlign: "center" }}>
          <div className="tip-error-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 style={{ fontSize: "20px", marginBottom: "8px", fontFamily: "var(--font-serif)" }}>
            {error || "Recipient not found"}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>
            {ensName
              ? `We couldn't resolve "${ensName}". Double-check the ENS name and try again.`
              : "This doesn't look like a valid Ethereum address or ENS name."}
          </p>
          <a href="/" className="btn btn-secondary" style={{ padding: "10px 24px" }}>
            Go back
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="tip-page">
        <div className="tip-card success-animation" style={{ textAlign: "center" }}>
          <div className="tip-success-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontSize: "22px", marginBottom: "6px", fontFamily: "var(--font-serif)" }}>
            Tip sent!
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "12px" }}>
            Your payment is on its way
          </p>
          <div className="tip-success-amount">
            <span className="mono">${success.amount}</span>
            <span style={{ color: "var(--text-muted)" }}>to {displayName}</span>
          </div>
          <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "16px" }}>
            <a
              href={`https://basescan.org/tx/${success.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ flex: 1, padding: "12px 16px", fontSize: "14px" }}
            >
              View on Basescan
            </a>
            <button
              onClick={() => setSuccess(null)}
              className="btn btn-secondary"
              style={{ flex: 1, padding: "12px 16px", fontSize: "14px" }}
            >
              Send another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tip-page">
      <div className="tip-card">
        {/* Header */}
        <div className="tip-header">
          <span className="tip-header-label">You're tipping</span>
        </div>

        <RecipientCard
          address={address}
          ensName={ensName}
          ensAvatar={ensAvatar}
        />

        <div className="tip-divider" />

        {isConnected ? (
          <TipForm
            recipient={address}
            recipientName={displayName}
            onSuccess={(txHash, amount) => setSuccess({ txHash, amount })}
          />
        ) : (
          <div className="tip-connect-prompt">
            <div className="tip-security-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <span>Secure connection</span>
            </div>
            <p style={{ marginTop: "12px" }}>Connect your wallet to send a tip</p>
            <span className="tip-connect-hint">
              Pay with multiple tokens. They receive USDC instantly.
            </span>
            <div className="tip-protocol-info">
              <span>Powered by</span>
              <a href="https://x402.org" target="_blank" rel="noopener noreferrer">x402 Protocol</a>
              <span>on Base</span>
            </div>
          </div>
        )}

        {/* Trust signals */}
        <div className="tip-trust">
          <div className="tip-trust-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Non-custodial</span>
          </div>
          <div className="tip-trust-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Zero fees</span>
          </div>
          <div className="tip-trust-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Instant settlement</span>
          </div>
          <div className="tip-trust-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Open source</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function createConfetti() {
  const colors = ["#22C55E", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6"];
  const container = document.body;

  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
    container.appendChild(confetti);

    setTimeout(() => {
      confetti.remove();
    }, 4000);
  }
}
