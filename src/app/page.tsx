"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Check,
  Cloud,
  Code2,
  Copy,
  Mic,
  Play,
  Shield,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type SetupTab = "local" | "cloud";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true as const },
  transition: { duration: 0.6, delay },
});

export default function LandingPage() {
  const [setupTab, setSetupTab] = useState<SetupTab>("local");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCmd(text);
      setTimeout(() => setCopiedCmd((c) => (c === text ? null : c)), 2000);
    } catch {}
  };

  const localSteps = [
    { step: "01", title: "Pull the model", cmd: "ollama run gemma4:latest" },
    { step: "02", title: "Launch Meem8", cmd: "npm run dev" },
    {
      step: "03",
      title: "Open the dashboard",
      cmd: "http://localhost:3008/dashboard",
      noTerminal: true,
    },
    {
      step: "04",
      title: "Start secure mic",
      cmd: 'Click "Start Local Secure Microphone" — say "hi gemma" to query',
      noTerminal: true,
    },
  ];

  const cloudSteps = [
    { step: "01", title: "Start tunnel", cmd: "npm run tunnel" },
    {
      step: "02",
      title: "Configure webhook",
      cmd: "https://<your-ngrok>/api/webhook/recall",
      noTerminal: true,
    },
    {
      step: "03",
      title: "Launch Meem8",
      cmd: "npm run dev",
    },
    {
      step: "04",
      title: "Invite the bot",
      cmd: 'Paste meeting URL in the dashboard → click "Invite Bot"',
      noTerminal: true,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30 overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.22] mix-blend-screen filter brightness-[0.85] contrast-[1.1]"
          style={{ backgroundImage: 'url("/cyber_anime_bg.png")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-black" />
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-emerald-500/8 blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full bg-blue-500/8 blur-[140px]" />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Image
              src="/meem8_favicon.png"
              alt="Meem8"
              width={44}
              height={44}
              className="opacity-95 rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.2)]"
            />
            <span className="font-extrabold tracking-widest text-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              MEEM8
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://linkedin.com/in/tianchengc"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              <span className="hidden sm:inline">Built by tianchengc</span>
            </a>
            <a href="#modes" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
              Modes
            </a>
            <a href="#setup" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
              Setup
            </a>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 hover:border-emerald-500/50 transition-all text-sm font-medium flex items-center gap-2"
            >
              Launch App
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-8 pb-40">
          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center text-center pt-24 pb-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 text-xs font-semibold tracking-widest uppercase mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Air-Gapped Local · Cloud-Ready · Privacy by Default
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.08]">
              Your AI Co-Pilot
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                for Every Meeting.
              </span>
            </h1>

            <p className="max-w-2xl text-base md:text-lg text-zinc-400 mb-10 leading-relaxed">
              Meem8 listens to your meetings and puts{" "}
              <strong className="text-white">Gemma 4</strong> on standby. Say the
              trigger word, get an instant answer — locally on your machine, or
              via a cloud bot in the call. You choose the mode based on what{" "}
              <em>this</em> meeting deserves.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/dashboard"
                className="px-8 py-4 rounded-full bg-emerald-500 text-black font-bold tracking-wide hover:bg-emerald-400 transition-colors flex items-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              >
                <Play className="w-5 h-5 fill-black" />
                Open Dashboard
              </Link>
              <a
                href="#modes"
                className="px-8 py-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white font-medium"
              >
                Compare Modes
              </a>
            </div>
          </motion.div>

          {/* ── Feature grid ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-36">
            {[
              {
                icon: <Shield className="w-6 h-6 text-emerald-400" />,
                title: "Privacy by Default",
                desc: "Starts in Air-Gapped Local Mode. Your microphone feeds directly into Gemma 4 running on your own hardware — no audio, transcript, or prompt ever touches a cloud server.",
              },
              {
                icon: <Mic className="w-6 h-6 text-cyan-400" />,
                title: "Always Listening, Never Intrusive",
                desc: 'Transcripts run continuously in the background. Gemma 4 activates only when you say the trigger word — "hi gemma" — so the model stays silent until you actually need it.',
              },
              {
                icon: <Zap className="w-6 h-6 text-yellow-400" />,
                title: "Dual-Mode Architecture",
                desc: "Switch between Air-Gapped Local (browser mic, zero cloud) and Cloud Bot (Recall.ai joins the call for you) in a single toggle. Same Gemma 4 engine, different threat models.",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                {...fadeUp(i * 0.15)}
                className="p-8 rounded-3xl bg-white/[0.025] border border-white/8 hover:border-white/15 hover:bg-white/[0.04] transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-3">{f.title}</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Choose Your Mode ─────────────────────────────────────────── */}
          <section id="modes" className="mt-40">
            <motion.div {...fadeUp()} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/8 bg-white/[0.025] text-[11px] font-bold text-zinc-500 tracking-widest uppercase mb-6">
                Dual-Mode Architecture
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                Choose Your Mode
              </h2>
              <p className="text-zinc-400 mt-4 max-w-xl mx-auto text-base leading-relaxed">
                Not every meeting carries the same stakes. Meem8 adapts to the
                level of sensitivity the meeting demands.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Local Mode */}
              <motion.div
                {...fadeUp(0.1)}
                className="relative p-8 rounded-3xl bg-emerald-950/25 border border-emerald-500/20 hover:border-emerald-500/35 transition-all"
              >
                <div className="absolute top-5 right-5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 tracking-widest uppercase">
                  Default
                </div>

                <div className="flex items-center gap-3.5 mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Air-Gapped Local</h3>
                    <p className="text-xs text-emerald-500/70 font-semibold tracking-widest uppercase mt-0.5">
                      For Sensitive Meetings
                    </p>
                  </div>
                </div>

                <p className="text-zinc-400 text-sm leading-relaxed mb-7">
                  Zero bytes leave your device. Your browser microphone feeds
                  directly into a local Gemma 4 model via Ollama. No API calls,
                  no cloud logs, no exposure — even to Meem8's own servers.
                </p>

                <ul className="space-y-2.5 mb-8">
                  {[
                    "Legal & compliance reviews",
                    "HR, executive, and board discussions",
                    "M&A due diligence calls",
                    "NDA-protected client sessions",
                    "Anything you wouldn't want in a cloud log",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-zinc-300"
                    >
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="pt-5 border-t border-emerald-500/10 space-y-1.5">
                  <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-zinc-600" />
                    Requires: Ollama + <code className="text-emerald-500/80 font-mono">gemma4:latest</code>
                  </p>
                  <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-zinc-600" />
                    Browser: Chrome or Edge (Web Speech API)
                  </p>
                </div>
              </motion.div>

              {/* Cloud Mode */}
              <motion.div
                {...fadeUp(0.2)}
                className="relative p-8 rounded-3xl bg-blue-950/20 border border-blue-500/20 hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
                    <Cloud className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Cloud Bot</h3>
                    <p className="text-xs text-blue-500/70 font-semibold tracking-widest uppercase mt-0.5">
                      For Routine Meetings
                    </p>
                  </div>
                </div>

                <p className="text-zinc-400 text-sm leading-relaxed mb-7">
                  A Recall.ai bot joins your Zoom or Google Meet remotely — no
                  microphone permissions, no screen sharing, no host requirements.
                  Paste the link, invite the bot, and Gemma 4 handles the rest.
                </p>

                <ul className="space-y-2.5 mb-8">
                  {[
                    "Daily standups and sprint reviews",
                    "Product demos and customer onboarding",
                    "Team all-hands and retrospectives",
                    "Multi-participant calls you're facilitating",
                    "Any meeting where convenience wins",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-zinc-300"
                    >
                      <Check className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="pt-5 border-t border-blue-500/10 space-y-1.5">
                  <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-zinc-600" />
                    Requires: Recall.ai API key
                  </p>
                  <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-zinc-600" />
                    Requires: ngrok tunnel active (<code className="text-blue-500/80 font-mono">npm run tunnel</code>)
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Shared feature callout */}
            <motion.div
              {...fadeUp(0.3)}
              className="mt-6 p-6 rounded-3xl bg-white/[0.02] border border-white/6 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-zinc-200">
                  Same Gemma 4 engine. Same trigger word. Same RAG pipeline.
                </p>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Both modes feed into the same local Gemma 4 inference engine with full RAG context from your knowledge base. The only difference is how the audio gets in.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/8 border border-white/10 hover:bg-white/12 transition-all text-sm font-medium text-white whitespace-nowrap flex-shrink-0"
              >
                Try it now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </section>

          {/* ── Setup Guide ──────────────────────────────────────────────── */}
          <motion.section
            id="setup"
            {...fadeUp()}
            className="mt-40 pt-20 border-t border-white/8"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Quick Start</h2>
              <p className="text-zinc-500 mt-3 text-sm">
                Pick a mode and follow the steps.
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex justify-center mb-10">
              <div className="flex items-center gap-1 p-1 bg-zinc-900/60 border border-white/8 rounded-2xl backdrop-blur-xl">
                <button
                  onClick={() => setSetupTab("local")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    setupTab === "local"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                      : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Air-Gapped Local
                </button>
                <button
                  onClick={() => setSetupTab("cloud")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    setupTab === "cloud"
                      ? "bg-blue-500/15 text-blue-300 border border-blue-500/25"
                      : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                  }`}
                >
                  <Cloud className="w-4 h-4" />
                  Cloud Bot
                </button>
              </div>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {(setupTab === "local" ? localSteps : cloudSteps).map((s, i) => (
                <motion.div
                  key={`${setupTab}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.07 }}
                  className={`flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-2xl border transition-all ${
                    setupTab === "local"
                      ? "bg-emerald-950/10 border-emerald-500/10 hover:border-emerald-500/20"
                      : "bg-blue-950/10 border-blue-500/10 hover:border-blue-500/20"
                  }`}
                >
                  <div
                    className={`text-3xl font-black tabular-nums ${
                      setupTab === "local" ? "text-emerald-500/20" : "text-blue-500/20"
                    }`}
                  >
                    {s.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold mb-2">{s.title}</h4>
                    <div
                      onClick={() => !s.noTerminal && copy(s.cmd)}
                      className={`group flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-black/50 border border-white/5 ${
                        !s.noTerminal ? "cursor-pointer hover:border-white/15" : ""
                      } transition-all`}
                    >
                      <code
                        className={`text-sm font-mono flex items-center gap-2 flex-1 min-w-0 truncate ${
                          setupTab === "local" ? "text-emerald-400" : "text-blue-400"
                        }`}
                      >
                        {!s.noTerminal && (
                          <Terminal
                            className={`w-3.5 h-3.5 flex-shrink-0 ${
                              setupTab === "local" ? "text-emerald-600" : "text-blue-600"
                            }`}
                          />
                        )}
                        {s.noTerminal ? (
                          <span className="text-zinc-400 font-sans text-sm normal-case tracking-normal">
                            {s.cmd}
                          </span>
                        ) : (
                          s.cmd
                        )}
                      </code>
                      {!s.noTerminal && (
                        <span className="flex-shrink-0">
                          {copiedCmd === s.cmd ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex justify-center mt-14">
              <Link
                href="/dashboard"
                className="px-10 py-4 rounded-full bg-emerald-500 text-black font-bold tracking-wide hover:bg-emerald-400 transition-colors flex items-center gap-2.5 shadow-[0_0_40px_rgba(16,185,129,0.25)]"
              >
                <Play className="w-5 h-5 fill-black" />
                Open Dashboard
              </Link>
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}
