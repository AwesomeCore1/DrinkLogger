'use client';

import type { Log } from '@/types';
import { History, Trash2 } from 'lucide-react';

export default function RecentActivity({
  logs,
  onDeleteLog,
  formatLogDate,
  limit,
  variant,
  onToggle,
  open,
}: {
  logs: Log[];
  onDeleteLog: (logId: string) => void | Promise<void>;
  formatLogDate: (timestamp: any) => string;
  limit: number;
  variant: 'desktop' | 'mobile';
  onToggle?: () => void;
  open?: boolean;
}) {
  const visibleLogs = logs.slice(0, limit);

  const grouped = visibleLogs.reduce<
    Array<{ key: string; label: string; items: Log[] }>
  >((acc, log) => {
    const dt = log.created_at?.toDate?.();
    if (!dt) return acc;
    const hourBucket = new Date(dt);
    hourBucket.setMinutes(0, 0, 0);
    const key = hourBucket.toISOString();
    const label = hourBucket.toLocaleString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    });
    const existing = acc.find((g) => g.key === key);
    if (existing) {
      existing.items.push(log);
    } else {
      acc.push({ key, label, items: [log] });
    }
    return acc;
  }, []);

  const shellClasses =
    variant === 'desktop'
      ? 'hidden lg:block bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-xl shadow-[0_25px_80px_rgba(0,0,0,0.35)]'
      : 'lg:hidden bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-xl shadow-[0_25px_80px_rgba(0,0,0,0.35)]';

  return (
    <section className={shellClasses}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[11px] font-black text-slate-300 uppercase tracking-[0.22em]">
          <History size={14} />
          <span>Recente Activiteit</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[11px] font-semibold text-slate-400">Laatste {limit}</div>
          {onToggle ? (
            <button
              type="button"
              onClick={onToggle}
              className="text-[11px] font-semibold text-slate-300 bg-white/5 border border-white/10 rounded-full px-3 py-1 hover:border-white/20 transition-colors"
            >
              {open ? 'Verberg' : 'Toon'}
            </button>
          ) : null}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="text-center py-10 text-slate-500 font-semibold">Nog geen logs.</div>
      ) : (
        <div className="space-y-3">
          {grouped.map((group) => (
            <div key={group.key} className="relative pl-6">
              <div className="absolute left-1 top-0 bottom-0 w-px bg-white/10" />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_0_4px_rgba(34,211,238,0.18)]" />
                <span className="text-xs font-semibold text-slate-300">{group.label}</span>
              </div>
              <div className="space-y-2">
                {group.items.map((log) => (
                  <div
                    key={log.id}
                    className="group flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 transition-colors hover:border-cyan-300/40 shadow-[0_16px_40px_rgba(0,0,0,0.25)]"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900/80 flex items-center justify-center text-lg shadow-inner ring-1 ring-white/10">
                        {log.icon}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-100 truncate">{log.drink_name}</span>
                        <span className="text-xs text-slate-500">Tapback</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">{formatLogDate(log.created_at)}</span>
                      <button
                        onClick={() => onDeleteLog(log.id)}
                        className="p-2 text-slate-500 hover:text-red-400 transition-opacity opacity-0 group-hover:opacity-100"
                        aria-label="Verwijder log"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
