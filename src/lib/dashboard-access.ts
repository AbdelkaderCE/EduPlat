import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../types/supabase';

export type DashboardCourseCard = Database['public']['Tables']['courses']['Row'];
export type DashboardAccessRow = Database['public']['Tables']['user_access']['Row'];

export async function getUserAccessRows(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<DashboardAccessRow[]> {
  const { data, error } = await supabase
    .from('user_access')
    .select('id, user_id, access_type, access_id, granted_at')
    .eq('user_id', userId)
    .order('granted_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function resolveOwnedCourses(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<DashboardCourseCard[]> {
  const accessRows = await getUserAccessRows(supabase, userId);
  return resolveOwnedCoursesFromAccessRows(supabase, accessRows);
}

export async function resolveOwnedCoursesFromAccessRows(
  supabase: SupabaseClient<Database>,
  accessRows: DashboardAccessRow[]
): Promise<DashboardCourseCard[]> {
  const directCourseIds = accessRows
    .filter((row) => row.access_type === 'course')
    .map((row) => row.access_id);

  const bundleIds = accessRows
    .filter((row) => row.access_type === 'bundle')
    .map((row) => row.access_id);

  const bundleCourseIds =
    bundleIds.length > 0
      ? await resolveBundleCourseIds(supabase, bundleIds)
      : [];

  const ownedCourseIds = Array.from(new Set([...directCourseIds, ...bundleCourseIds]));

  if (ownedCourseIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('courses')
    .select('id, title, description, thumbnail_url, created_at')
    .in('id', ownedCourseIds)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function canUserAccessCourse(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseId: string
): Promise<boolean> {
  const accessRows = await getUserAccessRows(supabase, userId);

  const directMatch = accessRows.some(
    (row) => row.access_type === 'course' && row.access_id === courseId
  );

  if (directMatch) {
    return true;
  }

  const bundleIds = accessRows
    .filter((row) => row.access_type === 'bundle')
    .map((row) => row.access_id);

  if (bundleIds.length === 0) {
    return false;
  }

  const { data, error } = await supabase
    .from('bundle_courses')
    .select('bundle_id, course_id')
    .in('bundle_id', bundleIds)
    .eq('course_id', courseId);

  if (error) {
    throw new Error(error.message);
  }

  return (data?.length ?? 0) > 0;
}

async function resolveBundleCourseIds(
  supabase: SupabaseClient<Database>,
  bundleIds: string[]
): Promise<string[]> {
  const { data, error } = await supabase
    .from('bundle_courses')
    .select('bundle_id, course_id')
    .in('bundle_id', bundleIds);

  if (error) {
    throw new Error(error.message);
  }

  return Array.from(new Set((data ?? []).map((row) => row.course_id)));
}
