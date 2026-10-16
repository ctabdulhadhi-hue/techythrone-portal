'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signInAction } from '@/actions/auth';
import { Terminal, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction, isPending] = useActionState(signInAction, null);

  return (
    <div className="w-full max-w-md p-8 rounded-xl cyber-card border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Decorative cyber corner tag */}
      <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 border-b border-l border-emerald-500/30 text-[10px] font-mono px-3 py-1">
        SYS_AUTH_v2
      </div>

      <div className="text-center mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
          <Terminal className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-100">AGENT_LOGIN</h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">Authenticate to access cybersecurity challenges</p>
      </div>

      {(state?.error || initialError) && (
        <div className="mb-6 p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>{state?.error || initialError}</div>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
            Operator Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              name="email"
              type="email"
              required
              placeholder="agent@techythrone.ctf"
              className="w-full bg-[#05080f] border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono transition-all"
            />
          </div>
          {state?.fieldErrors?.email && (
            <p className="mt-1 text-xs text-rose-400 font-mono">{state.fieldErrors.email[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
            Access Key / Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••••••"
              className="w-full bg-[#05080f] border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono transition-all"
            />
          </div>
          {state?.fieldErrors?.password && (
            <p className="mt-1 text-xs text-rose-400 font-mono">{state.fieldErrors.password[0]}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-emerald-500 text-slate-950 font-bold font-mono text-sm hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#090d16] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AUTHENTICATING...</span>
            </>
          ) : (
            <>
              <span>ESTABLISH_SESSION</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs font-mono text-slate-400">
        New operator?{' '}
        <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
          Register new credentials
        </Link>
      </div>
    </div>
  );
}
