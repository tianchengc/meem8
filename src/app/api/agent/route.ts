import { NextResponse } from "next/server";
import { agentEngine } from "@/lib/agent/engine";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Invoke the engine, which returns a ReadableStream from Ollama
    const stream = await agentEngine.invoke(prompt);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Agent API Error:", error);
    return NextResponse.json({ error: "Failed to invoke agent" }, { status: 500 });
  }
}
