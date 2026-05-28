-- ============================================================================
-- 002_create_tables.sql
-- Core tables for identity, catalog, commercial, and entitlement
-- ============================================================================

-- ============================================================================
-- 2.1 Profiles (1:1 with auth.users)
-- ============================================================================
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

-- ============================================================================
-- 2.2 Courses
-- ============================================================================
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

-- ============================================================================
-- 2.3 Lessons
-- ============================================================================
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

-- ============================================================================
-- 2.4 Bundles (Product shell)
-- ============================================================================
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

-- ============================================================================
-- 2.5 Bundle Revisions (Versioned snapshots)
-- ============================================================================
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

-- ============================================================================
-- 2.6 Bundle Revision Courses (Many-to-many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bundle_revision_courses (
  revision_id UUID NOT NULL REFERENCES bundle_revisions(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (revision_id, course_id)
);

CREATE INDEX idx_bundle_revision_courses_course_id ON bundle_revision_courses(course_id);
CREATE INDEX idx_bundle_revision_courses_revision_id ON bundle_revision_courses(revision_id);

-- ============================================================================
-- 2.7 Orders (Off-platform payment reconciliation)
-- ============================================================================
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

-- ============================================================================
-- 2.8 Entitlements (Normalized ownership model)
-- ============================================================================
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
  -- Constraint: exactly one of course_id or bundle_id must be set
  CONSTRAINT check_course_or_bundle CHECK (
    (course_id IS NOT NULL AND bundle_id IS NULL) OR
    (course_id IS NULL AND bundle_id IS NOT NULL)
  ),
  -- If bundle_id is set, bundle_access_model must be set
  CONSTRAINT check_bundle_fields CHECK (
    (bundle_id IS NULL) OR
    (bundle_id IS NOT NULL AND bundle_access_model IS NOT NULL)
  ),
  -- If bundle_access_model is 'static', bundle_revision_id must be set
  CONSTRAINT check_static_revision CHECK (
    (bundle_access_model != 'static') OR
    (bundle_access_model = 'static' AND bundle_revision_id IS NOT NULL)
  )
);

CREATE INDEX idx_entitlements_user_id ON entitlements(user_id);
CREATE INDEX idx_entitlements_course_id ON entitlements(course_id);
CREATE INDEX idx_entitlements_bundle_id ON entitlements(bundle_id);
CREATE INDEX idx_entitlements_revoked_at ON entitlements(revoked_at);

-- ============================================================================
-- 2.9 Access Audit (Immutable log)
-- ============================================================================
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
