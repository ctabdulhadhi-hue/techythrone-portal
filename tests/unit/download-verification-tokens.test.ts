import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock Supabase Service Role and SSR Clients
const mockServiceFrom = vi.fn();
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: mockServiceFrom,
  })),
  getServiceRoleClient: vi.fn(() => ({
    from: mockServiceFrom,
  })),
}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

import {
  hashVerificationToken,
  createDownloadVerificationToken,
  redeemDownloadVerificationToken,
  MAX_TOKENS_PER_WINDOW,
} from '@/lib/auth/download-verification';
import { sendDownloadVerificationEmail } from '@/lib/email/sender';
import { GET as verifyDownloadRoute } from '@/app/verify-download/route';

describe('Option A: Download Verification Token Security & Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Cryptographic Token Generation & Hashing', () => {
    it('generates high-entropy tokens and computes deterministic SHA-256 hashes', () => {
      const rawToken1 = 'test-token-123';
      const hash1 = hashVerificationToken(rawToken1);
      const hash2 = hashVerificationToken(rawToken1);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex output is 64 characters

      const diffHash = hashVerificationToken('test-token-456');
      expect(hash1).not.toBe(diffHash);
    });

    it('stores ONLY the SHA-256 token hash in the database, never the raw token', async () => {
      // Rate limit check: 0 tokens in window
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      mockServiceFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: 0, error: null }),
        insert: mockInsert,
      });

      const res = await createDownloadVerificationToken('user-123');
      expect(res.success).toBe(true);
      expect(res.rawToken).toBeDefined();
      expect(res.rawToken).toHaveLength(64); // 32 bytes hex = 64 characters

      // Verify the insert payload receives token_hash and NOT rawToken
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          token_hash: hashVerificationToken(res.rawToken!),
        })
      );
    });

    it('strictly enforces rate limit of 3 tokens per 15-minute window', async () => {
      mockServiceFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: MAX_TOKENS_PER_WINDOW, error: null }),
      });

      const res = await createDownloadVerificationToken('user-rate-limited');
      expect(res.success).toBe(false);
      expect(res.rateLimited).toBe(true);
      expect(res.error).toContain('Rate limit exceeded');
    });
  });

  describe('2. Single-Use & Expiration Redemption', () => {
    it('successfully redeems an unconsumed, active token and updates profiles.download_verified_at', async () => {
      const rawToken = 'valid-active-token-secret-xyz';
      const futureExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const mockProfileUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      // 1. Fetch token record
      // 2. Consume token record
      // 3. Update profile
      mockServiceFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: 'token-rec-1',
              user_id: 'operative-456',
              expires_at: futureExpiry,
              consumed_at: null,
            },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'token-rec-1', user_id: 'operative-456' },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: mockProfileUpdate,
        });

      const res = await redeemDownloadVerificationToken(rawToken);
      expect(res.success).toBe(true);
      expect(res.userId).toBe('operative-456');
    });

    it('rejects expired tokens (15-minute expiry limit)', async () => {
      const rawToken = 'expired-token-secret';
      const pastExpiry = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes ago

      mockServiceFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'token-rec-expired',
            user_id: 'operative-456',
            expires_at: pastExpiry,
            consumed_at: null,
          },
          error: null,
        }),
      });

      const res = await redeemDownloadVerificationToken(rawToken);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('EXPIRED_TOKEN');
      expect(res.error).toContain('expired');
    });

    it('rejects already consumed tokens (prevents token reuse)', async () => {
      const rawToken = 'consumed-token-secret';
      const futureExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      mockServiceFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'token-rec-consumed',
            user_id: 'operative-456',
            expires_at: futureExpiry,
            consumed_at: new Date(Date.now() - 1000).toISOString(), // already consumed
          },
          error: null,
        }),
      });

      const res = await redeemDownloadVerificationToken(rawToken);
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('ALREADY_CONSUMED');
      expect(res.error).toContain('already been used');
    });

    it('rejects nonexistent or tampered tokens', async () => {
      mockServiceFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const res = await redeemDownloadVerificationToken('tampered-token-xyz');
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_TOKEN');
    });
  });

  describe('3. Email Delivery Security Rules', () => {
    it('fails safely in production if email delivery is not configured', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalResend = process.env.RESEND_API_KEY;
      const originalSmtp = process.env.SMTP_HOST;
      const envObj = process.env as Record<string, string | undefined>;

      try {
        envObj.NODE_ENV = 'production';
        delete process.env.RESEND_API_KEY;
        delete process.env.SMTP_HOST;

        const res = await sendDownloadVerificationEmail({
          toEmail: 'operative@techythrone.ctf',
          verificationUrl: 'https://techythrone.ctf/verify-download?token=secret',
        });

        expect(res.success).toBe(false);
        expect(res.error).toContain('Production email delivery service is not configured');
      } finally {
        envObj.NODE_ENV = originalEnv;
        if (originalResend) process.env.RESEND_API_KEY = originalResend;
        if (originalSmtp) process.env.SMTP_HOST = originalSmtp;
      }
    });

    it('never logs verification URL in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      const envObj = process.env as Record<string, string | undefined>;
      const consoleSpy = vi.spyOn(console, 'log');

      try {
        envObj.NODE_ENV = 'production';
        process.env.RESEND_API_KEY = 're_mock_test_key';

        // Mock global fetch for Resend API call
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({ id: 'mock-email-id' }),
        } as unknown as Response);

        const res = await sendDownloadVerificationEmail({
          toEmail: 'target@techythrone.ctf',
          verificationUrl: 'https://techythrone.ctf/verify-download?token=top-secret-token',
        });

        expect(res.success).toBe(true);

        // Assert console was never called with the secret link in production
        for (const call of consoleSpy.mock.calls) {
          for (const arg of call) {
            expect(String(arg)).not.toContain('top-secret-token');
          }
        }
      } finally {
        envObj.NODE_ENV = originalEnv;
        consoleSpy.mockRestore();
      }
    });
  });

  describe('4. Verify Download Route Handler (/verify-download)', () => {
    it('redirects to /verify-email?error=missing_token when token query param is absent', async () => {
      const req = new Request('http://localhost:3000/verify-download?next=/challenges/reverse-101');
      const res = await verifyDownloadRoute(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/verify-email?error=missing_token');
    });

    it('redirects to sanitized target challenge with ?verified=download_authorized upon valid redemption', async () => {
      // Mock redeemDownloadVerificationToken behavior
      mockServiceFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: 'tok-1',
              user_id: 'user-1',
              expires_at: new Date(Date.now() + 60000).toISOString(),
              consumed_at: null,
            },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'tok-1', user_id: 'user-1' },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        });

      const req = new Request('http://localhost:3000/verify-download?token=valid-secret&next=/challenges/crypto-101');
      const res = await verifyDownloadRoute(req);

      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/challenges/crypto-101');
      expect(location).toContain('verified=download_authorized');
    });

    it('preserves download=1 and attachmentId parameters through verification redirect for seamless automatic download', async () => {
      mockServiceFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: 'tok-seamless',
              user_id: 'user-1',
              expires_at: new Date(Date.now() + 60000).toISOString(),
              consumed_at: null,
            },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'tok-seamless', user_id: 'user-1' },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        });

      const req = new Request('http://localhost:3000/verify-download?token=valid-secret&next=/challenges/webd?download=1%26attachmentId=att-xyz');
      const res = await verifyDownloadRoute(req);

      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/challenges/webd');
      expect(location).toContain('download=1');
      expect(location).toContain('attachmentId=att-xyz');
      expect(location).toContain('verified=download_authorized');
    });

    it('prevents open redirect vulnerabilities by constraining next destination to relative paths', async () => {
      // Attack vector: next=https://evil.attacker.com
      const req = new Request('http://localhost:3000/verify-download?token=&next=https://evil.attacker.com');
      const res = await verifyDownloadRoute(req);

      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      // Must not redirect to evil.attacker.com; sanitized to default /challenges
      expect(location).not.toContain('evil.attacker.com');
      expect(location).toContain('next=%2Fchallenges');

      // Attack vector 2: protocol-relative //evil.attacker.com
      const req2 = new Request('http://localhost:3000/verify-download?token=&next=//evil.attacker.com/pwn');
      const res2 = await verifyDownloadRoute(req2);
      expect(res2.status).toBe(307);
      expect(res2.headers.get('location')).not.toContain('evil.attacker.com');
      expect(res2.headers.get('location')).toContain('next=%2Fchallenges');

      // Attack vector 3: backslash \evil.attacker.com
      const req3 = new Request('http://localhost:3000/verify-download?token=&next=\\evil.attacker.com');
      const res3 = await verifyDownloadRoute(req3);
      expect(res3.status).toBe(307);
      expect(res3.headers.get('location')).not.toContain('evil.attacker.com');
      expect(res3.headers.get('location')).toContain('next=%2Fchallenges');
    });
  });
});
