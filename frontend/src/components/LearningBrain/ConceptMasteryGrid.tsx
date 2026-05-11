import React from 'react';
import { ConceptMemory } from '@/types';

interface Props {
  concepts: ConceptMemory[];
}

const MASTERY_COLOR = (score: number) => {
  if (score >= 75) return 'bg-green-500';
  if (score >= 55) return 'bg-blue-500';
  if (score >= 35) return 'bg-amber-500';
  return 'bg-red-500';
};

const MASTERY_BG = (score: number) => {
  if (score >= 75) return 'bg-green-50 border-green-200';
  if (score >= 55) return 'bg-blue-50 border-blue-200';
  if (score >= 35) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
};

const MASTERY_TEXT = (score: number) => {
  if (score >= 75) return 'text-green-700';
  if (score >= 55) return 'text-blue-700';
  if (score >= 35) return 'text-amber-700';
  return 'text-red-700';
};

export function ConceptMasteryGrid({ concepts }: Props) {
  if (!concepts.length) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center text-gray-400 text-sm">
        No concepts tracked yet. Start chatting about your subjects to build your learning memory.
      </div>
    );
  }

  const sorted = [...concepts].sort((a, b) => a.mastery_score - b.mastery_score);

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h3 className="font-semibold text-gray-800 mb-4">Concept Mastery Map</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {sorted.map(c => (
          <div key={c.concept} className={`rounded-lg border p-3 ${MASTERY_BG(c.mastery_score)}`}>
            <p className={`text-xs font-semibold truncate ${MASTERY_TEXT(c.mastery_score)}`}>{c.concept}</p>
            {c.subject && <p className="text-xs text-gray-400 truncate mt-0.5">{c.subject}</p>}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Mastery</span>
                <span className={`text-xs font-bold ${MASTERY_TEXT(c.mastery_score)}`}>{c.mastery_score}%</span>
              </div>
              <div className="w-full bg-white bg-opacity-60 rounded-full h-1.5">
                <div className={`${MASTERY_COLOR(c.mastery_score)} h-1.5 rounded-full`} style={{ width: `${c.mastery_score}%` }} />
              </div>
            </div>
            {c.retention_score < c.mastery_score * 0.75 && (
              <p className="text-xs text-orange-500 mt-1">Fading</p>
            )}
            {c.struggle_count >= 3 && (
              <p className="text-xs text-red-500 mt-0.5">Struggling</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
