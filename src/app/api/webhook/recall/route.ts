import { NextResponse } from "next/server";
import { agentEngine } from "@/lib/agent/engine";
import { configManager } from "@/lib/config";
import { sendChatToRecall } from "@/lib/recall/api";

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

    if (botId) {
      configManager.update({ activeBotId: botId });
    }

    if (payload.event === "bot.transcript" || payload.data?.transcript?.text) {
      const transcriptText = payload.data?.transcript?.text?.toLowerCase() || "";
      const triggerWord = configManager.get().triggerWord.toLowerCase();
      
      if (botId && transcriptText.includes(triggerWord)) {
        console.log(`Wake word '${triggerWord}' detected! Activating Agentic Engine...`);
        
        // Extract the actual question after the trigger word if possible, or just pass the whole text
        const promptIndex = transcriptText.indexOf(triggerWord);
        const prompt = transcriptText.slice(promptIndex + triggerWord.length).trim() || transcriptText;
        
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
