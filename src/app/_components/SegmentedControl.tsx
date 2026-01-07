'use client';

import React from 'react';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export default function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
}) {
  return (
    <div className="inline-grid grid-flow-col auto-cols-fr gap-1 p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-colors ${
              active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
