import React, { useState } from 'react';

export default function BarMiniChart({
  labels,
  values,
  color = '#6366f1', // Indigo-500 default
}: {
  labels: string[];
  values: number[];
  color?: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const max = Math.max(1, ...values);

  return (
    <div className="w-full">
      <div className="relative flex items-end gap-2 h-24">
        {values.map((v, i) => {
          const h = Math.max(8, (v / max) * 90);
          const isHover = hoverIndex === i;
          return (
            <div
              key={i}
              className="relative flex-1 flex flex-col items-center justify-end"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              onFocus={() => setHoverIndex(i)}
              onBlur={() => setHoverIndex(null)}
              tabIndex={0}
            >
              {isHover ? (
                <div className="absolute -top-8 px-2 py-1 rounded-md bg-slate-800 text-[10px] font-medium text-slate-200 border border-slate-700 shadow-sm z-10 whitespace-nowrap">
                   {labels[i]}: <span className="text-white">{v}</span>
                </div>
              ) : null}
              <div
                className={`w-full rounded-t-sm transition-all duration-300 ${
                  isHover ? 'opacity-100' : 'opacity-70'
                }`}
                style={{ 
                    height: `${h}%`,
                    backgroundColor: color,
                    boxShadow: isHover ? `0 0 10px ${color}80` : 'none'
                }}
              />
            </div>
          );
        })}
      </div>
       <div
        className="mt-3 grid gap-1 text-[10px] font-medium text-slate-500 uppercase tracking-wide"
        style={{ gridTemplateColumns: `repeat(${Math.max(labels.length, 1)}, minmax(0, 1fr))` }}
      >
        {labels.map((l, i) => (
          <div key={i} className="text-center truncate">
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
