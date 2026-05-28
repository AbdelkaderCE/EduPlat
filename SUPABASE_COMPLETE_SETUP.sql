-- ============================================================================
-- ScholarStream Complete Database Setup
-- Paste this entire script into Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. Initialize Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. Create All Tables
-- ============================================================================

-- Profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin', 'support')),
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'suspended', 'deleted')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_status ON profiles(status);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_path TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_is_published ON courses(is_published);

-- Lessons
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  lesson_order INT NOT NULL,
  cloudflare_asset_id TEXT UNIQUE NOT NULL,
  cloudflare_uid TEXT UNIQUE,
  video_provider TEXT DEFAULT 'cloudflare_stream',
  duration_seconds INT,
  is_preview BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (course_id, slug)
);

CREATE INDEX idx_lessons_course_id ON lessons(course_id);
CREATE INDEX idx_lessons_is_published ON lessons(is_published);
CREATE INDEX idx_lessons_cloudflare_asset_id ON lessons(cloudflare_asset_id);

-- Bundles
CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_path TEXT,
  access_model TEXT DEFAULT 'dynamic' CHECK (access_model IN ('dynamic', 'static')),
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bundles_slug ON bundles(slug);
CREATE INDEX idx_bundles_is_published ON bundles(is_published);
CREATE INDEX idx_bundles_access_model ON bundles(access_model);

-- Bundle Revisions
CREATE TABLE IF NOT EXISTS bundle_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  revision_number INT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (bundle_id, revision_number)
);

CREATE INDEX idx_bundle_revisions_bundle_id ON bundle_revisions(bundle_id);
CREATE INDEX idx_bundle_revisions_status ON bundle_revisions(status);

-- Bundle Revision Courses (Many-to-many)
CREATE TABLE IF NOT EXISTS bundle_revision_courses (
  revision_id UUID NOT NULL REFERENCES bundle_revisions(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (revision_id, course_id)
);

CREATE INDEX idx_bundle_revision_courses_course_id ON bundle_revision_courses(course_id);
CREATE INDEX idx_bundle_revision_courses_revision_id ON bundle_revision_courses(revision_id);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_payment_reference TEXT UNIQUE NOT NULL,
  payer_name TEXT,
  payer_email TEXT,
  payment_method TEXT,
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'refunded')),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_external_reference ON orders(external_payment_reference);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payer_email ON orders(payer_email);

-- Entitlements
CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entitlement_type TEXT NOT NULL CHECK (entitlement_type IN ('course', 'bundle')),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,
  bundle_access_model TEXT CHECK (bundle_access_model IN ('dynamic', 'static', NULL)),
  bundle_revision_id UUID REFERENCES bundle_revisions(id) ON DELETE RESTRICT,
  source_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_course_or_bundle CHECK (
    (course_id IS NOT NULL AND bundle_id IS NULL) OR
    (course_id IS NULL AND bundle_id IS NOT NULL)
  ),
  CONSTRAINT check_bundle_fields CHECK (
    (bundle_id IS NULL) OR
    (bundle_id IS NOT NULL AND bundle_access_model IS NOT NULL)
  ),
  CONSTRAINT check_static_revision CHECK (
    (bundle_access_model != 'static') OR
    (bundle_access_model = 'static' AND bundle_revision_id IS NOT NULL)
  )
);

CREATE INDEX idx_entitlements_user_id ON entitlements(user_id);
CREATE INDEX idx_entitlements_course_id ON entitlements(course_id);
CREATE INDEX idx_entitlements_bundle_id ON entitlements(bundle_id);
CREATE INDEX idx_entitlements_revoked_at ON entitlements(revoked_at);

-- Access Audit
CREATE TABLE IF NOT EXISTS access_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_access_audit_target_user_id ON access_audit(target_user_id);
CREATE INDEX idx_access_audit_action_type ON access_audit(action_type);
CREATE INDEX idx_access_audit_created_at ON access_audit(created_at DESC);

-- ============================================================================
-- 3. Create Functions
-- ============================================================================

-- has_course_access Function
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
  IF p_user_id IS NULL OR p_course_id IS NULL THEN
    RETURN FALSE;
  END IF;

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

GRANT EXECUTE ON FUNCTION has_course_access(UUID, UUID) TO authenticated;

-- get_lesson_course_id Helper
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

-- provision_entitlement_and_audit RPC
CREATE OR REPLACE FUNCTION provision_entitlement_and_audit(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_entitlement_type TEXT,
  p_order_id UUID,
  p_granted_by UUID,
  p_course_id UUID DEFAULT NULL,
  p_bundle_id UUID DEFAULT NULL,
  p_bundle_access_model TEXT DEFAULT NULL,
  p_bundle_revision_id UUID DEFAULT NULL,
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
  INSERT INTO profiles (user_id, full_name, email, role, status)
  VALUES (p_user_id, p_full_name, p_email, 'student', 'invited')
  ON CONFLICT (user_id) DO NOTHING;

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

GRANT EXECUTE ON FUNCTION provision_entitlement_and_audit(
  UUID, TEXT, TEXT, TEXT, UUID, UUID, UUID, UUID, TEXT, UUID, INET, TEXT
) TO service_role;

-- ============================================================================
-- 4. Enable Row-Level Security
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_revision_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_audit ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. RLS Policies - Profiles
-- ============================================================================

CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 6. RLS Policies - Courses
-- ============================================================================

CREATE POLICY "Users can read published courses they have access to"
  ON courses FOR SELECT
  USING (
    is_published = TRUE
    AND (
      EXISTS (
        SELECT 1 FROM entitlements
        WHERE user_id = auth.uid()
          AND entitlement_type = 'course'
          AND course_id = courses.id
          AND revoked_at IS NULL
      )
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

CREATE POLICY "Admins can read all published courses"
  ON courses FOR SELECT
  USING (
    is_published = TRUE
    AND EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can read all courses"
  ON courses FOR SELECT
  USING (auth.role() = 'service_role');

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

-- ============================================================================
-- 7. RLS Policies - Lessons
-- ============================================================================

CREATE POLICY "Users can read published lessons they have access to"
  ON lessons FOR SELECT
  USING (
    is_published = TRUE
    AND has_course_access(auth.uid(), course_id)
  );

CREATE POLICY "Admins can read all published lessons"
  ON lessons FOR SELECT
  USING (
    is_published = TRUE
    AND EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can read all lessons"
  ON lessons FOR SELECT
  USING (auth.role() = 'service_role');

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

-- ============================================================================
-- 8. RLS Policies - Bundles
-- ============================================================================

CREATE POLICY "Authenticated users can read published bundles"
  ON bundles FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Service role can read all bundles"
  ON bundles FOR SELECT
  USING (auth.role() = 'service_role');

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

-- ============================================================================
-- 9. RLS Policies - Bundle Tables (Admin-only)
-- ============================================================================

CREATE POLICY "Service role can manage bundle revisions"
  ON bundle_revisions
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage bundle revision courses"
  ON bundle_revision_courses
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 10. RLS Policies - Entitlements
-- ============================================================================

CREATE POLICY "Users can read their own entitlements"
  ON entitlements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all entitlements"
  ON entitlements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage entitlements"
  ON entitlements
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 11. RLS Policies - Orders & Audit
-- ============================================================================

CREATE POLICY "Only service role can manage orders"
  ON orders
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins can read access audit logs"
  ON access_audit FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can insert audit logs"
  ON access_audit FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- Setup Complete
-- ============================================================================
