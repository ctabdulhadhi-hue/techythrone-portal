import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Filter, Loader2 } from 'lucide-react';

export default function ChallengesLoading() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 mb-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>SYNCING_CHALLENGE_PERIMETER...</span>
            </div>
            <h1 className="text-3xl font-extrabold font-mono tracking-tight text-slate-100">
              ACTIVE_CHALLENGES
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Establishing secure connection to telemetry database...
            </p>
          </div>

          <div className="text-right">
            <div className="h-8 w-12 bg-slate-800/80 rounded ml-auto"></div>
            <div className="text-[11px] font-mono text-slate-600 uppercase tracking-wider mt-1">
              Available Labs
            </div>
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="p-4 rounded-xl cyber-card border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600 mr-1" />
            {['All', 'Web', 'Crypto', 'Reverse', 'Forensics', 'Pwn'].map((cat, i) => (
              <div
                key={i}
                className="h-7 w-16 bg-slate-800/60 rounded-lg border border-slate-800"
              ></div>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="h-7 w-28 bg-slate-800/60 rounded-lg"></div>
            <div className="h-7 w-40 bg-slate-800/60 rounded-lg"></div>
          </div>
        </div>

        {/* Challenge Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl cyber-card border border-slate-800/80 p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-5 w-16 bg-emerald-950/40 border border-emerald-500/20 rounded"></div>
                  <div className="h-4 w-12 bg-slate-800/60 rounded"></div>
                </div>

                <div className="h-5 w-3/4 bg-slate-800/80 rounded mb-2"></div>
                <div className="space-y-1.5 mt-3">
                  <div className="h-3 w-full bg-slate-800/40 rounded"></div>
                  <div className="h-3 w-5/6 bg-slate-800/40 rounded"></div>
                  <div className="h-3 w-2/3 bg-slate-800/40 rounded"></div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="h-4 w-16 bg-cyan-950/40 rounded"></div>
                <div className="h-4 w-20 bg-emerald-950/40 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
