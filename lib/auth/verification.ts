/**
 * Evaluates whether an operative has completed email verification specifically
 * required for downloading private challenge attachments.
 *
 * Verification is confirmed if:
 * 1. user exists
 * 2. profile.download_verified_at != null (Application-level download verification)
 * 3. OR user.email_confirmed_at != null (Supabase Auth confirmed identity fallback)
 */
export function isUserEmailVerified(
  user?: {
    email_confirmed_at?: string | null;
    download_verified_at?: string | null;
    is_verified?: boolean;
    app_metadata?: Record<string, unknown> | null;
  } | null
): boolean {
  if (!user) return false;
  if (typeof user.is_verified === 'boolean') {
    return user.is_verified;
  }
  // Application-level download verification: strictly require download_verified_at
  if (user.download_verified_at) {
    return true;
  }
  return false;
}
