'use server';

import { revalidatePath } from 'next/cache';
import { assertAdminSession } from '@/lib/auth/assert-admin';
import { createServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { adminUpdateProfileSchema } from '@/lib/validations/profile';

export async function adminUpdateUserProfile(
  targetUserId: string,
  role?: 'user' | 'admin',
  isActive?: boolean
): Promise<{ success: boolean; error?: string }> {
  const adminSession = await assertAdminSession();

  const validation = adminUpdateProfileSchema.safeParse({
    targetUserId,
    role,
    isActive,
  });

  if (!validation.success) {
    return { success: false, error: 'Invalid profile update parameters.' };
  }

  // Prevent self-lockout: an admin cannot demote themselves or deactivate their own profile
  if (targetUserId === adminSession.user.id) {
    if (role && role !== 'admin') {
      return { success: false, error: 'Self-demotion prohibited. Another administrator must change your role.' };
    }
    if (isActive === false) {
      return { success: false, error: 'Self-deactivation prohibited. You cannot deactivate your own account.' };
    }
  }

  const updates: Record<string, unknown> = {};
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.is_active = isActive;

  if (Object.keys(updates).length === 0) {
    return { success: true };
  }

  // Execute privileged update via isolated server-only service-role client
  const serviceRole = getServiceRoleClient();
  const { error } = await serviceRole
    .from('profiles')
    .update(updates)
    .eq('id', targetUserId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/users');
  revalidatePath('/admin');

  return { success: true };
}

export async function adminGetUsers() {
  await assertAdminSession();

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, username, display_name, role, is_active, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}
