-- ============================================================================
-- 009_rls_bundles.sql
-- Row-Level Security policies for bundles table
-- ============================================================================

-- Published bundles visible to all authenticated users (product marketing)
CREATE POLICY "Authenticated users can read published bundles"
  ON bundles FOR SELECT
  USING (is_published = TRUE);

-- Service role
CREATE POLICY "Service role can read all bundles"
  ON bundles FOR SELECT
  USING (auth.role() = 'service_role');

-- Admin write
CREATE POLICY "Admins can manage bundles"
  ON bundles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update bundles"
  ON bundles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
