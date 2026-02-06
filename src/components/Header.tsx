"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <nav className="nav">
      <a href="https://agentokratia.com" className="nav-brand" target="_blank" rel="noopener noreferrer">
        {/* Agentokratia Logo */}
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 6L9 42H17L19 36H29L31 42H39L24 6Z" fill="currentColor" />
          <path d="M24 16L21 28H27L24 16Z" fill="var(--bg)" />
          <circle cx="13" cy="10" r="2" fill="currentColor" />
          <circle cx="24" cy="5" r="2" fill="currentColor" />
          <circle cx="35" cy="10" r="2" fill="currentColor" />
        </svg>
        <span>Agentokratia</span>
      </a>

      <div className="nav-right">
        <ThemeToggle />
        <ConnectButton
          showBalance={false}
          chainStatus="icon"
          accountStatus={{
            smallScreen: "avatar",
            largeScreen: "full",
          }}
        />
      </div>
    </nav>
  );
}
