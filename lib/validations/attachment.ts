import { z } from 'zod';

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_MIME_TYPES = [
  'application/zip',
  'application/x-tar',
  'application/gzip',
  'text/plain',
  'application/octet-stream',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/svg+xml',
];

export const attachmentSchema = z.object({
  fileName: z.string().min(1, 'Filename is required').max(255),
  fileSize: z
    .number()
    .positive('File size must be greater than 0')
    .max(MAX_FILE_SIZE, 'File size cannot exceed 50MB'),
  mimeType: z
    .string()
    .refine((val) => ALLOWED_MIME_TYPES.includes(val) || val.startsWith('image/'), {
      message: 'File type is not supported',
    }),
});

export type AttachmentInput = z.infer<typeof attachmentSchema>;
