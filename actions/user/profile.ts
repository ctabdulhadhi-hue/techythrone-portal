'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { updateDisplayNameSchema } from '@/lib/validations/profile';

export type ProfileActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updateDisplayNameAction(
  prevState: ProfileActionResult | null,
  formData: FormData
): Promise<ProfileActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Authentication required to update profile.' };
  }

  const rawData = {
    displayName: formData.get('displayName'),
  };

  const validation = updateDisplayNameSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: 'Invalid display name.',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  // Update display_name only (respects column-level UPDATE grant)
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ display_name: validation.data.displayName })
    .eq('id', user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/admin/users');

  return { success: true };
}
