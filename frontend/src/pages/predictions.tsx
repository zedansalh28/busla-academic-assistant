import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { usePredictions } from '@/hooks/usePredictions';
import { DashboardLayout } from '@/components/Common/DashboardLayout';
import { Loading } from '@/components/Common/Loaders';
import {
  RiskScoreCard,
  RadarChart,
  PredictionTimeline,
  InterventionCard,
  ExplainabilityPanel,
} from '@/components/Predictions';
import { analyticsService } from '@/services/analyticsService';
import { RefreshCw, TrendingDown, TrendingUp, Minus, AlertTriangle } from 'lucide-react';

const HEALTH_CONFIG: Record<string, { label: string; bg: string; border: string; text: string }> = {
  healthy:  { label: 'Healthy',   bg: 'bg-emerald-950/40', border: 'border-emerald-500/40', text: 'text-emerald-400' },
  moderate: { label: 'Moderate',  bg: 'bg-yellow-950/30',  border: 'border-yellow-500/40',  text: 'text-yellow-400' },
  at_risk:  { label: 'At Risk',   bg: 'bg-orange-950/40',  border: 'border-orange-500/40',  text: 'text-orange-400' },
  critical: { label: 'Critical',  bg: 'bg-red-950/40',     border: 'border-red-500/40',     text: 'text-red-400' },
};

function TrendIcon({ direction }: { direction: string }) {
  if (direction === 'improving') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  if (direction === 'declining') return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
}

export default function Predictions() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { prediction, timeline, loading, recomputing, error, recompute, acknowledgeIntervention } =
    usePredictions(user?.id ?? null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      analyticsService.trackEvent(user.id, 'page_view', 'predictions');
    }
  }, [user?.id]);

  if (authLoading || !user) return <Loading />;

  const health = HEALTH_CONFIG[prediction?.overallHealth ?? 'healthy'];
  const activeInterventions = prediction?.interventions?.filter(iv => iv.acknowledged !== 1) ?? [];
  const criticalCount = activeInterventions.filter(iv => iv.urgency >= 4).length;

  const radarAxes = prediction ? [
    { label: 'Failure', value: prediction.failureRisk, color: '#ef4444' },
    { label: 'Burnout', value: prediction.burnoutProbability, color: '#f59e0b' },
    { label: 'Schedule', value: prediction.scheduleCollapseRisk, color: '#f97316' },
    { label: 'Exam', value: prediction.examFailureRisk, color: '#a855f7' },
    { label: 'Productivity', value: prediction.productivityDeclineRisk, color: '#3b82f6' },
    { label: 'Recovery', value: 100 - prediction.recoveryPotential, color: '#10b981' },
  ] : [];

  const factorGroups = prediction ? [
    { label: 'Failure Risk', key: 'failure', score: prediction.failureRisk, factors: prediction.factors?.failure ?? [] },
    { label: 'Burnout Probability', key: 'burnout', score: prediction.burnoutProbability, factors: prediction.factors?.burnout ?? [] },
    { label: 'Schedule Collapse', key: 'schedule', score: prediction.scheduleCollapseRisk, factors: prediction.factors?.schedule ?? [] },
    { label: 'Exam Failure', key: 'exam', score: prediction.examFailureRisk, factors: prediction.factors?.exam ?? [] },
    { label: 'Productivity Decline', key: 'productivity', score: prediction.productivityDeclineRisk, factors: prediction.factors?.productivity ?? [] },
    { label: 'Recovery Potential', key: 'recovery', score: prediction.recoveryPotential, factors: prediction.factors?.recovery ?? [] },
  ] : [];

  return (
    <DashboardLayout onLogout={logout} title="Academic Predictions">
      <div className="space-y-6 max-w-5xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">AI Prediction Engine</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Real-time academic performance forecasting based on your behavioral patterns
            </p>
          </div>
          <button
            onClick={recompute}
            disabled={recomputing || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-300 text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${recomputing ? 'animate-spin' : ''}`} />
            {recomputing ? 'Recomputing...' : 'Force Recompute'}
          </button>
        </div>

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        {loading && !prediction && (
          <div className="text-center py-12 text-gray-500">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
            Computing your academic predictions...
          </div>
        )}

        {prediction && (
          <>
            {/* ── Overall Health Banner ──────────────────────────────────── */}
            <div className={`rounded-xl border p-5 ${health.bg} ${health.border}`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-lg font-bold ${health.text}`}>
                      Academic Health: {health.label}
                    </span>
                    <TrendIcon direction={prediction.trendDirection} />
                    <span className="text-xs text-gray-400 capitalize">{prediction.trendDirection}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Overall risk score: <span className="text-white font-semibold">{prediction.overallScore}/100</span>
                    {' '}· Confidence: <span className="text-white font-semibold">{prediction.confidenceScore}%</span>
                    {criticalCount > 0 && (
                      <span className="ml-2 text-red-400 font-semibold">
                        ⚠ {criticalCount} critical intervention{criticalCount > 1 ? 's' : ''} require attention
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-4xl font-black text-white/20 tabular-nums">
                  {prediction.overallScore}
                </div>
              </div>
            </div>

            {/* ── Risk Score Cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <RiskScoreCard label="Failure Risk" score={prediction.failureRisk} icon="📉" />
              <RiskScoreCard label="Burnout" score={prediction.burnoutProbability} icon="🔥" />
              <RiskScoreCard label="Schedule Collapse" score={prediction.scheduleCollapseRisk} icon="📅" />
              <RiskScoreCard label="Exam Failure" score={prediction.examFailureRisk} icon="📝" />
              <RiskScoreCard label="Productivity Decline" score={prediction.productivityDeclineRisk} icon="⚡" />
              <RiskScoreCard
                label="Recovery Potential"
                score={prediction.recoveryPotential}
                icon="💚"
                invert={true}
                subtitle="Higher is better"
              />
            </div>

            {/* ── Radar Chart + Recovery Plan ────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/3 p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Risk Profile Radar</h3>
                <RadarChart axes={radarAxes} size={240} />
                <p className="text-xs text-gray-500 text-center mt-2">
                  Larger area = higher risk. Recovery axis shows inverse (larger = less potential).
                </p>
              </div>

              {prediction.recovery_plan && (
                <div className="rounded-xl border border-white/10 bg-white/3 p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">
                    {prediction.recovery_plan.title}
                  </h3>
                  <div className="space-y-2.5">
                    {prediction.recovery_plan.steps.map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
                          <span className="text-xs text-indigo-400 font-bold">{i + 1}</span>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-indigo-300 mb-0.5">{step.day}</div>
                          <div className="text-xs text-gray-300 leading-relaxed">{step.action}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Interventions ─────────────────────────────────────────── */}
            {activeInterventions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">
                  Active Interventions
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    ({activeInterventions.length} action{activeInterventions.length > 1 ? 's' : ''})
                  </span>
                </h3>
                <div className="space-y-3">
                  {activeInterventions.map((iv, i) => (
                    <InterventionCard
                      key={iv.id || i}
                      intervention={iv}
                      onAcknowledge={acknowledgeIntervention}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── 8-Week Timeline ────────────────────────────────────────── */}
            <div className="rounded-xl border border-white/10 bg-white/3 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">8-Week Prediction History</h3>
              <PredictionTimeline timeline={timeline} />
            </div>

            {/* ── Explainability Panel ──────────────────────────────────── */}
            <div className="rounded-xl border border-white/10 bg-white/3 p-5">
              <h3 className="text-sm font-semibold text-white mb-1">Why These Scores?</h3>
              <p className="text-xs text-gray-500 mb-4">
                Expand any category to see the exact factors driving each prediction score.
              </p>
              <ExplainabilityPanel factorGroups={factorGroups} />
            </div>

            {/* ── Last Computed ─────────────────────────────────────────── */}
            {prediction.computed_at && (
              <p className="text-xs text-gray-600 text-center pb-2">
                Last computed: {new Date(prediction.computed_at).toLocaleString()}
              </p>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
