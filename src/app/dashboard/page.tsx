"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LiveTranscript from "@/components/LiveTranscript";
import AgentMonitor from "@/components/AgentMonitor";
import WorkspaceSidebar from "@/components/WorkspaceSidebar";
import { ShieldCheck, CloudCog } from "lucide-react";
import type { AppMode } from "@/lib/appTypes";

export type { AppMode };

export default function Home() {
  const [mode, setMode] = useState<AppMode>("local");
  const [localTrigger, setLocalTrigger] = useState<{ id: string; prompt: string } | null>(null);

  const handleLocalTrigger = useCallback((prompt: string) => {
    setLocalTrigger({ id: Date.now().toString(), prompt });
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-[#050505] text-zinc-300 font-sans overflow-hidden">
      {/* Background Gradient — color-shifts with mode */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-all duration-700 ${
            mode === "local" ? "bg-emerald-900/10" : "bg-blue-900/10"
          }`}
        />
        <div
          className={`absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-all duration-700 ${
            mode === "local" ? "bg-teal-900/8" : "bg-cyan-900/10"
          }`}
        />
      </div>

      {/* Header: logo left · toggle center · spacer right */}
      <header className="relative z-10 flex items-center px-6 pt-4">
        <Link
          href="/"
          className="flex items-center gap-2 w-44 flex-shrink-0 group"
          title="Back to home"
        >
          <Image
            src="/meem8_favicon.png"
            alt="Meem8"
            width={28}
            height={28}
            className="rounded-xl opacity-80 group-hover:opacity-100 transition-opacity shadow-[0_0_12px_rgba(52,211,153,0.15)]"
          />
          <span className="font-black tracking-widest text-sm bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent select-none">
            MEEM8
          </span>
        </Link>

        <div className="flex-1 flex justify-center">
        <div className="flex items-center gap-1 p-1 bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl shadow-2xl">
          <button
            onClick={() => setMode("local")}
            className={`relative flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
              mode === "local"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(16,185,129,0.1)]"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] border border-transparent"
            }`}
          >
            <ShieldCheck
              className={`w-3.5 h-3.5 transition-colors duration-300 ${
                mode === "local" ? "text-emerald-400" : ""
              }`}
            />
            Air-Gapped Local
            {mode === "local" && (
              <span className="relative flex h-1.5 w-1.5 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
            )}
          </button>

          <div className="h-4 w-px bg-white/[0.06]" />

          <button
            onClick={() => setMode("cloud")}
            className={`relative flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
              mode === "cloud"
                ? "bg-blue-500/15 text-blue-300 border border-blue-500/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(59,130,246,0.1)]"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] border border-transparent"
            }`}
          >
            <CloudCog
              className={`w-3.5 h-3.5 transition-colors duration-300 ${
                mode === "cloud" ? "text-blue-400" : ""
              }`}
            />
            Cloud Bot
            {mode === "cloud" && (
              <span className="relative flex h-1.5 w-1.5 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
              </span>
            )}
          </button>
        </div>
        </div>

        {/* Right spacer — mirrors logo width to keep toggle truly centered */}
        <div className="w-44 flex-shrink-0" />
      </header>

      <main className="relative z-10 flex w-full flex-1 p-6 pt-4 gap-6 min-h-0">
        {/* Left Panel: Live Transcript */}
        <section
          className={`flex-[1] flex flex-col min-w-[320px] max-w-sm rounded-3xl backdrop-blur-2xl border overflow-hidden shadow-2xl transition-all duration-500 ${
            mode === "local"
              ? "bg-zinc-900/40 border-emerald-500/[0.08] shadow-[0_0_60px_rgba(16,185,129,0.04)]"
              : "bg-zinc-900/40 border-white/5"
          }`}
        >
          <LiveTranscript mode={mode} onTrigger={handleLocalTrigger} />
        </section>

        {/* Center Panel: Agent Monitor */}
        <section className="flex-[2] flex flex-col rounded-3xl bg-zinc-900/60 backdrop-blur-2xl border border-white/10 overflow-hidden shadow-2xl relative">
          <AgentMonitor localTrigger={localTrigger} />
        </section>

        {/* Right Panel: Workspace Sidebar */}
        <section className="flex-[1] flex flex-col min-w-[280px] max-w-xs rounded-3xl bg-zinc-900/40 backdrop-blur-2xl border border-white/5 overflow-hidden shadow-2xl">
          <WorkspaceSidebar mode={mode} />
        </section>
      </main>
    </div>
  );
}
