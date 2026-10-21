import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function ChallengeDetailLoading() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 animate-pulse">
        {/* Back Link Skeleton */}
        <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-500">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>BACK_TO_CHALLENGES</span>
        </div>

        {/* Header Skeleton */}
        <div className="rounded-xl cyber-card border border-slate-800 p-6 md:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-20 bg-emerald-950/50 border border-emerald-500/20 rounded"></div>
              <div className="h-6 w-16 bg-cyan-950/50 border border-cyan-500/20 rounded"></div>
            </div>
            <div className="h-7 w-24 bg-emerald-950/50 rounded"></div>
          </div>
          <div className="h-8 w-2/3 bg-slate-800/80 rounded"></div>
          <div className="h-3 w-40 bg-slate-800/40 rounded"></div>
        </div>

        {/* Terminal Briefing Skeleton */}
        <div className="rounded-xl cyber-terminal p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 border-b border-slate-800 pb-3">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>DECRYPTING_MISSION_BRIEFING...</span>
          </div>
          <div className="space-y-2 py-2">
            <div className="h-3.5 w-full bg-slate-800/40 rounded"></div>
            <div className="h-3.5 w-5/6 bg-slate-800/40 rounded"></div>
            <div className="h-3.5 w-4/6 bg-slate-800/40 rounded"></div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
