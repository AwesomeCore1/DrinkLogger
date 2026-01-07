import React from 'react';

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/5 border border-white/10 ${className}`} />;
}

export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto p-4 pb-20">
        <div className="pt-10 pb-6">
          <Skeleton className="h-10 w-56 rounded-2xl" />
          <Skeleton className="mt-3 h-5 w-72 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
          <div className="lg:col-span-8 space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </div>
    </div>
  );
}
