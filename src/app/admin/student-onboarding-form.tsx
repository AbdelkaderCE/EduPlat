'use client';

import { useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { createStudentAndGrantAccess, type CreateStudentState } from './actions';

type CourseSummary = {
  id: string;
  title: string;
};

type BundleSummary = {
  id: string;
  title: string;
};

type AdminOnboardingFormProps = {
  courses: CourseSummary[];
  bundles: BundleSummary[];
};

const initialState: CreateStudentState = {
  success: false,
  message: ''
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Creating student…' : 'Create Student & Grant Access'}
    </button>
  );
}

export function AdminOnboardingForm({ courses, bundles }: AdminOnboardingFormProps) {
  const [state, formAction] = useFormState(createStudentAndGrantAccess, initialState);
  const [selectedCount, setSelectedCount] = useState(0);

  const totalItems = useMemo(() => courses.length + bundles.length, [courses.length, bundles.length]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-sky-950/20 backdrop-blur-xl lg:p-8">
      <div className="flex flex-col gap-2 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Create a paid student</h2>
          <p className="mt-1 text-sm text-slate-400">Select course and bundle access, then generate a temporary password.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
          {selectedCount} selected of {totalItems}
        </div>
      </div>

      <form action={formAction} className="mt-6 space-y-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-200" htmlFor="email">
            <span>Student&apos;s Email</span>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="student@example.com"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-200" htmlFor="full_name">
            <span>Student&apos;s Full Name</span>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              placeholder="Amina Hassan"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
            />
          </label>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <fieldset className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
            <legend className="px-2 text-sm font-semibold text-white">Grant Individual Courses</legend>
            <p className="mb-4 mt-1 text-xs text-slate-400">These entries are fetched from the `courses` table.</p>
            <div className="max-h-[340px] space-y-3 overflow-auto pr-1">
              {courses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
                  No courses found.
                </div>
              ) : (
                courses.map((course) => (
                  <label
                    key={course.id}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-sky-400/50 hover:bg-sky-400/5"
                  >
                    <input
                      type="checkbox"
                      name="course_ids"
                      value={course.id}
                      className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500"
                      onChange={(event) => {
                        setSelectedCount((value) => (event.target.checked ? value + 1 : Math.max(0, value - 1)));
                      }}
                    />
                    <span className="font-medium text-white">{course.title}</span>
                  </label>
                ))
              )}
            </div>
          </fieldset>

          <fieldset className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
            <legend className="px-2 text-sm font-semibold text-white">Grant Bundles</legend>
            <p className="mb-4 mt-1 text-xs text-slate-400">These entries are fetched from the `bundles` table.</p>
            <div className="max-h-[340px] space-y-3 overflow-auto pr-1">
              {bundles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
                  No bundles found.
                </div>
              ) : (
                bundles.map((bundle) => (
                  <label
                    key={bundle.id}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-400/5"
                  >
                    <input
                      type="checkbox"
                      name="bundle_ids"
                      value={bundle.id}
                      className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-400"
                      onChange={(event) => {
                        setSelectedCount((value) => (event.target.checked ? value + 1 : Math.max(0, value - 1)));
                      }}
                    />
                    <span className="font-medium text-white">{bundle.title}</span>
                  </label>
                ))
              )}
            </div>
          </fieldset>
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-white">Temporary password will be generated securely</p>
            <p className="mt-1 text-sm text-slate-400">Copy it after submission and share it with the student off-platform.</p>
          </div>
          <SubmitButton />
        </div>

        {state.message ? (
          <div
            className={`rounded-3xl border px-5 py-4 text-sm ${state.success ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : 'border-rose-500/30 bg-rose-500/10 text-rose-100'}`}
          >
            <p className="font-medium">{state.message}</p>
            {state.temporaryPassword ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 font-mono text-base tracking-wide text-cyan-300">
                {state.temporaryPassword}
              </div>
            ) : null}
          </div>
        ) : null}
      </form>
    </section>
  );
}
