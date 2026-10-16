import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server-only
vi.mock('server-only', () => ({}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockCreateSignedUrl = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  getServiceRoleClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: mockCreateSignedUrl,
      })),
    },
  })),
}));

import { GET } from '@/app/challenges/[slug]/download/route';

describe('5-Factor Secure Download Route Handler', () => {
  const baseUrl = 'http://localhost:3000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('FACTOR 1: Redirects unauthenticated requests to /login?error=unauthorized', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Unauthenticated') });

    const req = new Request(`${baseUrl}/challenges/reverse-101/download`);
    const params = Promise.resolve({ slug: 'reverse-101' });

    const response = await GET(req, { params });
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(`${baseUrl}/login?error=unauthorized`);
  });

  it('FACTOR 2: Redirects unconfirmed email accounts to /verify-email', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-unconfirmed',
          email: 'unconfirmed@example.com',
          email_confirmed_at: null, // NOT CONFIRMED
        },
      },
      error: null,
    });

    const req = new Request(`${baseUrl}/challenges/reverse-101/download`);
    const params = Promise.resolve({ slug: 'reverse-101' });

    const response = await GET(req, { params });
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/verify-email?email=unconfirmed%40example.com&error=unconfirmed');
  });

  it('FACTOR 3: Rejects deactivated user profiles', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-banned',
          email: 'banned@example.com',
          email_confirmed_at: '2026-01-01T00:00:00Z',
        },
      },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: 'user', is_active: false }, // DEACTIVATED
        error: null,
      }),
    });

    const req = new Request(`${baseUrl}/challenges/reverse-101/download`);
    const params = Promise.resolve({ slug: 'reverse-101' });

    const response = await GET(req, { params });
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(`${baseUrl}/login?error=account_deactivated`);
  });

  it('FACTOR 4: Returns 403 when regular user requests draft/archived challenge', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-valid',
          email: 'operative@example.com',
          email_confirmed_at: '2026-01-01T00:00:00Z',
        },
      },
      error: null,
    });

    // Profile is normal user
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: 'user', is_active: true },
        error: null,
      }),
    });

    // Challenge is draft
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'chal-draft-1', title: 'Secret Draft', status: 'draft' },
        error: null,
      }),
    });

    const req = new Request(`${baseUrl}/challenges/secret-draft/download`);
    const params = Promise.resolve({ slug: 'secret-draft' });

    const response = await GET(req, { params });
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('not currently published');
  });

  it('FACTOR 5: Returns 404 when target challenge has no attachment record', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-valid',
          email: 'operative@example.com',
          email_confirmed_at: '2026-01-01T00:00:00Z',
        },
      },
      error: null,
    });

    // Profile is active user
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: 'user', is_active: true },
        error: null,
      }),
    });

    // Challenge is published
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'chal-pub-1', title: 'Web Intro', status: 'published' },
        error: null,
      }),
    });

    // Attachment query returns null
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null, // NO ATTACHMENT
        error: null,
      }),
    });

    const req = new Request(`${baseUrl}/challenges/web-intro/download`);
    const params = Promise.resolve({ slug: 'web-intro' });

    const response = await GET(req, { params });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toContain('No attachment found');
  });

  it('SUCCESS: Generates short-lived signed URL and redirects when all 5 factors pass', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-valid',
          email: 'operative@example.com',
          email_confirmed_at: '2026-01-01T00:00:00Z',
        },
      },
      error: null,
    });

    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: 'user', is_active: true },
        error: null,
      }),
    });

    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'chal-pub-2', title: 'Reverse Me', status: 'published' },
        error: null,
      }),
    });

    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'att-1',
          storage_path: 'chal-pub-2/binary.zip',
          file_name: 'binary.zip',
        },
        error: null,
      }),
    });

    const ephemeralSignedUrl = 'https://supabase.co/storage/v1/object/sign/challenge-files/binary.zip?token=exp_60s';
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: ephemeralSignedUrl },
      error: null,
    });

    const req = new Request(`${baseUrl}/challenges/reverse-me/download`);
    const params = Promise.resolve({ slug: 'reverse-me' });

    const response = await GET(req, { params });
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(ephemeralSignedUrl);
  });
});
