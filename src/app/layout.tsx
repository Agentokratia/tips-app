import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import type { Metadata, Viewport } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tip.agentokratia.com";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF8" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1A1A" },
  ],
};

export const metadata: Metadata = {
  title: "Tip Anyone | Agentokratia",
  description: "Send tips to any Basename, ENS, or address. Pay with any token. Zero fees.",
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "Tip Anyone | Agentokratia",
    description: "Send tips to any Basename, ENS, or address. Pay with any token. Zero fees.",
    url: APP_URL,
    siteName: "Tip Anyone",
    images: [{ url: "/og.svg", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tip Anyone | Agentokratia",
    description: "Send tips to any Basename, ENS, or address. Pay with any token. Zero fees.",
    images: ["/og.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Farcaster Frame meta tags */}
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${APP_URL}/og.svg`} />
        <meta property="fc:frame:button:1" content="Tip Someone" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content={APP_URL} />
        <meta property="of:version" content="vNext" />
        <meta property="of:accepts:xmtp" content="2024-02-01" />
      </head>
      <body>
        <Providers>
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Header />
            <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
