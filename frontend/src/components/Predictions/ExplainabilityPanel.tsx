import React, { useState } from 'react';
import { PredictionFactor } from '@/types';

interface ExplainabilityPanelProps {
  factorGroups: {
    label: string;
    key: string;
    score: number;
    factors: PredictionFactor[];
  }[];
}

const SEVERITY_COLOR: Record<string, { bar: string; text: string }> = {
  critical: { bar: 'bg-red-500',     text: 'text-red-400' },
  high:     { bar: 'bg-orange-500',  text: 'text-orange-400' },
  medium:   { bar: 'bg-amber-400',   text: 'text-amber-400' },
  low:      { bar: 'bg-blue-400',    text: 'text-blue-400' },
};

function weightBar(weight: number, severity: string) {
  const cfg = SEVERITY_COLOR[severity] || SEVERITY_COLOR.medium;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-20 bg-white/10 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${cfg.bar}`} style={{ width: `${Math.min(Math.abs(weight), 100)}%` }} />
      </div>
      <span className={`text-xs ${cfg.text}`}>+{weight}</span>
    </div>
  );
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({ factorGroups }) => {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const nonEmpty = factorGroups.filter(g => g.factors && g.factors.length > 0);

  if (nonEmpty.length === 0) {
    return (
      <div className="text-center text-gray-500 py-6 text-sm">
        No detailed factor data yet. Use the app for a few days to generate explainability data.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {nonEmpty.map(group => (
        <div key={group.key} className="rounded-xl border border-white/8 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors text-left"
            onClick={() => setOpenKey(openKey === group.key ? null : group.key)}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-white">{group.label}</span>
              <span className="text-xs text-gray-400">Score: {group.score}/100</span>
              <span className="text-xs text-gray-500">({group.factors.length} factor{group.factors.length !== 1 ? 's' : ''})</span>
            </div>
            <span className="text-gray-500 text-xs">{openKey === group.key ? '▲' : '▼'}</span>
          </button>

          {openKey === group.key && (
            <div className="px-4 pb-4 space-y-2.5 border-t border-white/5">
              {group.factors.map((f, i) => (
                <div key={i} className="pt-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-200 flex-1">{f.label}</span>
                    {weightBar(f.weight, f.severity)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
