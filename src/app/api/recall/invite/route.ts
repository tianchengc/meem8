import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { meetingUrl } = await req.json();

    if (!meetingUrl) {
      return NextResponse.json({ error: "Missing meeting URL" }, { status: 400 });
    }

    const RECALL_API_KEY = process.env.RECALL_API_KEY;

    if (!RECALL_API_KEY || RECALL_API_KEY === 'your_recall_api_key_here') {
      return NextResponse.json({ error: "Recall API key not configured in .env.local" }, { status: 500 });
    }

    // Call Recall.ai API to dispatch bot
    const response = await fetch("https://us-west-2.recall.ai/api/v1/bot", {
      method: "POST",
      headers: {
        "Authorization": `Token ${RECALL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        meeting_url: meetingUrl,
        bot_name: "Meem8 Co-Pilot",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Recall API Error:", errorData);
      return NextResponse.json({ error: "Failed to dispatch Recall bot", details: errorData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, bot: data });

  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
