import React from 'react';

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-900/60 border border-slate-800 ${className}`} />;
}

export function AdminLoginSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <SkeletonBlock className="mx-auto h-16 w-16 rounded-2xl" />
            <SkeletonBlock className="mx-auto mt-5 h-8 w-52 rounded-lg" />
            <SkeletonBlock className="mx-auto mt-3 h-4 w-64 rounded-lg" />
          </div>

          <div className="space-y-4">
            <div>
              <SkeletonBlock className="h-4 w-28 rounded-md" />
              <SkeletonBlock className="mt-2 h-12 w-full rounded-xl" />
            </div>
            <div>
              <SkeletonBlock className="h-4 w-28 rounded-md" />
              <SkeletonBlock className="mt-2 h-12 w-full rounded-xl" />
            </div>
            <SkeletonBlock className="mt-6 h-12 w-full rounded-xl" />
          </div>

          <div className="mt-6 flex justify-center">
            <SkeletonBlock className="h-4 w-40 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <SkeletonBlock className="h-11 flex-1 rounded-xl" />
          <SkeletonBlock className="h-11 w-11 rounded-xl" />
          <SkeletonBlock className="h-11 w-11 rounded-xl" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <SkeletonBlock className="h-20 rounded-2xl" />
              <SkeletonBlock className="h-20 rounded-2xl" />
            </div>
            <SkeletonBlock className="h-36 rounded-2xl" />
          </div>

          <div className="lg:col-span-9 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <SkeletonBlock className="h-4 w-28 rounded-md" />
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonBlock key={i} className="h-24 rounded-2xl" />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {Array.from({ length: 24 }).map((_, i) => (
                <SkeletonBlock key={i} className="aspect-square rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
