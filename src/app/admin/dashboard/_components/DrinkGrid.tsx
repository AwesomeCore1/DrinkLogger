'use client';

import type { DrinkType } from '@/types';

export default function DrinkGrid({
  drinks,
  addingId,
  onAddLog,
  featuredDrinks = [],
}: {
  drinks: Array<DrinkType & { categoryId?: string }>;
  addingId: string | null;
  onAddLog: (drink: DrinkType, uniqueId: string) => void | Promise<void>;
  featuredDrinks?: DrinkType[];
}) {
  return (
    <div className="space-y-4">
      {featuredDrinks.length ? (
        <div className="flex flex-wrap gap-2">
          {featuredDrinks.map((drink, idx) => {
            const uniqueId = `featured-${idx}`;
            const isLoading = addingId === uniqueId;
            return (
              <button
                key={uniqueId}
                disabled={!!addingId}
                onClick={() => onAddLog(drink, uniqueId)}
                className={`inline-flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl transition-all shadow-[0_15px_45px_rgba(0,0,0,0.3)] ${
                  !!addingId
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:-translate-y-[2px] hover:border-cyan-300/60 hover:shadow-[0_20px_60px_rgba(34,211,238,0.25)]'
                } bg-white/5 border-white/10`}
              >
                {isLoading ? (
                  <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-2xl drop-shadow-lg">{drink.icon}</span>
                )}
                <span className="text-sm font-bold text-white">{drink.name}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {drinks.map((drink, idx) => {
          const uniqueId = `${drink.id}-${idx}`;
          const isLoading = addingId === uniqueId;
          return (
            <button
              key={uniqueId}
              disabled={!!addingId}
              onClick={() => onAddLog(drink, uniqueId)}
              className={`aspect-square flex flex-col items-start justify-between p-4 rounded-3xl border bg-white/5 border-white/10 backdrop-blur-xl transition-all shadow-[0_20px_60px_rgba(0,0,0,0.35)] text-left active:translate-y-[1px] active:bg-cyan-500 active:text-slate-900 active:border-cyan-300 active:shadow-[0_22px_65px_rgba(34,211,238,0.35)] ${
                !!addingId
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:-translate-y-[2px] hover:border-white/18 hover:shadow-[0_24px_70px_rgba(0,0,0,0.4)]'
              } ${isLoading ? 'bg-cyan-500 text-slate-900 border-cyan-300 shadow-[0_24px_70px_rgba(34,211,238,0.35)]' : ''}`}
            >
              {isLoading ? (
                <div className="w-9 h-9 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-3xl drop-shadow-lg">{drink.icon}</span>
              )}
              <span className={`text-sm font-semibold leading-tight line-clamp-2 ${isLoading ? 'text-slate-900' : 'text-slate-100'}`}>
                {drink.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
