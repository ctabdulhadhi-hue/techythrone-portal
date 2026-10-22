'use server';

import { revalidatePath } from 'next/cache';
import { getAuthUser, getAuthProfile } from '@/lib/auth/session';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { validateFlagFormat, verifyFlag, maskFlagForAudit } from '@/lib/flags/crypto';

export type FlagSubmissionResult = {
  success?: boolean;
  error?: string;
  alreadySolved?: boolean;
  pointsAwarded?: number;
  message?: string;
};

// In-memory burst rate limiting per user (backup to DB audit check)
const submissionRateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, challengeId: string): { allowed: boolean; waitSeconds?: number } {
  const key = `${userId}:${challengeId}`;
  const now = Date.now();
  const entry = submissionRateMap.get(key);

  if (!entry || now > entry.resetAt) {
    submissionRateMap.set(key, { count: 1, resetAt: now + 60000 });
    return { allowed: true };
  }

  if (entry.count >= 5) {
    const waitSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  entry.count += 1;
  return { allowed: true };
}

export async function submitFlagAction(
  challengeId: string,
  challengeSlug: string,
  prevState: FlagSubmissionResult | null,
  formData: FormData
): Promise<FlagSubmissionResult> {
  // 1. Authoritative Authentication Check
  const user = await getAuthUser();
  if (!user) {
    return { error: 'AUTHENTICATION_REQUIRED: You must be logged in to submit challenge flags.' };
  }

  const profile = await getAuthProfile();
  if (!profile || !profile.is_active) {
    return { error: 'ACCOUNT_DEACTIVATED: Your operative account is inactive.' };
  }

  if (profile.role === 'admin') {
    return {
      error: 'ADMIN_NOT_ELIGIBLE: Administrators cannot participate in challenges or submit flags. Admins manage and create challenges.',
    };
  }

  // 2. Validate Flag Input
  const rawFlag = formData.get('flag');
  if (!rawFlag || typeof rawFlag !== 'string') {
    return { error: 'EMPTY_FLAG: Please provide a flag string.' };
  }

  const trimmedFlag = rawFlag.trim();
  if (!validateFlagFormat(trimmedFlag)) {
    return {
      error: 'MALFORMED_FLAG: Flags must match the platform format THR{...}. Inspect target systems for the solution key.',
    };
  }

  // 3. Rate Limit Failed Attempts (5 attempts per minute per challenge)
  const rateLimit = checkRateLimit(user.id, challengeId);
  if (!rateLimit.allowed) {
    return {
      error: `RATE_LIMIT_EXCEEDED: Too many attempts. Please wait ${rateLimit.waitSeconds} seconds before retrying.`,
    };
  }

  const serviceClient = getServiceRoleClient();

  // 4. Retrieve Authoritative Challenge Details and Flag Hash
  const { data: challenge, error: challengeError } = await serviceClient
    .from('challenges')
    .select('id, title, status, points, flag_hash')
    .eq('id', challengeId)
    .single();

  if (challengeError || !challenge) {
    return { error: 'CHALLENGE_NOT_FOUND: The requested challenge does not exist.' };
  }

  if (challenge.status !== 'published') {
    return { error: 'CHALLENGE_UNAVAILABLE: This challenge is not currently published.' };
  }

  if (!challenge.flag_hash) {
    return { error: 'NO_FLAG_CONFIGURED: This challenge has no flag configured. Please contact CTF staff.' };
  }

  // 5. Constant-Time Flag Verification
  const isCorrect = verifyFlag(trimmedFlag, challenge.flag_hash);
  const flagPreview = maskFlagForAudit(trimmedFlag);

  // 6. Record Submission Attempt (Audit Trail)
  await serviceClient.from('challenge_submissions').insert({
    challenge_id: challenge.id,
    user_id: user.id,
    submitted_flag_preview: flagPreview,
    is_correct: isCorrect,
  });

  if (!isCorrect) {
    return {
      error: 'INCORRECT_FLAG: The submitted flag is invalid. Recheck your payload and target system response.',
    };
  }

  // 7. Atomic Solve Recording and Point Allocation (PostgreSQL Race-Safe Function)
  const { data: rpcResult, error: rpcError } = await serviceClient.rpc('record_challenge_solve', {
    p_user_id: user.id,
    p_challenge_id: challenge.id,
  });

  if (rpcError) {
    return { error: `SOLVE_RECORDING_ERROR: ${rpcError.message}` };
  }

  const solveData = rpcResult as {
    success: boolean;
    already_solved?: boolean;
    points_awarded?: number;
    message?: string;
    error?: string;
  };

  if (!solveData.success) {
    return { error: solveData.error || 'Failed to record solve.' };
  }

  // 8. Cache Invalidation
  revalidatePath(`/challenges/${challengeSlug}`);
  revalidatePath('/challenges');
  revalidatePath('/dashboard');
  revalidatePath('/leaderboard');

  return {
    success: true,
    alreadySolved: solveData.already_solved,
    pointsAwarded: solveData.points_awarded,
    message: solveData.already_solved
      ? 'CHALLENGE_PREVIOUSLY_CAPTURED: Flag verified, but points were already awarded on your initial solve.'
      : `FLAG_ACCEPTED: Flag verified! Captured +${solveData.points_awarded} PTS.`,
  };
}
