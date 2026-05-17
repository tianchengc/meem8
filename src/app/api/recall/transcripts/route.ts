import { NextResponse } from "next/server";
import { transcriptsManager } from "@/lib/transcripts";

export async function GET() {
  try {
    return NextResponse.json(transcriptsManager.get());
  } catch (error) {
    console.error("Transcripts API Error:", error);
    return NextResponse.json({ error: "Failed to read transcripts" }, { status: 500 });
  }
}
