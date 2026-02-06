"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isAddress } from "viem";

export default function Home() {
  const [recipient, setRecipient] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = recipient.trim();
    if (!trimmed) {
      setError("Please enter an address or ENS name");
      return;
    }

    // Basic validation: address, ENS (.eth), or Basename (.base.eth or just name)
    const isValidAddress = isAddress(trimmed);
    const isEns = trimmed.endsWith(".eth");
    const isBasename = /^[a-z0-9-]+$/i.test(trimmed) && trimmed.length >= 3;

    if (!isValidAddress && !isEns && !isBasename) {
      setError("Please enter a valid address, ENS, or Basename");
      return;
    }

    setIsLoading(true);
    router.push(`/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="main-content">
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
        {/* Hero */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "var(--text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 28px",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--paper)" strokeWidth="2" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: "44px",
            marginBottom: "16px",
            fontWeight: 500,
            letterSpacing: "-0.02em",
          }}
        >
          Tip Anyone
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "17px",
            marginBottom: "40px",
            lineHeight: 1.6,
            maxWidth: "380px",
            margin: "0 auto 40px",
          }}
        >
          Send instant tips to any Basename, ENS, or address.
          Tip with any token. Recipients receive USDC.
        </p>

        {/* Form */}
        <div
          className="card-elevated"
          style={{
            padding: "32px",
            textAlign: "left",
          }}
        >
          <form onSubmit={handleSubmit}>
            <label htmlFor="recipient-input" className="label">Recipient</label>
            <div style={{ marginBottom: "20px" }}>
              <input
                id="recipient-input"
                name="recipient"
                type="text"
                className="input"
                placeholder="jesse.base.eth, vitalik.eth, or 0x..."
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value);
                  setError("");
                }}
                autoComplete="off"
                style={{
                  fontSize: "16px",
                  padding: "16px 18px",
                }}
              />
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  padding: "12px 16px",
                  background: "var(--error-light)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--error)",
                  fontSize: "14px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "16px 24px",
                fontSize: "16px",
                fontWeight: 600,
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                {isLoading ? (
                  <>
                    <div className="spinner spinner-light" style={{ width: "18px", height: "18px" }} />
                    Loading...
                  </>
                ) : (
                  <>
                    Continue
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>
        </div>

        {/* URL hint */}
        <div
          style={{
            marginTop: "32px",
            padding: "16px 20px",
            background: "var(--bg-card)",
            borderRadius: "var(--radius)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
            Tip directly at{" "}
            <code style={{ color: "var(--text)", fontWeight: 500, fontFamily: "var(--font-mono, monospace)" }}>
              tip.agentokratia.com/jesse
            </code>
          </p>
        </div>

        {/* Features */}
        <div
          className="trust-row"
          style={{
            marginTop: "40px",
            padding: "20px 0",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div className="trust-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Multiple tokens</span>
          </div>
          <div className="trust-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Instant settlement</span>
          </div>
          <div className="trust-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>x402 powered</span>
          </div>
        </div>

        {/* Developer CTA */}
        <a
          href="/embed"
          style={{
            marginTop: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            padding: "16px 20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            textDecoration: "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.boxShadow = "0 0 0 1px var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "15px" }}>
                Embed Widget
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                Add a tip button to your site with one line of code
              </div>
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>
      </div>
    </div>
  );
}
