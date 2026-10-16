-- =============================================================================
-- Migration 00003: Storage Buckets & Restrictive Policies
-- Cybersecurity Challenge Portal
-- =============================================================================

-- 1. Create Private Storage Bucket 'challenge-files'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'challenge-files',
    'challenge-files',
    false, -- Strictly Private
    52428800, -- 50 MB limit
    ARRAY[
        'application/zip',
        'application/x-tar',
        'application/gzip',
        'text/plain',
        'application/octet-stream',
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/svg+xml'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 52428800,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Restrictive Storage Policies on storage.objects
-- Regular users have ZERO direct SELECT or download access to challenge-files.
-- Downloads MUST proceed through the server-side 5-factor verified route handler.

DROP POLICY IF EXISTS "Admin only read on challenge-files" ON storage.objects;
CREATE POLICY "Admin only read on challenge-files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'challenge-files' AND public.is_admin() = true
);

DROP POLICY IF EXISTS "Admin upload objects in challenge-files" ON storage.objects;
CREATE POLICY "Admin upload objects in challenge-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'challenge-files' AND public.is_admin() = true
);

DROP POLICY IF EXISTS "Admin update objects in challenge-files" ON storage.objects;
CREATE POLICY "Admin update objects in challenge-files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'challenge-files' AND public.is_admin() = true
)
WITH CHECK (
    bucket_id = 'challenge-files' AND public.is_admin() = true
);

DROP POLICY IF EXISTS "Admin delete objects in challenge-files" ON storage.objects;
CREATE POLICY "Admin delete objects in challenge-files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'challenge-files' AND public.is_admin() = true
);
