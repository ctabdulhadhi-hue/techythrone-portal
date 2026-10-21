'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { adminSignInAction } from '@/actions/auth';
import { ShieldAlert, Lock, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export function AdminLoginForm({ initialError }: { initialError?: string } = {}) {
  const [state, formAction, isPending] = useActionState(adminSignInAction, null);

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-[#111C2E] border border-[#243247] shadow-2xl relative">
      <div className="text-center mb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3 shadow-lg shadow-amber-500/10">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">Admin Gateway</h1>
        <p className="text-xs text-[#94A3B8] mt-1">
          High-privilege console access for verified platform administrators
        </p>
      </div>

      {(state?.error || initialError) && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>{state?.error || initialError}</div>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#F8FAFC]">
            Admin Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              placeholder="admin_callsign"
              className="w-full bg-[#0B1220] border border-[#243247] rounded-lg pl-9 pr-4 py-2.5 text-xs text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          {state?.fieldErrors?.username && (
            <p className="mt-1 text-xs text-rose-400">{state.fieldErrors.username[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#F8FAFC]">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              className="w-full bg-[#0B1220] border border-[#243247] rounded-lg pl-9 pr-4 py-2.5 text-xs text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          {state?.fieldErrors?.password && (
            <p className="mt-1 text-xs text-rose-400">{state.fieldErrors.password[0]}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Access Console</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-[#243247] text-center">
        <Link
          href="/login"
          className="text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
        >
          ← Return to Operative Login
        </Link>
      </div>
    </div>
  );
}
