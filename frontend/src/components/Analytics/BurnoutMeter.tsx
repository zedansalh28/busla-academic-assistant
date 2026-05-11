import React from 'react';

interface Props {
  score: number;
  consistencyScore: number;
}

export const BurnoutMeter: React.FC<Props> = ({ score, consistencyScore }) => {
  const clampedScore = Math.min(100, Math.max(0, score));
  const level = clampedScore >= 66 ? 'high' : clampedScore >= 36 ? 'medium' : 'low';

  const levelConfig = {
    low:    { label: 'Low Risk', color: 'text-green-600', bg: 'bg-green-50 border-green-200', fill: '#22c55e' },
    medium: { label: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', fill: '#f59e0b' },
    high:   { label: 'High Risk', color: 'text-red-600',   bg: 'bg-red-50 border-red-200',    fill: '#ef4444' },
  };
  const cfg = levelConfig[level];

  // SVG arc meter (180° half-circle)
  const W = 180, H = 100;
  const cx = W / 2, cy = H - 5;
  const r = 72;

  // Zones: 0-35 = green, 35-65 = amber, 65-100 = red (on the 180° arc)
  function arcPath(startDeg: number, endDeg: number) {
    const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg * 1.8 - 90));
    const y1 = cy + r * Math.sin(toRad(startDeg * 1.8 - 90));
    const x2 = cx + r * Math.cos(toRad(endDeg * 1.8 - 90));
    const y2 = cy + r * Math.sin(toRad(endDeg * 1.8 - 90));
    const large = endDeg - startDeg > 55 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  // Needle angle: 0 → -90°, 100 → 90°
  const needleAngle = (clampedScore / 100) * 180 - 90;
  const needleRad = ((needleAngle - 90) * Math.PI) / 180;
  const needleLen = r - 8;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy + needleLen * Math.sin(needleRad);

  return (
    <div className={`rounded-xl border p-4 ${cfg.bg}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700">Burnout Risk</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.color} bg-white border`}>{cfg.label}</span>
      </div>

      <div className="flex justify-center">
        <svg width={W} height={H + 10} viewBox={`0 0 ${W} ${H + 10}`}>
          {/* Background arc zones */}
          <path d={arcPath(0, 35)}  fill="none" stroke="#dcfce7" strokeWidth={10} strokeLinecap="butt" />
          <path d={arcPath(35, 65)} fill="none" stroke="#fef3c7" strokeWidth={10} strokeLinecap="butt" />
          <path d={arcPath(65, 100)} fill="none" stroke="#fee2e2" strokeWidth={10} strokeLinecap="butt" />
          {/* Filled progress */}
          <path d={arcPath(0, clampedScore)} fill="none" stroke={cfg.fill} strokeWidth={10} strokeLinecap="round" />
          {/* Needle */}
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#374151" strokeWidth={2.5} strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={4} fill="#374151" />
          {/* Score text */}
          <text x={cx} y={cy - 16} textAnchor="middle" fontSize="18" fontWeight="bold" fill={cfg.fill}>{clampedScore}</text>
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">/ 100</text>
        </svg>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 -mt-2">
        <span>Low</span>
        <span>Moderate</span>
        <span>High</span>
      </div>

      <div className="mt-3 pt-3 border-t border-white/60">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Study consistency</span>
          <span className="font-semibold text-gray-700">{consistencyScore}%</span>
        </div>
        <div className="w-full bg-white/60 rounded-full h-1.5 mt-1">
          <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${consistencyScore}%` }} />
        </div>
      </div>
    </div>
  );
};
