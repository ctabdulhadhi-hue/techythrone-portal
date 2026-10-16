import { z } from 'zod';

export const updateDisplayNameSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(100, 'Display name cannot exceed 100 characters')
    .trim(),
});

export const adminUpdateProfileSchema = z.object({
  targetUserId: z.string().uuid('Invalid user ID'),
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateDisplayNameInput = z.infer<typeof updateDisplayNameSchema>;
export type AdminUpdateProfileInput = z.infer<typeof adminUpdateProfileSchema>;
