-- ============================================================================
-- 008_rls_lessons.sql
-- Row-Level Security policies for lessons table
-- ============================================================================

-- Published lessons accessible only to entitled users (via parent course)
CREATE POLICY "Users can read published lessons they have access to"
  ON lessons FOR SELECT
  USING (
    is_published = TRUE
    AND has_course_access(auth.uid(), course_id)
  );

-- Admins can see all published lessons
CREATE POLICY "Admins can read all published lessons"
  ON lessons FOR SELECT
  USING (
    is_published = TRUE
    AND EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Service role
CREATE POLICY "Service role can read all lessons"
  ON lessons FOR SELECT
  USING (auth.role() = 'service_role');

-- Admin write
CREATE POLICY "Admins can manage lessons"
  ON lessons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update lessons"
  ON lessons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
