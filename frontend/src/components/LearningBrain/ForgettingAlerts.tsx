import React from 'react';
import { ForgettingAlert } from '@/types';
import { AlertTriangle, Clock, Brain } from 'lucide-react';

interface Props {
  alerts: ForgettingAlert[];
}

const URGENCY_STYLES = {
  critical: { border: 'border-red-200 bg-red-50', icon: 'text-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
  high:     { border: 'border-orange-200 bg-orange-50', icon: 'text-orange-500', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  medium:   { border: 'border-amber-200 bg-amber-50', icon: 'text-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
};

export function ForgettingAlerts({ alerts }: Props) {
  if (!alerts.length) {
    return (
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center space-x-2 mb-3">
          <Brain size={18} className="text-green-500" />
          <h3 className="font-semibold text-gray-800">Forgetting Alerts</h3>
        </div>
        <p className="text-sm text-green-600">All concepts are fresh — no forgetting detected.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center space-x-2 mb-4">
        <AlertTriangle size={18} className="text-amber-500" />
        <h3 className="font-semibold text-gray-800">Forgetting Alerts</h3>
        <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">{alerts.length}</span>
      </div>
      <div className="space-y-2">
        {alerts.map((a, i) => {
          const styles = URGENCY_STYLES[a.urgency] || URGENCY_STYLES.medium;
          return (
            <div key={i} className={`rounded-lg border p-3 ${styles.border}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm font-semibold ${styles.text}`}>{a.concept}</p>
                  {a.subject && <p className="text-xs text-gray-400">{a.subject}</p>}
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${styles.badge}`}>{a.urgency}</span>
              </div>
              <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <Clock size={11} />
                  <span>{a.days_since}d ago</span>
                </span>
                <span>Mastery: {a.mastery_score}%</span>
                <span>Retention: {Math.round(a.retention_score)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
