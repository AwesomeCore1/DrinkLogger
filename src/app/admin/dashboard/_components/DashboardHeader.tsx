'use client';

import { LogOut, Search, Settings } from 'lucide-react';

export default function DashboardHeader({
  searchQuery,
  onSearchQueryChange,
  onOpenSettings,
  onLogout,
  mobileTab,
  onMobileTabChange,
  onSearchActiveChange,
}: {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  mobileTab: 'drinks' | 'history';
  onMobileTabChange: (tab: 'drinks' | 'history') => void;
  onSearchActiveChange: (active: boolean) => void;
}) {
  return (
    <header className="relative z-40 pt-6 pb-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative group">
          <div className="absolute inset-0 rounded-3xl bg-slate-800/40 border border-white/10 backdrop-blur-xl shadow-[0_25px_80px_rgba(0,0,0,0.45)]" />
          <div className="relative flex items-center px-4 py-2">
            <Search className="mr-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Spotlight: zoek drankjes of categorieën"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onFocus={() => onSearchActiveChange(true)}
              onBlur={() => onSearchActiveChange(false)}
              className="w-full bg-transparent outline-none text-sm text-slate-50 placeholder:text-slate-500"
            />
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 px-2 py-1 rounded-full bg-white/5 border border-white/10">
              ⌘K
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-3 flex items-center justify-between gap-3">
        <div className="lg:hidden flex-1">
          <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
            <button
              type="button"
              onClick={() => onMobileTabChange('drinks')}
              className={`py-2.5 rounded-xl text-sm font-extrabold transition-all ${
                mobileTab === 'drinks'
                  ? 'bg-slate-50 text-slate-900 shadow-[0_10px_40px_rgba(255,255,255,0.35)]'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              Drankjes
            </button>
            <button
              type="button"
              onClick={() => onMobileTabChange('history')}
              className={`py-2.5 rounded-xl text-sm font-extrabold transition-all ${
                mobileTab === 'history'
                  ? 'bg-slate-50 text-slate-900 shadow-[0_10px_40px_rgba(255,255,255,0.35)]'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              Geschiedenis
            </button>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-2 py-1 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Beheer drankjes"
          >
            <Settings size={20} />
          </button>

          <div className="h-6 w-px bg-white/10" />

          <button
            onClick={onLogout}
            className="p-2.5 rounded-xl text-slate-300 hover:text-red-300 hover:bg-white/10 transition-colors"
            title="Uitloggen"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
