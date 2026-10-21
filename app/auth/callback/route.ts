import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export type EmailOtpType =
  | 'signup'
  | 'invite'
  | 'magiclink'
  | 'recovery'
  | 'email_change'
  | 'email';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth provider errors (e.g. user cancelled Google sign-in)
  if (error || errorDescription) {
    const errorMsg = errorDescription || error || 'Authentication was cancelled or failed.';
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMsg)}`);
  }

  // Sanitize next redirect target to prevent open redirect vulnerabilities
  let next = '/dashboard';
  const rawNext = searchParams.get('next');
  if (rawNext) {
    try {
      const parsed = new URL(rawNext, origin);
      if (parsed.origin === origin && parsed.pathname.startsWith('/')) {
        next = parsed.pathname + parsed.search + parsed.hash;
      }
    } catch {
      next = '/dashboard';
    }
  }

  const supabase = await createServerClient();
  let authenticatedUser: {
    id: string;
    identities?: Array<{ provider: string; identity_data?: Record<string, unknown> | null }>;
  } | null = null;

  // 1. Handle token_hash verification (Standard Supabase Email confirmation links)
  if (tokenHash && type) {
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (verifyError || !data.user) {
      const msg = verifyError?.message || 'Verification token is invalid or has expired.';
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`);
    }

    authenticatedUser = data.user;
  }
  // 2. Handle PKCE authorization code exchange (OAuth and PKCE confirmation)
  else if (code) {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data.user) {
      const msg = exchangeError?.message || 'Authentication session exchange failed.';
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`);
    }

    authenticatedUser = data.user;
  } else {
    // Neither code nor token_hash provided
    return NextResponse.redirect(`${origin}/login?error=verification_failed`);
  }

  // Record genuine email verification in profiles.download_verified_at
  if (authenticatedUser?.id) {
    try {
      const serviceRole = createServiceRoleClient();
      const now = new Date().toISOString();

      if (tokenHash && type) {
        // Direct email link verification: operative clicked link in their inbox
        await serviceRole
          .from('profiles')
          .update({ download_verified_at: now })
          .eq('id', authenticatedUser.id);
      } else if (code) {
        // Validate trusted provider identity claim for OAuth (Google OpenID Connect)
        const googleIdentity = authenticatedUser.identities?.find((id) => id.provider === 'google');
        const isGoogleEmailVerified = Boolean(
          googleIdentity && (googleIdentity.identity_data as { email_verified?: boolean })?.email_verified === true
        );

        if (isGoogleEmailVerified) {
          await serviceRole
            .from('profiles')
            .update({ download_verified_at: now })
            .eq('id', authenticatedUser.id);
        }
      }
    } catch {
      // Best-effort profile update; does not block session establishment
    }
  }

  // Verify user profile and active status
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', authenticatedUser.id)
    .single();

  if (profile && !profile.is_active) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=account_deactivated`);
  }

  // Role-based routing: Admin accounts route to /admin; regular users route to target destination
  if (profile?.role === 'admin') {
    return NextResponse.redirect(`${origin}/admin`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
