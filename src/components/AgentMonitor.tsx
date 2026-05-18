"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Bot, Check, Copy, Loader2, Radio, Send, ShieldCheck, Sparkles, Volume2, Zap } from "lucide-react";

interface ConversationEntry {
  id: string;
  prompt: string;
  response: string;
  source: "local" | "meeting" | "dashboard";
  isStreaming: boolean;
  timestamp: string;
}

interface OllamaHealth {
  status: "loading" | "ok" | "error";
  modelDetected: boolean;
}

interface Props {
  localTrigger: { id: string; prompt: string } | null;
}

export default function AgentMonitor({ localTrigger }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [history, setHistory] = useState<ConversationEntry[]>([]);
  const [manualPrompt, setManualPrompt] = useState("");
  const [ollamaHealth, setOllamaHealth] = useState<OllamaHealth>({ status: "loading", modelDetected: false });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyResponse = useCallback(async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    } catch {}
  }, []);

  // Track whether any entry is streaming (used to block manual submit)
  const isAnyStreaming = history.some((e) => e.isStreaming);

  // Track last seen meeting trigger timestamp to detect new ones
  const lastMeetingTimestampRef = useRef("");

  // ── Helpers ──────────────────────────────────────────────────────────────
  const appendEntry = useCallback((entry: ConversationEntry) => {
    setHistory((prev) => [...prev, entry]);
  }, []);

  const updateEntry = useCallback((id: string, updates: Partial<ConversationEntry>) => {
    setHistory((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const streamAgentResponse = useCallback(async (prompt: string, entryId: string) => {
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.body) throw new Error("No stream body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setHistory((prev) =>
          prev.map((e) => (e.id === entryId ? { ...e, response: e.response + chunk } : e))
        );
      }

      updateEntry(entryId, { isStreaming: false });
    } catch {
      updateEntry(entryId, {
        response: "[Error: Failed to connect to local Ollama agent]",
        isStreaming: false,
      });
    }
  }, [updateEntry]);

  // ── Ollama health polling ────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/ollama/health");
        const data = await res.json();
        setOllamaHealth({
          status: data.status === "ok" ? "ok" : "error",
          modelDetected: !!data.modelDetected,
        });
      } catch {
        setOllamaHealth({ status: "error", modelDetected: false });
      }
    };

    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  // ── Local trigger (from speech recognition via page) ─────────────────────
  useEffect(() => {
    if (!localTrigger) return;
    const entryId = `local-${localTrigger.id}`;
    appendEntry({
      id: entryId,
      prompt: localTrigger.prompt,
      response: "",
      source: "local",
      isStreaming: true,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    });
    streamAgentResponse(localTrigger.prompt, entryId);
  // only re-run when a new trigger arrives (id changes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localTrigger?.id]);

  // ── Cloud meeting trigger polling ────────────────────────────────────────
  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const res = await fetch("/api/agent/state");
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;

        if (data.source !== "meeting") return;

        const entryId = `meeting-${data.timestamp}`;

        if (data.status === "streaming" && data.timestamp !== lastMeetingTimestampRef.current) {
          // New meeting trigger
          lastMeetingTimestampRef.current = data.timestamp;
          setHistory((prev) => {
            if (prev.find((e) => e.id === entryId)) return prev;
            return [...prev, {
              id: entryId,
              prompt: data.prompt,
              response: data.response,
              source: "meeting" as const,
              isStreaming: true,
              timestamp: data.timestamp,
            }];
          });
        } else if (data.timestamp === lastMeetingTimestampRef.current) {
          setHistory((prev) =>
            prev.map((e) =>
              e.id === entryId
                ? { ...e, response: data.response, isStreaming: data.status === "streaming" }
                : e
            )
          );
        }
      } catch {}
    };

    poll();
    const interval = setInterval(poll, 800);
    return () => { active = false; clearInterval(interval); };
  }, []);

  // ── Manual dashboard submit ──────────────────────────────────────────────
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualPrompt.trim() || isAnyStreaming) return;

    const currentPrompt = manualPrompt;
    setManualPrompt("");

    const entryId = `dashboard-${Date.now()}`;
    appendEntry({
      id: entryId,
      prompt: currentPrompt,
      response: "",
      source: "dashboard",
      isStreaming: true,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    });

    await streamAgentResponse(currentPrompt, entryId);
  };

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (containerRef.current)
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [history]);

  // ── Derived header status ────────────────────────────────────────────────
  const headerStatus = () => {
    if (isAnyStreaming) return { label: "Generating Answer…", color: "text-emerald-400", icon: <Loader2 className="w-3 h-3 animate-spin" /> };
    if (ollamaHealth.status === "loading") return { label: "Checking Ollama…", color: "text-zinc-500", icon: <Loader2 className="w-3 h-3 animate-spin" /> };
    if (ollamaHealth.status === "error") return { label: "Ollama Offline", color: "text-rose-400", icon: <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> };
    if (!ollamaHealth.modelDetected) return { label: "Model Not Found", color: "text-amber-400", icon: <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> };
    return { label: "Idle · Ready", color: "text-emerald-400", icon: <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> };
  };
  const status = headerStatus();

  // ── Source badge config ──────────────────────────────────────────────────
  const sourceBadge = (source: ConversationEntry["source"], streaming: boolean) => {
    if (source === "local") return (
      <span className={`px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[9px] font-bold text-emerald-400 tracking-wider uppercase flex items-center gap-1 ${streaming ? "animate-pulse" : ""}`}>
        <ShieldCheck className="w-2.5 h-2.5" /> Local Trigger
      </span>
    );
    if (source === "meeting") return (
      <span className={`px-2 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-[9px] font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-1 ${streaming ? "animate-pulse" : ""}`}>
        <Volume2 className="w-2.5 h-2.5" /> Meeting Voice
      </span>
    );
    return (
      <span className={`px-2 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-[9px] font-bold text-purple-400 tracking-wider uppercase flex items-center gap-1 ${streaming ? "animate-pulse" : ""}`}>
        <Zap className="w-2.5 h-2.5" /> Dashboard
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#07070a]/40">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Bot className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Gemma 4 (Local)</h2>
            <p className={`text-[10px] font-mono flex items-center gap-1.5 mt-0.5 ${status.color}`}>
              {status.icon}
              {status.label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAnyStreaming && history.at(-1)?.source === "meeting" && (
            <span className="px-2.5 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-[9px] font-bold text-cyan-400 tracking-wider uppercase animate-pulse flex items-center gap-1">
              <Radio className="w-3 h-3" />
              Meeting Voice
            </span>
          )}
          <span className="px-2 py-0.5 rounded-lg border border-white/5 bg-white/[0.02] text-[9px] font-mono text-zinc-500">
            gemma4:latest
          </span>
        </div>
      </div>

      {/* Conversation History */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 scroll-smooth flex flex-col gap-8"
        style={{ scrollbarWidth: "none" }}
      >
        {history.length > 0 ? (
          history.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Prompt row */}
              <div className="flex items-start gap-3">
                <div className="flex-1 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] max-w-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    {sourceBadge(entry.source, entry.isStreaming)}
                    <span className="text-[10px] text-zinc-600 font-mono">{entry.timestamp}</span>
                  </div>
                  <p className="text-[13px] text-zinc-200 leading-relaxed select-text">{entry.prompt}</p>
                </div>
              </div>

              {/* Response row */}
              <div className="flex items-start gap-3 pl-4">
                <div className="w-6 h-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                  {entry.isStreaming
                    ? <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                    : <Bot className="w-3 h-3 text-emerald-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">
                      Gemma 4 Response
                    </span>
                    {!entry.isStreaming && entry.response && (
                      <button
                        onClick={() => copyResponse(entry.id, entry.response)}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all"
                        title="Copy response"
                      >
                        {copiedId === entry.id
                          ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
                          : <><Copy className="w-3 h-3" />Copy</>
                        }
                      </button>
                    )}
                  </div>
                  <p className="text-[13px] leading-relaxed text-zinc-300 whitespace-pre-wrap font-sans select-text">
                    {entry.response || (
                      entry.isStreaming
                        ? <span className="text-zinc-600 italic flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" />Waiting for stream…</span>
                        : <span className="text-zinc-600 italic">No response.</span>
                    )}
                    {entry.isStreaming && entry.response && (
                      <span className="inline-block w-0.5 h-3.5 bg-emerald-400/70 animate-pulse align-text-bottom ml-0.5" />
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-3">
            <div className="w-12 h-12 rounded-3xl bg-zinc-900/60 border border-white/5 flex items-center justify-center shadow-xl">
              <Zap className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div className="text-sm font-semibold text-zinc-300">Agent Center Monitor</div>
            <p className="text-xs text-zinc-500 max-w-[280px] leading-relaxed">
              Say your trigger word{" "}
              <code className="text-emerald-400 font-bold font-mono bg-emerald-950/25 px-1 py-0.5 rounded border border-emerald-500/10">
                hi gemma
              </code>{" "}
              in the transcript to invoke Gemma 4 — or type a manual prompt below.
            </p>
            {ollamaHealth.status === "error" && (
              <div className="flex items-center gap-1.5 text-[11px] text-rose-400 bg-rose-950/30 border border-rose-500/15 px-3 py-1.5 rounded-full mt-1">
                <AlertCircle className="w-3 h-3" />
                Ollama is offline — start it to enable inference
              </div>
            )}
            {ollamaHealth.status === "ok" && !ollamaHealth.modelDetected && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-950/30 border border-amber-500/15 px-3 py-1.5 rounded-full mt-1">
                <AlertCircle className="w-3 h-3" />
                Run <code className="font-mono mx-1">ollama run gemma4:latest</code> first
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-black/15">
        <div className="relative flex items-center">
          <input
            type="text"
            value={manualPrompt}
            onChange={(e) => setManualPrompt(e.target.value)}
            disabled={isAnyStreaming}
            placeholder="Type a manual prompt for Gemma 4…"
            className="w-full bg-zinc-950/50 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all disabled:opacity-50 shadow-inner"
          />
          <button
            type="submit"
            disabled={!manualPrompt.trim() || isAnyStreaming}
            className="absolute right-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer disabled:opacity-30 flex items-center justify-center"
          >
            {isAnyStreaming
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Send className="w-3.5 h-3.5" />
            }
          </button>
        </div>
      </form>
    </div>
  );
}
