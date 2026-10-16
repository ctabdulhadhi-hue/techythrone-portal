import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md p-8 rounded-xl cyber-card border border-rose-900/50 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 bg-rose-500/10 text-rose-400 border-b border-l border-rose-500/30 text-[10px] font-mono px-3 py-1">
            HTTP_403_FORBIDDEN
          </div>

          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-400 mb-4 shadow-[0_0_25px_rgba(239,68,68,0.25)]">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-100 mb-2">
            ACCESS_DENIED
          </h1>

          <p className="text-xs text-slate-300 font-mono mb-6 leading-relaxed">
            Administrative clearance required. Your security profile does not have permission to access this internal perimeter.
          </p>

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 text-slate-950 font-mono text-xs font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              RETURN_TO_DASHBOARD
            </Link>

            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-mono text-xs font-medium transition-all flex items-center justify-center gap-2"
            >
              <Home className="h-3.5 w-3.5" />
              PORTAL_HOME
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
