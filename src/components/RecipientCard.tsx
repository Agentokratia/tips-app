"use client";

import Image from "next/image";

interface RecipientCardProps {
  address: string;
  ensName: string | null;
  ensAvatar: string | null;
}

export function RecipientCard({ address, ensName, ensAvatar }: RecipientCardProps) {
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="recipient-row">
      {/* Avatar */}
      <div className="recipient-avatar">
        {ensAvatar ? (
          <Image
            src={ensAvatar}
            alt={ensName || address}
            width={48}
            height={48}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: generateGradient(address),
            }}
          />
        )}
      </div>

      {/* Info */}
      <div className="recipient-info">
        {ensName ? (
          <>
            <span className="recipient-name" style={{ display: "flex", alignItems: "center" }}>
              {ensName}
              <span className="recipient-verified" title="Verified ENS name">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            </span>
            <a
              href={`https://basescan.org/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="recipient-address mono"
            >
              {shortAddress}
            </a>
          </>
        ) : (
          <a
            href={`https://basescan.org/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="recipient-name mono"
          >
            {shortAddress}
          </a>
        )}
      </div>
    </div>
  );
}

function generateGradient(address: string): string {
  const hash = address.slice(2, 10);
  const hue1 = parseInt(hash.slice(0, 2), 16) * 1.4;
  const hue2 = parseInt(hash.slice(2, 4), 16) * 1.4;
  const sat1 = 60 + (parseInt(hash.slice(4, 6), 16) % 30);
  const sat2 = 60 + (parseInt(hash.slice(6, 8), 16) % 30);

  return `linear-gradient(135deg, hsl(${hue1}, ${sat1}%, 60%), hsl(${hue2}, ${sat2}%, 50%))`;
}
