import React from 'react';
import { MemorySnapshot } from '@/types';
import { TrendingUp } from 'lucide-react';

interface Props {
  snapshots: MemorySnapshot[];
}

export function LearningEvolution({ snapshots }: Props) {
  if (!snapshots.length) {
    return (
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center space-x-2 mb-3">
          <TrendingUp size={18} className="text-indigo-500" />
          <h3 className="font-semibold text-gray-800">Learning Evolution</h3>
        </div>
        <p className="text-sm text-gray-400">Mastery history will appear here after your first week of activity.</p>
      </div>
    );
  }

  const sorted = [...snapshots].sort((a, b) => a.snapshot_date - b.snapshot_date);
  const maxMastery = Math.max(...sorted.map(s => s.overall_mastery), 1);

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp size={18} className="text-indigo-500" />
        <h3 className="font-semibold text-gray-800">Learning Evolution</h3>
        <span className="ml-auto text-xs text-gray-400">{sorted.length} snapshots</span>
      </div>

      {/* Bar chart */}
      <div className="flex items-end space-x-1 h-24 mb-3">
        {sorted.map((s, i) => {
          const height = Math.max((s.overall_mastery / maxMastery) * 100, 4);
          const date = new Date(s.snapshot_date);
          const label = `${date.getMonth() + 1}/${date.getDate()}`;
          return (
            <div key={i} className="flex-1 flex flex-col items-center" title={`${label}: ${s.overall_mastery}% mastery`}>
              <div className="w-full rounded-t" style={{ height: `${height}%`, backgroundColor: '#6366f1', opacity: 0.7 + (i / sorted.length) * 0.3 }} />
            </div>
          );
        })}
      </div>

      {/* Date labels — only first and last */}
      <div className="flex justify-between text-xs text-gray-400 mb-4">
        <span>{new Date(sorted[0].snapshot_date).toLocaleDateString()}</span>
        <span>{new Date(sorted[sorted.length - 1].snapshot_date).toLocaleDateString()}</span>
      </div>

      {/* Latest snapshot breakdown */}
      {(() => {
        const latest = sorted[sorted.length - 1];
        return (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-50 rounded-lg p-2">
              <p className="text-lg font-bold text-green-600">{latest.improving_count}</p>
              <p className="text-xs text-gray-400">Improving</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2">
              <p className="text-lg font-bold text-amber-600">{latest.forgetting_count}</p>
              <p className="text-xs text-gray-400">Forgetting</p>
            </div>
            <div className="bg-red-50 rounded-lg p-2">
              <p className="text-lg font-bold text-red-600">{latest.declining_count}</p>
              <p className="text-xs text-gray-400">Declining</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
