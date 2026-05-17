import { NextResponse } from "next/server";
import { agentEngine } from "@/lib/agent/engine";

const RECALL_API_KEY = process.env.RECALL_API_KEY;
const TRIGGER_WORD = (process.env.MEEM8_TRIGGER_WORD || "hey gemma").toLowerCase();

async function sendChatToRecall(botId: string, text: string) {
  if (!RECALL_API_KEY) return;
  try {
    await fetch(`https://us-west-2.recall.ai/api/v1/bot/${botId}/send_chat_message/`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${RECALL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
  } catch (error) {
    console.error("Failed to send chat message to Recall:", error);
  }
}

async function processAndReplyToMeeting(botId: string, prompt: string) {
  try {
    // 1. Send immediate placeholder
    await sendChatToRecall(botId, "Meem8 is thinking...");

    // 2. Trigger the engine
    const stream = await agentEngine.invoke(prompt);
    
    // 3. Consume the stream
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullResponse += decoder.decode(value, { stream: true });
    }

    // 4. Send the final response to chat
    await sendChatToRecall(botId, fullResponse);

  } catch (error) {
    console.error("Agent error during webhook processing:", error);
    await sendChatToRecall(botId, "Sorry, I encountered an error while processing that request.");
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    // Extract bot ID from payload (sometimes at payload.data.bot_id or payload.bot_id)
    const botId = payload.data?.bot_id || payload.bot_id;

    if (payload.event === "bot.transcript" || payload.data?.transcript?.text) {
      const transcriptText = payload.data?.transcript?.text?.toLowerCase() || "";
      
      if (botId && transcriptText.includes(TRIGGER_WORD)) {
        console.log(`Wake word '${TRIGGER_WORD}' detected! Activating Agentic Engine...`);
        
        // Extract the actual question after the trigger word if possible, or just pass the whole text
        const promptIndex = transcriptText.indexOf(TRIGGER_WORD);
        const prompt = transcriptText.slice(promptIndex + TRIGGER_WORD.length).trim() || transcriptText;
        
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
