'use server';

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { signUpSchema, signInSchema } from '@/lib/validations/auth';

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
  const { error } = await supabase.auth.signUp({
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

  // If Supabase has email confirmation enabled, email_confirmed_at will be null or user.identities could be empty if email exists
  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
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

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { error: authError?.message || 'Invalid email or password.' };
  }

  // Mandatory email confirmation check
  if (!authData.user.email_confirmed_at) {
    await supabase.auth.signOut();
    redirect(`/verify-email?email=${encodeURIComponent(email)}&error=unconfirmed`);
  }

  // Check profile active status and role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    return { error: 'Profile not found. Please contact support.' };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    return { error: 'Your account has been deactivated. Access denied.' };
  }

  // Direct to appropriate dashboard
  if (profile.role === 'admin') {
    redirect('/admin');
  } else {
    redirect('/dashboard');
  }
}

export async function signOutAction() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function resendVerificationAction(
  email: string
): Promise<{ success: boolean; message: string }> {
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Valid email required to resend verification link.' };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: 'Verification link resent successfully. Please check your inbox.' };
}
