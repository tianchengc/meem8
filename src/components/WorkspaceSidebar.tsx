"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  FolderHeart, 
  AlertCircle, 
  Check, 
  HelpCircle, 
  Activity, 
  Plus, 
  FileText, 
  Volume2, 
  Save, 
  RefreshCw,
  Copy,
  Terminal,
  ExternalLink,
  Loader2
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

  // Micro-states for click-to-copy steps
  const [copiedStep1, setCopiedStep1] = useState(false);
  const [copiedStep3, setCopiedStep3] = useState(false);

  const copyToClipboard = async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

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
    <div className="flex flex-col h-full bg-[#08080c]/90 border-l border-white/5 backdrop-blur-2xl">
      {/* Header Tabs */}
      <div className="flex border-b border-white/5 bg-black/40 p-1 gap-1">
        <button
          onClick={() => setActiveTab("control")}
          className={`flex-1 py-3 text-[11px] font-bold tracking-widest flex items-center justify-center gap-2 rounded-xl transition-all duration-300 ${
            activeTab === "control"
              ? "bg-white/[0.04] border border-white/5 text-emerald-400 shadow-md shadow-emerald-500/[0.02]"
              : "border border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.01]"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          CONTROL PANEL
        </button>
        <button
          onClick={() => setActiveTab("workspace")}
          className={`flex-1 py-3 text-[11px] font-bold tracking-widest flex items-center justify-center gap-2 rounded-xl transition-all duration-300 ${
            activeTab === "workspace"
              ? "bg-white/[0.04] border border-white/5 text-emerald-400 shadow-md shadow-emerald-500/[0.02]"
              : "border border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.01]"
          }`}
        >
          <FolderHeart className="w-3.5 h-3.5" />
          WORKSPACE
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6" style={{ scrollbarWidth: "none" }}>
        {activeTab === "control" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            
            {/* Ollama Connection Health */}
            <section className="p-5 rounded-3xl bg-zinc-900/30 border border-white/5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Ollama Status
                </span>
                <button 
                  onClick={checkOllamaHealth} 
                  className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors duration-200"
                  title="Check Health"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-3 py-1">
                {ollamaStatus.status === "loading" && (
                  <>
                    <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
                    <span className="text-xs font-semibold text-zinc-400">Pinging local endpoint...</span>
                  </>
                )}
                {ollamaStatus.status === "ok" && ollamaStatus.modelDetected && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] font-bold tracking-wide uppercase">Gemma 4 (Local) Ready</span>
                  </div>
                )}
                {ollamaStatus.status === "ok" && !ollamaStatus.modelDetected && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span className="text-[11px] font-bold tracking-wide uppercase">Model Missing</span>
                  </div>
                )}
                {ollamaStatus.status === "error" && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.05)]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                    <span className="text-[11px] font-bold tracking-wide uppercase">Ollama Offline</span>
                  </div>
                )}
              </div>

              {/* Diagnosis Blocks */}
              {ollamaStatus.status === "error" && (
                <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/15 text-xs text-rose-300/90 leading-relaxed space-y-2">
                  <p className="font-bold flex items-center gap-1.5 text-rose-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Ollama is not running
                  </p>
                  <p className="text-[11px] text-rose-300/80">
                    Please open the Ollama Desktop App on your machine or start the terminal daemon. Make sure it is listening on localhost port <code className="bg-rose-500/10 px-1 py-0.5 rounded font-mono text-[10px] text-rose-400">11434</code>.
                  </p>
                </div>
              )}

              {ollamaStatus.status === "ok" && !ollamaStatus.modelDetected && (
                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/15 text-xs text-amber-300/90 leading-relaxed space-y-2.5">
                  <p className="font-bold flex items-center gap-1.5 text-amber-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    gemma4:latest not found
                  </p>
                  <p className="text-[11px] text-amber-300/80">
                    Run the following command in your local terminal to pull the model:
                  </p>
                  <div 
                    onClick={() => copyToClipboard("ollama run gemma4:latest", setCopiedStep1)}
                    className="p-2 rounded-xl bg-black/40 border border-white/5 hover:border-amber-500/20 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <code className="text-amber-400 font-mono text-[10px] select-all">
                      ollama run gemma4:latest
                    </code>
                    {copiedStep1 ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Trigger Word Configuration */}
            <section className="p-5 rounded-3xl bg-zinc-900/30 border border-white/5 shadow-xl flex flex-col gap-4">
              <span className="text-xs font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                Trigger Word
              </span>
              <p className="text-[13px] text-zinc-400 leading-relaxed">
                Meem8 listens passively to all meeting transcripts. Once the wake word is said, Gemma begins agentic reasoning and automatically posts the answer directly into Zoom/Meet chat.
              </p>
              <form onSubmit={handleSaveTrigger} className="flex gap-2">
                <input
                  type="text"
                  value={triggerWord}
                  onChange={(e) => setTriggerWord(e.target.value.toLowerCase())}
                  className="flex-1 bg-zinc-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono font-bold tracking-wider placeholder-zinc-600"
                  placeholder="e.g. hi gemma"
                />
                <button
                  type="submit"
                  disabled={saveStatus === "saving"}
                  className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-emerald-500/10 cursor-pointer disabled:opacity-50 flex-shrink-0"
                  title="Save Trigger Word"
                >
                  {saveStatus === "saving" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saveStatus === "saved" ? (
                    <Check className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </button>
              </form>
              {saveStatus === "saved" && (
                <p className="text-xs text-emerald-400 font-medium animate-in fade-in duration-300">Trigger word saved successfully!</p>
              )}
              {saveStatus === "error" && (
                <p className="text-xs text-rose-400 font-medium animate-in fade-in duration-300">Failed to update configuration.</p>
              )}
            </section>

            {/* Instruction Panel */}
            <section className="p-5 rounded-3xl bg-zinc-900/30 border border-white/5 shadow-xl flex flex-col gap-4">
              <span className="text-xs font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                Bot Invite Guide
              </span>
              
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.1)]">
                    01
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <p className="text-[13px] text-zinc-300 font-semibold leading-none">Start Local Tunnel</p>
                    <p className="text-[12px] text-zinc-400 leading-normal">Make sure your backend local ngrok tunnel is active in a terminal:</p>
                    <div 
                      onClick={() => copyToClipboard("npm run tunnel", setCopiedStep3)}
                      className="p-2.5 rounded-xl bg-black/40 border border-white/5 hover:border-emerald-500/20 transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <code className="text-emerald-400 font-mono text-[10px] flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-emerald-500/60" />
                        npm run tunnel
                      </code>
                      {copiedStep3 ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.1)]">
                    02
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-[13px] text-zinc-300 font-semibold leading-none">Configure Webhook</p>
                    <p className="text-[12px] text-zinc-400 leading-normal">
                      Copy the generated <code className="text-emerald-400 px-1 py-0.5 bg-white/5 rounded font-mono text-[10px]">ngrok</code> forwarding URL from your terminal. 
                    </p>
                    <p className="text-[12px] text-zinc-400 leading-normal">
                      Configure it as the Webhook URL in your Recall.ai workspace dashboard, appending the webhook path:
                      <code className="block mt-1.5 p-2 bg-black/30 border border-white/5 rounded-xl font-mono text-[10px] text-zinc-300 select-all">
                        https://&lt;your-ngrok&gt;/api/webhook/recall
                      </code>
                    </p>
                    <a 
                      href="https://dashboard.recall.ai" 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors font-medium mt-1 hover:underline"
                    >
                      Open Recall Dashboard
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.1)]">
                    03
                  </div>
                  <div className="flex-1 space-y-1 text-[12px] text-zinc-400 leading-normal">
                    <p className="text-[13px] text-zinc-300 font-semibold leading-none mb-1">Invite Bot</p>
                    Paste the meeting link into the left panel input in the dashboard and click "Invite Bot". The co-pilot will join and immediately begin live transcription and agentic response.
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}

        {activeTab === "workspace" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            
            {/* Knowledge Base Section */}
            <section className="p-5 rounded-3xl bg-zinc-900/30 border border-white/5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase">Local Knowledge base</h3>
                <button className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 hover:bg-white/[0.04] transition-all cursor-pointer group">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-zinc-300 truncate">Q3_Roadmap.pdf</div>
                    <div className="text-[10px] text-zinc-500">Vectorized PDF • 2.4 MB</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 hover:bg-white/[0.04] transition-all cursor-pointer group">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <FolderHeart className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-zinc-300 truncate">Obsidian Vault (Local)</div>
                    <div className="text-[10px] text-zinc-500">Auto-Synced Folder</div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                </div>
              </div>
            </section>

            {/* Action Items Section */}
            <section className="p-5 rounded-3xl bg-zinc-900/30 border border-white/5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase">Live Action Items</h3>
              </div>
              <div className="space-y-2.5">
                <div className="p-4 rounded-2xl bg-emerald-500/[0.01] border border-emerald-500/10 hover:border-emerald-500/20 transition-all">
                  <p className="text-[12px] text-zinc-300 leading-relaxed font-semibold">Investigate Tavily API pricing for MCP web search skill.</p>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-emerald-500/60 font-mono">
                    <span className="bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">Unassigned</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
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
