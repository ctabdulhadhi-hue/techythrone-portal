import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock createServerClient
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

import { assertAdminSession } from '@/lib/auth/assert-admin';

describe('assertAdminSession Security Assertion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws Unauthorized error if user session is absent', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') });

    await expect(assertAdminSession()).rejects.toThrow('Unauthorized: Authentication required.');
  });

  it('throws Forbidden error if user profile does not exist in database', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'usr-1', email: 'test@example.com' } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
    });

    await expect(assertAdminSession()).rejects.toThrow('Forbidden: User profile not found.');
  });

  it('throws Forbidden error if user has role "user" instead of "admin"', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'usr-2', email: 'normie@example.com' } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'usr-2',
          email: 'normie@example.com',
          username: 'normie',
          display_name: 'Normie',
          role: 'user',
          is_active: true,
        },
        error: null,
      }),
    });

    await expect(assertAdminSession()).rejects.toThrow(
      'Forbidden: Active administrative privileges required.'
    );
  });

  it('throws Forbidden error if user is an admin but is_active is false', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'usr-3', email: 'bannedadmin@example.com' } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'usr-3',
          email: 'bannedadmin@example.com',
          username: 'badadmin',
          display_name: 'Bad Admin',
          role: 'admin',
          is_active: false,
        },
        error: null,
      }),
    });

    await expect(assertAdminSession()).rejects.toThrow(
      'Forbidden: Active administrative privileges required.'
    );
  });

  it('successfully returns AdminSession when user is active admin', async () => {
    const adminUser = { id: 'admin-uuid', email: 'secops@techythrone.ctf' };
    const adminProfile = {
      id: 'admin-uuid',
      email: 'secops@techythrone.ctf',
      username: 'secops',
      display_name: 'SecOps Lead',
      role: 'admin',
      is_active: true,
    };

    mockGetUser.mockResolvedValue({ data: { user: adminUser }, error: null });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: adminProfile, error: null }),
    });

    const session = await assertAdminSession();
    expect(session.user.id).toBe('admin-uuid');
    expect(session.profile.role).toBe('admin');
    expect(session.profile.is_active).toBe(true);
  });
});
