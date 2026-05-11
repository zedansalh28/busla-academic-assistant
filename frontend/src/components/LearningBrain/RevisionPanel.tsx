import React from 'react';
import { RevisionPriority } from '@/types';
import { RotateCcw, Flame } from 'lucide-react';

interface Props {
  queue: RevisionPriority[];
}

const PRIORITY_BAR = (score: number) => {
  if (score >= 70) return 'bg-red-500';
  if (score >= 50) return 'bg-orange-500';
  if (score >= 30) return 'bg-amber-400';
  return 'bg-blue-400';
};

export function RevisionPanel({ queue }: Props) {
  if (!queue.length) {
    return (
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center space-x-2 mb-3">
          <RotateCcw size={18} className="text-blue-500" />
          <h3 className="font-semibold text-gray-800">Spaced Revision Queue</h3>
        </div>
        <p className="text-sm text-gray-400">No revision needed right now. Keep up your study sessions to stay on track.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center space-x-2 mb-4">
        <RotateCcw size={18} className="text-blue-500" />
        <h3 className="font-semibold text-gray-800">Spaced Revision Queue</h3>
        <span className="ml-auto text-xs text-gray-400">{queue.length} concept{queue.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-3">
        {queue.map((r, i) => (
          <div key={r.concept} className="flex items-start space-x-3">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700 truncate">{r.concept}</p>
                {r.priority_score >= 60 && <Flame size={14} className="text-red-500 flex-shrink-0" />}
              </div>
              {r.subject && <p className="text-xs text-gray-400">{r.subject}</p>}
              <div className="mt-1 w-full bg-gray-100 rounded-full h-1">
                <div className={`${PRIORITY_BAR(r.priority_score)} h-1 rounded-full`} style={{ width: `${Math.min(r.priority_score, 100)}%` }} />
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
                <span>{r.reason}</span>
                <span className="font-medium text-blue-600">{r.next_revision}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
