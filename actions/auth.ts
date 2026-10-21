'use server';

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { signUpSchema, signInSchema, adminSignInSchema } from '@/lib/validations/auth';

export type AuthActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function signUpAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName'),
  };

  const validation = signUpSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: 'Validation failed. Please correct the fields below.',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { email, password, displayName } = validation.data;
  const username = displayName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30) || 'agent';

  const supabase = await createServerClient();
  const serviceClient = createServiceRoleClient();

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        username,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Auto-confirm the account for platform access so the user can enter dashboard directly
  // (Challenge file downloads remain strictly protected behind download verification)
  if (authData?.user) {
    try {
      await serviceClient.auth.admin.updateUserById(authData.user.id, {
        email_confirm: true,
      });

      await supabase.auth.signInWithPassword({
        email,
        password,
      });
    } catch (e) {
      console.warn('Auto-confirm non-blocking notice:', e);
    }

    redirect('/dashboard');
  }

  if (authData?.session) {
    redirect('/dashboard');
  }

  redirect('/dashboard');
}

export async function signInAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const validation = signInSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: 'Please provide a valid email and password.',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validation.data;
  const supabase = await createServerClient();

  let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // If account was unconfirmed in Supabase Auth, auto-confirm platform access
  // so the user can enter the dashboard and explore freely.
  // (Challenge file downloads remain strictly protected behind download verification).
  if (
    authError?.message === 'Email not confirmed' ||
    (authError as { code?: string })?.code === 'email_not_confirmed'
  ) {
    const serviceClient = createServiceRoleClient();

    let targetUserId: string | null = null;
    const { data: profileRow } = await serviceClient
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (profileRow?.id) {
      targetUserId = profileRow.id;
    } else {
      const { data: userList } = await serviceClient.auth.admin.listUsers();
      const matchedUser = userList?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (matchedUser) {
        targetUserId = matchedUser.id;
      }
    }

    if (targetUserId) {
      await serviceClient.auth.admin.updateUserById(targetUserId, {
        email_confirm: true,
      });

      const retryResult = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      authData = retryResult.data;
      authError = retryResult.error;
    }
  }

  if (authError || !authData?.user) {
    return { error: authError?.message || 'Invalid email or password.' };
  }

  const authenticatedUser = authData.user;

  // Check profile active status and role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', authenticatedUser.id)
    .single();

  if (profileError || !profile) {
    return { error: 'Profile not found. Please contact support.' };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    return { error: 'Your account has been deactivated. Access denied.' };
  }

  // Direct to appropriate destination:
  // Admin accounts route to /admin; regular users route to /dashboard
  if (profile.role === 'admin') {
    redirect('/admin');
  } else {
    redirect('/dashboard');
  }
}

export async function adminSignInAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    username: formData.get('username'),
    password: formData.get('password'),
  };

  const validation = adminSignInSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: 'Please provide a valid admin username and password.',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { username, password } = validation.data;
  const serviceClient = createServiceRoleClient();

  // 1. Authoritative lookup for profile by username
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('id, email, role, is_active')
    .ilike('username', username)
    .maybeSingle();

  if (profileError || !profile || profile.role !== 'admin') {
    return { error: 'Invalid administrative credentials.' };
  }

  if (!profile.is_active) {
    return { error: 'Administrative account has been deactivated. Access denied.' };
  }

  // 2. Authenticate against Supabase Auth using the admin's bound email
  const supabase = await createServerClient();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  });

  if (authError || !authData?.user) {
    return { error: 'Invalid administrative credentials.' };
  }

  if (!authData.user.email_confirmed_at) {
    await supabase.auth.signOut();
    return { error: 'Administrative email requires confirmation before accessing security console.' };
  }

  redirect('/admin');
}

export async function signOutAction() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function resendVerificationAction(
  email?: string,
  next?: string
): Promise<{ success: boolean; message: string; cooldownSeconds?: number }> {
  if (!email) {
    return { success: false, message: 'Valid email required' };
  }

  const trimmedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { success: false, message: 'Valid email required' };
  }

  const supabase = await createServerClient();
  const nextTarget = next || '/dashboard';

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: trimmedEmail,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback?next=${encodeURIComponent(nextTarget)}`,
    },
  });

  if (error) {
    const errorMsg = error.message.toLowerCase();
    if (errorMsg.includes('already confirmed') || errorMsg.includes('already registered')) {
      return {
        success: true,
        message: 'This account email is already confirmed. You may proceed to sign in directly.',
      };
    }
    if (errorMsg.includes('rate limit') || errorMsg.includes('security purposes') || errorMsg.includes('seconds')) {
      const match = error.message.match(/(\d+)\s*seconds?/i);
      const waitSeconds = match ? parseInt(match[1], 10) : 60;
      return {
        success: false,
        message: `Security rate limit: For security purposes, please wait ${waitSeconds} seconds before requesting another email.`,
        cooldownSeconds: waitSeconds,
      };
    }
    return {
      success: false,
      message: `Failed to dispatch verification email: ${error.message}`,
    };
  }

  return {
    success: true,
    message: `Confirmation email dispatched to ${trimmedEmail}. Please inspect your inbox and spam folder.`,
    cooldownSeconds: 60,
  };
}
