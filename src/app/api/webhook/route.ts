/**
 * Webhook Endpoint for Base Mini App
 *
 * Receives notifications from Base App when users interact with the mini app.
 * This is used for analytics and can trigger server-side actions.
 */

import { NextRequest, NextResponse } from "next/server";

interface WebhookPayload {
  event: string;
  timestamp: number;
  data: {
    fid?: number;
    username?: string;
    action?: string;
    buttonIndex?: number;
    inputText?: string;
    castId?: {
      fid: number;
      hash: string;
    };
    url?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json();

    // Log the webhook event (you could send this to analytics)
    console.log("[webhook]", payload.event, {
      fid: payload.data.fid,
      action: payload.data.action,
      timestamp: new Date(payload.timestamp).toISOString(),
    });

    // Handle specific events
    switch (payload.event) {
      case "frame_added":
        // User added the mini app
        console.log("[webhook] Mini app added by fid:", payload.data.fid);
        break;

      case "frame_removed":
        // User removed the mini app
        console.log("[webhook] Mini app removed by fid:", payload.data.fid);
        break;

      case "notifications_enabled":
        // User enabled notifications
        console.log("[webhook] Notifications enabled by fid:", payload.data.fid);
        break;

      case "notifications_disabled":
        // User disabled notifications
        console.log("[webhook] Notifications disabled by fid:", payload.data.fid);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[webhook] Error processing webhook:", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
