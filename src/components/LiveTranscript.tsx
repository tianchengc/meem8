"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Cloud,
  Info,
  Loader2,
  Lock,
  Mic,
  MicOff,
  Radio,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { AppMode } from "@/lib/appTypes";

// Web Speech API types (not yet in every TS DOM lib version)
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface TranscriptItem {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
}

interface Props {
  mode: AppMode;
  onTrigger: (prompt: string) => void;
}

const TRIGGER_WORD = "hi gemma";

type RecordingStatus = "idle" | "recording" | "error";
type NotificationPayload = { type: "success" | "error" | "info"; title: string; message: string };

export default function LiveTranscript({ mode, onTrigger }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const localTranscriptsRef = useRef<TranscriptItem[]>([]);

  // ── Shared ──────────────────────────────────────────────────────────────
  const [notification, setNotification] = useState<NotificationPayload | null>(null);

  // ── Local mode ──────────────────────────────────────────────────────────
  const [localTranscripts, setLocalTranscripts] = useState<TranscriptItem[]>([]);
  const [interimText, setInterimText] = useState("");
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>("idle");
  const [triggerFired, setTriggerFired] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ── Cloud mode ──────────────────────────────────────────────────────────
  const [meetingUrl, setMeetingUrl] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [cloudTranscripts, setCloudTranscripts] = useState<TranscriptItem[]>([]);
  const [botStatus, setBotStatus] = useState<"active" | "joining" | "inactive" | "error">("inactive");

  // ── Helpers ─────────────────────────────────────────────────────────────
  const showNotification = useCallback((type: NotificationPayload["type"], title: string, message: string) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification((c) => (c?.title === title ? null : c)), 10000);
  }, []);

  const isBrowserSupported =
    mounted && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // detect client mount (avoids SSR window access)
  useEffect(() => { setMounted(true); }, []);

  // ── Local: stop recording ────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null; // clear first so onend won't auto-restart
    rec?.stop();
    setRecordingStatus("idle");
    setInterimText("");
  }, []);

  // ── Local: start recording ───────────────────────────────────────────────
  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setRecordingStatus("recording");

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      recognitionRef.current = null;
      setRecordingStatus("error");
      const msg =
        event.error === "not-allowed"
          ? "Grant microphone permission in your browser to use Local Mode."
          : `Recognition failed: ${event.error}`;
      showNotification("error", "Microphone Error", msg);
    };

    // auto-restart on unexpected end while still supposed to be running
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognition.start();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          if (!text) continue;

          const item: TranscriptItem = {
            id: `local-${Date.now()}-${Math.random()}`,
            speaker: "You",
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };

          const updated = [...localTranscriptsRef.current, item];
          localTranscriptsRef.current = updated;
          setLocalTranscripts(updated);

          if (text.toLowerCase().includes(TRIGGER_WORD)) {
            const context = updated.slice(-6).map((t) => `${t.speaker}: ${t.text}`).join("\n");
            const fullPrompt = `Meeting context:\n${context}\n\nQuery: ${text}`;
            onTrigger(fullPrompt);
            setTriggerFired(true);
            setTimeout(() => setTriggerFired(false), 3000);
          }
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(interim);
    };

    recognitionRef.current = recognition;
    recognition.start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNotification]);

  // ── Keep ref in sync with state for use inside event handlers ───────────
  useEffect(() => { localTranscriptsRef.current = localTranscripts; }, [localTranscripts]);

  // ── Mode switch: isolate state, stop polling/recording ──────────────────
  const prevModeRef = useRef(mode);
  useEffect(() => {
    if (prevModeRef.current === mode) return;
    prevModeRef.current = mode;

    if (mode === "cloud") {
      stopRecording();
      setLocalTranscripts([]);
      setInterimText("");
      setRecordingStatus("idle");
    } else {
      setCloudTranscripts([]);
      setBotStatus("inactive");
    }
  }, [mode, stopRecording]);

  // ── Cloud: polling (completely off in local mode) ────────────────────────
  useEffect(() => {
    if (mode !== "cloud") return;
    let active = true;

    const checkStatus = async () => {
      try {
        const res = await fetch("/api/recall/status");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (active) { setBotStatus(data.status); }
      } catch {
        if (active) setBotStatus("error");
      }
    };

    const fetchTranscripts = async () => {
      try {
        const res = await fetch("/api/recall/transcripts");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (active) setCloudTranscripts(data);
      } catch {}
    };

    checkStatus();
    fetchTranscripts();
    const si = setInterval(checkStatus, 4000);
    const ti = setInterval(fetchTranscripts, 2500);
    return () => { active = false; clearInterval(si); clearInterval(ti); };
  }, [mode]);

  // ── Cloud: invite bot ───────────────────────────────────────────────────
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
        setBotStatus("joining");
        setMeetingUrl("");
        showNotification("success", "Invitation Sent", "Recall bot dispatched to the call. Connecting...");
      } else {
        const detail = data.details?.detail || data.details?.message || data.error || "Failed to dispatch bot.";
        showNotification("error", "Dispatch Failed", detail);
      }
    } catch {
      showNotification("error", "Connection Error", "Failed to reach local server.");
    } finally {
      setIsInviting(false);
    }
  };

  // ── Auto-scroll ─────────────────────────────────────────────────────────
  const activeTranscripts = mode === "local" ? localTranscripts : cloudTranscripts;
  useEffect(() => {
    if (containerRef.current)
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [activeTranscripts, interimText]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full relative">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`absolute top-4 left-4 right-4 z-50 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in slide-in-from-top duration-300 flex items-start gap-3 ${
            notification.type === "error"
              ? "bg-rose-950/90 border-rose-500/20"
              : notification.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/20"
              : "bg-cyan-950/90 border-cyan-500/20"
          }`}
        >
          {notification.type === "error" && <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />}
          {notification.type === "success" && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />}
          {notification.type === "info" && <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <h4 className={`text-[10px] font-bold tracking-widest uppercase ${
              notification.type === "error" ? "text-rose-400" : notification.type === "success" ? "text-emerald-400" : "text-cyan-400"
            }`}>
              {notification.title}
            </h4>
            <p className="text-[11px] text-zinc-300 leading-normal mt-0.5 select-text">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-zinc-600 hover:text-zinc-300 text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors uppercase tracking-wider"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── LOCAL MODE ──────────────────────────────────────────────────── */}
      {mode === "local" && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-emerald-500/[0.08] bg-emerald-950/[0.12]">
            <h2 className="text-sm font-semibold tracking-wider text-emerald-200 flex items-center gap-2.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              LOCAL SECURE SESSION
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Confidential
            </div>
          </div>

          {/* Mic control area */}
          <div className="p-4 border-b border-emerald-500/[0.06] bg-black/10">
            {/* Browser unsupported hard-block */}
            {mounted && !isBrowserSupported ? (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/20">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-300">Browser Not Supported</p>
                  <p className="text-[11px] text-amber-500/80 mt-0.5 leading-relaxed">
                    Web Speech API requires Chrome or Edge. Firefox and Safari are not supported.
                  </p>
                </div>
              </div>
            ) : recordingStatus === "idle" ? (
              <button
                onClick={startRecording}
                disabled={!mounted}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 hover:text-emerald-200 text-xs font-semibold transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.06)] hover:shadow-[0_0_24px_rgba(16,185,129,0.12)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer group"
              >
                <ShieldCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                Start Local Secure Microphone
              </button>
            ) : recordingStatus === "recording" ? (
              <div className="flex items-center gap-3">
                {/* Pulsing mic indicator */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                  <div className="relative w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-emerald-400">Recording — say <span className="text-emerald-300 font-bold">"hi gemma"</span> to query</p>
                  {triggerFired && (
                    <p className="text-[10px] text-cyan-400 flex items-center gap-1 mt-0.5">
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      Gemma 4 invoked →
                    </p>
                  )}
                </div>
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-[11px] font-semibold transition-all duration-200 cursor-pointer"
                >
                  <MicOff className="w-3 h-3" />
                  Stop
                </button>
              </div>
            ) : (
              /* Error state */
              <button
                onClick={startRecording}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-400 text-xs font-semibold transition-all duration-200 cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Retry Microphone Access
              </button>
            )}
          </div>

          {/* Local Transcript Panel */}
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto p-5 scroll-smooth flex flex-col gap-4"
            style={{ scrollbarWidth: "none" }}
          >
            {localTranscripts.length > 0 || interimText ? (
              <>
                {localTranscripts.map((t) => (
                  <div key={t.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-xs text-emerald-500/70 group-hover:text-emerald-400 transition-colors">
                        {t.speaker}
                      </span>
                      <span className="text-[10px] text-zinc-700">{t.timestamp}</span>
                    </div>
                    <p className="text-[13px] text-zinc-300 leading-relaxed font-sans select-text">{t.text}</p>
                  </div>
                ))}

                {/* Interim / in-progress text */}
                {interimText && (
                  <div className="animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-xs text-emerald-500/50">You</span>
                      <span className="text-[10px] text-zinc-700 italic">live</span>
                    </div>
                    <p className="text-[13px] text-zinc-500 leading-relaxed font-sans select-text italic">
                      {interimText}
                      <span className="ml-0.5 inline-block w-0.5 h-3.5 bg-emerald-500/60 animate-pulse align-text-bottom" />
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-900/20 border border-emerald-500/15 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-emerald-500/60" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-400/80">Air-Gapped Mode Active</p>
                  <p className="text-[11px] text-zinc-600 max-w-[210px] leading-relaxed mt-1">
                    No data leaves this device. Start the microphone to begin a confidential local transcript.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-700 bg-zinc-900/60 border border-white/[0.04] px-3 py-1.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Zero cloud calls in this mode
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── CLOUD BOT MODE ──────────────────────────────────────────────── */}
      {mode === "cloud" && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/5 bg-black/20">
            <h2 className="text-sm font-semibold tracking-wider text-zinc-100 flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                {botStatus === "active" && (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  </>
                )}
                {botStatus === "joining" && (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                  </>
                )}
                {botStatus === "inactive" && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-600" />
                )}
                {botStatus === "error" && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                )}
              </span>
              LIVE TRANSCRIPT
            </h2>

            {botStatus === "active" && (
              <div className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" />
                Recall Active
              </div>
            )}
            {botStatus === "joining" && (
              <div className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                Connecting
              </div>
            )}
            {botStatus === "inactive" && (
              <div className="text-[10px] font-semibold text-zinc-500 bg-zinc-500/5 border border-zinc-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Cloud className="w-3 h-3" />
                Standby
              </div>
            )}
            {botStatus === "error" && (
              <div className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Offline
              </div>
            )}
          </div>

          {/* Bot Invite */}
          <div className="p-4 border-b border-white/5 bg-black/10">
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="Paste Google Meet / Zoom URL…"
                className="flex-1 bg-zinc-900/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                required
              />
              <button
                type="submit"
                disabled={isInviting}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all whitespace-nowrap shadow-lg shadow-blue-950/20 flex items-center gap-1.5 cursor-pointer"
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

          {/* Cloud Transcript Panel */}
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto p-5 scroll-smooth flex flex-col gap-4"
            style={{ scrollbarWidth: "none" }}
          >
            {cloudTranscripts.length > 0 ? (
              cloudTranscripts.map((t) => (
                <div key={t.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
                      {t.speaker}
                    </span>
                    <span className="text-[10px] text-zinc-600">{t.timestamp}</span>
                  </div>
                  <p className="text-[13px] text-zinc-300 leading-relaxed font-sans select-text">{t.text}</p>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500 gap-3">
                {botStatus === "inactive" && (
                  <>
                    <div className="w-10 h-10 rounded-2xl bg-zinc-900/60 border border-white/5 flex items-center justify-center">
                      <Cloud className="w-5 h-5 text-zinc-600" />
                    </div>
                    <div className="text-xs font-medium text-zinc-400">No Active Meeting</div>
                    <p className="text-[11px] text-zinc-500 max-w-[220px] leading-relaxed">
                      Enter a Zoom or Google Meet URL above to invite the Meem8 co-pilot.
                    </p>
                  </>
                )}
                {botStatus === "joining" && (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500 mb-1" />
                    <div className="text-xs font-medium text-amber-400">Connecting to Call…</div>
                    <p className="text-[11px] text-zinc-500 max-w-[220px] leading-relaxed">
                      Bot is entering the waiting room. Audio stream will begin shortly.
                    </p>
                  </>
                )}
                {botStatus === "active" && (
                  <>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-pulse mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-xs font-semibold text-emerald-400">Listening to Stream…</div>
                    <p className="text-[11px] text-zinc-500 max-w-[220px] leading-relaxed">
                      Recall bot is active. Speak in the meeting to see the live feed here.
                    </p>
                  </>
                )}
                {botStatus === "error" && (
                  <>
                    <AlertCircle className="w-6 h-6 text-rose-500 mb-1" />
                    <div className="text-xs font-medium text-rose-400">Connection Failed</div>
                    <p className="text-[11px] text-zinc-500 max-w-[220px] leading-relaxed">
                      Verify your Recall.ai credentials in <code className="text-rose-400 font-mono">.env.local</code>.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
