"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, AlertCircle, Radio } from "lucide-react";

export interface TranscriptItem {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
}

export default function LiveTranscript() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [botStatus, setBotStatus] = useState<"active" | "joining" | "inactive" | "error">("inactive");
  const [statusMessage, setStatusMessage] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingUrl) return;

    setIsInviting(true);
    try {
      const res = await fetch("/api/recall/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingUrl }),
      });
      const data = await res.json();
      if (data.success) {
        // Optimistically set to joining
        setBotStatus("joining");
        setStatusMessage("Bot dispatched successfully!");
        setMeetingUrl("");
      } else {
        alert("Error: " + (data.error || "Failed to dispatch bot"));
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setIsInviting(false);
    }
  };

  // Poll Bot Status and Transcripts
  useEffect(() => {
    let active = true;

    const checkStatus = async () => {
      try {
        const res = await fetch("/api/recall/status");
        if (!res.ok) throw new Error("Failed to fetch status");
        
        const data = await res.json();
        if (!active) return;

        setBotStatus(data.status);
        setStatusMessage(data.message || "");
      } catch (err) {
        console.error("Error checking bot status:", err);
        if (active) setBotStatus("error");
      }
    };

    const fetchTranscripts = async () => {
      try {
        const res = await fetch("/api/recall/transcripts");
        if (!res.ok) throw new Error("Failed to fetch transcripts");
        
        const data = await res.json();
        if (!active) return;
        setTranscripts(data);
      } catch (err) {
        console.error("Error fetching transcripts:", err);
      }
    };

    // Initial check
    checkStatus();
    fetchTranscripts();

    // Check status every 4 seconds
    const statusInterval = setInterval(checkStatus, 4000);
    // Fetch transcripts every 2.5 seconds
    const transcriptsInterval = setInterval(fetchTranscripts, 2500);

    return () => {
      active = false;
      clearInterval(statusInterval);
      clearInterval(transcriptsInterval);
    };
  }, []);

  // Auto-scroll to bottom of transcripts when they update
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcripts]);

  return (
    <div className="flex flex-col h-full bg-zinc-950/40">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5 bg-black/20">
        <h2 className="text-sm font-semibold tracking-wider text-zinc-100 flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            {botStatus === "active" && (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              </>
            )}
            {botStatus === "joining" && (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
              </>
            )}
            {botStatus === "inactive" && (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-600"></span>
            )}
            {botStatus === "error" && (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
            )}
          </span>
          LIVE TRANSCRIPT
        </h2>

        {/* Dynamic Recall Status Badge */}
        {botStatus === "active" && (
          <div className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
            Recall Active
          </div>
        )}
        {botStatus === "joining" && (
          <div className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" />
            Connecting
          </div>
        )}
        {botStatus === "inactive" && (
          <div className="text-[10px] font-semibold text-zinc-500 bg-zinc-500/5 border border-zinc-500/10 px-2 py-0.5 rounded-full">
            Inactive
          </div>
        )}
        {botStatus === "error" && (
          <div className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Offline
          </div>
        )}
      </div>

      {/* Bot Invite input panel */}
      <div className="p-4 border-b border-white/5 bg-black/10">
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="url"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            placeholder="Paste Google Meet / Zoom URL..."
            className="flex-1 bg-zinc-900/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            required
          />
          <button
            type="submit"
            disabled={isInviting}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all whitespace-nowrap shadow-lg shadow-emerald-950/20 flex items-center gap-1.5 cursor-pointer"
          >
            {isInviting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Inviting
              </>
            ) : (
              "Invite Bot"
            )}
          </button>
        </form>
      </div>

      {/* Transcript Render Panel */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-5 scroll-smooth flex flex-col gap-4"
        style={{ scrollbarWidth: "none" }}
      >
        {transcripts.length > 0 ? (
          transcripts.map((t) => (
            <div key={t.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  {t.speaker}
                </span>
                <span className="text-[10px] text-zinc-600">{t.timestamp}</span>
              </div>
              <p className="text-[13px] text-zinc-300 leading-relaxed font-sans select-text">
                {t.text}
              </p>
            </div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500 gap-3">
            {botStatus === "inactive" && (
              <>
                <div className="w-10 h-10 rounded-2xl bg-zinc-900/60 border border-white/5 flex items-center justify-center text-zinc-400">
                  <Mic className="w-5 h-5 text-zinc-500" />
                </div>
                <div className="text-xs font-medium text-zinc-400">No Active Meeting</div>
                <p className="text-[11px] text-zinc-500 max-w-[220px] leading-relaxed">
                  Enter a Zoom or Google Meet URL above to invite the Meem8 co-pilot and record transcripts.
                </p>
              </>
            )}

            {botStatus === "joining" && (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-amber-500 mb-1" />
                <div className="text-xs font-medium text-amber-400">Connecting to Call...</div>
                <p className="text-[11px] text-zinc-500 max-w-[220px] leading-relaxed">
                  The bot is currently entering the waiting room and joining the meeting. Audio stream will begin shortly.
                </p>
              </>
            )}

            {botStatus === "active" && (
              <>
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-pulse mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-xs font-semibold text-emerald-400">Listening to Stream...</div>
                <p className="text-[11px] text-zinc-500 max-w-[220px] leading-relaxed">
                  Recall bot is active in call. Speak in the meeting to see the live transcript feed here.
                </p>
              </>
            )}

            {botStatus === "error" && (
              <>
                <AlertCircle className="w-6 h-6 text-rose-500 mb-1" />
                <div className="text-xs font-medium text-rose-400">Connection Failed</div>
                <p className="text-[11px] text-zinc-500 max-w-[220px] leading-relaxed">
                  Failed to connect to Recall.ai API. Verify your API credentials in <code className="text-rose-400 font-mono">.env.local</code>.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
