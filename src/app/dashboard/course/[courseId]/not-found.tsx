import Link from 'next/link';

export default function CourseNotFound() {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white shadow-2xl shadow-sky-950/20 backdrop-blur-xl">
      <h1 className="text-2xl font-bold">Course unavailable</h1>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        This course can’t be shown right now. Head back to your dashboard to continue learning.
      </p>
      <div className="mt-6">
        <Link href="/dashboard" className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
