import { LoginForm } from '../../components/auth/login-form';

const highlights = [
  'Structured learning paths for students and instructors',
  'Progress tracking, cohorts, and course analytics',
  'Supabase auth ready for secure deployments'
];

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen overflow-hidden px-6 py-10 lg:px-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-500/25 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2">
        <section className="max-w-xl space-y-8 text-white">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.9)]" />
            EduPlat • Modern learning experiences
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Build a smarter educational platform with a clean, secure login flow.
            </h1>
            <p className="max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
              Launch a polished learning product with Supabase authentication, modern UI, and a deployment-ready Next.js foundation.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {highlights.map((highlight) => (
              <div key={highlight} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200 shadow-glow backdrop-blur">
                {highlight}
              </div>
            ))}
          </div>
        </section>

        <section className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
