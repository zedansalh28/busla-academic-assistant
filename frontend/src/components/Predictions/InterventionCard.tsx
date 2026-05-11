import React from 'react';
import { Intervention } from '@/types';

interface InterventionCardProps {
  intervention: Intervention;
  onAcknowledge?: (id: string) => void;
}

const URGENCY_STYLE: Record<number, { border: string; badge: string; badgeText: string; icon: string }> = {
  5: { border: 'border-red-500/40', badge: 'bg-red-500/20 text-red-300', badgeText: 'Critical', icon: '🚨' },
  4: { border: 'border-orange-500/40', badge: 'bg-orange-500/20 text-orange-300', badgeText: 'High', icon: '⚠️' },
  3: { border: 'border-amber-500/40', badge: 'bg-amber-500/20 text-amber-300', badgeText: 'Medium', icon: '📊' },
  2: { border: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-300', badgeText: 'Low', icon: '💡' },
  1: { border: 'border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300', badgeText: 'Info', icon: '✅' },
};

export const InterventionCard: React.FC<InterventionCardProps> = ({ intervention, onAcknowledge }) => {
  const style = URGENCY_STYLE[intervention.urgency] || URGENCY_STYLE[3];
  const isAcknowledged = intervention.acknowledged === 1;

  return (
    <div className={`rounded-xl border ${style.border} bg-white/3 p-4 transition-opacity ${isAcknowledged ? 'opacity-40' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg flex-shrink-0">{style.icon}</span>
          <h4 className="text-sm font-semibold text-white truncate">{intervention.title}</h4>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${style.badge}`}>
          {style.badgeText}
        </span>
      </div>

      <p className="text-xs text-gray-300 leading-relaxed mb-3">{intervention.message}</p>

      {intervention.reason && (
        <p className="text-xs text-gray-500 mb-3 italic">Why: {intervention.reason}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          {intervention.action_href && intervention.action_label && (
            <a
              href={intervention.action_href}
              className="text-xs px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 transition-colors"
            >
              {intervention.action_label} →
            </a>
          )}
        </div>
        {!isAcknowledged && onAcknowledge && intervention.id && (
          <button
            onClick={() => onAcknowledge(intervention.id!)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};
