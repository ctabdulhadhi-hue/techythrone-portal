import { z } from 'zod';

export const challengeDifficultyEnum = z.enum(['easy', 'medium', 'hard', 'insane']);
export const challengeCategoryEnum = z.enum([
  'web',
  'crypto',
  'reverse',
  'forensics',
  'pwn',
  'osint',
  'misc',
]);
export const challengeStatusEnum = z.enum(['draft', 'published', 'archived']);

export const challengeSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title cannot exceed 150 characters')
    .trim(),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(180, 'Slug cannot exceed 180 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens (kebab-case)'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters (supports Markdown)'),
  category: challengeCategoryEnum,
  difficulty: challengeDifficultyEnum,
  points: z
    .number()
    .int('Points must be an integer')
    .min(0, 'Points cannot be negative')
    .max(5000, 'Points cannot exceed 5000'),
  flag: z.string().optional().nullable(),
  flag_hash: z.string().optional().nullable(),
  status: challengeStatusEnum.default('draft'),
});

export type ChallengeInput = z.infer<typeof challengeSchema>;
