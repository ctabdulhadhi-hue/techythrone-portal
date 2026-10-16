'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MailCheck, RefreshCw, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { resendVerificationAction } from '@/actions/auth';

export function VerifyEmailCard({ email, error }: { email?: string; error?: string }) {
  const [resending, setResending] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setFeedback(null);
    try {
      const res = await resendVerificationAction(email);
      setFeedback({ message: res.message, isError: !res.success });
    } catch {
      setFeedback({ message: 'An unexpected error occurred while resending.', isError: true });
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="w-full max-w-md p-8 rounded-xl cyber-card border border-slate-800 shadow-2xl relative overflow-hidden text-center">
      <div className="absolute top-0 right-0 bg-cyan-500/10 text-cyan-400 border-b border-l border-cyan-500/30 text-[10px] font-mono px-3 py-1">
        VERIFY_IDENTITY
      </div>

      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 mb-4 shadow-[0_0_25px_rgba(6,182,212,0.25)]">
        <MailCheck className="h-8 w-8" />
      </div>

      <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-100 mb-2">
        EMAIL_VERIFICATION_REQUIRED
      </h1>

      <p className="text-xs text-slate-300 font-mono mb-4 leading-relaxed">
        We sent an authentication dispatch to:
      </p>

      <div className="p-3 bg-[#05080f] border border-cyan-500/30 rounded-lg text-sm font-mono text-cyan-400 mb-6 break-all">
        {email || 'your registered email address'}
      </div>

      {error === 'unconfirmed' && (
        <div className="mb-6 p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-start gap-2.5 text-left">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <div>Your email address has not been confirmed yet. Please verify your email before signing in.</div>
        </div>
      )}

      {feedback && (
        <div
          className={`mb-6 p-3 rounded-lg border text-xs font-mono flex items-start gap-2.5 text-left ${
            feedback.isError
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
          }`}
        >
          {feedback.isError ? (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
          )}
          <div>{feedback.message}</div>
        </div>
      )}

      <div className="text-xs text-slate-400 font-mono text-left mb-6 p-3.5 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1.5">
        <p className="font-semibold text-slate-300">Why is this required?</p>
        <p>
          Challenge attachments and private CTF binaries are strictly gated behind verified accounts to prevent abuse and bot downloads.
        </p>
      </div>

      <div className="space-y-3">
        {email && (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="w-full py-2.5 px-4 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-black font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
            {resending ? 'RESENDING DISPATCH...' : 'RESEND_CONFIRMATION_EMAIL'}
          </button>
        )}

        <Link
          href="/login"
          className="w-full py-2.5 px-4 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-mono text-xs font-medium transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          RETURN_TO_LOGIN
        </Link>
      </div>
    </div>
  );
}
