-- ============================================================================
-- 010_rls_bundle_tables.sql
-- Row-Level Security policies for bundle_revisions and bundle_revision_courses
-- ============================================================================

-- ============================================================================
-- Bundle Revisions RLS (Admin-only)
-- ============================================================================
CREATE POLICY "Service role can manage bundle revisions"
  ON bundle_revisions
  USING (auth.role() = 'service_role');

-- ============================================================================
-- Bundle Revision Courses RLS (Admin-only)
-- ============================================================================
CREATE POLICY "Service role can manage bundle revision courses"
  ON bundle_revision_courses
  USING (auth.role() = 'service_role');
