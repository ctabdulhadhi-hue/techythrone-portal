import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server-only
vi.mock('server-only', () => ({}));

const mockFrom = vi.fn();
const mockDownload = vi.fn();
const mockGetAuthUser = vi.fn();
const mockGetAuthProfile = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    from: mockFrom,
  })),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  getServiceRoleClient: vi.fn(() => ({
    from: mockFrom,
    storage: {
      from: vi.fn(() => ({
        download: mockDownload,
      })),
    },
  })),
}));

vi.mock('@/lib/auth/session', () => ({
  getAuthUser: () => mockGetAuthUser(),
  getAuthProfile: () => mockGetAuthProfile(),
}));

import { GET } from '@/app/challenges/[slug]/preview/route';

describe('HTML Challenge Preview Route Handler (GET)', () => {
  const baseUrl = 'http://localhost:3000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows unauthenticated and unverified users to preview published HTML challenge', async () => {
    // Challenge is published
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'chal-web-1', title: 'XSS Lab', slug: 'xss-lab', status: 'published' },
        error: null,
      }),
    });

    // Attachment is HTML
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'att-html-1',
          file_name: 'vulnerable.html',
          file_size_bytes: 1024,
          mime_type: 'text/html',
          storage_path: 'chal-web-1/vulnerable.html',
        },
        error: null,
      }),
    });

    const sampleHtml = '<html><body><h1>XSS Simulation Challenge</h1></body></html>';
    mockDownload.mockResolvedValue({
      data: {
        text: vi.fn().mockResolvedValue(sampleHtml),
      },
      error: null,
    });

    const req = new Request(`${baseUrl}/challenges/xss-lab/preview`);
    const params = Promise.resolve({ slug: 'xss-lab' });

    const response = await GET(req, { params });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');

    // Verify Restrictive CSP & Sandbox headers
    const csp = response.headers.get('content-security-policy') || '';
    expect(csp).toContain('sandbox allow-scripts');
    expect(csp).not.toContain('allow-same-origin');
    expect(csp).toContain("connect-src 'none'");
    expect(csp).toContain("form-action 'none'");
    expect(csp).toContain("frame-ancestors 'self'");

    const text = await response.text();
    expect(text).toBe(sampleHtml);
  });

  it('denies regular/unauthenticated user access to preview unpublished draft challenges (403)', async () => {
    // Challenge is draft
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'chal-draft-1', title: 'Draft XSS', slug: 'draft-xss', status: 'draft' },
        error: null,
      }),
    });

    // User is unauthenticated
    mockGetAuthUser.mockResolvedValue(null);

    const req = new Request(`${baseUrl}/challenges/draft-xss/preview`);
    const params = Promise.resolve({ slug: 'draft-xss' });

    const response = await GET(req, { params });
    expect(response.status).toBe(403);
    const body = await response.text();
    expect(body).toContain('not currently published');
  });

  it('allows active admin to preview unpublished draft HTML challenges (200)', async () => {
    // Challenge is draft
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'chal-draft-2', title: 'Admin Draft', slug: 'admin-draft', status: 'draft' },
        error: null,
      }),
    });

    // User is active admin
    mockGetAuthUser.mockResolvedValue({ id: 'admin-1', email: 'admin@techythrone.ctf' });
    mockGetAuthProfile.mockResolvedValue({ role: 'admin', is_active: true });

    // Attachment is HTML
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'att-html-2',
          file_name: 'preview.html',
          file_size_bytes: 512,
          mime_type: 'text/html',
          storage_path: 'chal-draft-2/preview.html',
        },
        error: null,
      }),
    });

    mockDownload.mockResolvedValue({
      data: {
        text: vi.fn().mockResolvedValue('<p>Admin Preview Content</p>'),
      },
      error: null,
    });

    const req = new Request(`${baseUrl}/challenges/admin-draft/preview`);
    const params = Promise.resolve({ slug: 'admin-draft' });

    const response = await GET(req, { params });
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toBe('<p>Admin Preview Content</p>');
  });

  it('returns 404 when challenge does not exist', async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      }),
    });

    const req = new Request(`${baseUrl}/challenges/non-existent/preview`);
    const params = Promise.resolve({ slug: 'non-existent' });

    const response = await GET(req, { params });
    expect(response.status).toBe(404);
  });

  it('returns 404 when challenge has no attachment record', async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'chal-no-att', title: 'No File Chal', slug: 'no-file-chal', status: 'published' },
        error: null,
      }),
    });

    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null, // No attachment
        error: null,
      }),
    });

    const req = new Request(`${baseUrl}/challenges/no-file-chal/preview`);
    const params = Promise.resolve({ slug: 'no-file-chal' });

    const response = await GET(req, { params });
    expect(response.status).toBe(404);
  });

  it('returns 400 when challenge attachment is NOT an HTML file (e.g. zip/binary)', async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'chal-zip', title: 'Binary Lab', slug: 'binary-lab', status: 'published' },
        error: null,
      }),
    });

    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'att-zip',
          file_name: 'payload.zip',
          file_size_bytes: 2048,
          mime_type: 'application/zip', // NON-HTML
          storage_path: 'chal-zip/payload.zip',
        },
        error: null,
      }),
    });

    const req = new Request(`${baseUrl}/challenges/binary-lab/preview`);
    const params = Promise.resolve({ slug: 'binary-lab' });

    const response = await GET(req, { params });
    expect(response.status).toBe(400);
    const body = await response.text();
    expect(body).toContain('only available for HTML challenge files');
  });

  it('returns 500 when storage download encounters an error', async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'chal-error', title: 'Error Lab', slug: 'error-lab', status: 'published' },
        error: null,
      }),
    });

    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'att-html-err',
          file_name: 'test.html',
          file_size_bytes: 1024,
          mime_type: 'text/html',
          storage_path: 'chal-error/test.html',
        },
        error: null,
      }),
    });

    mockDownload.mockResolvedValue({
      data: null,
      error: new Error('Storage service unavailable'),
    });

    const req = new Request(`${baseUrl}/challenges/error-lab/preview`);
    const params = Promise.resolve({ slug: 'error-lab' });

    const response = await GET(req, { params });
    expect(response.status).toBe(500);
  });
});
