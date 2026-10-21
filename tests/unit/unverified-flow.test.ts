import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock Next.js navigation
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

// Mock Supabase SSR and Service Role
const mockSignInWithPassword = vi.fn();
const mockVerifyOtp = vi.fn();
const mockSignOut = vi.fn();
const mockResend = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      verifyOtp: mockVerifyOtp,
      signOut: mockSignOut,
      resend: mockResend,
    },
    from: mockFrom,
  })),
}));

const mockAdminGenerateLink = vi.fn();
const mockAdminUpdateUserById = vi.fn();
const mockServiceFrom = vi.fn();

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => ({
    auth: {
      admin: {
        generateLink: mockAdminGenerateLink,
        updateUserById: mockAdminUpdateUserById,
      },
    },
    from: mockServiceFrom,
  })),
  getServiceRoleClient: vi.fn(() => ({
    auth: {
      admin: {
        generateLink: mockAdminGenerateLink,
        updateUserById: mockAdminUpdateUserById,
      },
    },
    from: mockServiceFrom,
  })),
}));

import { signInAction, resendVerificationAction } from '@/actions/auth';
import { isUserEmailVerified } from '@/lib/auth/verification';

describe('Unverified User Authentication & Security Enforcement Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('auto-confirms platform access on email_not_confirmed so user can explore dashboard without blocking', async () => {
    // First call returns email_not_confirmed, retry succeeds
    mockSignInWithPassword
      .mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed', code: 'email_not_confirmed' },
      })
      .mockResolvedValueOnce({
        data: {
          user: { id: 'unconfirmed-agent-1', email: 'unconfirmed_agent@techythrone.ctf' },
          session: { access_token: 'valid_session' },
        },
        error: null,
      });

    mockServiceFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'unconfirmed-agent-1' },
        error: null,
      }),
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'unconfirmed-agent-1', role: 'user', is_active: true },
        error: null,
      }),
    });

    const formData = new FormData();
    formData.set('email', 'unconfirmed_agent@techythrone.ctf');
    formData.set('password', 'ValidPassphrase123!');

    await expect(signInAction(null, formData)).rejects.toThrow('NEXT_REDIRECT:/dashboard');
    expect(mockAdminUpdateUserById).toHaveBeenCalledWith('unconfirmed-agent-1', {
      email_confirm: true,
    });
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });

  it('rejects invalid password credentials with standard error without triggering unconfirmed flow', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials', code: 'invalid_credentials' },
    });

    const formData = new FormData();
    formData.set('email', 'cadet@techythrone.ctf');
    formData.set('password', 'WrongPassword123!');

    const res = await signInAction(null, formData);
    expect(res.error).toBe('Invalid login credentials');
    expect(mockAdminGenerateLink).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('allows verified normal user to log in and redirects to /dashboard', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: 'user-verified-789',
          email: 'veteran@techythrone.ctf',
          email_confirmed_at: '2026-03-01T12:00:00Z', // VERIFIED
        },
      },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'user-verified-789',
          role: 'user',
          is_active: true,
        },
        error: null,
      }),
    });

    const formData = new FormData();
    formData.set('email', 'veteran@techythrone.ctf');
    formData.set('password', 'VeteranPass123!');

    await expect(signInAction(null, formData)).rejects.toThrow('NEXT_REDIRECT:/dashboard');
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });

  it('isUserEmailVerified strictly enforces verification and rejects unverified users', () => {
    // 1. Unauthenticated / null user
    expect(isUserEmailVerified(null)).toBe(false);
    expect(isUserEmailVerified(undefined)).toBe(false);

    // 2. Unverified user with null download_verified_at
    expect(isUserEmailVerified({ download_verified_at: null })).toBe(false);

    // 3. User with email_confirmed_at but no download_verified_at remains unverified for download
    expect(
      isUserEmailVerified({
        email_confirmed_at: '2026-10-17T07:00:00Z',
        download_verified_at: null,
      })
    ).toBe(false);

    // 4. Genuinely verified user with download_verified_at
    expect(
      isUserEmailVerified({
        download_verified_at: '2026-10-17T07:00:00Z',
      })
    ).toBe(true);

    // 5. Explicit user.is_verified boolean override
    expect(isUserEmailVerified({ is_verified: false, download_verified_at: '2026-10-17T07:00:00Z' })).toBe(false);
    expect(isUserEmailVerified({ is_verified: true })).toBe(true);
  });

  it('resendVerificationAction rejects invalid email format', async () => {
    const res = await resendVerificationAction('invalid-email-string');
    expect(res.success).toBe(false);
    expect(res.message).toContain('Valid email required');
    expect(mockResend).not.toHaveBeenCalled();
  });

  it('resendVerificationAction reports success and returns cooldown when Supabase resend succeeds', async () => {
    mockResend.mockResolvedValue({ error: null });

    const res = await resendVerificationAction('cadet@techythrone.ctf', '/challenges/webd');
    expect(mockResend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'cadet@techythrone.ctf',
      options: {
        emailRedirectTo: expect.stringContaining('/auth/callback?next=%2Fchallenges%2Fwebd'),
      },
    });
    expect(res.success).toBe(true);
    expect(res.cooldownSeconds).toBe(60);
    expect(res.message).toContain('Confirmation email dispatched');
  });

  it('resendVerificationAction detects rate limits honestly and enforces 60s cooldown', async () => {
    mockResend.mockResolvedValue({
      error: {
        status: 429,
        message: 'For security purposes, you can only request this once every 60 seconds',
      },
    });

    const res = await resendVerificationAction('cadet@techythrone.ctf');
    expect(res.success).toBe(false);
    expect(res.cooldownSeconds).toBe(60);
    expect(res.message).toContain('Security rate limit: For security purposes, please wait 60 seconds');
  });

  it('resendVerificationAction detects already-confirmed accounts honestly', async () => {
    mockResend.mockResolvedValue({
      error: {
        message: 'User already confirmed',
      },
    });

    const res = await resendVerificationAction('confirmed@techythrone.ctf');
    expect(res.success).toBe(true);
    expect(res.message).toContain('already confirmed');
  });
});
