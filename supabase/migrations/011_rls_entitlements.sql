-- ============================================================================
-- 011_rls_entitlements.sql
-- Row-Level Security policies for entitlements table
-- ============================================================================

-- Users read only their own
CREATE POLICY "Users can read their own entitlements"
  ON entitlements FOR SELECT
  USING (user_id = auth.uid());

-- Admins read all
CREATE POLICY "Admins can read all entitlements"
  ON entitlements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Service role (provisioning)
CREATE POLICY "Service role can manage entitlements"
  ON entitlements
  USING (auth.role() = 'service_role');
