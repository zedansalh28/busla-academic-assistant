import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { useMemory } from '@/hooks/useMemory';
import { DashboardLayout } from '@/components/Common/DashboardLayout';
import { Loading } from '@/components/Common/Loaders';
import {
  ConceptMasteryGrid,
  ForgettingAlerts,
  ExplanationProfile,
  KnowledgeGapMap,
  RevisionPanel,
  LearningEvolution,
} from '@/components/LearningBrain';
import { Brain, RefreshCw, AlertCircle, BookOpen, Target, TrendingUp } from 'lucide-react';

export default function LearningBrain() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { dashboard, loading, recomputing, error, recompute } = useMemory(user?.id ?? null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [authLoading, user, router]);

  if (authLoading || !user) return <Loading />;

  const summary = dashboard?.summary;

  return (
    <DashboardLayout onLogout={logout} title="Learning Brain">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Brain size={22} className="text-indigo-500" />
              <h2 className="text-2xl font-bold text-secondary">AI Learning Brain</h2>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Long-term academic memory — concept mastery, forgetting detection, spaced revision, knowledge gaps
            </p>
          </div>
          <button
            onClick={recompute}
            disabled={recomputing || loading}
            className="flex items-center space-x-2 text-sm text-indigo-600 border border-indigo-200 rounded-lg px-3 py-2 hover:bg-indigo-50 disabled:opacity-50 transition"
          >
            <RefreshCw size={14} className={recomputing ? 'animate-spin' : ''} />
            <span>{recomputing ? 'Recomputing…' : 'Recompute'}</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading && !dashboard ? (
          <Loading />
        ) : !dashboard || !summary?.total_concepts ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <Brain size={40} className="text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-600 mb-1">No memory yet</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              Start chatting with Busla about your subjects. Every conversation builds your academic memory — concept mastery, struggle detection, and personalized revision priorities.
            </p>
            <button onClick={() => router.push('/chat')} className="mt-4 btn-primary text-sm">
              Start Chatting
            </button>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <div className="text-3xl font-bold text-indigo-600">{summary.total_concepts}</div>
                <p className="text-xs text-gray-500 mt-1 flex items-center justify-center space-x-1">
                  <BookOpen size={11} /><span>Concepts</span>
                </p>
              </div>
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{summary.avg_mastery}%</div>
                <p className="text-xs text-gray-500 mt-1 flex items-center justify-center space-x-1">
                  <Target size={11} /><span>Avg Mastery</span>
                </p>
              </div>
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <div className="text-3xl font-bold text-amber-500">{summary.forgetting_count}</div>
                <p className="text-xs text-gray-500 mt-1">Forgetting</p>
              </div>
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <div className="text-3xl font-bold text-red-500">{summary.gap_count}</div>
                <p className="text-xs text-gray-500 mt-1 flex items-center justify-center space-x-1">
                  <TrendingUp size={11} /><span>Gaps</span>
                </p>
              </div>
            </div>

            {/* Profile banner */}
            {dashboard.profile && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Learning Style: </span>
                    <span className="font-semibold text-indigo-700 capitalize">{dashboard.profile.preferred_explanation.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Depth: </span>
                    <span className="font-semibold text-indigo-700 capitalize">{dashboard.profile.preferred_depth}</span>
                  </div>
                  {dashboard.profile.strongest_subject && (
                    <div>
                      <span className="text-gray-500">Strongest: </span>
                      <span className="font-semibold text-green-700">{dashboard.profile.strongest_subject}</span>
                    </div>
                  )}
                  {dashboard.profile.weakest_subject && (
                    <div>
                      <span className="text-gray-500">Needs work: </span>
                      <span className="font-semibold text-red-600">{dashboard.profile.weakest_subject}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Learning velocity: </span>
                    <span className="font-semibold text-indigo-700">{dashboard.profile.learning_velocity.toFixed(1)} pts/day</span>
                  </div>
                </div>
              </div>
            )}

            {/* Main grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ForgettingAlerts alerts={dashboard.forgetting_alerts} />
              <RevisionPanel queue={dashboard.revision_queue} />
            </div>

            <ConceptMasteryGrid concepts={dashboard.concepts} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <KnowledgeGapMap gaps={dashboard.knowledge_gaps} />
              <ExplanationProfile
                effectiveness={dashboard.explanation_effectiveness}
                profile={dashboard.profile}
              />
            </div>

            <LearningEvolution snapshots={dashboard.snapshots} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
