export default function WorkspaceSidebar() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-white/5 flex items-center gap-3">
        <img src="/meem8_logo.png" alt="Meem8 Logo" className="h-8 w-auto opacity-90" />
        <h2 className="text-sm font-semibold tracking-wide text-zinc-100 mt-1">WORKSPACE</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
        
        {/* Knowledge Base Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Knowledge Base</h3>
            <button className="text-zinc-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-xs text-zinc-300 truncate">Q3_Roadmap.pdf</div>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              <div className="text-xs text-zinc-300 truncate">Obsidian Vault (Local)</div>
              <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* Action Items Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Live Action Items</h3>
          </div>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-emerald-100 leading-snug">Investigate Tavily API pricing for MCP web search skill.</p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-emerald-500/70">
                <span>Assigned: Unassigned</span>
                <span>Just now</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
