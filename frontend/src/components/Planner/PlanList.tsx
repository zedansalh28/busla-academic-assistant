import React from 'react';
import { StudyPlan } from '@/types';
import { format } from 'date-fns';
import { Trash2, ChevronRight } from 'lucide-react';

interface PlanListProps {
  plans: StudyPlan[];
  onSelectPlan: (plan: StudyPlan) => void;
  onDeletePlan: (planId: string) => Promise<void>;
  loading?: boolean;
}

export const PlanList: React.FC<PlanListProps> = ({
  plans,
  onSelectPlan,
  onDeletePlan,
  loading = false,
}) => {
  if (!plans.length) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        <p className="text-lg">No study plans yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
        >
          <div className="p-4 border-l-4 border-primary">
            <h3 className="font-semibold text-lg text-secondary mb-1">{plan.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{plan.subject}</p>

            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{plan.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all"
                  style={{ width: `${plan.progress}%` }}
                ></div>
              </div>
            </div>

            {plan.deadline && (
              <p className="text-xs text-gray-500 mb-3">
                Due: {format(new Date(plan.deadline), 'MMM dd, yyyy')}
              </p>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => onSelectPlan(plan)}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-primary text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <span>View</span>
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${plan.title}"? This cannot be undone.`)) {
                    onDeletePlan(plan.id);
                  }
                }}
                disabled={loading}
                className="px-3 py-2 text-gray-400 hover:text-danger transition-colors disabled:opacity-50"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
