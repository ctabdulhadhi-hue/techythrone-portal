import 'server-only';
import crypto from 'crypto';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export const TOKEN_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_TOKENS_PER_WINDOW = 3;
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export interface GenerateTokenResult {
  success: boolean;
  rawToken?: string;
  error?: string;
  rateLimited?: boolean;
}

export interface RedeemTokenResult {
  success: boolean;
  userId?: string;
  error?: string;
  errorCode?: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'ALREADY_CONSUMED' | 'USER_NOT_FOUND';
}

/**
 * Computes the SHA-256 hash of a plaintext token.
 * Tokens are NEVER stored plaintext in the database.
 */
export function hashVerificationToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Creates a cryptographically secure, single-use, expiring verification token for private downloads.
 * Strictly rate-limited to 3 tokens per 15 minutes per user.
 */
export async function createDownloadVerificationToken(userId: string): Promise<GenerateTokenResult> {
  const serviceRole = createServiceRoleClient();
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS).toISOString();

  // 1. Rate-limit check: count tokens created in the rate limit window
  const { count, error: countError } = await serviceRole
    .from('download_verification_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', windowStart);

  if (countError) {
    return { success: false, error: 'Database error verifying rate limit.' };
  }

  if ((count || 0) >= MAX_TOKENS_PER_WINDOW) {
    return {
      success: false,
      rateLimited: true,
      error: 'Rate limit exceeded. You may only request 3 download verification links every 15 minutes.',
    };
  }

  // 2. Generate 32 bytes of cryptographic randomness (256 bits entropy)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashVerificationToken(rawToken);
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRATION_MS).toISOString();

  // 3. Store ONLY the SHA-256 hash in the database
  const { error: insertError } = await serviceRole
    .from('download_verification_tokens')
    .insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

  if (insertError) {
    return { success: false, error: 'Failed to record verification token.' };
  }

  return {
    success: true,
    rawToken,
  };
}

/**
 * Validates and atomically consumes a download verification token.
 * Single-use: marks consumed_at so it can NEVER be reused.
 * Updates profiles.download_verified_at upon successful redemption.
 */
export async function redeemDownloadVerificationToken(rawToken: string): Promise<RedeemTokenResult> {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.trim().length === 0) {
    return { success: false, error: 'Invalid verification token provided.', errorCode: 'INVALID_TOKEN' };
  }

  const tokenHash = hashVerificationToken(rawToken.trim());
  const serviceRole = createServiceRoleClient();
  const now = new Date().toISOString();

  // 1. Inspect token status
  const { data: tokenRecord, error: fetchError } = await serviceRole
    .from('download_verification_tokens')
    .select('id, user_id, expires_at, consumed_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (fetchError || !tokenRecord) {
    return { success: false, error: 'Verification token not found or invalid.', errorCode: 'INVALID_TOKEN' };
  }

  if (tokenRecord.consumed_at) {
    return {
      success: false,
      error: 'This verification link has already been used. Please request a new one.',
      errorCode: 'ALREADY_CONSUMED',
    };
  }

  if (new Date(tokenRecord.expires_at) < new Date(now)) {
    return {
      success: false,
      error: 'This verification link has expired (15-minute validity limit). Please request a new one.',
      errorCode: 'EXPIRED_TOKEN',
    };
  }

  // 2. Atomically consume token (guards against concurrent race conditions)
  const { data: consumedRecord, error: consumeError } = await serviceRole
    .from('download_verification_tokens')
    .update({ consumed_at: now })
    .eq('id', tokenRecord.id)
    .is('consumed_at', null)
    .select('id, user_id')
    .maybeSingle();

  if (consumeError || !consumedRecord) {
    return {
      success: false,
      error: 'Verification link consumption conflict. Please try again.',
      errorCode: 'ALREADY_CONSUMED',
    };
  }

  // 3. Update operative profile download_verified_at via service_role
  const { error: profileError } = await serviceRole
    .from('profiles')
    .update({
      download_verified_at: now,
    })
    .eq('id', consumedRecord.user_id);

  if (profileError) {
    return {
      success: false,
      error: 'Failed to update operative verification status.',
      errorCode: 'USER_NOT_FOUND',
    };
  }

  return {
    success: true,
    userId: consumedRecord.user_id,
  };
}
