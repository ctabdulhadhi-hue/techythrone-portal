import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock redirect from next/navigation
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

// Mock Supabase SSR and Service Role clients
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockSsrFrom = vi.fn();
const mockServiceFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
    },
    from: mockSsrFrom,
  })),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: mockServiceFrom,
  })),
  getServiceRoleClient: vi.fn(() => ({
    from: mockServiceFrom,
  })),
}));

import { signInAction, adminSignInAction } from '@/actions/auth';

describe('Role-Based Authentication & Login Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Normal User Login (signInAction)', () => {
    it('redirects normal active user to /dashboard after successful email/password authentication', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-standard-123',
            email: 'operative@techythrone.ctf',
            email_confirmed_at: '2026-01-01T00:00:00Z',
          },
        },
        error: null,
      });

      mockSsrFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            role: 'user',
            is_active: true,
          },
          error: null,
        }),
      });

      const formData = new FormData();
      formData.set('email', 'operative@techythrone.ctf');
      formData.set('password', 'ValidPassphrase123!');

      await expect(signInAction(null, formData)).rejects.toThrow('NEXT_REDIRECT:/dashboard');
      expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    });

    it('allows unconfirmed email user to log in and redirects to /dashboard', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-unconfirmed',
            email: 'unconfirmed@techythrone.ctf',
            email_confirmed_at: null, // NOT CONFIRMED
          },
        },
        error: null,
      });

      mockSsrFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            role: 'user',
            is_active: true,
          },
          error: null,
        }),
      });

      const formData = new FormData();
      formData.set('email', 'unconfirmed@techythrone.ctf');
      formData.set('password', 'ValidPassphrase123!');

      await expect(signInAction(null, formData)).rejects.toThrow('NEXT_REDIRECT:/dashboard');
      expect(mockSignOut).not.toHaveBeenCalled();
      expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    });

    it('denies login if user account is deactivated', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-banned',
            email: 'banned@techythrone.ctf',
            email_confirmed_at: '2026-01-01T00:00:00Z',
          },
        },
        error: null,
      });

      mockSsrFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            role: 'user',
            is_active: false, // BANNED
          },
          error: null,
        }),
      });

      const formData = new FormData();
      formData.set('email', 'banned@techythrone.ctf');
      formData.set('password', 'ValidPassphrase123!');

      const result = await signInAction(null, formData);
      expect(mockSignOut).toHaveBeenCalled();
      expect(result.error).toContain('Your account has been deactivated');
    });
  });

  describe('Separate Admin Login (adminSignInAction)', () => {
    it('redirects active admin to /admin after successful username and password login', async () => {
      // Service role lookup finds admin profile by username
      mockServiceFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'admin-uuid-1',
            email: 'root@techythrone.ctf',
            username: 'cyber_admin',
            role: 'admin',
            is_active: true,
          },
          error: null,
        }),
      });

      // Supabase Auth succeeds
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'admin-uuid-1',
            email: 'root@techythrone.ctf',
            email_confirmed_at: '2026-01-01T00:00:00Z',
          },
        },
        error: null,
      });

      // Post-auth active admin verification
      mockSsrFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            role: 'admin',
            is_active: true,
          },
          error: null,
        }),
      });

      const formData = new FormData();
      formData.set('username', 'cyber_admin');
      formData.set('password', 'SuperAdminPass123!');

      await expect(adminSignInAction(null, formData)).rejects.toThrow('NEXT_REDIRECT:/admin');
      expect(mockRedirect).toHaveBeenCalledWith('/admin');
    });

    it('rejects normal user who attempts to log in via admin login gateway', async () => {
      // Service role lookup finds a profile with role='user'
      mockServiceFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'normie-uuid',
            email: 'normie@techythrone.ctf',
            username: 'normal_operator',
            role: 'user', // NOT AN ADMIN
            is_active: true,
          },
          error: null,
        }),
      });

      const formData = new FormData();
      formData.set('username', 'normal_operator');
      formData.set('password', 'NormalUserPass123!');

      const result = await adminSignInAction(null, formData);
      expect(result.error).toBe('Invalid administrative credentials.');
      // Should not even call signInWithPassword
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it('rejects non-existent admin username with generic error message', async () => {
      mockServiceFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null, // NOT FOUND
          error: null,
        }),
      });

      const formData = new FormData();
      formData.set('username', 'non_existent_admin');
      formData.set('password', 'SomePassphrase123!');

      const result = await adminSignInAction(null, formData);
      expect(result.error).toBe('Invalid administrative credentials.');
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it('rejects deactivated admin account', async () => {
      mockServiceFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'banned-admin-id',
            email: 'badadmin@techythrone.ctf',
            username: 'corrupt_admin',
            role: 'admin',
            is_active: false, // DEACTIVATED
          },
          error: null,
        }),
      });

      const formData = new FormData();
      formData.set('username', 'corrupt_admin');
      formData.set('password', 'AdminPassphrase123!');

      const result = await adminSignInAction(null, formData);
      expect(result.error).toContain('Administrative account has been deactivated');
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it('rejects admin login when password authentication fails', async () => {
      mockServiceFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'admin-uuid-2',
            email: 'admin2@techythrone.ctf',
            username: 'sec_admin',
            role: 'admin',
            is_active: true,
          },
          error: null,
        }),
      });

      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid login credentials'),
      });

      const formData = new FormData();
      formData.set('username', 'sec_admin');
      formData.set('password', 'WrongPassword123!');

      const result = await adminSignInAction(null, formData);
      expect(result.error).toBe('Invalid administrative credentials.');
    });

    it('denies admin login when admin email is unconfirmed', async () => {
      mockServiceFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'admin-unconfirmed-id',
            email: 'unconfirmedadmin@techythrone.ctf',
            username: 'unconfirmed_admin',
            role: 'admin',
            is_active: true,
          },
          error: null,
        }),
      });

      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'admin-unconfirmed-id',
            email: 'unconfirmedadmin@techythrone.ctf',
            email_confirmed_at: null, // NOT CONFIRMED
          },
        },
        error: null,
      });

      const formData = new FormData();
      formData.set('username', 'unconfirmed_admin');
      formData.set('password', 'AdminPass123!');

      const result = await adminSignInAction(null, formData);
      expect(mockSignOut).toHaveBeenCalled();
      expect(result.error).toContain('Administrative email requires confirmation');
    });
  });
});
