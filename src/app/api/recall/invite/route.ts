import { NextRequest, NextResponse } from "next/server";
import { configManager } from "@/lib/config";
import { transcriptsManager } from "@/lib/transcripts";

export async function POST(req: NextRequest) {
  try {
    const { meetingUrl } = await req.json();

    if (!meetingUrl) {
      return NextResponse.json({ error: "Missing meeting URL" }, { status: 400 });
    }

    // Immediately reset previous bot state and clear transcripts to prevent the dashboard
    // from displaying the old bot's active status during a new invitation attempt.
    configManager.update({ activeBotId: null, activeBotStatus: "joining" });
    transcriptsManager.clear();

    const RECALL_API_KEY = process.env.RECALL_API_KEY;

    if (!RECALL_API_KEY || RECALL_API_KEY === 'your_recall_api_key_here') {
      configManager.update({ activeBotStatus: "inactive" });
      return NextResponse.json({ error: "Recall API key not configured in .env.local" }, { status: 500 });
    }

    // Try to discover local ngrok tunnel URL via the local ngrok agent API (listening on port 4040)
    let webhookUrl: string | null = null;
    try {
      const ngrokRes = await fetch("http://127.0.0.1:4040/api/tunnels");
      if (ngrokRes.ok) {
        const ngrokData = await ngrokRes.json();
        const publicTunnel = ngrokData.tunnels?.find(
          (t: any) => t.proto === "https" || t.public_url?.startsWith("https://")
        );
        if (publicTunnel?.public_url) {
          webhookUrl = `${publicTunnel.public_url}/api/webhook/recall`;
          console.log(`[Recall Invite] Automatically discovered active public ngrok webhook: ${webhookUrl}`);
        }
      }
    } catch (e) {
      console.log("[Recall Invite] Local ngrok agent API is not reachable (expected if ngrok is offline).");
    }

    // Fallback: If ngrok API isn't running but we are accessed via an external domain (e.g. ngrok link directly or production domain)
    if (!webhookUrl) {
      const host = req.headers.get("host") || "";
      if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
        const protocol = req.headers.get("x-forwarded-proto") || "https";
        webhookUrl = `${protocol}://${host}/api/webhook/recall`;
        console.log(`[Recall Invite] Webhook URL resolved from public host header: ${webhookUrl}`);
      }
    }

    // Construct the bot dispatch payload
    const botPayload: any = {
      meeting_url: meetingUrl,
      bot_name: "Meem8 Co-Pilot",
    };

    // Only configure recording_config if we resolved a valid public HTTPS webhook URL.
    // Specifying an insecure "http" or "localhost" webhook causes Recall.ai to reject the request with a 400 error.
    if (webhookUrl && webhookUrl.startsWith("https://")) {
      botPayload.recording_config = {
        transcript: {
          provider: {
            recallai_streaming: {
              mode: "prioritize_low_latency",
              language_code: "en",
            },
          },
        },
        realtime_endpoints: [
          {
            type: "webhook",
            url: webhookUrl,
            events: ["transcript.data"],
          },
        ],
      };
      console.log(`[Recall Invite] Dispatching bot with real-time streaming endpoint: ${webhookUrl}`);
    } else {
      console.warn(
        "[Recall Invite] No active public HTTPS webhook found (ngrok offline or local development). Omitting real-time endpoint parameters to guarantee successful bot dispatch."
      );
    }

    // Call Recall.ai API to dispatch bot
    const response = await fetch("https://us-west-2.recall.ai/api/v1/bot", {
      method: "POST",
      headers: {
        "Authorization": `Token ${RECALL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(botPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Recall API Error:", errorData);
      // Reset status to inactive on dispatch failure
      configManager.update({ activeBotStatus: "inactive" });
      return NextResponse.json({ error: "Failed to dispatch Recall bot", details: errorData }, { status: response.status });
    }

    const data = await response.json();
    
    // Save bot ID and initial status to config, and clear previous transcripts for the new session
    configManager.update({ activeBotId: data.id, activeBotStatus: "joining" });

    return NextResponse.json({ success: true, bot: data });

  } catch (error) {
    console.error("Internal Server Error:", error);
    configManager.update({ activeBotStatus: "inactive" });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
