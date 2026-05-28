-- ============================================================================
-- 012_rls_orders_and_audit.sql
-- Row-Level Security policies for orders and access_audit tables
-- ============================================================================

-- ============================================================================
-- Orders RLS (Admin-only)
-- ============================================================================
CREATE POLICY "Only service role can manage orders"
  ON orders
  USING (auth.role() = 'service_role');

-- ============================================================================
-- Access Audit RLS (Admin-only)
-- ============================================================================

-- Admins read all
CREATE POLICY "Admins can read access audit logs"
  ON access_audit FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Service role insert
CREATE POLICY "Service role can insert audit logs"
  ON access_audit FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
