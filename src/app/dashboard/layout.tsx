import { redirect } from 'next/navigation';
import Link from 'next/link';

import { createClient } from '../../utils/supabase/server';
import { getUserAccessRows, resolveOwnedCoursesFromAccessRows } from '../../lib/dashboard-access';

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const accessRows = await getUserAccessRows(supabase, user.id);
  const ownedCourses = await resolveOwnedCoursesFromAccessRows(supabase, accessRows);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_32%),linear-gradient(180deg,#020617_0%,#030712_100%)] text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-[1800px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r border-white/10 bg-slate-950/70 px-5 py-6 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 font-bold text-slate-950 shadow-glow">
              E
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-300">EduPlat</p>
              <p className="text-sm text-slate-300">Student Classroom</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Your library</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-xs text-slate-400">Courses</p>
                  <p className="mt-1 text-xl font-semibold text-white">{ownedCourses.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-xs text-slate-400">Grants</p>
                  <p className="mt-1 text-xl font-semibold text-white">{accessRows.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Quick access</p>
              <div className="mt-3 space-y-2">
                <Link
                  href="/dashboard"
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white transition hover:border-sky-400/40 hover:bg-sky-400/5"
                >
                  <span>All courses</span>
                  <span className="text-slate-400">{ownedCourses.length}</span>
                </Link>
                {ownedCourses.slice(0, 4).map((course) => (
                  <Link
                    key={course.id}
                    href={`/dashboard/course/${course.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/5"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-500/20 to-cyan-400/10 text-xs font-semibold text-sky-200">
                      {course.title.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="truncate">{course.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="border-b border-white/10 bg-slate-950/40 px-5 py-4 backdrop-blur-xl lg:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Streaming-style classroom</p>
                <h2 className="text-lg font-semibold text-white">Keep learning where you left off</h2>
              </div>
              <div className="text-sm text-slate-400">{user.email}</div>
            </div>
          </div>
          <div className="px-4 py-5 lg:px-6 lg:py-6">{children}</div>
        </section>
      </div>
    </div>
  );
}
