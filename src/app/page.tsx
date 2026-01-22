'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { arrayRemove, arrayUnion, collection, doc, limit, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Log } from '@/types';
import { daysInMonth, formatShortDayNL, formatShortMonthNL, startOfMonth, startOfWeek, startOfYear } from '@/utils/date';
import { generateUUID } from '@/utils/uuid';
import BarMiniChart from './_components/BarMiniChart';
import Sparkline from './_components/Sparkline';

/* --- Components --- */

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function MetricCard({ label, value, trend, subValue }: { label: string; value: string | number; trend?: string; subValue?: string }) {
  return (
    <GlassCard className="p-6 flex flex-col justify-between h-full relative overflow-hidden group min-h-[140px]">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10 flex flex-col gap-1">
        <h3 className="text-sm font-medium text-slate-400">{label}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold text-slate-100 tracking-tight">{value}</span>
          {trend && <span className="text-xs font-medium text-indigo-400">{trend}</span>}
        </div>
        {subValue && <div className="text-xs font-medium text-slate-500 mt-1">{subValue}</div>}
      </div>
    </GlassCard>
  );
}

function CompactLogCard({ log, isLatest, reactorId, reactingOn, onToggleReaction }: { log: Log; isLatest: boolean; reactorId: string; reactingOn: string | null; onToggleReaction: (id: string, emoji: string, hasReacted: boolean) => void }) {
  const reactionMap = log.reactions || {};
  const defaultEmojis = ['🔥', '👏', '🍻'];

  return (
    <GlassCard className={`relative flex items-center gap-4 p-3 pr-4 transition-all duration-300 hover:bg-white/10 ${isLatest ? 'ring-1 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : ''}`}>
      {/* Icon Box */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-900/50 border border-white/10 flex items-center justify-center text-xl">
        {log.icon}
      </div>

      {/* Content */}
      <div className="flex-grow min-w-0 flex flex-col justify-center">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-200 truncate leading-tight">{sanitizeName(log.drink_name)}</h4>
          <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">+1</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-slate-500 font-medium">{formatTimeAgo(log.created_at)} geleden</span>
          {/* Tiny Reactions */}
          <div className="flex gap-1">
            {defaultEmojis.map((emoji) => {
              const users = reactionMap[emoji] || [];
              const count = users.length;
              const hasReacted = users.includes(reactorId);
              const isGhost = count === 0 && !hasReacted;
              // Check if THIS specific button is the one currently loading
              const isLoading = reactingOn === log.id + emoji;

              return (
                <button
                  key={emoji}
                  onClick={() => onToggleReaction(log.id, emoji, hasReacted)}
                  disabled={!!reactingOn} // Disable all reaction buttons while any request is flying to prevent spam
                  className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 transition-all
                    ${isLoading ? 'opacity-50 cursor-wait' : ''}
                    ${hasReacted 
                      ? 'bg-indigo-500/20 text-indigo-200' 
                      : isGhost 
                        ? 'opacity-0 group-hover:opacity-100 text-slate-600 hover:bg-white/5 hover:text-slate-400' 
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                >
                  <span>{emoji}</span>
                  {(count > 0 || hasReacted) && <span>{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function FavoriteItem({ name, count, index }: { name: string; count: number; index: number }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors">
        {index + 1}
      </div>
      <div className="flex-grow min-w-0">
        <div className="text-sm font-medium text-slate-200 truncate">{sanitizeName(name)}</div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1.5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${Math.min(100, count * 5)}%` }} />
        </div>
      </div>
      <div className="text-xs font-semibold text-slate-400">{count}</div>
    </div>
  );
}

function SkeletonBlock({ className, transparent = false }: { className: string; transparent?: boolean }) {
  return <div className={`animate-pulse rounded-lg ${transparent ? 'bg-white/5' : 'bg-slate-800'} ${className}`} />;
}

/* --- Helpers --- */

function sanitizeName(name: string) {
  return name.replace(/kanker/gi, '******');
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayKeyLocal(d: Date) {
  const normalized = startOfDay(d);
  const y = normalized.getFullYear();
  const m = String(normalized.getMonth() + 1).padStart(2, '0');
  const day = String(normalized.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTimeAgo(ts: any) {
  const dt = ts?.toDate?.();
  if (!dt) return '';
  const diffMs = Date.now() - dt.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 10) return 'zojuist';
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}u`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
}

/* --- Main Page --- */

export default function HomePage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactorId, setReactorId] = useState<string>('');
  
  // State voor UI feedback (disabled buttons)
  const [reactingOn, setReactingOn] = useState<string | null>(null);
  
  // Ref voor echte locking (voorkomt double-clicks en race conditions)
  const reactingMutex = useRef<Set<string>>(new Set());

  useEffect(() => {
    const q = query(
      collection(db, 'logs'),
      orderBy('created_at', 'desc'),
      limit(1000)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Log)));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    // Check localStorage direct om te voorkomen dat React Strict Mode rare dingen doet
    if (typeof window !== 'undefined') {
      let id = window.localStorage.getItem('dl_reactor_id');
      if (!id) {
        id = generateUUID();
        window.localStorage.setItem('dl_reactor_id', id);
      }
      setReactorId(id);
    }
  }, []);

  /* --- Calculations --- */

  const totals = useMemo(() => {
    const now = new Date();
    const dayStart = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);
    const yearStart = startOfYear(now);

    const today = logs.filter((l) => l.created_at?.toDate && l.created_at.toDate() >= dayStart).length;
    const week = logs.filter((l) => l.created_at?.toDate && l.created_at.toDate() >= weekStart).length;
    const month = logs.filter((l) => l.created_at?.toDate && l.created_at.toDate() >= monthStart).length;
    const year = logs.filter((l) => l.created_at?.toDate && l.created_at.toDate() >= yearStart).length;

    return { today, week, month, year };
  }, [logs]);

  const currentStreak = useMemo(() => {
    if (!logs.length) return 0;
    const loggedDays = new Set<string>();
    logs.forEach((l) => {
      const dt = l.created_at?.toDate?.();
      if (dt) loggedDays.add(dayKeyLocal(dt));
    });
    let streak = 0;
    const cursor = startOfDay(new Date());
    if (!loggedDays.has(dayKeyLocal(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (loggedDays.has(dayKeyLocal(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }, [logs]);

  const reactionTotal = useMemo(() => {
    return logs.reduce((acc, log) => {
      const reactions = log.reactions || {};
      return acc + Object.values(reactions).reduce((sum, u) => sum + (u?.length || 0), 0);
    }, 0);
  }, [logs]);

  const topDrinks = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of logs) counts[l.drink_name] = (counts[l.drink_name] || 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [logs]);

  const toggleReaction = async (logId: string, emoji: string, alreadyReacted: boolean) => {
    if (!reactorId) return;

    const lockKey = `${logId}-${emoji}`;

    // 1. Check de Ref mutex. Als deze key al bezig is: STOP.
    if (reactingMutex.current.has(lockKey)) return;

    // 2. Locken
    reactingMutex.current.add(lockKey);
    setReactingOn(lockKey); // Voor de UI disabled state

    try {
      const ref = doc(db, 'logs', logId);
      if (alreadyReacted) {
        await updateDoc(ref, { [`reactions.${emoji}`]: arrayRemove(reactorId) });
      } else {
        await updateDoc(ref, { [`reactions.${emoji}`]: arrayUnion(reactorId) });
      }
    } catch (err) {
      console.error('Reaction error', err);
    } finally {
      // 3. Unlocken (altijd, ook bij errors)
      reactingMutex.current.delete(lockKey);
      setReactingOn(null);
    }
  };

  const activityFeed = logs.slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 pb-20">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-900/10 blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-900/5 blur-[150px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 pt-10 space-y-8">
        <header className="flex items-center justify-between pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Live feed actief</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">Dashboard</h1>
          </div>
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
            <span className="text-2xl">🔥</span>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-white">{currentStreak} Dagen</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Streak</span>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard 
            label="Vandaag" 
            value={totals.today} 
          />
          <MetricCard 
            label="Week" 
            value={totals.week} 
          />
          <MetricCard 
            label="Maand" 
            value={totals.month} 
          />
          <MetricCard 
            label="Jaar" 
            value={totals.year} 
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-100 mb-1">Activiteiten Tijdlijn</h2>
              <p className="text-xs text-slate-500">Recente logs en interacties</p>
            </div>

            <div className="relative pl-4">
              <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-white/5" />

              <div className="space-y-6">
                {loading && (
                  <>
                    <SkeletonBlock className="h-20 w-full" />
                    <SkeletonBlock className="h-20 w-full opacity-70" />
                    <SkeletonBlock className="h-20 w-full opacity-40" />
                  </>
                )}
                {!loading &&
                  activityFeed.map((log, index) => (
                    <div key={log.id} className="relative flex gap-6 group">
                      <div className={`relative z-10 flex-shrink-0 w-2.5 h-2.5 rounded-full mt-7 ml-2 border-2 ${index === 0 ? 'bg-indigo-500 border-slate-950 shadow-[0_0_0_4px_rgba(99,102,241,0.2)]' : 'bg-slate-800 border-slate-950'}`} />

                      <div className="flex-grow">
                        <CompactLogCard log={log} isLatest={index === 0} reactorId={reactorId} reactingOn={reactingOn} onToggleReaction={toggleReaction} />
                      </div>
                    </div>
                  ))}
                {!loading && activityFeed.length === 0 && <div className="py-12 text-center text-slate-500 text-sm italic">Geen activiteiten gevonden.</div>}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-200">Favorieten</h3>
                <span className="text-xs bg-white/5 px-2 py-1 rounded text-slate-400">Top 5</span>
              </div>
              <div className="space-y-1">
                {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} className="h-10 mb-2" transparent />)}
                {!loading && topDrinks.map((d, i) => <FavoriteItem key={d.name} name={d.name} count={d.count} index={i} />)}
                {!loading && topDrinks.length === 0 && <div className="py-4 text-center text-xs text-slate-500">Nog geen data.</div>}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}