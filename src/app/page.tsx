"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bot, Shield, Zap, Code2, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30 overflow-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Image src="/meem8_logo.png" alt="Meem8" width={32} height={32} className="opacity-90" />
            <span className="font-bold tracking-widest text-lg">MEEM8</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://linkedin.com/in/tianchengc" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              <span className="hidden sm:inline">Built by tianchengc</span>
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

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-8 pt-20 pb-32">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center text-center mt-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Local Privacy-First Intelligence
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1]">
              Your Meetings, <br />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Untethered.
              </span>
            </h1>
            
            <p className="max-w-2xl text-lg md:text-xl text-zinc-400 mb-12 leading-relaxed">
              Meem8 is a local-first meeting co-pilot. It joins your Zoom or Google Meet calls, listens to the transcription, and uses your machine's <strong>Gemma 4</strong> model to synthesize and reply directly in the chat—never sending your private meeting audio to cloud LLMs.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link 
                href="/dashboard"
                className="px-8 py-4 rounded-full bg-emerald-500 text-black font-bold tracking-wide hover:bg-emerald-400 transition-colors flex items-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              >
                <Play className="w-5 h-5 fill-black" />
                Start Local Dashboard
              </Link>
              <a 
                href="#instructions"
                className="px-8 py-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white font-medium"
              >
                View Setup Guide
              </a>
            </div>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-40">
            {[
              {
                icon: <Shield className="w-6 h-6 text-emerald-400" />,
                title: "100% Local Inference",
                desc: "Powered by Ollama. Your meeting transcripts are vectorized via HNSWLib and inferred locally by Gemma 4. Zero cloud LLM fees."
              },
              {
                icon: <Bot className="w-6 h-6 text-cyan-400" />,
                title: "Bi-Directional Chat",
                desc: "Don't just take notes. Ask Meem8 a question during the call and it injects the researched answer directly into the Zoom chat."
              },
              {
                icon: <Zap className="w-6 h-6 text-yellow-400" />,
                title: "Agentic RAG Engine",
                desc: "Meem8 doesn't just know the meeting. It cross-references your local Obsidian Vault and Wikipedia in real-time."
              }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Instructions */}
          <motion.div 
            id="instructions"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-40 pt-20 border-t border-white/10"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Quick Start Guide</h2>
            <div className="max-w-3xl mx-auto space-y-6">
              {[
                { step: "01", title: "Start Ollama", code: "ollama run gemma4:latest" },
                { step: "02", title: "Start Tunnel", code: "npm run tunnel" },
                { step: "03", title: "Config Recall.ai", code: "Set your webhook to https://<your-ngrok>/api/webhook/recall" },
                { step: "04", title: "Launch Meem8", code: "Click 'Start Local Dashboard' and invite the bot to your Google Meet." },
              ].map((instruction, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-2xl bg-black/50 border border-white/5">
                  <div className="text-3xl font-black text-white/10">{instruction.step}</div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold mb-2">{instruction.title}</h4>
                    <code className="px-3 py-1.5 rounded bg-white/5 text-emerald-400 text-sm font-mono flex items-center gap-2">
                      <Code2 className="w-4 h-4" />
                      {instruction.code}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
