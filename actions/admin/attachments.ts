'use server';

import { revalidatePath } from 'next/cache';
import { assertAdminSession } from '@/lib/auth/assert-admin';
import { createServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { attachmentSchema } from '@/lib/validations/attachment';

export type AttachmentActionResult = {
  success?: boolean;
  error?: string;
  attachmentId?: string;
};

export async function uploadAttachmentAction(
  formData: FormData
): Promise<AttachmentActionResult> {
  const adminSession = await assertAdminSession();

  const challengeId = formData.get('challengeId') as string;
  const file = formData.get('file') as File | null;

  if (!challengeId) {
    return { error: 'Challenge ID is required for attachment upload.' };
  }

  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: 'Please select a valid non-empty file to upload.' };
  }

  // Validate file metadata using Zod schema
  const validation = attachmentSchema.safeParse({
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
  });

  if (!validation.success) {
    const errorMsg = validation.error.issues[0]?.message || 'File validation failed.';
    return { error: errorMsg };
  }

  const supabase = await createServerClient();

  // Verify challenge existence
  const { data: challenge, error: chalError } = await supabase
    .from('challenges')
    .select('id, slug')
    .eq('id', challengeId)
    .single();

  if (chalError || !challenge) {
    return { error: 'Target challenge does not exist.' };
  }

  // Check if an existing attachment exists for replacement
  const { data: existingAttachment } = await supabase
    .from('challenge_attachments')
    .select('id, storage_path')
    .eq('challenge_id', challengeId)
    .maybeSingle();

  const serviceRole = getServiceRoleClient();

  // If replacing, purge previous storage file
  if (existingAttachment?.storage_path) {
    await serviceRole.storage
      .from('challenge-files')
      .remove([existingAttachment.storage_path]);
  }

  // Sanitize filename and construct isolated storage path
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${challengeId}/${Date.now()}-${sanitizedName}`;

  // Upload file buffer to private Supabase bucket
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await serviceRole.storage
    .from('challenge-files')
    .upload(storagePath, fileBuffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) {
    return { error: `Storage upload failed: ${uploadError.message}` };
  }

  let attachmentId: string;

  if (existingAttachment) {
    // Update existing row
    const { error: updateError } = await supabase
      .from('challenge_attachments')
      .update({
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        storage_path: storagePath,
        uploaded_by: adminSession.user.id,
      })
      .eq('id', existingAttachment.id);

    if (updateError) {
      // Rollback storage file on DB failure
      await serviceRole.storage.from('challenge-files').remove([storagePath]);
      return { error: `Failed to update attachment record: ${updateError.message}` };
    }
    attachmentId = existingAttachment.id;
  } else {
    // Insert new row
    const { data: newAttachment, error: insertError } = await supabase
      .from('challenge_attachments')
      .insert({
        challenge_id: challengeId,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        storage_path: storagePath,
        uploaded_by: adminSession.user.id,
      })
      .select('id')
      .single();

    if (insertError || !newAttachment) {
      await serviceRole.storage.from('challenge-files').remove([storagePath]);
      return { error: `Failed to create attachment record: ${insertError?.message}` };
    }
    attachmentId = newAttachment.id;
  }

  revalidatePath(`/admin/challenges/${challengeId}`);
  revalidatePath('/admin/challenges');
  revalidatePath('/challenges');
  revalidatePath(`/challenges/${challenge.slug}`);

  return { success: true, attachmentId };
}

export async function deleteAttachmentAction(
  attachmentId: string
): Promise<{ success: boolean; error?: string }> {
  await assertAdminSession();

  const supabase = await createServerClient();

  const { data: attachment, error: fetchError } = await supabase
    .from('challenge_attachments')
    .select('id, storage_path, challenge_id, challenges(slug)')
    .eq('id', attachmentId)
    .single();

  if (fetchError || !attachment) {
    return { success: false, error: 'Attachment not found.' };
  }

  // Remove file from storage
  const serviceRole = getServiceRoleClient();
  if (attachment.storage_path) {
    await serviceRole.storage
      .from('challenge-files')
      .remove([attachment.storage_path]);
  }

  // Delete row from DB
  const { error: deleteError } = await supabase
    .from('challenge_attachments')
    .delete()
    .eq('id', attachmentId);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  revalidatePath(`/admin/challenges/${attachment.challenge_id}`);
  revalidatePath('/admin/challenges');
  revalidatePath('/challenges');

  return { success: true };
}
