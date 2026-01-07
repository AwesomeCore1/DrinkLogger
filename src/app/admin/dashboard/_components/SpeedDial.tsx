'use client';

import type { DrinkType } from '@/types';
import { Zap } from 'lucide-react';

export default function SpeedDial({
  drinks,
  addingId,
  onAddLog,
}: {
  drinks: DrinkType[];
  addingId: string | null;
  onAddLog: (drink: DrinkType, uniqueId: string) => void | Promise<void>;
}) {
  if (drinks.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <Zap size={14} className="text-yellow-500" />
        <span>Snel Toevoegen</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {drinks.map((drink, idx) => {
          const uniqueId = `speed-${idx}`;
          const isLoading = addingId === uniqueId;
          return (
            <button
              key={uniqueId}
              disabled={!!addingId}
              onClick={() => onAddLog(drink, uniqueId)}
              className={`flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl shadow-lg transition-transform active:scale-95 ${
                !!addingId ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-500/30'
              }`}
            >
              {isLoading ? (
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" />
              ) : (
                <span className="text-3xl mb-2">{drink.icon}</span>
              )}
              <span className="text-xs font-bold text-slate-300 truncate w-full text-center">{drink.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
