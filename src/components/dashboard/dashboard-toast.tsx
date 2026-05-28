'use client';

import { useEffect, useState } from 'react';

type DashboardToastProps = {
  message: string;
};

export function DashboardToast({ message }: DashboardToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 4500);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl border border-rose-500/30 bg-slate-950/95 p-4 shadow-2xl shadow-rose-950/30 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-rose-500/20 p-2 text-rose-200">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.75a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 7.5a.875.875 0 100-1.75.875.875 0 000 1.75z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-rose-100">Access denied</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">{message}</p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-full p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
