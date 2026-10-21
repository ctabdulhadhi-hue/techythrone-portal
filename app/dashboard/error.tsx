'use client';

import { ShieldAlert, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-5">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
        <ShieldAlert className="h-7 w-7" />
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-bold text-[#F8FAFC]">
          Dashboard Error
        </h2>
        <p className="text-xs text-rose-300 bg-[#111C2E] border border-[#243247] rounded-lg p-3 break-all">
          {error.message || 'An unexpected error occurred while loading your dashboard.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try Again</span>
        </button>

        <Link
          href="/"
          className="px-4 py-2 rounded-lg bg-[#111C2E] border border-[#243247] text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-medium transition-colors flex items-center gap-2"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
