import { NextResponse } from "next/server";
import { configManager } from "@/lib/config";

export async function GET() {
  const config = configManager.get();
  const activeBotId = config.activeBotId;
  const localStatus = config.activeBotStatus || "inactive";

  if (!activeBotId) {
    return NextResponse.json({ status: "inactive" });
  }

  const RECALL_API_KEY = process.env.RECALL_API_KEY;
  if (!RECALL_API_KEY) {
    // If key is missing but we have a cached state, trust the cached state first!
    if (localStatus === "active" || localStatus === "joining") {
      return NextResponse.json({ status: localStatus, message: "Displaying cached webhook status" });
    }
    return NextResponse.json({ status: "error", message: "Recall API key missing" });
  }

  try {
    const res = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${activeBotId}/`, {
      method: "GET",
      headers: {
        "Authorization": `Token ${RECALL_API_KEY}`,
        "Content-Type": "application/json"
      },
      // Short timeout to avoid blocking the client polling
      signal: AbortSignal.timeout(2500)
    });

    if (res.status === 404) {
      console.log(`[Status API] Bot ${activeBotId} returned 404. Clearing active bot.`);
      configManager.update({ activeBotId: null, activeBotStatus: "inactive" });
      return NextResponse.json({ status: "inactive" });
    }

    if (!res.ok) {
      throw new Error(`Recall.ai API returned ${res.status}`);
    }

    const bot = await res.json();
    
    // Recall bot status is stored in the status_changes history array. 
    // We try to extract it from the latest entry, falling back to a top-level bot.status if available.
    let statusCode = bot.status?.code;
    let message = bot.status?.message || "";

    if (!statusCode && bot.status_changes && bot.status_changes.length > 0) {
      const latestStatus = bot.status_changes[bot.status_changes.length - 1];
      statusCode = latestStatus.code;
      message = latestStatus.message || "";
    }

    statusCode = statusCode || "unknown";

    // Determine active status:
    // - ended: call is finished or failed and should be cleared
    // - active: actively recording/in call
    // - joining: any transitional start status (ready, created, joining_call, etc.)
    const isEnded = ["call_ended", "done", "fatal", "recording_permission_denied"].includes(statusCode);
    const isRecording = ["in_call_recording", "in_call_not_recording", "recording_permission_allowed"].includes(statusCode);

    let displayStatus = "joining";
    if (isRecording) {
      displayStatus = "active";
    } else if (isEnded) {
      displayStatus = "inactive";
    }

    // Sync config status cache
    configManager.update({ activeBotStatus: displayStatus });
    if (displayStatus === "inactive") {
      configManager.update({ activeBotId: null });
    }

    return NextResponse.json({ status: displayStatus, code: statusCode, message });
  } catch (error: any) {
    console.error("[Status API] Failed to fetch Recall.ai status, falling back to local cache:", error);
    
    // Fall back to cached localStatus if it is active/joining
    if (localStatus === "active" || localStatus === "joining") {
      return NextResponse.json({ 
        status: localStatus, 
        message: `Cached state fallback: ${error.message || "Offline"}` 
      });
    }
    
    return NextResponse.json({ 
      status: "error", 
      message: error.message || "Failed to contact Recall.ai"
    });
  }
}
