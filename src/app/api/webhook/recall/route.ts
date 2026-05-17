import { NextResponse } from "next/server";
import { agentEngine } from "@/lib/agent/engine";
import { configManager } from "@/lib/config";
import { sendChatToRecall } from "@/lib/recall/api";
import { getEmbeddings } from "@/lib/vector/embed";
import { vectorStore } from "@/lib/vector/store";
import { transcriptsManager } from "@/lib/transcripts";
import { agentStateManager } from "@/lib/agentState";

async function processAndReplyToMeeting(botId: string, prompt: string) {
  try {
    // 0. Update shared agent state
    agentStateManager.update({
      prompt,
      response: "",
      status: "streaming",
      source: "meeting",
    });

    // 1. Send immediate placeholder
    await sendChatToRecall(botId, "Meem8 is thinking...");

    // 2. Trigger the engine
    const stream = await agentEngine.invoke(prompt);
    
    // 3. Consume the stream
    const reader = stream.getReader();
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullResponse += value;
      agentStateManager.update({ response: fullResponse });
    }

    // Mark shared state as idle once streaming finishes
    agentStateManager.update({ status: "idle" });

    // 4. Send the final response to chat
    await sendChatToRecall(botId, fullResponse);

  } catch (error) {
    console.error("Agent error during webhook processing:", error);
    agentStateManager.update({ status: "error" });
    await sendChatToRecall(botId, "Sorry, I encountered an error while processing that request.");
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    // Extract bot ID from payload
    const botId = payload.data?.bot_id || payload.bot_id;

    if (botId) {
      configManager.update({ activeBotId: botId });
    }

    // Handle bot status changes to cache state locally
    if (payload.event === "bot.status_change") {
      const statusCode = payload.data?.status?.code || payload.status?.code;
      if (statusCode) {
        const isEnded = ["call_ended", "done", "fatal", "recording_permission_denied"].includes(statusCode);
        const isRecording = ["in_call_recording", "in_call_not_recording", "recording_permission_allowed"].includes(statusCode);

        let displayStatus = "joining";
        if (isRecording) {
          displayStatus = "active";
        } else if (isEnded) {
          displayStatus = "inactive";
        }

        console.log(`[Webhook] Bot status is '${statusCode}', caching state as '${displayStatus}'.`);
        configManager.update({ activeBotStatus: displayStatus });

        if (displayStatus === "inactive") {
          configManager.update({ activeBotId: null });
        }
      }
    }

    const transcript = payload.data?.transcript;
    if (payload.event === "bot.transcript" && transcript?.text) {
      // Resilience: ensure status is active when transcripts arrive
      if (configManager.get().activeBotStatus !== "active") {
        configManager.update({ activeBotStatus: "active" });
      }

      const text = transcript.text;
      const speaker = transcript.speaker || "Speaker";
      const transcriptTextLower = text.toLowerCase();
      const triggerWord = configManager.get().triggerWord.toLowerCase();

      // Record transcript chunk in our live transcripts store for the dashboard!
      transcriptsManager.add(speaker, text);

      // Asynchronously index the transcript in the background
      if (text.trim().length > 10) {
        (async () => {
          try {
            const formatted = `[Meeting Transcript] ${speaker}: ${text}`;
            const vector = await getEmbeddings(formatted);
            vectorStore.addText(vector, formatted);
            console.log(`[RAG Indexed] ${formatted}`);
          } catch (err) {
            console.error("Failed to index live transcript chunk:", err);
          }
        })();
      }
      
      if (botId && transcriptTextLower.includes(triggerWord)) {
        console.log(`Wake word '${triggerWord}' detected! Activating Agentic Engine...`);
        
        // Extract actual question after wake word
        const promptIndex = transcriptTextLower.indexOf(triggerWord);
        const prompt = text.slice(promptIndex + triggerWord.length).trim() || text;
        
        // Trigger asynchronously so we don't block the webhook response
        processAndReplyToMeeting(botId, prompt);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
