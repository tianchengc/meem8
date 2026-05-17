import { NextResponse } from 'next/server';
import { configManager } from '@/lib/config';

export async function GET() {
  return NextResponse.json(configManager.get());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newConfig = configManager.update(body);
    return NextResponse.json(newConfig);
  } catch (error) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
