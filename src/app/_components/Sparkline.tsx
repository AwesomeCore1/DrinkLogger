import React from 'react';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function buildSmoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const tension = 0.2;
  const d: string[] = [];
  d.push(`M ${points[0].x} ${points[0].y}`);

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`);
  }

  return d.join(' ');
}

export default function Sparkline({
  values,
  strokeClassName = 'stroke-indigo-400',
  fillClassName = 'fill-indigo-500/10',
}: {
  values: number[];
  strokeClassName?: string;
  fillClassName?: string;
}) {
  const w = 320;
  const h = 120;
  const padX = 5;
  const padY = 5;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => {
    const t = values.length <= 1 ? 0 : i / (values.length - 1);
    const x = padX + t * innerW;
    const y = padY + (1 - clamp(v / max, 0, 1)) * innerH;
    return { x, y };
  });

  const lineD = buildSmoothPath(pts);
  const areaD =
    pts.length === 0
      ? ''
      : `${lineD} L ${padX + innerW} ${padY + innerH} L ${padX} ${padY + innerH} Z`;

  const id = React.useId();

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="90%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={areaD} className={fillClassName} fill={`url(#${id}-fill)`} />
      <path
        d={lineD}
        className={`${strokeClassName} fill-none`}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{
          strokeDasharray: 1200,
          strokeDashoffset: 0,
          animation: 'spark-draw 1s ease-out both',
        }}
      />
      <style>{`
        @keyframes spark-draw {
          from { stroke-dashoffset: 1200; opacity: 0; }
          to { stroke-dashoffset: 0; opacity: 1; }
        }
      `}</style>
    </svg>
  );
}
