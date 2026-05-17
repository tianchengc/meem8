import { NextResponse } from 'next/server';
import { sendChatToRecall } from '@/lib/recall/api';
import { configManager } from '@/lib/config';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const { activeBotId } = configManager.get();
    
    if (!activeBotId) {
      return NextResponse.json({ error: "No active bot ID found." }, { status: 400 });
    }

    await sendChatToRecall(activeBotId, text);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send chat" }, { status: 500 });
  }
}
