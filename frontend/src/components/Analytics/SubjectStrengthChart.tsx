import React from 'react';
import { SubjectAnalysis } from '@/types';

interface Props {
  subjects: SubjectAnalysis[];
}

function barColor(weaknessScore: number): string {
  if (weaknessScore >= 60) return '#ef4444';
  if (weaknessScore >= 35) return '#f59e0b';
  return '#22c55e';
}

function label(score: number): string {
  if (score >= 60) return 'Needs focus';
  if (score >= 35) return 'Moderate';
  return 'Strong';
}

export const SubjectStrengthChart: React.FC<Props> = ({ subjects }) => {
  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-sm">
        <span>No subject data yet.</span>
        <span className="text-xs mt-1">Start chatting about your courses to see analysis here.</span>
      </div>
    );
  }

  const maxScore = 100;

  return (
    <div className="space-y-3">
      {subjects.slice(0, 7).map((s) => {
        const color = barColor(s.weakness_score);
        const pct = Math.round((s.weakness_score / maxScore) * 100);
        return (
          <div key={s.subject}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 truncate max-w-[140px]">{s.subject}</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold" style={{ color }}>{label(s.weakness_score)}</span>
                <span className="text-xs text-gray-400">{s.weakness_score}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.explanation}</p>
          </div>
        );
      })}
      <div className="flex items-center space-x-4 pt-2 border-t border-gray-100">
        {[['#22c55e', 'Strong (< 35%)'], ['#f59e0b', 'Moderate (35–60%)'], ['#ef4444', 'Needs focus (> 60%)']].map(([color, lbl]) => (
          <div key={lbl} className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-gray-500">{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
