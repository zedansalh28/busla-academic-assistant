import React from 'react';
import { BehaviorPattern, AnalyticsRecommendation } from '@/types';
import { AlertTriangle, CheckCircle, Clock, BookOpen, Brain, Target, Trophy, Heart, Star, Calendar } from 'lucide-react';

interface Props {
  patterns: BehaviorPattern[];
  recommendations: AnalyticsRecommendation[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  alert: AlertTriangle,
  check: CheckCircle,
  clock: Clock,
  book: BookOpen,
  brain: Brain,
  target: Target,
  trophy: Trophy,
  heart: Heart,
  star: Star,
  calendar: Calendar,
  warning: AlertTriangle,
};

const PRIORITY_STYLE: Record<string, string> = {
  high:     'bg-red-50 border-red-200 text-red-800',
  medium:   'bg-amber-50 border-amber-200 text-amber-800',
  info:     'bg-blue-50 border-blue-200 text-blue-800',
  positive: 'bg-green-50 border-green-200 text-green-800',
};

const PRIORITY_ICON_COLOR: Record<string, string> = {
  high:     'text-red-500',
  medium:   'text-amber-500',
  info:     'text-blue-500',
  positive: 'text-green-500',
};

const PATTERN_LABEL: Record<string, string> = {
  consistency: 'Study Consistency',
  procrastination: 'Procrastination Index',
  burnout_risk: 'Burnout Risk',
  ai_dependency: 'AI Dependency',
  completion_trend: 'Task Completion',
  overdue_ratio: 'Overdue Tasks',
  preferred_study_time: 'Preferred Study Time',
};

function patternValueDisplay(p: BehaviorPattern): string {
  if (p.type === 'preferred_study_time') {
    const h = p.value;
    const period = h < 6 ? 'Late Night' : h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : h < 21 ? 'Evening' : 'Night';
    return `${period} (~${h}:00)`;
  }
  return `${Math.round(p.value)}%`;
}

function patternLevel(type: string, value: number): 'good' | 'warn' | 'bad' {
  const config: Record<string, [number, number]> = {
    consistency:   [60, 35],
    procrastination: [40, 65],
    burnout_risk:  [35, 65],
    ai_dependency: [40, 65],
    completion_trend: [60, 35],
    overdue_ratio: [15, 40],
  };
  const thresholds = config[type];
  if (!thresholds) return 'good';
  const [goodThresh, badThresh] = thresholds;
  const higherIsBetter = ['consistency', 'completion_trend'].includes(type);
  if (higherIsBetter) {
    return value >= goodThresh ? 'good' : value <= badThresh ? 'bad' : 'warn';
  }
  return value <= goodThresh ? 'good' : value >= badThresh ? 'bad' : 'warn';
}

const LEVEL_BADGE: Record<string, string> = {
  good: 'bg-green-100 text-green-700',
  warn: 'bg-amber-100 text-amber-700',
  bad:  'bg-red-100 text-red-700',
};

export const PatternInsights: React.FC<Props> = ({ patterns, recommendations }) => {
  const keyPatterns = patterns.filter(p => PATTERN_LABEL[p.type]);

  return (
    <div className="space-y-6">
      {/* Detected Patterns Grid */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Detected Behavioral Patterns</h4>
        <div className="grid grid-cols-2 gap-2">
          {keyPatterns.map((p) => {
            const lvl = patternLevel(p.type, p.value);
            return (
              <div key={p.type} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">{PATTERN_LABEL[p.type]}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${LEVEL_BADGE[lvl]}`}>
                    {lvl === 'good' ? 'Good' : lvl === 'warn' ? 'Watch' : 'Alert'}
                  </span>
                </div>
                <div className="text-lg font-bold text-gray-800">{patternValueDisplay(p)}</div>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{p.explanation}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Intelligence-Driven Recommendations</h4>
          <div className="space-y-2">
            {recommendations.map((rec, i) => {
              const Icon = ICON_MAP[rec.icon] || AlertTriangle;
              return (
                <div key={i} className={`flex items-start space-x-3 rounded-xl border px-3 py-2.5 ${PRIORITY_STYLE[rec.priority]}`}>
                  <Icon size={15} className={`flex-shrink-0 mt-0.5 ${PRIORITY_ICON_COLOR[rec.priority]}`} />
                  <p className="text-xs leading-relaxed">{rec.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
