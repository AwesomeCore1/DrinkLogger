'use client';

export default function StatsCards({ todayCount, totalCount }: { todayCount: number; totalCount: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 px-6 py-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/0 to-transparent" />
        <div className="relative flex flex-col gap-2">
          <span className="text-[11px] font-black tracking-[0.22em] uppercase text-slate-400">Vandaag</span>
          <span className="text-6xl font-black bg-gradient-to-b from-white via-slate-200 to-slate-500 bg-clip-text text-transparent leading-none">
            {todayCount}
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 px-6 py-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/12 via-white/0 to-transparent" />
        <div className="relative flex flex-col gap-2">
          <span className="text-[11px] font-black tracking-[0.22em] uppercase text-slate-400">Totaal</span>
          <span className="text-6xl font-black bg-gradient-to-b from-white via-slate-200 to-slate-500 bg-clip-text text-transparent leading-none">
            {totalCount}
          </span>
        </div>
      </div>
    </div>
  );
}
