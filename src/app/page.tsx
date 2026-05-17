import LiveTranscript from "@/components/LiveTranscript";
import AgentMonitor from "@/components/AgentMonitor";
import WorkspaceSidebar from "@/components/WorkspaceSidebar";

export default function Home() {
  return (
    <div className="flex h-screen w-full bg-[#050505] text-zinc-300 font-sans overflow-hidden">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 flex w-full h-full p-6 gap-6">
        {/* Left Panel: Live Transcript */}
        <section className="flex-[1] flex flex-col min-w-[320px] max-w-sm rounded-3xl bg-zinc-900/40 backdrop-blur-2xl border border-white/5 overflow-hidden shadow-2xl">
          <LiveTranscript />
        </section>

        {/* Center Panel: Agent Monitor */}
        <section className="flex-[2] flex flex-col rounded-3xl bg-zinc-900/60 backdrop-blur-2xl border border-white/10 overflow-hidden shadow-2xl relative">
          <AgentMonitor />
        </section>

        {/* Right Panel: Workspace Sidebar */}
        <section className="flex-[1] flex flex-col min-w-[280px] max-w-xs rounded-3xl bg-zinc-900/40 backdrop-blur-2xl border border-white/5 overflow-hidden shadow-2xl">
          <WorkspaceSidebar />
        </section>
      </main>
    </div>
  );
}
