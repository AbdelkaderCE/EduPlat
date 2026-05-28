-- ============================================================================
-- 007_rls_courses.sql
-- Row-Level Security policies for courses table
-- ============================================================================

-- Published courses accessible only to entitled users
CREATE POLICY "Users can read published courses they have access to"
  ON courses FOR SELECT
  USING (
    is_published = TRUE
    AND (
      -- Direct course entitlement
      EXISTS (
        SELECT 1 FROM entitlements
        WHERE user_id = auth.uid()
          AND entitlement_type = 'course'
          AND course_id = courses.id
          AND revoked_at IS NULL
      )
      -- Dynamic bundle entitlement
      OR EXISTS (
        SELECT 1
        FROM entitlements e
        INNER JOIN bundle_revisions br ON br.bundle_id = e.bundle_id
        INNER JOIN bundle_revision_courses brc ON brc.revision_id = br.id
        WHERE e.user_id = auth.uid()
          AND e.entitlement_type = 'bundle'
          AND e.bundle_access_model = 'dynamic'
          AND e.revoked_at IS NULL
          AND br.status = 'published'
          AND brc.course_id = courses.id
      )
      -- Static bundle entitlement
      OR EXISTS (
        SELECT 1
        FROM entitlements e
        INNER JOIN bundle_revision_courses brc ON brc.revision_id = e.bundle_revision_id
        WHERE e.user_id = auth.uid()
          AND e.entitlement_type = 'bundle'
          AND e.bundle_access_model = 'static'
          AND e.revoked_at IS NULL
          AND brc.course_id = courses.id
      )
    )
  );

-- Admins can see all published courses
CREATE POLICY "Admins can read all published courses"
  ON courses FOR SELECT
  USING (
    is_published = TRUE
    AND EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Service role (admin panel)
CREATE POLICY "Service role can read all courses"
  ON courses FOR SELECT
  USING (auth.role() = 'service_role');

-- Admin write
CREATE POLICY "Admins can insert and update courses"
  ON courses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update courses"
  ON courses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
