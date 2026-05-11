import React from 'react';
import { ExplanationEffectiveness, StudentLearningProfile } from '@/types';
import { Lightbulb } from 'lucide-react';

interface Props {
  effectiveness: ExplanationEffectiveness[];
  profile: StudentLearningProfile | null;
}

const EXPLANATION_LABELS: Record<string, string> = {
  example_based: 'Example-Based',
  step_by_step: 'Step-by-Step',
  theoretical: 'Theoretical',
  analogy: 'Analogy',
  practice: 'Practice Problems',
  standard: 'Standard',
};

export function ExplanationProfile({ effectiveness, profile }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center space-x-2 mb-4">
        <Lightbulb size={18} className="text-violet-500" />
        <h3 className="font-semibold text-gray-800">Explanation Style Profile</h3>
      </div>

      {profile && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-violet-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Preferred Style</p>
            <p className="text-sm font-semibold text-violet-700 mt-0.5 capitalize">
              {EXPLANATION_LABELS[profile.preferred_explanation] || profile.preferred_explanation}
            </p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Preferred Depth</p>
            <p className="text-sm font-semibold text-indigo-700 mt-0.5 capitalize">{profile.preferred_depth}</p>
          </div>
        </div>
      )}

      {effectiveness.length > 0 ? (
        <div className="space-y-2">
          {effectiveness.map(e => (
            <div key={e.explanation_type}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">{EXPLANATION_LABELS[e.explanation_type] || e.explanation_type}</span>
                <span className="text-xs font-semibold text-gray-700">{Math.round(e.effectiveness_score)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-violet-500 h-1.5 rounded-full"
                  style={{ width: `${e.effectiveness_score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">Effectiveness data builds up as you chat. Ask follow-up questions to signal what works.</p>
      )}
    </div>
  );
}
