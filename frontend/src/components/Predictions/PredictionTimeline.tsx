import React from 'react';
import { PredictionTimelineEntry } from '@/types';

interface PredictionTimelineProps {
  timeline: PredictionTimelineEntry[];
}

const HEALTH_COLOR: Record<string, string> = {
  healthy: '#10b981',
  moderate: '#f59e0b',
  at_risk: '#f97316',
  critical: '#ef4444',
};

export const PredictionTimeline: React.FC<PredictionTimelineProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 text-sm">
        No timeline data yet. Predictions will appear here after your first week of activity.
      </div>
    );
  }

  const W = 600;
  const H = 160;
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 32;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const n = timeline.length;

  function xPos(i: number) {
    return padL + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  }

  function yPos(v: number) {
    return padT + chartH - (v / 100) * chartH;
  }

  const failurePts = timeline.map((t, i) => ({ x: xPos(i), y: yPos(t.failureRisk) }));
  const burnoutPts = timeline.map((t, i) => ({ x: xPos(i), y: yPos(t.burnoutProbability) }));
  const scorePts = timeline.map((t, i) => ({ x: xPos(i), y: yPos(t.overallScore) }));

  function polyline(pts: { x: number; y: number }[]) {
    return pts.map(p => `${p.x},${p.y}`).join(' ');
  }

  function areaPath(pts: { x: number; y: number }[]) {
    if (pts.length === 0) return '';
    const bottom = padT + chartH;
    return `M${pts[0].x},${bottom} ` +
      pts.map(p => `L${p.x},${p.y}`).join(' ') +
      ` L${pts[pts.length - 1].x},${bottom} Z`;
  }

  const gridLines = [25, 50, 75];

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 320 }} className="overflow-visible">
        {/* Grid */}
        {gridLines.map(v => (
          <g key={v}>
            <line x1={padL} y1={yPos(v)} x2={padL + chartW} y2={yPos(v)}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3,3" />
            <text x={padL - 4} y={yPos(v)} fill="rgba(255,255,255,0.25)" fontSize="8"
              textAnchor="end" dominantBaseline="middle">{v}</text>
          </g>
        ))}

        {/* Area fills */}
        <path d={areaPath(failurePts)} fill="rgba(239,68,68,0.08)" />
        <path d={areaPath(burnoutPts)} fill="rgba(245,158,11,0.06)" />

        {/* Lines */}
        <polyline points={polyline(scorePts)} fill="none" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" strokeDasharray="4,3" />
        <polyline points={polyline(burnoutPts)} fill="none" stroke="#f59e0b" strokeWidth="1.5" />
        <polyline points={polyline(failurePts)} fill="none" stroke="#ef4444" strokeWidth="2" />

        {/* Data dots */}
        {failurePts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5"
            fill={HEALTH_COLOR[timeline[i].overallHealth] || '#ef4444'}
            stroke="#0f0f1a" strokeWidth="1.5" />
        ))}

        {/* X-axis labels */}
        {timeline.map((t, i) => (
          <text key={i} x={xPos(i)} y={padT + chartH + 12}
            fill="rgba(255,255,255,0.35)" fontSize="8" textAnchor="middle">
            {t.week}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex gap-4 mt-2 text-xs text-gray-400 justify-center">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-red-500 rounded" />Failure Risk</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-amber-400 rounded" />Burnout</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-indigo-400 rounded" style={{ borderTop: '1px dashed' }} />Overall Score</span>
      </div>
    </div>
  );
};
