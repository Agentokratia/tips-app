/**
 * MiniKit Configuration for Base Mini App
 *
 * This configuration is used to generate the manifest for the Base Mini App.
 * The app allows users to tip anyone with a Basename or ENS name.
 */

// Domain configuration - change this when deploying
const DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "tip.agentokratia.com";
const BASE_URL = `https://${DOMAIN}`;

export const minikitConfig = {
  // Account association - populated when deploying
  // Generate using: npx @coinbase/onchainkit associate
  accountAssociation: {
    header: "",
    payload: "",
    signature: "",
  },

  // Mini App metadata
  miniapp: {
    version: "1",
    name: "Tip Anyone",
    subtitle: "Send tips with any token",
    description:
      "Send tips to anyone with a Basename or ENS name. Pay with USDC, WETH, DAI, or USDT. Recipients receive USDC instantly. Zero fees, non-custodial, powered by x402 protocol.",
    iconUrl: `${BASE_URL}/icon.svg`,
    splashImageUrl: `${BASE_URL}/splash.svg`,
    homeUrl: BASE_URL,
    webhookUrl: `${BASE_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: ["tips", "payments", "crypto", "basenames"],

    // OG metadata for social sharing
    ogImage: `${BASE_URL}/og.svg`,
    ogTitle: "Tip Anyone | Agentokratia",
    ogDescription: "Send tips with any token. Zero fees. Instant settlement.",

    // Screenshots for the Base app store
    screenshotUrls: [
      `${BASE_URL}/screenshots/1.svg`,
      `${BASE_URL}/screenshots/2.svg`,
    ],
  },
};
