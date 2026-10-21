'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signInAction } from '@/actions/auth';
import { Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { TechythroneLogo } from '@/components/TechythroneLogo';

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction, isPending] = useActionState(signInAction, null);

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-[#111C2E] border border-[#243247] shadow-2xl relative">
      <div className="text-center mb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-3 shadow-lg shadow-blue-500/10">
          <TechythroneLogo className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">Sign In to Techythrone</h1>
        <p className="text-xs text-[#94A3B8] mt-1">Authenticate to access challenges and track your progress</p>
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
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full bg-[#0B1220] border border-[#243247] rounded-lg pl-9 pr-4 py-2.5 text-xs text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          {state?.fieldErrors?.email && (
            <p className="mt-1 text-xs text-rose-400">{state.fieldErrors.email[0]}</p>
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
              placeholder="••••••••••••"
              className="w-full bg-[#0B1220] border border-[#243247] rounded-lg pl-9 pr-4 py-2.5 text-xs text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          {state?.fieldErrors?.password && (
            <p className="mt-1 text-xs text-rose-400">{state.fieldErrors.password[0]}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#243247]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#111C2E] px-2 text-[#94A3B8]">
            or continue with
          </span>
        </div>
      </div>

      <GoogleSignInButton text="Sign in with Google" />

      <p className="mt-6 text-center text-xs text-[#94A3B8]">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium">
          Create Account
        </Link>
      </p>
    </div>
  );
}
