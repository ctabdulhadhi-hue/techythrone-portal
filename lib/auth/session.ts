import 'server-only';
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  display_name: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  download_verified_at?: string | null;
}

/**
 * Returns the currently authenticated Supabase user, memoized per request lifecycle.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});

/**
 * Returns the profile of the currently authenticated user, memoized per request lifecycle.
 */
export const getAuthProfile = cache(async (): Promise<UserProfile | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  try {
    const supabase = await createServerClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, username, display_name, role, is_active, created_at, download_verified_at')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) return profile as UserProfile;

    // Resilient fallback: lookup via service role client
    const serviceClient = getServiceRoleClient();
    const { data: adminProfile } = await serviceClient
      .from('profiles')
      .select('id, email, username, display_name, role, is_active, created_at, download_verified_at')
      .eq('id', user.id)
      .maybeSingle();

    if (adminProfile) return adminProfile as UserProfile;

    // Auto-provision profile row if missing so user is never locked out
    const defaultUsername = (
      user.user_metadata?.username ||
      user.user_metadata?.display_name ||
      user.email?.split('@')[0] ||
      'operative'
    )
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 30);

    const defaultDisplayName =
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'Operative';

    const { data: createdProfile } = await serviceClient
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email!,
        username: defaultUsername,
        display_name: defaultDisplayName,
        role: 'user',
        is_active: true,
      })
      .select('id, email, username, display_name, role, is_active, created_at, download_verified_at')
      .maybeSingle();

    return (createdProfile as UserProfile) ?? null;
  } catch (error) {
    console.warn('getAuthProfile non-blocking error:', error);
    return null;
  }
});
