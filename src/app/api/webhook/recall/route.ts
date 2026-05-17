import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    // In a real implementation, we would queue this to a state manager 
    // or trigger the vector DB worker to store this slice of the transcript.
    console.log("Received Recall.ai Webhook event:", payload.event);

    // Naive Wake Word detection for demonstration
    const transcriptText = payload.data?.transcript?.text?.toLowerCase() || "";
    
    if (transcriptText.includes("hey gemma")) {
      console.log("Wake word detected! Activating Agentic Engine...");
      
      // Trigger the engine asynchronously so we don't block this response
      // engine.invoke(transcriptText);
    }

    // Always return 200 immediately to prevent Recall.ai from timing out 
    // and to ensure the Node.js event loop isn't blocked.
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
