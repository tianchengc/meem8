"use client";

import { useRef, useState } from "react";

export default function AgentMonitor() {
  const streamRef = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isStreaming) return;

    setIsStreaming(true);
    if (streamRef.current) streamRef.current.textContent = "";

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponseText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullResponseText += chunk;
        if (streamRef.current) {
          streamRef.current.textContent += chunk;
        }
      }

      // Sync prompt and final answer back to Zoom/Meet chat so call participants can follow along!
      if (fullResponseText.trim()) {
        try {
          await fetch("/api/recall/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: `💡 Dashboard Admin asked: "${prompt}"\n\n🤖 Gemma Co-Pilot: ${fullResponseText}`
            }),
          });
        } catch (chatError) {
          console.warn("Failed to broadcast dashboard Q&A to Recall chat:", chatError);
        }
      }
    } catch (error) {
      console.error("Failed to stream:", error);
      if (streamRef.current) {
        streamRef.current.textContent = "[Error: Failed to connect to local agent via API]";
      }
    } finally {
      setIsStreaming(false);
      setPrompt("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.4)]">
            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Gemma 4 (Local)</h2>
            <p className="text-xs text-emerald-400 font-mono">{isStreaming ? "Generating..." : "Idle"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="px-2.5 py-1 rounded border border-white/10 bg-white/5 text-[10px] font-mono text-zinc-400">MEM: 5.2GB</span>
          <span className="px-2.5 py-1 rounded border border-white/10 bg-white/5 text-[10px] font-mono text-zinc-400">CTX: 4.1k/8k</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {/* Streaming Output Block */}
        <div className="flex gap-4">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex-shrink-0 mt-1 flex items-center justify-center">
            <div className={`w-2 h-2 rounded-full bg-emerald-400 ${isStreaming ? 'animate-pulse' : ''}`} />
          </div>
          <div 
            ref={streamRef} 
            className="text-lg leading-relaxed text-zinc-200 whitespace-pre-wrap"
          >
            Agent is ready. Send a prompt to begin native Ollama inference.
          </div>
        </div>
      </div>
      
      {/* Bottom Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-black/10">
        <div className="relative">
          <input 
            type="text" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isStreaming}
            placeholder="Type a manual prompt or wait for 'Hey Gemma'..." 
            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!prompt.trim() || isStreaming}
            className="absolute right-2 top-2 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
