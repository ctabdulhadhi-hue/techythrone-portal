-- =============================================================================
-- Migration 00002: RLS Policies, Functions & Escalation Triggers
-- Cybersecurity Challenge Portal
-- =============================================================================

-- =============================================================================
-- 1. DATABASE PRIVILEGES & COLUMN-LEVEL GRANTS
-- =============================================================================
-- Revoke full table-level update grants from public and authenticated roles
REVOKE UPDATE ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM anon;

-- Grant selective UPDATE permissions ONLY on user-editable column: display_name
GRANT UPDATE (display_name) ON public.profiles TO authenticated;

-- Service role retains full administrative privileges
GRANT ALL ON public.profiles TO service_role;

-- =============================================================================
-- 2. HELPER FUNCTIONS (SECURITY DEFINER with Fixed search_path)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = '';

CREATE OR REPLACE FUNCTION public.is_verified_active_user()
RETURNS BOOLEAN AS $$
DECLARE
    v_email_confirmed TIMESTAMPTZ;
    v_is_active BOOLEAN;
BEGIN
    SELECT email_confirmed_at INTO v_email_confirmed
    FROM auth.users
    WHERE id = auth.uid();

    IF v_email_confirmed IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT is_active INTO v_is_active
    FROM public.profiles
    WHERE id = auth.uid();

    RETURN COALESCE(v_is_active, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = '';

-- =============================================================================
-- 3. TRIGGERS & TIMESTAMP MAINTENANCE
-- =============================================================================

-- Trigger Function: Auto-sync on auth.users registration (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_base_username TEXT;
    v_final_username TEXT;
    v_counter INTEGER := 0;
BEGIN
    v_base_username := pg_catalog.lower(
        pg_catalog.regexp_replace(
            pg_catalog.split_part(NEW.email, '@', 1),
            '[^a-zA-Z0-9_]',
            '',
            'g'
        )
    );
    IF pg_catalog.length(v_base_username) < 3 THEN
        v_base_username := 'user_' || pg_catalog.substring(NEW.id::text, 1, 6);
    END IF;
    
    v_final_username := v_base_username;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_final_username) LOOP
        v_counter := v_counter + 1;
        v_final_username := v_base_username || v_counter;
    END LOOP;

    INSERT INTO public.profiles (id, email, username, display_name, role, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        v_final_username,
        COALESCE(NEW.raw_user_meta_data->>'display_name', v_final_username),
        'user',
        true
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger Function: Strict Privilege Escalation Guard (SECURITY INVOKER)
-- CRITICAL: Executes under SECURITY INVOKER to accurately inspect CURRENT_USER role.
CREATE OR REPLACE FUNCTION public.guard_profile_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Trusted database kernel role check:
    -- Administrative updates to role/is_active must execute via server-only service_role client.
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
    -- Explicitly guard updated_at against caller manipulation
    IF NEW.updated_at IS DISTINCT FROM OLD.updated_at THEN
        RAISE EXCEPTION 'Privilege Violation: updated_at cannot be modified by direct caller sessions.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER
SET search_path = '';

-- Named trg_01_ to fire FIRST alphabetically before trg_02_
DROP TRIGGER IF EXISTS trg_01_guard_profile_escalation ON public.profiles;
CREATE TRIGGER trg_01_guard_profile_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.guard_profile_escalation();

-- Trigger Function: Timestamp maintenance (SECURITY DEFINER)
-- Uses pg_catalog.now() to ensure true UTC instant without session timezone shift.
CREATE OR REPLACE FUNCTION public.update_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = pg_catalog.now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Named trg_02_ to fire SECOND alphabetically after trg_01_
DROP TRIGGER IF EXISTS trg_02_update_profiles_timestamp ON public.profiles;
CREATE TRIGGER trg_02_update_profiles_timestamp
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_profiles_timestamp();

CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = pg_catalog.now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

DROP TRIGGER IF EXISTS update_challenges_timestamp ON public.challenges;
CREATE TRIGGER update_challenges_timestamp
    BEFORE UPDATE ON public.challenges
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_attachments_timestamp ON public.challenge_attachments;
CREATE TRIGGER update_attachments_timestamp
    BEFORE UPDATE ON public.challenge_attachments
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- =============================================================================
-- 4. FUNCTION EXECUTE PERMISSIONS
-- =============================================================================
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_verified_active_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.guard_profile_escalation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_profiles_timestamp() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_timestamp() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.guard_profile_escalation() TO postgres, service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.update_profiles_timestamp() TO postgres, service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.update_timestamp() TO postgres, service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_verified_active_user() TO authenticated, service_role;

-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_solves ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    id = auth.uid() OR public.is_admin() = true
);

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    id = auth.uid() OR public.is_admin() = true
)
WITH CHECK (
    id = auth.uid() OR public.is_admin() = true
);

-- Challenges Policies
DROP POLICY IF EXISTS "challenges_select_policy" ON public.challenges;
CREATE POLICY "challenges_select_policy"
ON public.challenges
FOR SELECT
TO authenticated
USING (
    (status = 'published' AND public.is_verified_active_user() = true)
    OR
    public.is_admin() = true
);

DROP POLICY IF EXISTS "challenges_insert_policy" ON public.challenges;
CREATE POLICY "challenges_insert_policy"
ON public.challenges
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() = true);

DROP POLICY IF EXISTS "challenges_update_policy" ON public.challenges;
CREATE POLICY "challenges_update_policy"
ON public.challenges
FOR UPDATE
TO authenticated
USING (public.is_admin() = true)
WITH CHECK (public.is_admin() = true);

DROP POLICY IF EXISTS "challenges_delete_policy" ON public.challenges;
CREATE POLICY "challenges_delete_policy"
ON public.challenges
FOR DELETE
TO authenticated
USING (public.is_admin() = true);

-- Attachments Policies
DROP POLICY IF EXISTS "attachments_select_policy" ON public.challenge_attachments;
CREATE POLICY "attachments_select_policy"
ON public.challenge_attachments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.challenges c
        WHERE c.id = challenge_attachments.challenge_id
          AND c.status = 'published'
          AND public.is_verified_active_user() = true
    )
    OR
    public.is_admin() = true
);

DROP POLICY IF EXISTS "attachments_insert_policy" ON public.challenge_attachments;
CREATE POLICY "attachments_insert_policy"
ON public.challenge_attachments
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() = true);

DROP POLICY IF EXISTS "attachments_update_policy" ON public.challenge_attachments;
CREATE POLICY "attachments_update_policy"
ON public.challenge_attachments
FOR UPDATE
TO authenticated
USING (public.is_admin() = true)
WITH CHECK (public.is_admin() = true);

DROP POLICY IF EXISTS "attachments_delete_policy" ON public.challenge_attachments;
CREATE POLICY "attachments_delete_policy"
ON public.challenge_attachments
FOR DELETE
TO authenticated
USING (public.is_admin() = true);

-- Solves Policies (Phase 2 Forward Compatibility)
DROP POLICY IF EXISTS "solves_select_policy" ON public.challenge_solves;
CREATE POLICY "solves_select_policy"
ON public.challenge_solves
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR public.is_admin() = true
);

DROP POLICY IF EXISTS "solves_insert_policy" ON public.challenge_solves;
CREATE POLICY "solves_insert_policy"
ON public.challenge_solves
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() AND public.is_verified_active_user() = true
);
