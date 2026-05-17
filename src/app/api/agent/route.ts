import { NextResponse } from "next/server";
import { agentEngine } from "@/lib/agent/engine";
import { agentStateManager } from "@/lib/agentState";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const stream = await agentEngine.invoke(prompt);

    // Initialize the shared state
    agentStateManager.update({
      prompt,
      response: "",
      status: "streaming",
      source: "dashboard",
    });

    let accumulatedResponse = "";

    // Intercept stream chunks and record them to agentStateManager
    const transformStream = new TransformStream<string, string>({
      transform(chunk, controller) {
        controller.enqueue(chunk);

        try {
          accumulatedResponse += chunk;
          agentStateManager.update({ response: accumulatedResponse });
        } catch (err) {
          console.error("Error recording agent stream chunk:", err);
        }
      },
      flush() {
        agentStateManager.update({ status: "idle" });
      }
    });

    const pipedStream = stream.pipeThrough(transformStream);

    // Return the intercepted streaming response
    return new Response(pipedStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  } catch (error: any) {
    console.error("Agent error:", error);
    agentStateManager.update({ status: "error" });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
