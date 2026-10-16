import { describe, it, expect } from 'vitest';
import { signUpSchema, signInSchema } from '@/lib/validations/auth';
import { challengeSchema } from '@/lib/validations/challenge';
import { attachmentSchema, MAX_FILE_SIZE } from '@/lib/validations/attachment';
import { updateDisplayNameSchema, adminUpdateProfileSchema } from '@/lib/validations/profile';

describe('Authentication Validation Schemas', () => {
  describe('signUpSchema', () => {
    it('accepts valid signup inputs', () => {
      const valid = {
        email: 'hacker@example.com',
        password: 'Password123!',
        displayName: 'CyberNinja',
      };
      const result = signUpSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects passwords without uppercase letters', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        password: 'password123!',
        displayName: 'User',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase letter');
      }
    });

    it('rejects passwords without numbers', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        password: 'Password!',
        displayName: 'User',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least one number');
      }
    });

    it('rejects passwords without special characters', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        password: 'Password123',
        displayName: 'User',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('special character');
      }
    });

    it('rejects invalid email formats', () => {
      const result = signUpSchema.safeParse({
        email: 'invalid-email',
        password: 'Password123!',
        displayName: 'User',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('signInSchema', () => {
    it('validates correct sign-in inputs', () => {
      const result = signInSchema.safeParse({
        email: 'admin@techythrone.internal',
        password: 'AnyPassword123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty password', () => {
      const result = signInSchema.safeParse({
        email: 'admin@techythrone.internal',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Challenge Validation Schemas', () => {
  it('validates a complete challenge object', () => {
    const valid = {
      title: 'SQL Injection 101',
      slug: 'sql-injection-101',
      description: 'Find the vulnerability in the user login query parameter.',
      category: 'web',
      difficulty: 'easy',
      points: 100,
      status: 'draft',
    };
    const result = challengeSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects uppercase or non-kebab-case slugs', () => {
    const invalidSlugs = ['SQL-Injection', 'sql_injection', 'sql injection', 'sql--injection'];
    for (const slug of invalidSlugs) {
      const result = challengeSchema.safeParse({
        title: 'Test Challenge',
        slug,
        description: 'A challenge description for testing.',
        category: 'web',
        difficulty: 'medium',
        points: 200,
      });
      expect(result.success).toBe(false);
    }
  });

  it('rejects negative points', () => {
    const result = challengeSchema.safeParse({
      title: 'Valid Title',
      slug: 'valid-slug',
      description: 'Long enough description text here.',
      category: 'crypto',
      difficulty: 'hard',
      points: -50,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid category or difficulty', () => {
    const result = challengeSchema.safeParse({
      title: 'Valid Title',
      slug: 'valid-slug',
      description: 'Long enough description text here.',
      category: 'invalid_cat',
      difficulty: 'expert',
      points: 500,
    });
    expect(result.success).toBe(false);
  });
});

describe('Attachment Validation Schemas', () => {
  it('accepts zip file within allowed size limits', () => {
    const result = attachmentSchema.safeParse({
      fileName: 'source_code.zip',
      fileSize: 10 * 1024 * 1024,
      mimeType: 'application/zip',
    });
    expect(result.success).toBe(true);
  });

  it('rejects files exceeding 50MB limit', () => {
    const result = attachmentSchema.safeParse({
      fileName: 'huge_dump.zip',
      fileSize: MAX_FILE_SIZE + 1,
      mimeType: 'application/zip',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unsupported mime types', () => {
    const result = attachmentSchema.safeParse({
      fileName: 'malicious.exe',
      fileSize: 1024,
      mimeType: 'application/x-msdownload',
    });
    expect(result.success).toBe(false);
  });
});

describe('Profile Validation Schemas', () => {
  it('accepts valid display name update', () => {
    const result = updateDisplayNameSchema.safeParse({
      displayName: 'SecOps_Lead',
    });
    expect(result.success).toBe(true);
  });

  it('rejects display name that is too short', () => {
    const result = updateDisplayNameSchema.safeParse({
      displayName: 'a',
    });
    expect(result.success).toBe(false);
  });

  it('validates admin update profile input with valid UUID', () => {
    const result = adminUpdateProfileSchema.safeParse({
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
      role: 'admin',
      isActive: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID targetUserId in admin profile update', () => {
    const result = adminUpdateProfileSchema.safeParse({
      targetUserId: 'not-a-valid-uuid',
      role: 'user',
    });
    expect(result.success).toBe(false);
  });
});
