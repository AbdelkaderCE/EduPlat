import { redirect } from 'next/navigation';

import { createClient } from '../../utils/supabase/server';
import { AdminOnboardingForm } from './student-onboarding-form';

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const [{ data: courses }, { data: bundles }] = await Promise.all([
    supabase.from('courses').select('id, title').order('created_at', { ascending: false }),
    supabase.from('bundles').select('id, title').order('created_at', { ascending: false })
  ]);

  return (
    <main className="min-h-screen px-4 py-6 text-white lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-sky-950/20 backdrop-blur-xl lg:p-8">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Admin Dashboard</p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Student onboarding</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Create paid student accounts, grant course or bundle access, and generate a temporary password for off-platform delivery.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
              Signed in as <span className="text-white">{profile?.full_name ?? profile?.email ?? user.email}</span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Courses</p>
              <p className="mt-2 text-2xl font-semibold text-white">{courses?.length ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Bundles</p>
              <p className="mt-2 text-2xl font-semibold text-white">{bundles?.length ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mode</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">Manual grant</p>
            </div>
          </div>
        </section>

        <AdminOnboardingForm courses={courses ?? []} bundles={bundles ?? []} />
      </div>
    </main>
  );
}
