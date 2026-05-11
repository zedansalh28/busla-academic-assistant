import React from 'react';
import { WeeklyTrend as WeeklyTrendType } from '@/types';

interface Props {
  data: WeeklyTrendType[];
}

export const WeeklyTrend: React.FC<Props> = ({ data }) => {
  const validData = data.filter(d => d.completionRate !== null);

  if (validData.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm">
        <span>Not enough data yet.</span>
        <span className="text-xs mt-1">Complete tasks over multiple weeks to see trends.</span>
      </div>
    );
  }

  const W = 320, H = 100;
  const padL = 32, padR = 12, padT = 12, padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const rates = validData.map(d => d.completionRate as number);
  const maxRate = Math.max(100, ...rates);

  const points = validData.map((d, i) => ({
    x: padL + (i / (validData.length - 1)) * chartW,
    y: padT + chartH - ((d.completionRate as number) / maxRate) * chartH,
    rate: d.completionRate as number,
    label: d.label,
    events: d.studyEvents,
  }));

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');

  // Fill area under line
  const fillPath = `M ${points[0].x} ${padT + chartH} ` +
    points.map(p => `L ${p.x} ${p.y}`).join(' ') +
    ` L ${points[points.length - 1].x} ${padT + chartH} Z`;

  const trend = rates[rates.length - 1] - rates[0];
  const trendColor = trend >= 5 ? '#22c55e' : trend <= -5 ? '#ef4444' : '#6b7280';
  const trendLabel = trend >= 5 ? `+${Math.round(trend)}% improving` : trend <= -5 ? `${Math.round(trend)}% declining` : 'stable';

  return (
    <div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Y-axis labels */}
        {[0, 50, 100].map(v => {
          const y = padT + chartH - (v / maxRate) * chartH;
          return (
            <g key={v}>
              <text x={padL - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#9ca3af">{v}%</text>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#f3f4f6" strokeWidth={1} />
            </g>
          );
        })}

        {/* Fill area */}
        <path d={fillPath} fill="#dbeafe" fillOpacity={0.5} />

        {/* Line */}
        <polyline points={polyline} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="#3b82f6" stroke="white" strokeWidth={1.5} />
            <text x={p.x} y={padT + chartH + 12} textAnchor="middle" fontSize="8" fill="#9ca3af">{p.label}</text>
          </g>
        ))}
      </svg>

      <div className="flex items-center justify-between mt-1 px-1">
        <span className="text-xs text-gray-400">Task completion rate over 6 weeks</span>
        <span className="text-xs font-medium" style={{ color: trendColor }}>{trendLabel}</span>
      </div>
    </div>
  );
};
