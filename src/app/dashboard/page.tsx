import { redirect } from 'next/navigation';

import { createClient } from '../../utils/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen px-6 py-10 text-white lg:px-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-sky-950/20 backdrop-blur-xl">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Dashboard</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Welcome to EduPlat</h1>
          <p className="max-w-2xl text-slate-300">
            You are signed in and ready to continue building courses, tracking progress, and managing the learning experience.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
            <p className="text-sm text-slate-400">Signed in as</p>
            <p className="mt-2 break-all font-medium text-white">{user.email ?? 'Authenticated user'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
            <p className="text-sm text-slate-400">Platform</p>
            <p className="mt-2 font-medium text-white">Next.js + Supabase</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
            <p className="text-sm text-slate-400">Status</p>
            <p className="mt-2 font-medium text-emerald-300">Authenticated</p>
          </div>
        </div>
      </div>
    </main>
  );
}
