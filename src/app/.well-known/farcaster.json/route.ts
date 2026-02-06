/**
 * Farcaster Frame Manifest Endpoint
 *
 * Required for Base Mini Apps. Serves the manifest that tells
 * Base App / Farcaster how to embed and display this mini app.
 */

import { NextResponse } from "next/server";
import { minikitConfig } from "../../../../minikit.config";

export async function GET() {
  const manifest = {
    accountAssociation: minikitConfig.accountAssociation,
    frame: {
      version: minikitConfig.miniapp.version,
      name: minikitConfig.miniapp.name,
      subtitle: minikitConfig.miniapp.subtitle,
      iconUrl: minikitConfig.miniapp.iconUrl,
      splashImageUrl: minikitConfig.miniapp.splashImageUrl,
      splashBackgroundColor: "#ffffff",
      homeUrl: minikitConfig.miniapp.homeUrl,
      webhookUrl: minikitConfig.miniapp.webhookUrl,
    },
  };

  return NextResponse.json(manifest);
}
