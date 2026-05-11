import React from 'react';

interface RadarAxis {
  label: string;
  value: number; // 0–100
  color: string;
}

interface RadarChartProps {
  axes: RadarAxis[];
  size?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export const RadarChart: React.FC<RadarChartProps> = ({ axes, size = 260 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const n = axes.length;
  const angleStep = 360 / n;
  const rings = [20, 40, 60, 80, 100];

  const dataPoints = axes.map((axis, i) => {
    const angle = i * angleStep;
    const r = (axis.value / 100) * maxR;
    return polarToCartesian(cx, cy, r, angle);
  });

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Grid rings */}
        {rings.map(ring => {
          const ringPoints = Array.from({ length: n }, (_, i) => {
            const angle = i * angleStep;
            return polarToCartesian(cx, cy, (ring / 100) * maxR, angle);
          });
          const ringPath = ringPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';
          return (
            <path key={ring} d={ringPath} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          );
        })}

        {/* Axis lines */}
        {axes.map((_, i) => {
          const outerPt = polarToCartesian(cx, cy, maxR, i * angleStep);
          return (
            <line key={i} x1={cx} y1={cy} x2={outerPt.x} y2={outerPt.y}
              stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          );
        })}

        {/* Data polygon */}
        <path d={dataPath} fill="rgba(99,102,241,0.2)" stroke="#6366f1" strokeWidth="2" />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill={axes[i].color} stroke="#1e1e2e" strokeWidth="1.5" />
        ))}

        {/* Ring labels (innermost) */}
        {[25, 50, 75].map(v => {
          const pt = polarToCartesian(cx, cy, (v / 100) * maxR, 0);
          return (
            <text key={v} x={pt.x + 3} y={pt.y} fill="rgba(255,255,255,0.25)" fontSize="8" dominantBaseline="middle">
              {v}
            </text>
          );
        })}

        {/* Axis labels */}
        {axes.map((axis, i) => {
          const angle = i * angleStep;
          const labelR = maxR + 22;
          const pt = polarToCartesian(cx, cy, labelR, angle);
          const anchor = pt.x < cx - 5 ? 'end' : pt.x > cx + 5 ? 'start' : 'middle';
          return (
            <text key={i} x={pt.x} y={pt.y} fill="rgba(255,255,255,0.6)" fontSize="10"
              textAnchor={anchor} dominantBaseline="middle">
              {axis.label}
            </text>
          );
        })}

        {/* Value labels */}
        {dataPoints.map((p, i) => {
          const offset = 10;
          const angle = i * angleStep;
          const lp = polarToCartesian(cx, cy, (axes[i].value / 100) * maxR - offset, angle);
          return (
            <text key={i} x={lp.x} y={lp.y} fill={axes[i].color} fontSize="9"
              textAnchor="middle" dominantBaseline="middle" fontWeight="bold">
              {axes[i].value}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
