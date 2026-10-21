-- =============================================================================
-- Migration 00004: Application-Level Email Verification for Private Downloads
-- Cybersecurity Challenge Portal
-- =============================================================================

-- 1. Add download_verified_at column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS download_verified_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_download_verified_at
ON public.profiles(download_verified_at);

-- 2. Create download_verification_tokens table (Single-use, Expiring, Hash-only)
CREATE TABLE IF NOT EXISTS public.download_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT pg_catalog.now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dvt_user_id ON public.download_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_dvt_token_hash ON public.download_verification_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_dvt_expires_at ON public.download_verification_tokens(expires_at);

-- 3. Restrictive Database Grants & RLS
ALTER TABLE public.download_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Revoke all direct client access (tokens can ONLY be managed server-side via service_role)
REVOKE ALL ON public.download_verification_tokens FROM public, anon, authenticated;
GRANT ALL ON public.download_verification_tokens TO postgres, service_role;

-- Revoke update on download_verified_at from direct client sessions
REVOKE UPDATE (download_verified_at) ON public.profiles FROM authenticated, anon;

-- 4. Update Profile Escalation Guard Trigger Function
CREATE OR REPLACE FUNCTION public.guard_profile_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Trusted database kernel role check:
    -- Administrative updates to role/is_active/download_verified_at must execute via server-only service_role client.
    IF CURRENT_USER IN ('postgres', 'service_role') THEN
        RETURN NEW;
    END IF;

    -- 2. Direct client sessions (running as 'authenticated' or 'anon'):
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Privilege Violation: role is immutable to regular users and direct client sessions.';
    END IF;
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
        RAISE EXCEPTION 'Privilege Violation: is_active status is immutable to regular users and direct client sessions.';
    END IF;
    IF NEW.download_verified_at IS DISTINCT FROM OLD.download_verified_at THEN
        RAISE EXCEPTION 'Privilege Violation: download_verified_at is immutable to direct client sessions.';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
        RAISE EXCEPTION 'Privilege Violation: email must be updated via auth provider.';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id THEN
        RAISE EXCEPTION 'Privilege Violation: id cannot be modified.';
    END IF;
    IF NEW.username IS DISTINCT FROM OLD.username THEN
        RAISE EXCEPTION 'Privilege Violation: username cannot be modified.';
    END IF;
    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Privilege Violation: created_at cannot be modified.';
    END IF;
    IF NEW.updated_at IS DISTINCT FROM OLD.updated_at THEN
        RAISE EXCEPTION 'Privilege Violation: updated_at cannot be modified by direct caller sessions.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER
SET search_path = '';

-- 5. Helper Functions
CREATE OR REPLACE FUNCTION public.is_download_authorized()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND is_active = true
          AND download_verified_at IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = '';

GRANT EXECUTE ON FUNCTION public.is_download_authorized() TO authenticated, service_role;

-- Backwards-compatible is_verified_active_user() prioritizing download_verified_at with auth.users fallback
CREATE OR REPLACE FUNCTION public.is_verified_active_user()
RETURNS BOOLEAN AS $$
DECLARE
    v_download_verified TIMESTAMPTZ;
    v_is_active BOOLEAN;
    v_email_confirmed TIMESTAMPTZ;
BEGIN
    SELECT download_verified_at, is_active
    INTO v_download_verified, v_is_active
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_download_verified IS NOT NULL AND COALESCE(v_is_active, FALSE) = TRUE THEN
        RETURN TRUE;
    END IF;

    -- Fallback to Supabase auth.users confirmation during phased transition
    SELECT email_confirmed_at INTO v_email_confirmed
    FROM auth.users
    WHERE id = auth.uid();

    RETURN (v_email_confirmed IS NOT NULL AND COALESCE(v_is_active, FALSE) = TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = '';

GRANT EXECUTE ON FUNCTION public.is_verified_active_user() TO authenticated, service_role;
