'use server';

import { getAuthUser, getAuthProfile } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { createDownloadVerificationToken } from '@/lib/auth/download-verification';
import { sendDownloadVerificationEmail } from '@/lib/email/sender';

export interface RequestVerificationResult {
  success: boolean;
  message: string;
  rateLimited?: boolean;
}

/**
 * Server Action: Initiates application-level email verification for private challenge downloads.
 * Generates an expiring single-use cryptographic token, hashes it for storage,
 * and delivers the authorization link to the authenticated operative's registered inbox.
 */
export async function requestDownloadVerificationAction(
  nextUrl?: string
): Promise<RequestVerificationResult> {
  const user = await getAuthUser();
  if (!user || !user.email) {
    return {
      success: false,
      message: 'Authentication required to request download authorization.',
    };
  }

  const profile = await getAuthProfile();
  if (!profile || !profile.is_active) {
    return {
      success: false,
      message: 'Operative profile not found or account is deactivated.',
    };
  }

  // 1. If already verified in profile, inform operative immediately
  if (profile.download_verified_at) {
    return {
      success: true,
      message: 'Your email address is already verified for private challenge downloads.',
    };
  }

  // 2. Generate single-use, 15-minute token (strictly rate-limited)
  const tokenResult = await createDownloadVerificationToken(user.id);
  if (!tokenResult.success || !tokenResult.rawToken) {
    return {
      success: false,
      message: tokenResult.error || 'Failed to generate verification link. Please try again later.',
      rateLimited: tokenResult.rateLimited,
    };
  }

  // 3. Build verification URL
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const targetNext =
    nextUrl && nextUrl.startsWith('/') && !nextUrl.startsWith('//') && !nextUrl.includes('\\')
      ? nextUrl
      : '/challenges';
  const verificationUrl = `${appUrl}/verify-download?token=${encodeURIComponent(tokenResult.rawToken)}&next=${encodeURIComponent(targetNext)}`;

  // 4. Dispatch verification email (Resend REST API in production or local dev console)
  const emailResult = await sendDownloadVerificationEmail({
    toEmail: user.email,
    verificationUrl,
    recipientName: profile.display_name || profile.username || 'Operative',
  });

  if (!emailResult.success) {
    return {
      success: false,
      message: emailResult.error || 'Failed to dispatch verification email. Please try again.',
    };
  }

  return {
    success: true,
    message: `Verification link sent to ${user.email}. Check your inbox and click the link to authorize downloads.`,
  };
}

/**
 * Server Action: Fast poller to check if the current operative has completed download verification.
 * Used by the challenge page sidebar so downloads unlock automatically without screen change.
 */
export async function checkDownloadVerificationStatusAction(): Promise<{ isVerified: boolean }> {
  const profile = await getAuthProfile();
  return {
    isVerified: Boolean(profile?.download_verified_at),
  };
}

/**
 * Server Action: Instant dev verification for local testing. Disabled in production.
 */
export async function devAuthorizeDownloadAction(): Promise<{ success: boolean; message: string }> {
  if (process.env.NODE_ENV === 'production') {
    return { success: false, message: 'Dev authorization disabled in production.' };
  }
  const user = await getAuthUser();
  if (!user) return { success: false, message: 'Authentication required.' };
  const serviceRole = createServiceRoleClient();
  const now = new Date().toISOString();
  await serviceRole
    .from('profiles')
    .update({ download_verified_at: now })
    .eq('id', user.id);
  return { success: true, message: 'Operative email authorized for download access.' };
}
