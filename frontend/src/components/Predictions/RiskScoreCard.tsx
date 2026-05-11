import React from 'react';

interface RiskScoreCardProps {
  label: string;
  score: number;
  icon: string;
  invert?: boolean; // for "recovery potential" — higher is better
  subtitle?: string;
}

function getColor(score: number, invert: boolean): { bg: string; bar: string; text: string } {
  const effective = invert ? 100 - score : score;
  if (effective >= 70) return { bg: 'bg-red-950/40', bar: 'bg-red-500', text: 'text-red-400' };
  if (effective >= 45) return { bg: 'bg-amber-950/40', bar: 'bg-amber-400', text: 'text-amber-400' };
  if (effective >= 25) return { bg: 'bg-yellow-950/30', bar: 'bg-yellow-400', text: 'text-yellow-300' };
  return { bg: 'bg-emerald-950/30', bar: 'bg-emerald-500', text: 'text-emerald-400' };
}

function getLabel(score: number, invert: boolean): string {
  const effective = invert ? 100 - score : score;
  if (effective >= 70) return 'Critical';
  if (effective >= 45) return 'Elevated';
  if (effective >= 25) return 'Moderate';
  return 'Healthy';
}

export const RiskScoreCard: React.FC<RiskScoreCardProps> = ({ label, score, icon, invert = false, subtitle }) => {
  const color = getColor(score, invert);
  const statusLabel = getLabel(score, invert);

  return (
    <div className={`rounded-xl border border-white/10 p-4 ${color.bg}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xl mb-1">{icon}</div>
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
        <div className={`text-2xl font-bold ${color.text}`}>{score}</div>
      </div>

      <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
        <div
          className={`h-1.5 rounded-full transition-all duration-700 ${color.bar}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>

      <div className={`text-xs font-semibold ${color.text}`}>{statusLabel}</div>
    </div>
  );
};
