import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch("http://localhost:11434/api/tags", {
      method: "GET",
      signal: AbortSignal.timeout(2000)
    });
    
    if (res.ok) {
      const data = await res.json();
      const hasGemma = data.models?.some((m: any) => m.name === 'gemma4:latest');
      if (hasGemma) {
        return NextResponse.json({ status: "ok", modelDetected: true });
      } else {
        return NextResponse.json({ status: "ok", modelDetected: false, error: "Model 'gemma4:latest' not found. Please run 'ollama run gemma4:latest'." });
      }
    }
    return NextResponse.json({ status: "error", error: "Ollama is running but returned an error." }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ status: "error", error: "Ollama is not running. Please start Ollama." }, { status: 503 });
  }
}
