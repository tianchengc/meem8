import { NextResponse } from "next/server";
import { agentStateManager } from "@/lib/agentState";

export async function GET() {
  const state = agentStateManager.get();
  return NextResponse.json(state);
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json();
    if (action === "clear") {
      agentStateManager.clear();
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
