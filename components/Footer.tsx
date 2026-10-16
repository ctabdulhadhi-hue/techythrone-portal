import { Terminal, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#070a12] text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-mono text-slate-300">Techythrone Cybersecurity CTF</p>
            <p className="text-xs text-slate-500 font-mono">Zero-Trust Architecture • Ephemeral Signed Attachments</p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="h-4 w-4" /> RLS_ENFORCED
          </span>
          <span className="text-slate-600">|</span>
          <span>v2.6.1 PROD-SPEC</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">© 2026 Techythrone</span>
        </div>
      </div>
    </footer>
  );
}
