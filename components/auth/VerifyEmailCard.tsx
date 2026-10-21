'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MailCheck,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  LayoutDashboard,
  ArrowRight,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { resendVerificationAction } from '@/actions/auth';
import { requestDownloadVerificationAction } from '@/actions/download-verification';

export function VerifyEmailCard({
  email,
  error,
  next,
  isAuthenticated,
  isAlreadyVerified,
}: {
  email?: string;
  error?: string;
  next?: string;
  isAuthenticated?: boolean;
  isAlreadyVerified?: boolean;
}) {
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Determine whether this request is for private challenge download verification or native Supabase signup confirmation
  const isDownloadVerification = Boolean(
    isAuthenticated &&
      (next?.includes('/challenges') ||
        error === 'unconfirmed' ||
        error === 'expired_token' ||
        error === 'already_consumed' ||
        error === 'invalid_token' ||
        error === 'missing_token')
  );

  async function handleResend() {
    if (!email || resending || cooldown > 0) return;
    setResending(true);
    setFeedback(null);

    try {
      if (isDownloadVerification) {
        // Authenticated operative requesting challenge download verification token
        const res = await requestDownloadVerificationAction(next);
        setFeedback({ message: res.message, isError: !res.success });
        if (res.success || res.rateLimited) {
          setCooldown(60);
        }
      } else {
        // Native Supabase Auth confirmation email resend (for new signups / unconfirmed accounts)
        const res = await resendVerificationAction(email, next);
        setFeedback({ message: res.message, isError: !res.success });
        if (res.cooldownSeconds) {
          setCooldown(res.cooldownSeconds);
        } else if (res.success) {
          setCooldown(60);
        }
      }
    } catch {
      setFeedback({
        message: 'An unexpected network error occurred while resending. Please try again.',
        isError: true,
      });
    } finally {
      setResending(false);
    }
  }

  if (isAlreadyVerified) {
    return (
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#111C2E] border border-[#243247] shadow-2xl relative text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC] mb-2">
          Email Verified
        </h1>

        <p className="text-xs text-[#94A3B8] mb-4 leading-relaxed">
          Your email address is verified. You are authorized to access and download private challenge attachments.
        </p>

        <div className="p-3 bg-[#0B1220] border border-[#243247] rounded-lg text-xs font-medium text-emerald-400 mb-6 break-all">
          {email || 'your registered email address'}
        </div>

        <div className="space-y-3">
          {next ? (
            <Link
              href={next}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Return to Challenge</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              href="/challenges"
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Explore Challenges</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}

          <Link
            href="/dashboard"
            className="w-full py-2.5 px-4 rounded-lg bg-[#0B1220] border border-[#243247] text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-medium transition-colors flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-[#111C2E] border border-[#243247] shadow-2xl relative text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-4 shadow-lg shadow-blue-500/10">
        {isDownloadVerification ? <ShieldAlert className="h-8 w-8" /> : <MailCheck className="h-8 w-8" />}
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC] mb-2">
        {isDownloadVerification ? 'Download Verification Required' : 'Verify Your Email'}
      </h1>

      <p className="text-xs text-[#94A3B8] mb-4 leading-relaxed">
        {isDownloadVerification
          ? 'An authorization link has been sent to:'
          : 'A confirmation link has been sent to:'}
      </p>

      <div className="p-3 bg-[#0B1220] border border-[#243247] rounded-lg text-xs font-medium text-blue-400 mb-2 break-all">
        {email || 'your registered email address'}
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mb-6 px-1">
        <span>Gateway:</span>
        <span className="text-slate-300 font-medium">
          {isDownloadVerification ? 'Resend API' : 'Supabase Auth Mailer'}
        </span>
      </div>

      {error === 'unconfirmed' && (
        <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 text-left">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            Email confirmation is required before downloading private challenge attachments. You can continue exploring your dashboard and challenges.
          </div>
        </div>
      )}

      {(error === 'expired_token' || error === 'invalid_token' || error === 'already_consumed' || error === 'verification_failed' || error === 'missing_token') && (
        <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 text-left">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            {error === 'expired_token'
              ? 'The download verification link has expired (15-minute validity). Please request a new authorization email below.'
              : error === 'already_consumed'
              ? 'This download authorization link has already been used once. Please request a new link below.'
              : 'The verification link is invalid, expired, or missing. Please request a new confirmation email below.'}
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`mb-5 p-3 rounded-xl border text-xs flex items-start gap-2.5 text-left ${
            feedback.isError
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {feedback.isError ? (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
          )}
          <div>{feedback.message}</div>
        </div>
      )}

      <div className="text-xs text-[#94A3B8] text-left mb-6 p-3.5 bg-[#0B1220] rounded-xl border border-[#243247] space-y-1">
        <p className="font-semibold text-[#F8FAFC]">Why is this required?</p>
        <p className="text-[11px] leading-relaxed">
          Challenge attachments and private CTF files are strictly protected behind verified accounts to prevent automated scraping and abuse.
        </p>
      </div>

      <div className="space-y-3">
        {email && (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {resending ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Resending Email...</span>
              </>
            ) : cooldown > 0 ? (
              <>
                <Clock className="h-3.5 w-3.5" />
                <span>Resend in {cooldown}s</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{isDownloadVerification ? 'Resend Download Authorization' : 'Resend Confirmation Email'}</span>
              </>
            )}
          </button>
        )}

        {next && (
          <Link
            href={next}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Return to Challenge</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}

        <Link
          href="/dashboard"
          className="w-full py-2.5 px-4 rounded-lg bg-[#0B1220] border border-[#243247] text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-medium transition-colors flex items-center justify-center gap-2"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          <span>Go to Dashboard</span>
        </Link>

        <Link
          href="/login"
          className="w-full py-2 px-4 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] text-xs transition-colors flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Return to Login</span>
        </Link>
      </div>
    </div>
  );
}
