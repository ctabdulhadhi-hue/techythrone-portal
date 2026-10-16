import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server-only
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const mockGetUser = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn(() => ({
      update: mockUpdate.mockReturnValue({
        eq: mockEq,
      }),
    })),
  })),
}));

import { updateDisplayNameAction } from '@/actions/user/profile';

describe('Profile Immutability and Privilege Escalation Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permits display_name updates for authenticated caller', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'operative@techythrone.ctf' } },
      error: null,
    });
    mockEq.mockResolvedValue({ data: null, error: null });

    const formData = new FormData();
    formData.append('displayName', 'CyberFalcon');

    const result = await updateDisplayNameAction(null, formData);
    expect(result.success).toBe(true);

    // Verify only display_name was passed to update (not role, not is_active, not email, not id)
    expect(mockUpdate).toHaveBeenCalledWith({
      display_name: 'CyberFalcon',
    });
    expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
  });

  it('rejects update if user attempts to supply forged form payload', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'operative@techythrone.ctf' } },
      error: null,
    });
    mockEq.mockResolvedValue({ data: null, error: null });

    const formData = new FormData();
    formData.append('displayName', 'Hacker');
    formData.append('role', 'admin'); // Malicious field injection attempt
    formData.append('is_active', 'true');

    const result = await updateDisplayNameAction(null, formData);
    expect(result.success).toBe(true);

    // The Server Action MUST strictly isolate and only update display_name
    expect(mockUpdate).toHaveBeenCalledWith({
      display_name: 'Hacker',
    });
    expect(mockUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ role: 'admin' })
    );
  });
});
