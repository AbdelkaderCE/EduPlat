-- ============================================================================
-- 004_create_rpc_functions.sql
-- RPC functions for provisioning and admin workflows
-- ============================================================================

-- ============================================================================
-- 4.1 Provision Entitlement and Audit (Atomic Transaction)
-- ============================================================================
CREATE OR REPLACE FUNCTION provision_entitlement_and_audit(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_entitlement_type TEXT,
  p_course_id UUID DEFAULT NULL,
  p_bundle_id UUID DEFAULT NULL,
  p_bundle_access_model TEXT DEFAULT NULL,
  p_bundle_revision_id UUID DEFAULT NULL,
  p_order_id UUID,
  p_granted_by UUID,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  entitlement_id UUID,
  error_message TEXT
)
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entitlement_id UUID;
  v_error TEXT;
BEGIN
  -- Step 1: Insert profile (if not exists)
  INSERT INTO profiles (user_id, full_name, email, role, status)
  VALUES (p_user_id, p_full_name, p_email, 'student', 'invited')
  ON CONFLICT (user_id) DO NOTHING;

  -- Step 2: Validate entitlement inputs
  IF p_entitlement_type NOT IN ('course', 'bundle') THEN
    v_error := 'Invalid entitlement_type: ' || COALESCE(p_entitlement_type, 'NULL');
    RETURN QUERY SELECT FALSE, NULL::UUID, v_error;
    RETURN;
  END IF;

  IF p_entitlement_type = 'course' AND p_course_id IS NULL THEN
    v_error := 'course_id required for course entitlements';
    RETURN QUERY SELECT FALSE, NULL::UUID, v_error;
    RETURN;
  END IF;

  IF p_entitlement_type = 'bundle' THEN
    IF p_bundle_id IS NULL THEN
      v_error := 'bundle_id required for bundle entitlements';
      RETURN QUERY SELECT FALSE, NULL::UUID, v_error;
      RETURN;
    END IF;

    IF p_bundle_access_model NOT IN ('dynamic', 'static') THEN
      v_error := 'Invalid bundle_access_model: ' || COALESCE(p_bundle_access_model, 'NULL');
      RETURN QUERY SELECT FALSE, NULL::UUID, v_error;
      RETURN;
    END IF;

    IF p_bundle_access_model = 'static' AND p_bundle_revision_id IS NULL THEN
      v_error := 'bundle_revision_id required for static bundles';
      RETURN QUERY SELECT FALSE, NULL::UUID, v_error;
      RETURN;
    END IF;
  END IF;

  -- Step 3: Insert entitlement
  INSERT INTO entitlements (
    user_id,
    entitlement_type,
    course_id,
    bundle_id,
    bundle_access_model,
    bundle_revision_id,
    source_order_id,
    granted_by,
    granted_at
  )
  VALUES (
    p_user_id,
    p_entitlement_type,
    p_course_id,
    p_bundle_id,
    p_bundle_access_model,
    p_bundle_revision_id,
    p_order_id,
    p_granted_by,
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_entitlement_id;

  -- Step 4: Insert audit log
  INSERT INTO access_audit (
    actor_user_id,
    target_user_id,
    action_type,
    resource_type,
    resource_id,
    payload,
    ip_address,
    user_agent
  )
  VALUES (
    p_granted_by,
    p_user_id,
    'entitlement_granted',
    p_entitlement_type,
    COALESCE(p_course_id, p_bundle_id),
    jsonb_build_object(
      'entitlement_id', v_entitlement_id,
      'order_id', p_order_id,
      'bundle_access_model', p_bundle_access_model,
      'bundle_revision_id', p_bundle_revision_id
    ),
    p_ip_address,
    p_user_agent
  );

  RETURN QUERY SELECT TRUE, v_entitlement_id, NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  v_error := 'Database error: ' || SQLERRM;
  RETURN QUERY SELECT FALSE, NULL::UUID, v_error;
END;
$$;

-- Grant execute to service role only
GRANT EXECUTE ON FUNCTION provision_entitlement_and_audit(
  UUID, TEXT, TEXT, TEXT, UUID, UUID, TEXT, UUID, UUID, UUID, INET, TEXT
) TO service_role;
