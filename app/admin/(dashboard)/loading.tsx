import { ShieldAlert, Users, HardDrive, CheckCircle, Loader2 } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>ESTABLISHING_ADMIN_CONSOLE_SESSION...</span>
          </div>
          <div className="h-7 w-72 bg-slate-800/70 rounded mt-2"></div>
          <div className="h-3 w-96 max-w-full bg-slate-800/40 rounded mt-1"></div>
        </div>
        <div className="h-9 w-40 bg-emerald-950/40 border border-emerald-500/20 rounded-lg"></div>
      </div>

      {/* Metric Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Challenges', icon: ShieldAlert },
          { label: 'Registered Operatives', icon: Users },
          { label: 'Private Attachments', icon: HardDrive },
          { label: 'Security Architecture', icon: CheckCircle },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="p-5 rounded-xl cyber-card space-y-3">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-mono uppercase">{card.label}</span>
                <Icon className="h-4 w-4 opacity-40" />
              </div>
              <div className="h-8 w-16 bg-slate-800/70 rounded"></div>
              <div className="h-3 w-28 bg-slate-800/40 rounded"></div>
            </div>
          );
        })}
      </div>

      {/* Table Preview Skeleton */}
      <div className="rounded-xl cyber-card overflow-hidden border border-slate-800 p-6 space-y-4">
        <div className="h-5 w-44 bg-slate-800/60 rounded"></div>
        <div className="space-y-3 pt-2">
          <div className="h-8 w-full bg-slate-900/80 rounded"></div>
          <div className="h-8 w-full bg-slate-900/60 rounded"></div>
          <div className="h-8 w-full bg-slate-900/40 rounded"></div>
        </div>
      </div>
    </div>
  );
}
