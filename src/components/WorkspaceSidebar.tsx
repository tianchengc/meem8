"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  FolderHeart, 
  AlertCircle, 
  CheckCircle, 
  HelpCircle, 
  Activity, 
  Plus, 
  FileText, 
  Volume2, 
  Save, 
  RefreshCw 
} from "lucide-react";

export default function WorkspaceSidebar() {
  const [activeTab, setActiveTab] = useState<"control" | "workspace">("control");
  const [triggerWord, setTriggerWord] = useState("hi gemma");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [ollamaStatus, setOllamaStatus] = useState<{
    status: "loading" | "ok" | "error";
    modelDetected: boolean;
    error?: string;
  }>({ status: "loading", modelDetected: false });

  // Fetch Ollama health
  const checkOllamaHealth = async () => {
    try {
      const res = await fetch("/api/ollama/health");
      const data = await res.json();
      if (data.status === "ok") {
        setOllamaStatus({
          status: "ok",
          modelDetected: data.modelDetected,
          error: data.error,
        });
      } else {
        setOllamaStatus({
          status: "error",
          modelDetected: false,
          error: data.error || "Ollama is offline.",
        });
      }
    } catch (err) {
      setOllamaStatus({
        status: "error",
        modelDetected: false,
        error: "Ollama server not reachable. Please start it.",
      });
    }
  };

  // Fetch Config
  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        const data = await res.json();
        setTriggerWord(data.triggerWord);
      }
    } catch (err) {
      console.error("Failed to load config:", err);
    }
  };

  // Save trigger word
  const handleSaveTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggerWord }),
      });
      if (res.ok) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } else {
        setSaveStatus("error");
      }
    } catch (err) {
      setSaveStatus("error");
    }
  };

  useEffect(() => {
    checkOllamaHealth();
    fetchConfig();
    const interval = setInterval(checkOllamaHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-zinc-950/80 border-l border-white/5">
      {/* Header Tabs */}
      <div className="flex border-b border-white/5 bg-black/40">
        <button
          onClick={() => setActiveTab("control")}
          className={`flex-1 py-4 text-xs font-semibold tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === "control"
              ? "border-emerald-500 text-emerald-400 bg-white/[0.02]"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          CONTROL PANEL
        </button>
        <button
          onClick={() => setActiveTab("workspace")}
          className={`flex-1 py-4 text-xs font-semibold tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === "workspace"
              ? "border-emerald-500 text-emerald-400 bg-white/[0.02]"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <FolderHeart className="w-3.5 h-3.5" />
          WORKSPACE
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
        {activeTab === "control" && (
          <div className="flex flex-col gap-6">
            
            {/* Ollama Connection Health */}
            <section className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 tracking-wide uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Ollama Status
                </span>
                <button 
                  onClick={checkOllamaHealth} 
                  className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                  title="Check Health"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2.5 py-1">
                {ollamaStatus.status === "loading" && (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-600 animate-pulse" />
                    <span className="text-sm font-medium text-zinc-400">Pinging local endpoint...</span>
                  </>
                )}
                {ollamaStatus.status === "ok" && ollamaStatus.modelDetected && (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                    <span className="text-sm font-semibold text-emerald-400">Gemma 4 (Local) Ready</span>
                  </>
                )}
                {ollamaStatus.status === "ok" && !ollamaStatus.modelDetected && (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse" />
                    <span className="text-sm font-semibold text-amber-400">Model Missing</span>
                  </>
                )}
                {ollamaStatus.status === "error" && (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse" />
                    <span className="text-sm font-semibold text-rose-400">Ollama Offline</span>
                  </>
                )}
              </div>

              {/* Diagnosis Blocks */}
              {ollamaStatus.status === "error" && (
                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 text-xs text-rose-300 leading-relaxed space-y-2">
                  <p className="font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Ollama is not running.
                  </p>
                  <p>Open Ollama Application on your machine or start the daemon. Make sure it is listening on localhost port 11434.</p>
                </div>
              )}

              {ollamaStatus.status === "ok" && !ollamaStatus.modelDetected && (
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300 leading-relaxed space-y-2">
                  <p className="font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Model 'gemma4:latest' not found!
                  </p>
                  <p>Open your terminal and pull the model tag:</p>
                  <code className="block p-1.5 rounded bg-black/40 text-amber-400 font-mono text-[10px] select-all">
                    ollama run gemma4:latest
                  </code>
                </div>
              )}
            </section>

            {/* Trigger Word Configuration */}
            <section className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
              <span className="text-xs font-semibold text-zinc-400 tracking-wide uppercase flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                Trigger Word
              </span>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Meem8 listens passively to all meeting transcripts. Once the wake word is said, Gemma begins agentic reasoning and automatically posts the answer directly into Zoom/Meet chat.
              </p>
              <form onSubmit={handleSaveTrigger} className="flex gap-2">
                <input
                  type="text"
                  value={triggerWord}
                  onChange={(e) => setTriggerWord(e.target.value.toLowerCase())}
                  className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all font-mono"
                  placeholder="e.g. hi gemma"
                />
                <button
                  type="submit"
                  disabled={saveStatus === "saving"}
                  className="px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                >
                  <Save className="w-3 h-3" />
                  Save
                </button>
              </form>
              {saveStatus === "saved" && (
                <p className="text-[10px] text-emerald-400 font-medium">Trigger word saved successfully!</p>
              )}
              {saveStatus === "error" && (
                <p className="text-[10px] text-rose-400 font-medium">Failed to update configuration.</p>
              )}
            </section>

            {/* Instruction Panel */}
            <section className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
              <span className="text-xs font-semibold text-zinc-400 tracking-wide uppercase flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                Bot Invite Guide
              </span>
              <ol className="space-y-3 text-[11px] text-zinc-400 list-decimal pl-3.5">
                <li>
                  Make sure your backend tunnel is running:
                  <code className="block mt-1 p-1 rounded bg-black/40 text-emerald-400 font-mono text-[9px] select-all">
                    npm run tunnel
                  </code>
                </li>
                <li>
                  Copy the ngrok url from terminal and place it in the Webhook configuration of your Recall.ai workspace setting.
                </li>
                <li>
                  Add the active meeting invitation link in the dashboard's "Invite Bot" panel. The bot will join and begin capturing audio transcripts.
                </li>
              </ol>
            </section>

          </div>
        )}

        {activeTab === "workspace" && (
          <div className="flex flex-col gap-6">
            
            {/* Knowledge Base Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Local Knowledge base</h3>
                <button className="text-zinc-400 hover:text-white transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <div className="text-xs text-zinc-300 truncate">Q3_Roadmap.pdf</div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <div className="text-xs text-zinc-300 truncate">Obsidian Vault (Local)</div>
                  <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
              </div>
            </section>

            {/* Action Items Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Live Action Items</h3>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">Investigate Tavily API pricing for MCP web search skill.</p>
                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-emerald-500/60 font-mono">
                    <span>Unassigned</span>
                    <span>Active</span>
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  );
}
