'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Loader2, LogIn, ArrowRight } from 'lucide-react';
import { submitFlagAction } from '@/actions/flags';

interface FlagSubmissionCardProps {
  challengeId: string;
  challengeSlug: string;
  challengePoints: number;
  initialIsSolved?: boolean;
  solvedAt?: string | null;
  isAuthenticated: boolean;
}

export function FlagSubmissionCard({
  challengeId,
  challengeSlug,
  challengePoints,
  initialIsSolved = false,
  solvedAt,
  isAuthenticated,
}: FlagSubmissionCardProps) {
  const [flagInput, setFlagInput] = useState('');

  const boundAction = submitFlagAction.bind(null, challengeId, challengeSlug);
  const [state, formAction, isPending] = useActionState(boundAction, null);

  const isSolved = initialIsSolved || Boolean(state?.success);

  return (
    <div className="rounded-2xl bg-[#111C2E] border border-[#243247] p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[#243247] pb-3">
        <h4 className="text-sm font-semibold text-[#F8FAFC]">
          Submit Flag
        </h4>
        {isSolved && (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Solved ✓
          </span>
        )}
      </div>

      {/* Already Solved State */}
      {isSolved ? (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-200">Objective Completed</span>
          </div>
          <p className="text-[11px] text-emerald-200/80">
            You captured this flag and earned {challengePoints} points.
            {solvedAt && ` Logged: ${new Date(solvedAt).toLocaleDateString()}`}
          </p>
        </div>
      ) : !isAuthenticated ? (
        /* Unauthenticated Barrier State */
        <div className="p-4 rounded-xl bg-[#0B1220] border border-[#243247] text-slate-300 text-xs space-y-3">
          <p className="text-[11px] text-[#94A3B8]">
            Sign in with your operative account to submit solution flags and earn leaderboard points.
          </p>
          <Link
            href={`/login?redirect=${encodeURIComponent(`/challenges/${challengeSlug}`)}`}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shadow-sm"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In to Submit</span>
          </Link>
        </div>
      ) : (
        /* Active Flag Submission Form */
        <form action={formAction} className="space-y-3">
          {state?.error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <div>{state.error}</div>
            </div>
          )}

          {state?.success && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <div>{state.message}</div>
            </div>
          )}

          <div className="space-y-2">
            <input
              name="flag"
              type="text"
              required
              disabled={isPending}
              value={flagInput}
              onChange={(e) => setFlagInput(e.target.value)}
              placeholder="THR{...}"
              className="w-full bg-[#0B1220] border border-[#243247] rounded-lg px-3.5 py-2.5 text-xs text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-colors"
            />

            <button
              type="submit"
              disabled={isPending || !flagInput.trim()}
              className="w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Submit Flag</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-[#94A3B8] text-center pt-1">
            You need to solve this challenge to earn points.
          </p>
        </form>
      )}
    </div>
  );
}
