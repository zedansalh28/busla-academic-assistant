import React from 'react';
import { KnowledgeGap } from '@/types';
import { Link2, CheckCircle } from 'lucide-react';

interface Props {
  gaps: KnowledgeGap[];
}

const SEVERITY_LABEL = (s: number) => {
  if (s >= 70) return { label: 'Critical', cls: 'bg-red-100 text-red-700' };
  if (s >= 50) return { label: 'High', cls: 'bg-orange-100 text-orange-700' };
  return { label: 'Medium', cls: 'bg-amber-100 text-amber-700' };
};

export function KnowledgeGapMap({ gaps }: Props) {
  if (!gaps.length) {
    return (
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center space-x-2 mb-3">
          <CheckCircle size={18} className="text-green-500" />
          <h3 className="font-semibold text-gray-800">Knowledge Gap Map</h3>
        </div>
        <p className="text-sm text-green-600">No prerequisite gaps detected.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center space-x-2 mb-4">
        <Link2 size={18} className="text-red-500" />
        <h3 className="font-semibold text-gray-800">Knowledge Gap Map</h3>
        <span className="ml-auto bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">{gaps.length} gap{gaps.length !== 1 ? 's' : ''}</span>
      </div>
      <p className="text-xs text-gray-400 mb-3">Concepts where a prerequisite is missing, detected from your chat patterns.</p>
      <div className="space-y-2">
        {gaps.map(g => {
          const sev = SEVERITY_LABEL(g.gap_severity);
          return (
            <div key={g.id} className="rounded-lg border border-gray-100 p-3 bg-gray-50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-semibold text-gray-700">{g.weak_concept}</span>
                    <span className="text-gray-400">needs</span>
                    <span className="font-semibold text-blue-600">{g.missing_prerequisite}</span>
                  </div>
                  {g.subject && <p className="text-xs text-gray-400 mt-0.5">{g.subject}</p>}
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sev.cls}`}>{sev.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
