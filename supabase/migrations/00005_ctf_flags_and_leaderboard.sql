-- =============================================================================
-- Migration 00005: CTF Flag Submission, Atomic Scoring & Leaderboard
-- Cybersecurity Challenge Portal
-- =============================================================================

-- 1. Create Challenge Submissions Table (Audit log for flag attempts)
CREATE TABLE IF NOT EXISTS public.challenge_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submitted_flag_preview TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT pg_catalog.now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.challenge_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_challenge_id ON public.challenge_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.challenge_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_submissions_rate_limit ON public.challenge_submissions(user_id, challenge_id, created_at);

-- 2. Ensure RLS on Submissions and Secure Policies
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.challenge_submissions FROM public, anon;
GRANT SELECT, INSERT ON public.challenge_submissions TO authenticated;
GRANT ALL ON public.challenge_submissions TO postgres, service_role;

DROP POLICY IF EXISTS "submissions_select_policy" ON public.challenge_submissions;
CREATE POLICY "submissions_select_policy"
ON public.challenge_submissions
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR public.is_admin() = true
);

DROP POLICY IF EXISTS "submissions_insert_policy" ON public.challenge_submissions;
CREATE POLICY "submissions_insert_policy"
ON public.challenge_submissions
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
);

-- 3. Column-Level Privilege Hardening on flag_hash
-- Ensure regular authenticated and anon clients cannot read flag digests
REVOKE SELECT (flag_hash) ON public.challenges FROM public, anon, authenticated;
GRANT SELECT (flag_hash) ON public.challenges TO postgres, service_role;

-- 4. Atomic Solve Recording & Scoring Function (Race-Safe)
CREATE OR REPLACE FUNCTION public.record_challenge_solve(
    p_user_id UUID,
    p_challenge_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_points INTEGER;
    v_status public.challenge_status;
    v_existing_solve_id UUID;
    v_solve_id UUID;
    v_is_active BOOLEAN;
BEGIN
    -- 1. Verify user profile exists and is active
    SELECT is_active INTO v_is_active
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
    END IF;

    IF COALESCE(v_is_active, false) = false THEN
        RETURN jsonb_build_object('success', false, 'error', 'Account is deactivated');
    END IF;

    -- 2. Verify challenge exists and is published
    SELECT points, status INTO v_points, v_status
    FROM public.challenges
    WHERE id = p_challenge_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Challenge not found');
    END IF;

    IF v_status != 'published' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Challenge is not currently published');
    END IF;

    -- 3. Check if already solved (idempotent / prevent duplicate points)
    SELECT id INTO v_existing_solve_id
    FROM public.challenge_solves
    WHERE user_id = p_user_id AND challenge_id = p_challenge_id;

    IF v_existing_solve_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_solved', true,
            'points_awarded', 0,
            'message', 'Challenge was already solved previously'
        );
    END IF;

    -- 4. Atomic insert with ON CONFLICT DO NOTHING to handle concurrent submissions safely
    INSERT INTO public.challenge_solves (challenge_id, user_id, points_awarded, solved_at)
    VALUES (p_challenge_id, p_user_id, v_points, pg_catalog.now())
    ON CONFLICT (challenge_id, user_id) DO NOTHING
    RETURNING id INTO v_solve_id;

    IF v_solve_id IS NULL THEN
        -- Another concurrent transaction completed the insert first
        RETURN jsonb_build_object(
            'success', true,
            'already_solved', true,
            'points_awarded', 0,
            'message', 'Challenge was already solved previously'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'already_solved', false,
        'points_awarded', v_points,
        'message', 'Flag accepted! Challenge successfully captured.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

REVOKE ALL ON FUNCTION public.record_challenge_solve(UUID, UUID) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_challenge_solve(UUID, UUID) TO postgres, service_role;

-- 5. Leaderboard View with Deterministic Ranking & Tie-Breaking
-- Order: Points DESC -> Solves Count DESC -> Earliest Final Solve ASC -> Username ASC
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
    ROW_NUMBER() OVER (
        ORDER BY
            COALESCE(SUM(s.points_awarded), 0) DESC,
            COUNT(s.id) DESC,
            MAX(s.solved_at) ASC NULLS LAST,
            p.username ASC
    )::INTEGER AS rank,
    p.id AS user_id,
    p.username,
    p.display_name,
    COALESCE(SUM(s.points_awarded), 0)::INTEGER AS total_points,
    COUNT(s.id)::INTEGER AS solves_count,
    MAX(s.solved_at) AS last_solve_at
FROM public.profiles p
LEFT JOIN public.challenge_solves s ON p.id = s.user_id
WHERE p.is_active = true AND p.role = 'user'
GROUP BY p.id, p.username, p.display_name;

GRANT SELECT ON public.leaderboard TO anon, authenticated, postgres, service_role;

-- 6. RPC: Fetch Paginated Leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.leaderboard AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.leaderboard
    LIMIT LEAST(p_limit, 100)
    OFFSET GREATEST(p_offset, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = '';

GRANT EXECUTE ON FUNCTION public.get_leaderboard(INTEGER, INTEGER) TO anon, authenticated, postgres, service_role;

-- 7. RPC: Fetch Specific User's Leaderboard Rank & Summary
CREATE OR REPLACE FUNCTION public.get_user_leaderboard_rank(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_record RECORD;
BEGIN
    SELECT rank, total_points, solves_count, last_solve_at
    INTO v_record
    FROM public.leaderboard
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('rank', null, 'total_points', 0, 'solves_count', 0);
    END IF;

    RETURN jsonb_build_object(
        'rank', v_record.rank,
        'total_points', v_record.total_points,
        'solves_count', v_record.solves_count,
        'last_solve_at', v_record.last_solve_at
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = '';

GRANT EXECUTE ON FUNCTION public.get_user_leaderboard_rank(UUID) TO authenticated, service_role;
