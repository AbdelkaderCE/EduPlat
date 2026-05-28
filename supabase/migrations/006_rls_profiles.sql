-- ============================================================================
-- 006_rls_profiles.sql
-- Row-Level Security policies for profiles table
-- ============================================================================

-- Self-read
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Admin read all
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Self-update
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin update
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Service role insert (via Edge Functions)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
