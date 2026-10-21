'use server';

import { revalidatePath } from 'next/cache';
import { assertAdminSession } from '@/lib/auth/assert-admin';
import { createServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { challengeSchema, challengeStatusEnum } from '@/lib/validations/challenge';
import { computeFlagHash, validateFlagFormat } from '@/lib/flags/crypto';

export type ChallengeActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  challengeId?: string;
};

export async function createChallengeAction(
  prevState: ChallengeActionResult | null,
  formData: FormData
): Promise<ChallengeActionResult> {
  const adminSession = await assertAdminSession();

  const rawFlag = formData.get('flag')?.toString().trim();
  let flagHash: string | null = null;
  if (rawFlag) {
    if (!validateFlagFormat(rawFlag)) {
      return {
        error: 'Flag must follow platform format THR{...}',
        fieldErrors: { flag: ['Flag must follow format THR{...}'] },
      };
    }
    flagHash = computeFlagHash(rawFlag);
  }

  const rawData = {
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    category: formData.get('category'),
    difficulty: formData.get('difficulty'),
    points: formData.get('points') ? Number(formData.get('points')) : NaN,
    status: formData.get('status') || 'draft',
    flag: rawFlag || null,
    flag_hash: flagHash,
  };

  const validation = challengeSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: 'Please correct the validation errors below.',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const serviceClient = getServiceRoleClient();

  // Check slug uniqueness
  const { data: existing } = await serviceClient
    .from('challenges')
    .select('id')
    .eq('slug', validation.data.slug)
    .single();

  if (existing) {
    return {
      error: 'A challenge with this slug already exists. Please choose a unique slug.',
      fieldErrors: { slug: ['Slug must be unique across all challenges'] },
    };
  }

  const { data: newChallenge, error: insertError } = await serviceClient
    .from('challenges')
    .insert({
      title: validation.data.title,
      slug: validation.data.slug,
      description: validation.data.description,
      category: validation.data.category,
      difficulty: validation.data.difficulty,
      points: validation.data.points,
      status: validation.data.status,
      flag_hash: flagHash,
      created_by: adminSession.user.id,
    })
    .select('id')
    .single();

  if (insertError || !newChallenge) {
    return { error: insertError?.message || 'Failed to create challenge.' };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/challenges');
  revalidatePath('/challenges');

  return { success: true, challengeId: newChallenge.id };
}

export async function updateChallengeAction(
  challengeId: string,
  prevState: ChallengeActionResult | null,
  formData: FormData
): Promise<ChallengeActionResult> {
  await assertAdminSession();

  const rawFlag = formData.get('flag')?.toString().trim();
  let flagHashToUpdate: string | undefined = undefined;
  if (rawFlag) {
    if (!validateFlagFormat(rawFlag)) {
      return {
        error: 'Flag must follow platform format THR{...}',
        fieldErrors: { flag: ['Flag must follow format THR{...}'] },
      };
    }
    flagHashToUpdate = computeFlagHash(rawFlag);
  }

  const rawData = {
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    category: formData.get('category'),
    difficulty: formData.get('difficulty'),
    points: formData.get('points') ? Number(formData.get('points')) : NaN,
    status: formData.get('status'),
    flag: rawFlag || null,
  };

  const validation = challengeSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: 'Please correct the validation errors below.',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const serviceClient = getServiceRoleClient();

  // Check if another challenge uses the same slug
  const { data: conflicting } = await serviceClient
    .from('challenges')
    .select('id')
    .eq('slug', validation.data.slug)
    .neq('id', challengeId)
    .single();

  if (conflicting) {
    return {
      error: 'Slug is already in use by another challenge.',
      fieldErrors: { slug: ['Slug is already in use'] },
    };
  }

  const updatePayload: Record<string, unknown> = {
    title: validation.data.title,
    slug: validation.data.slug,
    description: validation.data.description,
    category: validation.data.category,
    difficulty: validation.data.difficulty,
    points: validation.data.points,
    status: validation.data.status,
  };

  if (flagHashToUpdate !== undefined) {
    updatePayload.flag_hash = flagHashToUpdate;
  }

  const { error: updateError } = await serviceClient
    .from('challenges')
    .update(updatePayload)
    .eq('id', challengeId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/challenges');
  revalidatePath(`/admin/challenges/${challengeId}`);
  revalidatePath('/challenges');
  revalidatePath(`/challenges/${validation.data.slug}`);

  return { success: true, challengeId };
}

export async function setChallengeStatusAction(
  challengeId: string,
  newStatus: string
): Promise<{ success: boolean; error?: string }> {
  await assertAdminSession();

  const validation = challengeStatusEnum.safeParse(newStatus);
  if (!validation.success) {
    return { success: false, error: 'Invalid challenge status.' };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('challenges')
    .update({ status: validation.data })
    .eq('id', challengeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/challenges');
  revalidatePath(`/admin/challenges/${challengeId}`);
  revalidatePath('/challenges');

  return { success: true };
}

export async function deleteChallengeAction(
  challengeId: string
): Promise<{ success: boolean; error?: string }> {
  await assertAdminSession();

  const supabase = await createServerClient();

  // Find any attachments to delete from storage bucket
  const { data: attachments } = await supabase
    .from('challenge_attachments')
    .select('storage_path')
    .eq('challenge_id', challengeId);

  if (attachments && attachments.length > 0) {
    const serviceRoleClient = getServiceRoleClient();
    const paths = attachments.map((a) => a.storage_path);
    await serviceRoleClient.storage.from('challenge-files').remove(paths);
  }

  const { error } = await supabase.from('challenges').delete().eq('id', challengeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/challenges');
  revalidatePath('/challenges');

  return { success: true };
}
