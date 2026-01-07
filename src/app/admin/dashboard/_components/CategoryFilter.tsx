'use client';

import type { Category } from '@/types';

export default function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelectCategoryId,
}: {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategoryId: (categoryId: string) => void;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3">Categorieën</h3>
      <div className="flex flex-wrap gap-2">
        {[{ id: 'all', name: 'Alles' }, ...categories].map((cat) => {
          const active = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategoryId(cat.id)}
              className={`relative px-4 py-2 rounded-2xl text-sm font-bold transition-all backdrop-blur-xl border ${
                active
                  ? 'bg-slate-50 text-slate-900 border-white shadow-[0_12px_40px_rgba(255,255,255,0.25)]'
                  : 'bg-white/5 text-slate-200 border-white/10 hover:border-white/18 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
