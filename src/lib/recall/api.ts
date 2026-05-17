export async function sendChatToRecall(botId: string, text: string) {
  const RECALL_API_KEY = process.env.RECALL_API_KEY;
  if (!RECALL_API_KEY || !botId) {
    console.warn("Missing API key or botId, skipping chat send.");
    return;
  }
  
  try {
    const res = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${botId}/send_chat_message/`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${RECALL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      console.error("Recall API failed:", await res.text());
    }
  } catch (error) {
    console.error("Failed to send chat message to Recall:", error);
  }
}
