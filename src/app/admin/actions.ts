'use server';

import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createAdminClient } from '../../utils/supabase/admin';
import { createClient } from '../../utils/supabase/server';
import type { Database } from '../../types/supabase';

export type CreateStudentState = {
  success: boolean;
  message: string;
  temporaryPassword?: string;
};

function createTemporaryPassword() {
  return crypto.randomBytes(16).toString('base64url');
}

type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type UserAccessInsert = Database['public']['Tables']['user_access']['Insert'];

export async function createStudentAndGrantAccess(
  _previousState: CreateStudentState,
  formData: FormData
): Promise<CreateStudentState> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profileData, error: profileReadError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const profile = profileData as { role: 'student' | 'admin' } | null;

  if (profileReadError || profile?.role !== 'admin') {
    return {
      success: false,
      message: 'You are not authorized to perform this action.'
    };
  }

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const fullName = String(formData.get('full_name') ?? '').trim();
  const selectedCourses = formData.getAll('course_ids').map(String).filter(Boolean);
  const selectedBundles = formData.getAll('bundle_ids').map(String).filter(Boolean);

  if (!email || !fullName) {
    return {
      success: false,
      message: 'Email and full name are required.'
    };
  }

  const temporaryPassword = createTemporaryPassword();
  const adminClient = createAdminClient();

  const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName
    }
  });

  if (createUserError || !createdUser.user) {
    return {
      success: false,
      message: createUserError?.message ?? 'Unable to create the student account.'
    };
  }

  const studentId = createdUser.user.id;

  const profileRow: ProfileInsert = {
    id: studentId,
    email,
    full_name: fullName,
    role: 'student'
  };

  const { error: profileError } = await adminClient.from('profiles').upsert(profileRow, {
    onConflict: 'id'
  });

  if (profileError) {
    return {
      success: false,
      message: profileError.message
    };
  }

  const accessRows: UserAccessInsert[] = [
    ...selectedCourses.map((courseId) => ({
      user_id: studentId,
      access_type: 'course' as const,
      access_id: courseId
    })),
    ...selectedBundles.map((bundleId) => ({
      user_id: studentId,
      access_type: 'bundle' as const,
      access_id: bundleId
    }))
  ];

  if (accessRows.length > 0) {
    const { error: accessError } = await adminClient.from('user_access').insert(accessRows);

    if (accessError) {
      return {
        success: false,
        message: accessError.message
      };
    }
  }

  revalidatePath('/admin');

  return {
    success: true,
    message: `Created ${fullName} and granted selected access.`,
    temporaryPassword
  };
}
