// ============================================================================
// src/types/index.ts
// ============================================================================

export interface Profile {
  user_id: string;
  full_name: string | null;
  email: string;
  role: 'student' | 'admin' | 'support';
  status: 'invited' | 'active' | 'suspended' | 'deleted';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_path: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  lesson_order: number;
  cloudflare_asset_id: string;
  cloudflare_uid: string | null;
  video_provider: string;
  duration_seconds: number | null;
  is_preview: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Bundle {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_path: string | null;
  access_model: 'dynamic' | 'static';
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Entitlement {
  id: string;
  user_id: string;
  entitlement_type: 'course' | 'bundle';
  course_id: string | null;
  bundle_id: string | null;
  bundle_access_model: 'dynamic' | 'static' | null;
  bundle_revision_id: string | null;
  source_order_id: string;
  granted_by: string | null;
  granted_at: string;
  revoked_at: string | null;
  created_at: string;
}

export interface AccessAuditLog {
  id: string;
  actor_user_id: string | null;
  target_user_id: string;
  action_type: string;
  resource_type: string | null;
  resource_id: string | null;
  payload: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  aud: string;
  role: string;
  email_confirmed_at: string | null;
  phone: string | null;
  confirmation_sent_at: string | null;
  confirmed_at: string | null;
  last_sign_in_at: string | null;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
  identities: any[];
  created_at: string;
  updated_at: string;
}
