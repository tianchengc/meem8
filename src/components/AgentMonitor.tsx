"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Zap, Send, Bot, Check, Volume2, ShieldAlert } from "lucide-react";

export default function AgentMonitor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState("");
  const [activePrompt, setActivePrompt] = useState("");
  const [activeResponse, setActiveResponse] = useState("");
  const [isLocalStreaming, setIsLocalStreaming] = useState(false);
  const [streamSource, setStreamSource] = useState<"meeting" | "dashboard" | "none">("none");

  // Handle Manual Dashboard Submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLocalStreaming) return;

    const currentPrompt = prompt;
    setPrompt(""); // Clear input immediately
    setActivePrompt(currentPrompt);
    setActiveResponse("");
    setIsLocalStreaming(true);
    setStreamSource("dashboard");

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: currentPrompt }),
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
        setActiveResponse((prev) => prev + chunk);
      }

      // Synchronize manual answer back to Zoom/Meet chat so participants see it
      if (fullResponseText.trim()) {
        try {
          await fetch("/api/recall/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: `💡 Dashboard Admin asked: "${currentPrompt}"\n\n🤖 Gemma Co-Pilot: ${fullResponseText}`
            }),
          });
        } catch (chatError) {
          console.warn("Failed to broadcast dashboard Q&A to Recall chat:", chatError);
        }
      }
    } catch (error) {
      console.error("Failed to stream manual agent prompt:", error);
      setActiveResponse("[Error: Failed to connect to local Ollama agent]");
    } finally {
      setIsLocalStreaming(false);
    }
  };

  // Poll for background Meeting voice triggers
  useEffect(() => {
    let active = true;

    const pollAgentState = async () => {
      // Avoid polling clashes if we are actively streaming a dashboard manual query
      if (isLocalStreaming && streamSource === "dashboard") return;

      try {
        const res = await fetch("/api/agent/state");
        if (!res.ok) return;
        const data = await res.json();
        
        if (!active) return;

        if (data.status === "streaming" && data.source === "meeting") {
          setActivePrompt(data.prompt);
          setActiveResponse(data.response);
          setIsLocalStreaming(true);
          setStreamSource("meeting");
        } else if (data.status === "idle" && data.source === "meeting" && streamSource === "meeting") {
          setActiveResponse(data.response);
          setIsLocalStreaming(false);
        }
      } catch (err) {
        console.error("Error polling agent state:", err);
      }
    };

    pollAgentState();
    // High-frequency polling (800ms) for comfortable text stream pacing
    const interval = setInterval(pollAgentState, 800);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isLocalStreaming, streamSource]);

  // Auto-scroll to bottom of output container
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [activeResponse]);

  return (
    <div className="flex flex-col h-full bg-[#07070a]/40">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Bot className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              Gemma 4 (Local)
            </h2>
            <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5">
              {isLocalStreaming ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                  Generating Answer...
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Idle Monitor
                </>
              )}
            </p>
          </div>
        </div>

        {/* Streaming Source Badge */}
        <div className="flex items-center gap-2">
          {isLocalStreaming && streamSource === "meeting" && (
            <span className="px-2.5 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-[9px] font-bold text-cyan-400 tracking-wider uppercase animate-pulse flex items-center gap-1">
              <Volume2 className="w-3 h-3 animate-bounce" />
              Meeting Voice Trigger
            </span>
          )}
          {isLocalStreaming && streamSource === "dashboard" && (
            <span className="px-2.5 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-[9px] font-bold text-purple-400 tracking-wider uppercase animate-pulse flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Dashboard Admin
            </span>
          )}
          <span className="px-2 py-0.5 rounded-lg border border-white/5 bg-white/[0.02] text-[9px] font-mono text-zinc-500">
            MEM: 5.2GB
          </span>
        </div>
      </div>

      {/* Main output panel */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {activePrompt ? (
          <div className="space-y-6">
            {/* Prompt Card */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 shadow-md max-w-xl animate-in fade-in duration-300">
              <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase block mb-1">
                Query Prompt
              </span>
              <p className="text-sm text-zinc-200 font-sans leading-relaxed select-text">
                {activePrompt}
              </p>
            </div>

            {/* Response Card */}
            <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-400">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0 flex items-center justify-center shadow-lg shadow-emerald-950/20">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase block">
                  Agent Inference Output
                </span>
                <p className="text-[14px] leading-relaxed text-zinc-300 whitespace-pre-wrap font-sans select-text">
                  {activeResponse || (
                    <span className="text-zinc-500 italic flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Awaiting stream...
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 gap-3">
            <div className="w-12 h-12 rounded-3xl bg-zinc-900/60 border border-white/5 flex items-center justify-center text-zinc-400 shadow-xl shadow-black/10">
              <Zap className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div className="text-sm font-semibold text-zinc-300">Agent Center Monitor</div>
            <p className="text-xs text-zinc-500 max-w-[280px] leading-relaxed">
              State machine is listening. Enter a manual prompt below, or say your Trigger Word <code className="text-emerald-400 font-bold font-mono bg-emerald-950/25 px-1 py-0.5 rounded border border-emerald-500/10">hey gemma</code> in the live meeting call to see dynamic local inference.
            </p>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-black/15">
        <div className="relative flex items-center">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLocalStreaming}
            placeholder="Type a manual prompt for local Gemma..."
            className="w-full bg-zinc-950/50 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all disabled:opacity-50 shadow-inner"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isLocalStreaming}
            className="absolute right-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer disabled:opacity-30 flex items-center justify-center"
          >
            {isLocalStreaming ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
