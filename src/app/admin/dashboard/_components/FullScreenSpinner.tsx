'use client';

export default function FullScreenSpinner({ label }: { label?: string }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
      {label ? <div className="text-sm text-slate-400 font-semibold">{label}</div> : null}
    </div>
  );
}
