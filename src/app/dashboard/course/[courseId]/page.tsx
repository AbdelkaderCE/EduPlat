import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createClient } from '../../../../utils/supabase/server';
import { canUserAccessCourse } from '../../../../lib/dashboard-access';

type CoursePageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const hasAccess = await canUserAccessCourse(supabase, user.id, courseId);

  if (!hasAccess) {
    redirect('/dashboard?error=access-denied');
  }

  const { data: course, error } = await supabase
    .from('courses')
    .select('id, title, description, thumbnail_url, created_at')
    .eq('id', courseId)
    .single();

  if (error || !course) {
    redirect('/dashboard?error=missing-course');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-slate-400 transition hover:text-white">
          ← Back to dashboard
        </Link>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-sky-200">
          Private access
        </span>
      </div>

      <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-sky-950/20 backdrop-blur-xl">
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.24),_rgba(15,23,42,0.72)_72%)] px-6 py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Course</p>
            <h1 className="text-3xl font-bold sm:text-4xl">{course.title}</h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-200/90">
              {course.description ?? 'This course is ready for your lessons, videos, and assignments.'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Course overview</p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
              <p>
                This is the protected classroom view. You reached it because your account owns this course directly or through an assigned bundle.
              </p>
              <p>
                From here, you can expand into lessons, downloads, progress tracking, and certificates while keeping access enforcement on the server.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Access check</p>
              <p className="mt-2 text-lg font-semibold text-emerald-300">Verified</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Server-side validation completed before the page rendered.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Last updated</p>
              <p className="mt-2 text-lg font-semibold text-white">{new Date(course.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
