import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { DashboardLayout } from '@/components/Common/DashboardLayout';
import { Loading } from '@/components/Common/Loaders';
import {
  ProductivityGauge,
  ConsistencyHeatmap,
  SubjectStrengthChart,
  BurnoutMeter,
  WeeklyTrend,
  PatternInsights,
} from '@/components/Analytics';
import { analyticsService } from '@/services/analyticsService';
import { RefreshCw, Brain, Zap, MessageSquare, BookOpen, TrendingUp, AlertCircle } from 'lucide-react';

const DEPTH_LABEL: Record<string, string> = {
  simplified: 'Simplified — step-by-step breakdowns',
  standard:   'Standard — balanced explanations',
  advanced:   'Advanced — concise & technical',
};
const DEPTH_COLOR: Record<string, string> = {
  simplified: 'text-amber-600 bg-amber-50 border-amber-200',
  standard:   'text-blue-600 bg-blue-50 border-blue-200',
  advanced:   'text-purple-600 bg-purple-50 border-purple-200',
};
const DEP_LABEL: Record<string, { label: string; color: string }> = {
  low:    { label: 'Independent',   color: 'text-green-600' },
  normal: { label: 'Balanced',      color: 'text-blue-600' },
  high:   { label: 'Heavy Reliance', color: 'text-red-500' },
};

export default function Analytics() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { dashboard, loading, error, recompute } = useAnalytics(user?.id ?? null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      analyticsService.trackEvent(user.id, 'page_view', 'analytics');
    }
  }, [user?.id]);

  if (authLoading || !user) return <Loading />;

  const prefs = dashboard?.adaptive_prefs;
  const depCfg = DEP_LABEL[dashboard?.ai_dependency_level ?? 'normal'];

  return (
    <DashboardLayout onLogout={logout} title="Learning Analytics">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-secondary">Learning Intelligence</h2>
            <p className="text-sm text-gray-500 mt-0.5">Your academic behavior analyzed and adapted in real time</p>
          </div>
          <button
            onClick={recompute}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Computing…' : 'Recompute'}</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading && !dashboard && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <RefreshCw size={32} className="animate-spin mb-3" />
            <p className="text-sm">Analyzing your academic behavior patterns…</p>
          </div>
        )}

        {dashboard && (
          <>
            {/* ── Top Score Row ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center">
                <ProductivityGauge score={dashboard.productivity_score} label="Productivity" size={120} />
              </div>
              <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center">
                <ProductivityGauge score={dashboard.consistency_score} label="Consistency" size={120} />
              </div>
              <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center">
                <ProductivityGauge score={Math.max(0, 100 - dashboard.burnout_score)} label="Energy Level" size={120} />
              </div>
              {/* AI dependency card */}
              <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center justify-center text-center">
                <MessageSquare size={28} className="text-primary mb-2" />
                <p className={`text-lg font-bold ${depCfg.color}`}>{depCfg.label}</p>
                <p className="text-xs text-gray-400 mt-1">AI Usage Pattern</p>
              </div>
            </div>

            {/* ── Adaptive Mode Banner ── */}
            {prefs && (
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Brain size={18} className="text-indigo-600" />
                  <h3 className="text-sm font-bold text-indigo-800">Adaptive Mode — Active</h3>
                  {prefs.recovery_mode && (
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Recovery Mode ON</span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-[10px] text-indigo-500 font-semibold uppercase mb-1">AI Response Style</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded border ${DEPTH_COLOR[prefs.explanation_depth]}`}>
                      {DEPTH_LABEL[prefs.explanation_depth]}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-indigo-500 font-semibold uppercase mb-1">Session Length</p>
                    <span className="text-xs font-medium text-indigo-700 capitalize">{prefs.session_length} sessions recommended</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-indigo-500 font-semibold uppercase mb-1">Example Frequency</p>
                    <span className="text-xs font-medium text-indigo-700 capitalize">{prefs.example_frequency} examples in answers</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-indigo-500 font-semibold uppercase mb-1">Focus Areas</p>
                    {prefs.focus_subjects.length > 0
                      ? <span className="text-xs font-medium text-indigo-700">{prefs.focus_subjects.slice(0, 2).join(', ')}</span>
                      : <span className="text-xs text-gray-400">None detected yet</span>
                    }
                  </div>
                </div>
                <p className="text-[10px] text-indigo-400 mt-3">
                  These settings are automatically applied to every AI response and your study schedule. No configuration needed.
                </p>
              </div>
            )}

            {/* ── Activity Heatmap + Weekly Trend ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <Zap size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold text-gray-700">28-Day Activity Heatmap</h3>
                </div>
                <ConsistencyHeatmap data={dashboard.heatmap_data} />
              </div>

              <div className="bg-white rounded-xl shadow p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold text-gray-700">Weekly Completion Trend</h3>
                </div>
                <WeeklyTrend data={dashboard.weekly_trends} />
              </div>
            </div>

            {/* ── Burnout + Subject Analysis ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BurnoutMeter score={dashboard.burnout_score} consistencyScore={dashboard.consistency_score} />

              <div className="bg-white rounded-xl shadow p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <BookOpen size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold text-gray-700">Subject Strength Analysis</h3>
                </div>
                <SubjectStrengthChart subjects={dashboard.subject_analysis} />
              </div>
            </div>

            {/* ── Top Asked Topics ── */}
            {dashboard.top_topics.length > 0 && (
              <div className="bg-white rounded-xl shadow p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <MessageSquare size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold text-gray-700">Most-Asked Topics</h3>
                  <span className="text-xs text-gray-400">(last 30 days)</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {dashboard.top_topics.map((t) => (
                    <div key={t.topic} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-sm font-semibold text-gray-800 truncate">{t.topic}</p>
                      <p className="text-2xl font-bold text-primary mt-1">{t.count}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <p className="text-[10px] text-gray-400">questions</p>
                        {t.is_repeat_heavy && (
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1 rounded">repeated</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Pattern Insights + Recommendations ── */}
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center space-x-2 mb-4">
                <Brain size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-gray-700">Pattern Analysis & Recommendations</h3>
              </div>
              <PatternInsights patterns={dashboard.patterns} recommendations={dashboard.recommendations} />
            </div>

            {/* ── Weak Topics Table ── */}
            {dashboard.weak_topics.length > 0 && (
              <div className="bg-white rounded-xl shadow p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <AlertCircle size={16} className="text-amber-500" />
                  <h3 className="text-sm font-semibold text-gray-700">Recurring Struggle Topics</h3>
                  <span className="text-xs text-gray-400">Topics you have asked about repeatedly</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                        <th className="pb-2 font-medium">Topic</th>
                        <th className="pb-2 font-medium">Times Asked</th>
                        <th className="pb-2 font-medium">Course</th>
                        <th className="pb-2 font-medium">Last Asked</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {dashboard.weak_topics.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="py-2 font-medium text-gray-800">{t.topic}</td>
                          <td className="py-2">
                            <span className={`font-bold ${t.question_count >= 5 ? 'text-red-500' : t.question_count >= 3 ? 'text-amber-500' : 'text-gray-600'}`}>
                              {t.question_count}×
                            </span>
                          </td>
                          <td className="py-2 text-gray-500">{t.course ?? '—'}</td>
                          <td className="py-2 text-gray-400 text-xs">
                            {new Date(t.last_asked).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty state — first visit */}
            {dashboard.patterns.length === 0 && dashboard.top_topics.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow">
                <Brain size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Start building your learning profile</p>
                <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                  As you chat, complete tasks, and use the planner, Busla automatically tracks your patterns and adapts to your learning style.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
