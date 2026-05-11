import React from 'react';

interface Props {
  score: number;
  label?: string;
  size?: number;
}

export const ProductivityGauge: React.FC<Props> = ({ score, label = 'Productivity', size = 140 }) => {
  const clampedScore = Math.min(100, Math.max(0, score));
  const r = (size / 2) - 14;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  // Arc goes from -90° (top) clockwise
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const color = clampedScore >= 70 ? '#22c55e' : clampedScore >= 40 ? '#f59e0b' : '#ef4444';
  const bgColor = '#e5e7eb';

  const textColor = clampedScore >= 70 ? 'text-green-600' : clampedScore >= 40 ? 'text-amber-600' : 'text-red-500';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={bgColor} strokeWidth={10} />
        {/* Progress arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{ marginTop: -(size / 2 + 8) }} className="flex flex-col items-center">
        <span className={`text-3xl font-bold ${textColor}`}>{clampedScore}</span>
        <span className="text-xs text-gray-400 mt-0.5">/100</span>
      </div>
      <p className="text-xs font-medium text-gray-500 mt-6">{label}</p>
    </div>
  );
};
