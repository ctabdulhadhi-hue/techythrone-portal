import 'server-only';
import { createServerClient } from '@/lib/supabase/server';

export interface AdminSession {
  user: {
    id: string;
    email?: string;
  };
  profile: {
    id: string;
    email: string;
    username: string;
    display_name: string;
    role: 'admin';
    is_active: boolean;
  };
}

export async function assertAdminSession(): Promise<AdminSession> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized: Authentication required.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, username, display_name, role, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Forbidden: User profile not found.');
  }

  if (profile.role !== 'admin' || !profile.is_active) {
    throw new Error('Forbidden: Active administrative privileges required.');
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile: profile as AdminSession['profile'],
  };
}
