"use client";

import { useEffect, useRef, useState } from "react";

export default function LiveTranscript() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingUrl) return;
    
    setIsInviting(true);
    try {
      const res = await fetch("/api/recall/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingUrl })
      });
      const data = await res.json();
      if (data.success) {
        alert("Bot dispatched successfully!");
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

  // Simulation of incoming stream without triggering React re-renders
  // In reality, this would be a WebSocket or SSE connection listening to Recall.ai
  useEffect(() => {
    setIsConnected(true);
    let counter = 0;
    
    const interval = setInterval(() => {
      if (containerRef.current) {
        counter++;
        const p = document.createElement("p");
        p.className = "text-sm text-zinc-400 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300";
        p.innerHTML = `<span class="font-semibold text-zinc-500 text-xs uppercase tracking-wider block mb-1">Speaker 1 • 10:${String(counter % 60).padStart(2, '0')} AM</span>
          This is a simulated transcript line ${counter}. Discussing architecture...`;
        
        containerRef.current.appendChild(p);
        // Auto-scroll to bottom
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
        
        // Keep only last N items to avoid infinite DOM growth
        if (containerRef.current.childNodes.length > 50) {
          containerRef.current.removeChild(containerRef.current.firstChild!);
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-100 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          </span>
          LIVE TRANSCRIPT
        </h2>
        <div className="text-xs text-zinc-500 bg-black/20 px-2 py-1 rounded-md">Recall.ai Active</div>
      </div>
      
      {/* Bot Dispatch UI */}
      <div className="p-4 border-b border-white/5 bg-black/10">
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="url"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            placeholder="Paste Zoom/Meet link..."
            className="flex-1 bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            required
          />
          <button
            type="submit"
            disabled={isInviting}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            {isInviting ? "Sending..." : "Invite Bot"}
          </button>
        </form>
      </div>

      {/* Transcript Container - Uses useRef to bypass React renders */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-5 scroll-smooth"
        style={{ scrollbarWidth: 'none' }} // Hide scrollbar for cleaner look
      >
        <div className="text-xs text-zinc-600 text-center italic mb-6">Meeting started. Listening...</div>
      </div>
    </div>
  );
}
