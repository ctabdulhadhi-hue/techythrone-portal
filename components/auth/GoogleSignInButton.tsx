'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';

interface GoogleSignInButtonProps {
  label?: string;
  text?: string;
  nextUrl?: string;
}

export function GoogleSignInButton({
  label,
  text,
  nextUrl = '/dashboard',
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buttonText = text || label || 'Continue with Google';

  async function handleGoogleSignIn() {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const redirectOrigin =
        typeof window !== 'undefined' ? window.location.origin : '';
      const redirectTo = `${redirectOrigin}/auth/callback?next=${encodeURIComponent(nextUrl)}`;

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthError) {
        setError(oauthError.message || 'Failed to initialize Google authentication.');
        setLoading(false);
        return;
      }

      // If data.url is returned, navigate to it (Supabase SSR browser client usually handles redirect automatically)
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('An unexpected error occurred while connecting to Google.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-2">
      {error && (
        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full py-2.5 px-4 rounded-lg bg-[#0B1220] border border-[#243247] hover:border-slate-500 hover:bg-[#1A273F] text-[#F8FAFC] text-xs font-medium transition-colors flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 cursor-pointer"
        aria-label={buttonText}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            <span>Connecting to Google...</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1c0 2.8.7 5.4 1.9 7.8l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"
              />
              <path
                fill="#34A853"
                d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.3 7.5 23.5 12 23.5z"
              />
            </svg>
            <span>{buttonText}</span>
          </>
        )}
      </button>
    </div>
  );
}
