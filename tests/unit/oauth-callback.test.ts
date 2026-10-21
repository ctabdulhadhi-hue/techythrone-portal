import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server-only
vi.mock('server-only', () => ({}));

const mockExchangeCodeForSession = vi.fn();
const mockVerifyOtp = vi.fn();
const mockSignOut = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
      verifyOtp: mockVerifyOtp,
      signOut: mockSignOut,
    },
    from: mockFrom,
  })),
}));

const mockServiceFrom = vi.fn(() => ({
  update: vi.fn(() => ({
    eq: vi.fn().mockResolvedValue({ error: null }),
  })),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: mockServiceFrom,
    auth: {
      admin: {
        updateUserById: vi.fn().mockResolvedValue({ error: null }),
      },
    },
  })),
  getServiceRoleClient: vi.fn(() => ({
    from: mockServiceFrom,
  })),
}));

import { GET } from '@/app/auth/callback/route';

describe('OAuth Callback Route Handler (GET)', () => {
  const origin = 'https://portal.techythrone.ctf';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /login with error message if OAuth provider returns error_description', async () => {
    const req = new Request(`${origin}/auth/callback?error=access_denied&error_description=The+user+denied+the+request`);
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toBe(`${origin}/login?error=The%20user%20denied%20the%20request`);
  });

  it('redirects to /login with error if provider returns error without description', async () => {
    const req = new Request(`${origin}/auth/callback?error=server_error`);
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toBe(`${origin}/login?error=server_error`);
  });

  it('redirects to /login?error=verification_failed if code is missing', async () => {
    const req = new Request(`${origin}/auth/callback`);
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toBe(`${origin}/login?error=verification_failed`);
  });

  it('redirects to /login with error message if session code exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid authorization code'),
    });

    const req = new Request(`${origin}/auth/callback?code=bad-auth-code`);
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toBe(`${origin}/login?error=Invalid%20authorization%20code`);
  });

  it('signs out and redirects to /login?error=account_deactivated if user profile is deactivated', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { id: 'usr-deactivated', email: 'banned@techythrone.ctf' } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: 'user', is_active: false },
        error: null,
      }),
    });

    const req = new Request(`${origin}/auth/callback?code=valid-auth-code`);
    const res = await GET(req);

    expect(mockSignOut).toHaveBeenCalled();
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toBe(`${origin}/login?error=account_deactivated`);
  });

  it('redirects standard active user to /dashboard by default', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { id: 'usr-standard', email: 'user@techythrone.ctf' } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: 'user', is_active: true },
        error: null,
      }),
    });

    const req = new Request(`${origin}/auth/callback?code=valid-auth-code`);
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toBe(`${origin}/dashboard`);
  });

  it('redirects active user to valid internal next URL', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { id: 'usr-standard', email: 'user@techythrone.ctf' } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: 'user', is_active: true },
        error: null,
      }),
    });

    const req = new Request(`${origin}/auth/callback?code=valid-code&next=/challenges`);
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toBe(`${origin}/challenges`);
  });

  it('sanitizes external open redirect URLs and falls back to /dashboard', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { id: 'usr-standard', email: 'user@techythrone.ctf' } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: 'user', is_active: true },
        error: null,
      }),
    });

    // Test external domain
    const evilReq = new Request(`${origin}/auth/callback?code=valid-code&next=https://evil-attacker.com`);
    const evilRes = await GET(evilReq);
    expect(evilRes.headers.get('location')).toBe(`${origin}/dashboard`);

    // Test protocol-relative URL
    const protoReq = new Request(`${origin}/auth/callback?code=valid-code&next=//evil-attacker.com`);
    const protoRes = await GET(protoReq);
    expect(protoRes.headers.get('location')).toBe(`${origin}/dashboard`);
  });

  it('redirects active admin to /admin regardless of regular next parameter', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { id: 'usr-admin', email: 'admin@techythrone.ctf' } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: 'admin', is_active: true },
        error: null,
      }),
    });

    const req = new Request(`${origin}/auth/callback?code=valid-admin-code&next=/challenges`);
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toBe(`${origin}/admin`);
  });

  it('successfully verifies email using token_hash and type and redirects to next destination', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { user: { id: 'usr-verified', email: 'verified@techythrone.ctf' } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: 'user', is_active: true },
        error: null,
      }),
    });

    const req = new Request(`${origin}/auth/callback?token_hash=valid-token-hash&type=signup&next=/challenges/web-101`);
    const res = await GET(req);

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      token_hash: 'valid-token-hash',
      type: 'signup',
    });
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(`${origin}/challenges/web-101`);
  });

  it('redirects to /login with error if token_hash verification fails', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { user: null },
      error: new Error('Token has expired or is invalid'),
    });

    const req = new Request(`${origin}/auth/callback?token_hash=expired-token&type=email`);
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(`${origin}/login?error=Token%20has%20expired%20or%20is%20invalid`);
  });
});
