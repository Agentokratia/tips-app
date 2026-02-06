/**
 * Wagmi + RainbowKit Configuration
 *
 * Configures wallet connection for Base mainnet and other supported chains.
 */

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, baseSepolia } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export const config = getDefaultConfig({
  appName: "Tip | Agentokratia",
  projectId,
  chains: [base, baseSepolia],
  ssr: true,
});
