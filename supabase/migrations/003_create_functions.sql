-- ============================================================================
-- 003_create_functions.sql
-- Core access control functions
-- ============================================================================

-- ============================================================================
-- 3.1 has_course_access Function (SECURITY DEFINER)
-- ============================================================================
CREATE OR REPLACE FUNCTION has_course_access(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_access BOOLEAN;
BEGIN
  -- Return false immediately if no user
  IF p_user_id IS NULL OR p_course_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check 1: Direct course entitlement
  SELECT EXISTS (
    SELECT 1
    FROM entitlements
    WHERE user_id = p_user_id
      AND entitlement_type = 'course'
      AND course_id = p_course_id
      AND revoked_at IS NULL
  ) INTO v_has_access;

  IF v_has_access THEN
    RETURN TRUE;
  END IF;

  -- Check 2: Bundle entitlements (dynamic)
  SELECT EXISTS (
    SELECT 1
    FROM entitlements e
    INNER JOIN bundle_revisions br ON br.bundle_id = e.bundle_id
    INNER JOIN bundle_revision_courses brc ON brc.revision_id = br.id
    WHERE e.user_id = p_user_id
      AND e.entitlement_type = 'bundle'
      AND e.bundle_access_model = 'dynamic'
      AND e.revoked_at IS NULL
      AND br.status = 'published'
      AND brc.course_id = p_course_id
  ) INTO v_has_access;

  IF v_has_access THEN
    RETURN TRUE;
  END IF;

  -- Check 3: Bundle entitlements (static, pinned to revision)
  SELECT EXISTS (
    SELECT 1
    FROM entitlements e
    INNER JOIN bundle_revision_courses brc ON brc.revision_id = e.bundle_revision_id
    WHERE e.user_id = p_user_id
      AND e.entitlement_type = 'bundle'
      AND e.bundle_access_model = 'static'
      AND e.revoked_at IS NULL
      AND brc.course_id = p_course_id
  ) INTO v_has_access;

  RETURN v_has_access;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION has_course_access(UUID, UUID) TO authenticated;

-- ============================================================================
-- 3.2 Helper: get_lesson_course_id (for RLS policy use)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_lesson_course_id(p_lesson_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT course_id FROM lessons WHERE id = p_lesson_id LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_lesson_course_id(UUID) TO authenticated;
