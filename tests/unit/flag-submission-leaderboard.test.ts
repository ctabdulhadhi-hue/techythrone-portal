import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock Next.js cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import {
  validateFlagFormat,
  computeFlagHash,
  verifyFlag,
  maskFlagForAudit,
} from '@/lib/flags/crypto';

// Mocks for Supabase
const mockGetAuthUser = vi.fn();
const mockGetAuthProfile = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getAuthUser: () => mockGetAuthUser(),
  getAuthProfile: () => mockGetAuthProfile(),
}));

const mockServiceSelect = vi.fn();
const mockServiceInsert = vi.fn();
const mockServiceUpdate = vi.fn();
const mockServiceEq = vi.fn();
const mockServiceSingle = vi.fn();
const mockServiceRpc = vi.fn();

const mockServiceFrom = vi.fn(() => {
  return {
    select: mockServiceSelect,
    insert: mockServiceInsert,
    update: mockServiceUpdate,
    eq: mockServiceEq,
    single: mockServiceSingle,
  };
});

vi.mock('@/lib/supabase/service-role', () => ({
  getServiceRoleClient: () => ({
    from: mockServiceFrom,
    rpc: mockServiceRpc,
  }),
  createServiceRoleClient: () => ({
    from: mockServiceFrom,
    rpc: mockServiceRpc,
  }),
}));

import { submitFlagAction } from '@/actions/flags';

describe('CTF Cryptographic Flag Verification & Hashing', () => {
  const secretKey = 'test_secret_salt_key_12345';
  process.env.FLAG_SALT_SECRET = secretKey;

  it('validates correct THR{...} flag formats', () => {
    expect(validateFlagFormat('THR{web_exploit_101}')).toBe(true);
    expect(validateFlagFormat('THR{s3cur3_v4ult_fl4g!}')).toBe(true);
    expect(validateFlagFormat('THR{c0mpl3x-k3y_w1th.symb0ls}')).toBe(true);
  });

  it('rejects malformed flag formats', () => {
    expect(validateFlagFormat('')).toBe(false);
    expect(validateFlagFormat('flag{invalid_prefix}')).toBe(false);
    expect(validateFlagFormat('THR{}')).toBe(false); // Empty brackets
    expect(validateFlagFormat('THR{unclosed_bracket')).toBe(false);
    expect(validateFlagFormat('just_a_string')).toBe(false);
  });

  it('computes deterministic keyed HMAC-SHA-256 digest', () => {
    const hash1 = computeFlagHash('THR{sample_flag}');
    const hash2 = computeFlagHash('THR{sample_flag}');
    const hash3 = computeFlagHash('THR{different_flag}');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(64); // 256 bits = 64 hex chars
  });

  it('verifies constant-time equality correctly', () => {
    const storedDigest = computeFlagHash('THR{correct_solution_99}');
    expect(verifyFlag('THR{correct_solution_99}', storedDigest)).toBe(true);
    expect(verifyFlag('THR{wrong_solution_99}', storedDigest)).toBe(false);
    expect(verifyFlag('', storedDigest)).toBe(false);
  });

  it('masks submitted flags for safe audit trails without leaking plaintext', () => {
    expect(maskFlagForAudit('THR{secret_admin_payload}')).toBe('THR{s***d}');
    expect(maskFlagForAudit('THR{1234}')).toBe('THR{1***4}');
    expect(maskFlagForAudit('THR{a}')).toBe('THR{***}');
  });
});

describe('CTF Flag Submission Server Action & Scoring Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServiceSelect.mockReturnThis();
    mockServiceEq.mockReturnThis();
  });

  it('rejects unauthenticated submissions', async () => {
    mockGetAuthUser.mockResolvedValue(null);

    const formData = new FormData();
    formData.set('flag', 'THR{test_flag}');

    const res = await submitFlagAction('chal-1', 'web-1', null, formData);
    expect(res.error).toContain('AUTHENTICATION_REQUIRED');
  });

  it('rejects deactivated user accounts', async () => {
    mockGetAuthUser.mockResolvedValue({ id: 'user-banned', email: 'banned@test.local' });
    mockGetAuthProfile.mockResolvedValue({ id: 'user-banned', is_active: false });

    const formData = new FormData();
    formData.set('flag', 'THR{test_flag}');

    const res = await submitFlagAction('chal-1', 'web-1', null, formData);
    expect(res.error).toContain('ACCOUNT_DEACTIVATED');
  });

  it('rejects malformed flag formats with generic guidance', async () => {
    mockGetAuthUser.mockResolvedValue({ id: 'user-1', email: 'op@test.local' });
    mockGetAuthProfile.mockResolvedValue({ id: 'user-1', is_active: true });

    const formData = new FormData();
    formData.set('flag', 'invalid_flag_format');

    const res = await submitFlagAction('chal-1', 'web-1', null, formData);
    expect(res.error).toContain('MALFORMED_FLAG');
  });

  it('records incorrect submissions in audit log and returns generic failure without leaking flag', async () => {
    mockGetAuthUser.mockResolvedValue({ id: 'user-1', email: 'op@test.local' });
    mockGetAuthProfile.mockResolvedValue({ id: 'user-1', is_active: true });

    const correctHash = computeFlagHash('THR{real_solution}');
    mockServiceSingle.mockResolvedValue({
      data: {
        id: 'chal-1',
        title: 'Crypto 101',
        status: 'published',
        points: 250,
        flag_hash: correctHash,
      },
      error: null,
    });

    const formData = new FormData();
    formData.set('flag', 'THR{wrong_guess}');

    const res = await submitFlagAction('chal-1', 'crypto-101', null, formData);
    expect(res.error).toContain('INCORRECT_FLAG');
    expect(mockServiceInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        challenge_id: 'chal-1',
        user_id: 'user-1',
        is_correct: false,
      })
    );
    expect(mockServiceRpc).not.toHaveBeenCalled();
  });

  it('processes correct flag atomically via record_challenge_solve RPC and awards points', async () => {
    mockGetAuthUser.mockResolvedValue({ id: 'user-1', email: 'op@test.local' });
    mockGetAuthProfile.mockResolvedValue({ id: 'user-1', is_active: true });

    const correctFlag = 'THR{master_pwn_exploit_2026}';
    const correctHash = computeFlagHash(correctFlag);

    mockServiceSingle.mockResolvedValue({
      data: {
        id: 'chal-2',
        title: 'Binary 201',
        status: 'published',
        points: 400,
        flag_hash: correctHash,
      },
      error: null,
    });

    mockServiceRpc.mockResolvedValue({
      data: {
        success: true,
        already_solved: false,
        points_awarded: 400,
      },
      error: null,
    });

    const formData = new FormData();
    formData.set('flag', correctFlag);

    const res = await submitFlagAction('chal-2', 'binary-201', null, formData);
    expect(res.success).toBe(true);
    expect(res.alreadySolved).toBe(false);
    expect(res.pointsAwarded).toBe(400);
    expect(res.message).toContain('+400 PTS');

    expect(mockServiceInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        challenge_id: 'chal-2',
        user_id: 'user-1',
        is_correct: true,
      })
    );
    expect(mockServiceRpc).toHaveBeenCalledWith('record_challenge_solve', {
      p_user_id: 'user-1',
      p_challenge_id: 'chal-2',
    });
  });

  it('handles duplicate solves safely: reports already_solved with 0 additional points', async () => {
    mockGetAuthUser.mockResolvedValue({ id: 'user-1', email: 'op@test.local' });
    mockGetAuthProfile.mockResolvedValue({ id: 'user-1', is_active: true });

    const correctFlag = 'THR{master_pwn_exploit_2026}';
    const correctHash = computeFlagHash(correctFlag);

    mockServiceSingle.mockResolvedValue({
      data: {
        id: 'chal-2',
        title: 'Binary 201',
        status: 'published',
        points: 400,
        flag_hash: correctHash,
      },
      error: null,
    });

    mockServiceRpc.mockResolvedValue({
      data: {
        success: true,
        already_solved: true,
        points_awarded: 0,
      },
      error: null,
    });

    const formData = new FormData();
    formData.set('flag', correctFlag);

    const res = await submitFlagAction('chal-2', 'binary-201', null, formData);
    expect(res.success).toBe(true);
    expect(res.alreadySolved).toBe(true);
    expect(res.pointsAwarded).toBe(0);
    expect(res.message).toContain('CHALLENGE_PREVIOUSLY_CAPTURED');
  });
});

describe('Leaderboard Deterministic Sorting & Tie-Breaking Rules', () => {
  type Entry = {
    username: string;
    total_points: number;
    solves_count: number;
    last_solve_at: string | null;
  };

  function sortLeaderboard(entries: Entry[]) {
    return [...entries].sort((a, b) => {
      // 1. Total Points DESC
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points;
      }
      // 2. Solves Count DESC
      if (b.solves_count !== a.solves_count) {
        return b.solves_count - a.solves_count;
      }
      // 3. Earliest Final Solve ASC (nulls last)
      if (a.last_solve_at && b.last_solve_at) {
        const timeDiff = new Date(a.last_solve_at).getTime() - new Date(b.last_solve_at).getTime();
        if (timeDiff !== 0) return timeDiff;
      } else if (a.last_solve_at && !b.last_solve_at) {
        return -1;
      } else if (!a.last_solve_at && b.last_solve_at) {
        return 1;
      }
      // 4. Deterministic Username ASC
      return a.username.localeCompare(b.username);
    });
  }

  it('ranks higher points above lower points', () => {
    const list: Entry[] = [
      { username: 'agent_bob', total_points: 200, solves_count: 2, last_solve_at: '2026-10-01T00:00:00Z' },
      { username: 'agent_alice', total_points: 500, solves_count: 3, last_solve_at: '2026-10-01T00:00:00Z' },
    ];
    const sorted = sortLeaderboard(list);
    expect(sorted[0].username).toBe('agent_alice');
    expect(sorted[1].username).toBe('agent_bob');
  });

  it('breaks point ties with challenge solves count', () => {
    const list: Entry[] = [
      { username: 'agent_few_solves', total_points: 300, solves_count: 1, last_solve_at: '2026-10-01T00:00:00Z' },
      { username: 'agent_many_solves', total_points: 300, solves_count: 3, last_solve_at: '2026-10-01T00:00:00Z' },
    ];
    const sorted = sortLeaderboard(list);
    expect(sorted[0].username).toBe('agent_many_solves');
    expect(sorted[1].username).toBe('agent_few_solves');
  });

  it('breaks point and solves ties with earliest last solve timestamp (first to capture wins)', () => {
    const list: Entry[] = [
      { username: 'agent_later', total_points: 300, solves_count: 2, last_solve_at: '2026-10-01T12:00:00Z' },
      { username: 'agent_earlier', total_points: 300, solves_count: 2, last_solve_at: '2026-10-01T08:00:00Z' },
    ];
    const sorted = sortLeaderboard(list);
    expect(sorted[0].username).toBe('agent_earlier');
    expect(sorted[1].username).toBe('agent_later');
  });

  it('breaks completely identical score ties deterministically by username alphabetical order', () => {
    const list: Entry[] = [
      { username: 'zulu_agent', total_points: 300, solves_count: 2, last_solve_at: '2026-10-01T08:00:00Z' },
      { username: 'alpha_agent', total_points: 300, solves_count: 2, last_solve_at: '2026-10-01T08:00:00Z' },
    ];
    const sorted = sortLeaderboard(list);
    expect(sorted[0].username).toBe('alpha_agent');
    expect(sorted[1].username).toBe('zulu_agent');
  });
});
