/**
 * Supported Networks Proxy
 *
 * Returns all supported networks and their tokens from the facilitator.
 * Used by the UI to populate the network and token selectors.
 */

import { NextResponse } from "next/server";
import { getNetworkConfigs } from "@/lib/x402";

export async function GET() {
  try {
    const networks = await getNetworkConfigs();

    return NextResponse.json({ networks }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error fetching supported networks:", error);
    return NextResponse.json(
      { error: `Failed to fetch supported networks: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
