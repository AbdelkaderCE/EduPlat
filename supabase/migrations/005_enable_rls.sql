-- ============================================================================
-- 005_enable_rls.sql
-- Enable Row-Level Security on all tables
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
