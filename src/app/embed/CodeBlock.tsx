"use client";

import { useState } from "react";

export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "relative" }}>
      <pre
        tabIndex={0}
        style={{
          background: "var(--bg-card)",
          padding: "20px",
          paddingRight: "60px",
          borderRadius: "8px",
          overflow: "auto",
          fontSize: "14px",
          border: "1px solid var(--border)",
          margin: 0,
        }}
      >
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        aria-label="Copy code to clipboard"
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          padding: "6px 10px",
          fontSize: "12px",
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          cursor: "pointer",
          color: "var(--text-muted)",
        }}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

export function SmallCodeBlock({ code, dark }: { code: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "relative" }}>
      <pre
        tabIndex={0}
        style={{
          background: dark ? "#0a0a0a" : "var(--bg)",
          padding: "12px",
          paddingRight: "70px",
          borderRadius: "6px",
          fontSize: "13px",
          overflow: "auto",
          margin: 0,
          color: dark ? "#888" : "inherit",
        }}
      >
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        aria-label="Copy code to clipboard"
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          padding: "4px 8px",
          fontSize: "11px",
          background: dark ? "#1a1a1a" : "var(--bg-card)",
          border: `1px solid ${dark ? "#333" : "var(--border)"}`,
          borderRadius: "4px",
          cursor: "pointer",
          color: dark ? "#666" : "var(--text-muted)",
        }}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
