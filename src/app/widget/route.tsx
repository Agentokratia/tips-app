/**
 * Widget Route Handler - Returns standalone HTML for iframe embedding
 * Completely bypasses Next.js layouts for clean embedding
 *
 * URL params:
 * - recipient: Basename, ENS, or address (required)
 * - amount: Default amount (optional, default: 5)
 * - theme: "light" | "dark" (optional, default: light)
 * - accent: Hex color without # (optional, default: 0052FF)
 * - compact: "true" for button-only mode (optional)
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const recipient = searchParams.get("recipient") || "";
  const amount = searchParams.get("amount") || "5";
  const theme = searchParams.get("theme") || "light";
  const accent = searchParams.get("accent") || "0052FF";
  const compact = searchParams.get("compact") === "true";

  if (!recipient) {
    return new NextResponse("Missing recipient parameter", { status: 400 });
  }

  const isDark = theme === "dark";
  const accentColor = `#${accent}`;
  const origin = request.nextUrl.origin;
  const tipUrl = `${origin}/${encodeURIComponent(recipient)}?amount=${amount}&embed=true`;

  const html = compact
    ? generateCompactWidget(recipient, amount, accentColor, tipUrl)
    : generateFullWidget(recipient, amount, accentColor, isDark, tipUrl);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function generateCompactWidget(
  recipient: string,
  amount: string,
  accentColor: string,
  tipUrl: string
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: transparent;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      background: ${accentColor};
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.15s ease;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }
    .btn:active {
      transform: translateY(0);
    }
    .icon {
      width: 16px;
      height: 16px;
    }
  </style>
</head>
<body>
  <a href="${tipUrl}" target="_blank" rel="noopener" class="btn">
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <polyline points="19 12 12 19 5 12"/>
    </svg>
    Tip $${amount}
  </a>
</body>
</html>`;
}

function generateFullWidget(
  recipient: string,
  amount: string,
  accentColor: string,
  isDark: boolean,
  tipUrl: string
): string {
  const bg = isDark ? "#1a1a1a" : "#ffffff";
  const border = isDark ? "#333" : "#e5e5e5";
  const textPrimary = isDark ? "#fff" : "#1a1a1a";
  const textSecondary = isDark ? "#888" : "#666";
  const textMuted = isDark ? "#666" : "#999";

  const displayRecipient =
    recipient.length > 18 ? `${recipient.slice(0, 8)}...${recipient.slice(-6)}` : recipient;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: transparent;
      padding: 8px;
    }
    .widget {
      background: ${bg};
      border: 1px solid ${border};
      border-radius: 16px;
      padding: 20px;
      max-width: 300px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 18px;
    }
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: ${accentColor};
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .avatar svg {
      width: 24px;
      height: 24px;
      stroke: #fff;
    }
    .info h3 {
      font-size: 15px;
      font-weight: 600;
      color: ${textPrimary};
      margin-bottom: 2px;
    }
    .info p {
      font-size: 13px;
      color: ${textSecondary};
    }
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px 20px;
      font-size: 15px;
      font-weight: 600;
      color: #fff;
      background: ${accentColor};
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      text-decoration: none;
    }
    .btn:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    .btn svg {
      width: 16px;
      height: 16px;
    }
    .footer {
      margin-top: 14px;
      text-align: center;
      font-size: 11px;
      color: ${textMuted};
    }
    .footer a {
      color: ${accentColor};
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="widget">
    <div class="header">
      <div class="avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <polyline points="19 12 12 19 5 12"/>
        </svg>
      </div>
      <div class="info">
        <h3>Tip ${displayRecipient}</h3>
        <p>Tip with any token</p>
      </div>
    </div>

    <a href="${tipUrl}" target="_blank" rel="noopener" class="btn">
      Send $${amount} Tip
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="5" y1="12" x2="19" y2="12"/>
        <polyline points="12 5 19 12 12 19"/>
      </svg>
    </a>

    <div class="footer">
      Powered by <a href="https://agentokratia.com" target="_blank">x402</a> · Zero fees
    </div>
  </div>
</body>
</html>`;
}
