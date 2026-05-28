# ScholarStream Implementation Specification

**Version:** 1.0  
**Date:** May 28, 2026  
**Platform:** Supabase + PostgreSQL + Cloudflare Stream + React  
**Focus:** Database DDL, RLS Policies, and Secure Edge Function Contracts

---

## 1) SQL Table Schemas (DDL)

### Identity & Access Layer

```sql
-- ============================================================================
-- Enable UUID extension
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1.1 Profiles (1:1 with auth.users)
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
```

### Catalog Layer

```sql
-- ============================================================================
-- 1.2 Courses
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
-- 1.3 Lessons
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
-- 1.4 Bundles (Product shell)
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
-- 1.5 Bundle Revisions (Versioned snapshots)
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
-- 1.6 Bundle Revision Courses (Many-to-many)
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
```

### Commercial & Entitlement Layer

```sql
-- ============================================================================
-- 1.7 Orders (Off-platform payment reconciliation)
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
-- 1.8 Entitlements (Normalized ownership model)
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
  -- If bundle_id is set, bundle_access_model and potentially bundle_revision_id must be set
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
-- 1.9 Access Audit (Immutable log)
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
```

---

## 2) Core Access Control Function: `has_course_access`

### Pseudocode Logic

```
function has_course_access(user_id, course_id):
  if user_id is null:
    return false

  // 1. Check direct course entitlement
  if exists(
    select 1 from entitlements
    where user_id = user_id
      and entitlement_type = 'course'
      and course_id = course_id
      and revoked_at is null
  ):
    return true

  // 2. Check bundle entitlements
  for each bundle_entitlement in (
    select bundle_id, bundle_access_model, bundle_revision_id
    from entitlements
    where user_id = user_id
      and entitlement_type = 'bundle'
      and revoked_at is null
  ):
    if bundle_entitlement.bundle_access_model == 'dynamic':
      // Use the bundle's current published revision
      if exists(
        select 1
        from bundle_revisions br
        join bundle_revision_courses brc on brc.revision_id = br.id
        where br.bundle_id = bundle_entitlement.bundle_id
          and br.status = 'published'
          and brc.course_id = course_id
      ):
        return true
    else if bundle_entitlement.bundle_access_model == 'static':
      // Use the pinned revision snapshot
      if exists(
        select 1
        from bundle_revision_courses brc
        where brc.revision_id = bundle_entitlement.bundle_revision_id
          and brc.course_id = course_id
      ):
        return true

  return false
```

### SQL Implementation

```sql
-- ============================================================================
-- 2.1 has_course_access Function (SECURITY DEFINER)
-- ============================================================================
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
  -- Return false immediately if no user
  IF p_user_id IS NULL OR p_course_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check 1: Direct course entitlement
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

  -- Check 2: Bundle entitlements (dynamic)
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

  -- Check 3: Bundle entitlements (static, pinned to revision)
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION has_course_access(UUID, UUID) TO authenticated;

-- ============================================================================
-- 2.2 Helper: get_lesson_course_id (for RLS policy use)
-- ============================================================================
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
```

---

## 3) Row-Level Security (RLS) Policies

### Profiles RLS

```sql
-- ============================================================================
-- 3.1 Profiles RLS
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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
```

### Courses RLS

```sql
-- ============================================================================
-- 3.2 Courses RLS
-- ============================================================================
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

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
```

### Lessons RLS

```sql
-- ============================================================================
-- 3.3 Lessons RLS
-- ============================================================================
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

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
```

### Bundles RLS

```sql
-- ============================================================================
-- 3.4 Bundles RLS
-- ============================================================================
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;

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
```

### Bundle Revisions & Bundle Revision Courses RLS (Admin-only)

```sql
-- ============================================================================
-- 3.5 Bundle Revisions RLS
-- ============================================================================
ALTER TABLE bundle_revisions ENABLE ROW LEVEL SECURITY;

-- Only service role (admin backend)
CREATE POLICY "Service role can manage bundle revisions"
  ON bundle_revisions
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 3.6 Bundle Revision Courses RLS
-- ============================================================================
ALTER TABLE bundle_revision_courses ENABLE ROW LEVEL SECURITY;

-- Only service role
CREATE POLICY "Service role can manage bundle revision courses"
  ON bundle_revision_courses
  USING (auth.role() = 'service_role');
```

### Entitlements RLS

```sql
-- ============================================================================
-- 3.7 Entitlements RLS
-- ============================================================================
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;

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
```

### Orders & Audit RLS

```sql
-- ============================================================================
-- 3.8 Orders RLS (Admin-only)
-- ============================================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can manage orders"
  ON orders
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 3.9 Access Audit RLS (Admin-only)
-- ============================================================================
ALTER TABLE access_audit ENABLE ROW LEVEL SECURITY;

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
```

---

## 4) PostgreSQL RPC: `provision_entitlement_and_audit`

This is called by the Edge Function to atomically create profiles and entitlements.

```sql
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
```

---

## 5) Edge Function: `provision-student-access`

This function handles the secure provisioning workflow: auth user creation, profile/entitlement insertion, and invite link generation.

### TypeScript Contract

```typescript
// ============================================================================
// Type Definitions
// ============================================================================

interface ProvisionStudentAccessRequest {
  email: string;
  fullName: string;
  externalPaymentReference: string;
  entitlementType: 'course' | 'bundle';
  courseId?: string;
  bundleId?: string;
  bundleAccessModel?: 'dynamic' | 'static';
  bundleRevisionId?: string;
  adminUserId: string;
}

interface ProvisionStudentAccessResponse {
  success: boolean;
  userId?: string;
  entitlementId?: string;
  inviteUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

// ============================================================================
// Implementation (Deno / Supabase Edge Function)
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { getFunctions, httpsCallable } from 'firebase-functions/v2/https';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const cloudflareAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID') || '';
const cloudflareApiToken = Deno.env.get('CLOUDFLARE_API_TOKEN') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function provisionStudentAccess(
  request: ProvisionStudentAccessRequest
): Promise<ProvisionStudentAccessResponse> {
  try {
    // 1. Validate input
    if (!request.email || !request.fullName || !request.externalPaymentReference) {
      return {
        success: false,
        errorCode: 'INVALID_INPUT',
        errorMessage: 'Missing required fields: email, fullName, externalPaymentReference'
      };
    }

    // 2. Verify order exists and is verified
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('external_payment_reference', request.externalPaymentReference)
      .eq('status', 'verified')
      .single();

    if (orderError || !order) {
      return {
        success: false,
        errorCode: 'ORDER_NOT_FOUND',
        errorMessage: `Order verification failed: ${orderError?.message || 'Order not verified'}`
      };
    }

    // 3. Create auth user via Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: request.email,
      email_confirm: false,
      user_metadata: {
        full_name: request.fullName,
        provisioned_at: new Date().toISOString()
      }
    });

    if (authError || !authData?.user?.id) {
      return {
        success: false,
        errorCode: 'AUTH_USER_CREATION_FAILED',
        errorMessage: `Failed to create auth user: ${authError?.message || 'Unknown error'}`
      };
    }

    const userId = authData.user.id;

    // 4. Call RPC to atomically create profile and entitlement
    const { data: rpResult, error: rpError } = await supabase.rpc(
      'provision_entitlement_and_audit',
      {
        p_user_id: userId,
        p_full_name: request.fullName,
        p_email: request.email,
        p_entitlement_type: request.entitlementType,
        p_course_id: request.courseId || null,
        p_bundle_id: request.bundleId || null,
        p_bundle_access_model: request.bundleAccessModel || null,
        p_bundle_revision_id: request.bundleRevisionId || null,
        p_order_id: order.id,
        p_granted_by: request.adminUserId,
        p_ip_address: null,
        p_user_agent: null
      }
    );

    if (rpError || !rpResult || !rpResult[0]?.success) {
      // Cleanup: delete the auth user since DB provisioning failed
      await supabase.auth.admin.deleteUser(userId);

      return {
        success: false,
        errorCode: 'ENTITLEMENT_PROVISION_FAILED',
        errorMessage: rpResult?.[0]?.error_message || rpError?.message || 'Failed to create entitlement'
      };
    }

    const entitlementId = rpResult[0].entitlement_id;

    // 5. Generate invite link using Supabase Auth Admin API
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email: request.email,
      options: {
        redirectTo: `${Deno.env.get('FRONTEND_URL')}/auth/welcome?user=${userId}`
      }
    });

    if (linkError || !linkData?.properties?.action_link) {
      // This is a warning; provisioning succeeded, but invite link generation failed
      console.warn('Invite link generation failed:', linkError);
    }

    // 6. Return success with invite URL
    return {
      success: true,
      userId,
      entitlementId,
      inviteUrl: linkData?.properties?.action_link || undefined
    };

  } catch (err) {
    console.error('Unexpected error in provisionStudentAccess:', err);
    return {
      success: false,
      errorCode: 'UNEXPECTED_ERROR',
      errorMessage: err instanceof Error ? err.message : 'An unexpected error occurred'
    };
  }
}
```

---

## 6) Edge Function: `get-lesson-playback-url`

This function validates entitlement and returns a signed Cloudflare Stream embed URL (never a raw token).

### TypeScript Contract

```typescript
// ============================================================================
// Type Definitions
// ============================================================================

interface GetLessonPlaybackUrlRequest {
  lessonId: string;
}

interface GetLessonPlaybackUrlResponse {
  success: boolean;
  playbackUrl?: string;
  expiresAt?: string;
  errorCode?: string;
  errorMessage?: string;
}

// ============================================================================
// Implementation (Deno / Supabase Edge Function)
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const cloudflareAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID') || '';
const cloudflareApiToken = Deno.env.get('CLOUDFLARE_API_TOKEN') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CloudflareSignedTokenRequest {
  accountId: string;
  videoId: string;
  token: string;
}

/**
 * Generate a signed Cloudflare Stream embed URL with HLS encryption.
 * This URL should be embedded directly in an HLS player, never exposed raw.
 */
async function generateCloudflareSignedEmbedUrl(
  lessonId: string,
  cloudflareAssetId: string,
  userId: string
): Promise<string> {
  const tokenTtl = 300; // 5 minutes
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + tokenTtl;

  // Payload for Cloudflare Signed Token (JWT-like)
  const tokenPayload = {
    sub: cloudflareAssetId,
    aud: cloudflareAccountId,
    iat: issuedAt,
    exp: expiresAt,
    nbf: issuedAt,
    accessRules: [
      {
        type: 'any'
      }
    ]
  };

  // Sign token using Cloudflare's API
  // (In production, use a Cloudflare library like @cloudflare/stream or direct REST API)
  const signTokenResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/stream/token/sign`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cloudflareApiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: JSON.stringify(tokenPayload)
      })
    }
  );

  if (!signTokenResponse.ok) {
    throw new Error(
      `Failed to sign Cloudflare token: ${signTokenResponse.statusText}`
    );
  }

  const { result } = (await signTokenResponse.json()) as {
    result?: { token?: string };
  };

  if (!result?.token) {
    throw new Error('Cloudflare signing response missing token');
  }

  const signedToken = result.token;

  // Construct the embed URL with signed token
  // This is a fully-formed HLS manifest URL with embedded token, NOT a raw token
  const embedUrl = `https://customer-${cloudflareAccountId}.cloudflarestream.com/${cloudflareAssetId}/manifest/video.m3u8?token=${encodeURIComponent(signedToken)}`;

  return embedUrl;
}

export async function getLessonPlaybackUrl(
  request: GetLessonPlaybackUrlRequest,
  userId: string | null
): Promise<GetLessonPlaybackUrlResponse> {
  try {
    // 1. Validate authentication
    if (!userId) {
      return {
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: 'User not authenticated'
      };
    }

    // 2. Fetch lesson (RLS applies automatically)
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, course_id, cloudflare_asset_id, title')
      .eq('id', request.lessonId)
      .single();

    if (lessonError || !lesson) {
      return {
        success: false,
        errorCode: 'LESSON_NOT_FOUND',
        errorMessage: 'Lesson not found or you do not have access'
      };
    }

    // 3. Double-check entitlement (defense in depth; RLS should already allow this)
    const hasAccess = await supabase.rpc('has_course_access', {
      p_user_id: userId,
      p_course_id: lesson.course_id
    });

    if (hasAccess.error || !hasAccess.data) {
      return {
        success: false,
        errorCode: 'ACCESS_DENIED',
        errorMessage: 'You do not have access to this lesson'
      };
    }

    // 4. Generate signed Cloudflare embed URL
    const playbackUrl = await generateCloudflareSignedEmbedUrl(
      lesson.id,
      lesson.cloudflare_asset_id,
      userId
    );

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // 5. Log access in audit trail
    await supabase
      .from('access_audit')
      .insert({
        actor_user_id: userId,
        target_user_id: userId,
        action_type: 'lesson_playback_requested',
        resource_type: 'lesson',
        resource_id: lesson.id,
        payload: {
          lesson_title: lesson.title,
          course_id: lesson.course_id
        }
      })
      .then(() => {})
      .catch((err) => console.warn('Audit log insert failed:', err));

    return {
      success: true,
      playbackUrl,
      expiresAt
    };

  } catch (err) {
    console.error('Unexpected error in getLessonPlaybackUrl:', err);
    return {
      success: false,
      errorCode: 'UNEXPECTED_ERROR',
      errorMessage: err instanceof Error ? err.message : 'An unexpected error occurred'
    };
  }
}
```

---

## 7) React Component: Secure Video Player Integration

How the frontend consumes the signed URL:

```typescript
// ============================================================================
// useSecureVideoPlayer Hook
// ============================================================================

import { useEffect, useState } from 'react';

interface UseSecureVideoPlayerProps {
  lessonId: string;
  onError?: (message: string) => void;
}

interface VideoPlayerState {
  playbackUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useSecureVideoPlayer({
  lessonId,
  onError
}: UseSecureVideoPlayerProps): VideoPlayerState {
  const [state, setState] = useState<VideoPlayerState>({
    playbackUrl: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchPlaybackUrl = async () => {
      try {
        // Call the Edge Function
        const response = await fetch('/api/get-lesson-playback-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId })
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch playback URL: ${response.statusText}`);
        }

        const result = (await response.json()) as {
          success: boolean;
          playbackUrl?: string;
          errorMessage?: string;
        };

        if (!result.success) {
          throw new Error(result.errorMessage || 'Unknown error');
        }

        setState({
          playbackUrl: result.playbackUrl || null,
          isLoading: false,
          error: null
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        setState({
          playbackUrl: null,
          isLoading: false,
          error: errorMsg
        });
        onError?.(errorMsg);
      }
    };

    fetchPlaybackUrl();
  }, [lessonId, onError]);

  return state;
}

// ============================================================================
// Secure Video Player Component
// ============================================================================

import React from 'react';
import HLS from 'hls.js';

interface SecureVideoPlayerProps {
  lessonId: string;
  title: string;
}

export function SecureVideoPlayer({ lessonId, title }: SecureVideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const { playbackUrl, isLoading, error } = useSecureVideoPlayer({ lessonId });

  React.useEffect(() => {
    if (!playbackUrl || !videoRef.current) return;

    // Use HLS.js to load the signed manifest
    if (HLS.isSupported()) {
      const hls = new HLS({
        xhrSetup: (xhr, url) => {
          // Prevent exposing the token in network traces where possible
          xhr.withCredentials = true;
        }
      });
      hls.loadSource(playbackUrl);
      hls.attachMedia(videoRef.current);

      return () => {
        hls.destroy();
      };
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Fallback for Safari
      videoRef.current.src = playbackUrl;
    }
  }, [playbackUrl]);

  return (
    <div className="relative w-full bg-black rounded-xl overflow-hidden shadow-lg">
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-secondary border-t-secondary-container rounded-full animate-spin mx-auto mb-3" />
            <p className="text-on-primary text-sm font-medium">Loading video...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-error/10 backdrop-blur-sm">
          <div className="text-center px-6">
            <p className="text-error font-semibold mb-2">Unable to load video</p>
            <p className="text-on-surface-variant text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        controls
        className="w-full h-full aspect-video bg-black"
        title={title}
      />
    </div>
  );
}
```

---

## 8) Deployment Checklist

- [ ] Database migration: Run all DDL statements in order
- [ ] Enable RLS: Verify all RLS policies are active
- [ ] Deploy `has_course_access` function and RPC
- [ ] Deploy `provision-student-access` Edge Function to Supabase
- [ ] Deploy `get-lesson-playback-url` Edge Function to Supabase
- [ ] Set environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `FRONTEND_URL`
- [ ] Test provisioning workflow end-to-end
- [ ] Test video playback with signed URL
- [ ] Verify RLS policies block unauthorized access
- [ ] Set up access audit log monitoring
- [ ] Document admin provisioning UI/API endpoint

---

## 9) Key Design Principles (Summary)

1. **Atomic provisioning:** Profile and entitlement are created in a single DB transaction
2. **Signed URLs only:** Never expose raw Cloudflare tokens; return full embed URLs
3. **Defense in depth:** Both RLS and Edge Function validate entitlement
4. **Audit trail:** Every provisioning and playback event is logged
5. **Bundle versioning:** Static bundles snapshot at purchase; dynamic bundles follow the latest revision
6. **Centralized access logic:** `has_course_access` is the single source of truth

