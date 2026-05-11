import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { usePlans } from '@/hooks/usePlans';
import { useRecommendations } from '@/hooks/usePlans';
import { DashboardLayout } from '@/components/Common/DashboardLayout';
import { ProfileSummary, RecommendationsCard } from '@/components/Dashboard';
import { Loading } from '@/components/Common/Loaders';
import { sessionService } from '@/services/sessionService';
import { riskService } from '@/services/riskService';
import { optimizerService } from '@/services/optimizerService';
import { RiskAssessment, GeneratedSchedule } from '@/types';
import { Plus, FlaskConical, AlertTriangle, Calendar, Shield, ArrowRight, CheckCircle, BrainCircuit, BarChart2 } from 'lucide-react';
import { predictionsService } from '@/services/predictionsService';
import { analyticsService } from '@/services/analyticsService';
import { AcademicPrediction } from '@/types';

const RISK_COLOR: Record<string, string> = {
  low: 'text-green-600',
  medium: 'text-amber-600',
  high: 'text-red-600',
};
const RISK_BG: Record<string, string> = {
  low: 'bg-green-50 border-green-200',
  medium: 'bg-amber-50 border-amber-200',
  high: 'bg-red-50 border-red-200',
};
const RISK_BAR: Record<string, string> = {
  low: 'bg-green-400',
  medium: 'bg-amber-400',
  high: 'bg-red-500',
};

export default function Dashboard() {
  const router = useRouter();
  const { user, authUser, loading, logout } = useAuth();
  const { plans } = usePlans(user?.id || null);
  const { recommendations, loading: recsLoading } = useRecommendations(user?.id || null);
  const [riskData, setRiskData] = useState<RiskAssessment | null>(null);
  const [schedule, setSchedule] = useState<GeneratedSchedule | null>(null);
  const [prediction, setPrediction] = useState<AcademicPrediction | null>(null);
  const isDemo = sessionService.isDemoMode();

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  // Load latest risk + schedule in background
  useEffect(() => {
    if (!user) return;
    riskService.getLatest(user.id).then(r => { if (r) setRiskData(r); });
    optimizerService.getLatest(user.id).then(s => { if (s) setSchedule(s); });
    predictionsService.getPrediction(user.id).then(p => { if (p) setPrediction(p); }).catch(() => {});
    analyticsService.trackEvent(user.id, 'page_view', undefined, { page: 'dashboard' });
  }, [user?.id]);

  if (loading || !user) return <Loading />;

  const completedPlans = plans.filter(p => p.progress === 100).length;
  const totalPlans = plans.length;
  const avgProgress = plans.length ? Math.round(plans.reduce((s, p) => s + p.progress, 0) / plans.length) : 0;

  // Next study block from schedule
  const nextBlock = schedule?.blocks?.[0];
  const displayName = authUser?.display_name || user.major?.split(' ')[0] || 'Student';

  return (
    <DashboardLayout onLogout={logout} title="Dashboard">
      <div className="space-y-6">

        {/* Demo banner */}
        {isDemo && (
          <div className="flex items-center space-x-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            <FlaskConical size={18} className="flex-shrink-0 text-amber-600" />
            <span>
              <strong>Demo Mode</strong> — Sample SCE student profile loaded. Click <strong>Logout</strong> to start fresh or{' '}
              <a href="/signup" className="underline font-medium">sign up</a> to create your own account.
            </span>
          </div>
        )}

        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold text-secondary">Welcome back, {displayName} 👋</h2>
          <p className="text-sm text-gray-500 mt-0.5">{user.major} • {user.year} Year</p>
        </div>

        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-3xl font-bold text-primary">{totalPlans}</div>
            <p className="text-xs text-gray-500 mt-1">Study Plans</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-3xl font-bold text-accent">{completedPlans}</div>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-3xl font-bold text-indigo-600">{avgProgress}%</div>
            <p className="text-xs text-gray-500 mt-1">Avg. Progress</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-3xl font-bold text-secondary">{user.year}</div>
            <p className="text-xs text-gray-500 mt-1">Academic Year</p>
          </div>
        </div>

        {/* ── AI Feature Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Academic Load Card */}
          <div
            onClick={() => router.push('/risk')}
            className={`rounded-xl border shadow p-5 cursor-pointer hover:shadow-md transition-shadow ${riskData ? RISK_BG[riskData.level] : 'bg-white border-gray-200'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Shield size={20} className={riskData ? RISK_COLOR[riskData.level] : 'text-gray-400'} />
                <span className="font-semibold text-gray-800 text-sm">Academic Load Check</span>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
            </div>
            {riskData ? (
              <>
                <div className="flex items-baseline space-x-2 mb-2">
                  <span className={`text-3xl font-bold ${RISK_COLOR[riskData.level]}`}>{riskData.score}</span>
                  <span className="text-sm text-gray-500">/100 — <span className={`font-semibold ${RISK_COLOR[riskData.level]} capitalize`}>{riskData.level} load</span></span>
                </div>
                <div className="w-full bg-white bg-opacity-60 rounded-full h-1.5">
                  <div className={`${RISK_BAR[riskData.level]} h-1.5 rounded-full`} style={{ width: `${riskData.score}%` }} />
                </div>
                {riskData.factors[0] && <p className="text-xs text-gray-600 mt-2">Top factor: {riskData.factors[0].label}</p>}
              </>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-gray-500">No assessment yet</p>
                <p className="text-xs text-gray-400 mt-1">Click to run your first academic load check →</p>
              </div>
            )}
          </div>

          {/* Schedule Card */}
          <div
            onClick={() => router.push('/optimizer')}
            className="bg-white border border-gray-200 rounded-xl shadow p-5 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Calendar size={20} className="text-primary" />
                <span className="font-semibold text-gray-800 text-sm">Study Schedule</span>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
            </div>
            {nextBlock ? (
              <>
                <p className="text-xs text-gray-500 mb-2">Next session:</p>
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  <p className="text-sm font-semibold text-blue-700">{nextBlock.course_name}</p>
                  <p className="text-xs text-blue-500">{nextBlock.day} {nextBlock.start_time}–{nextBlock.end_time}</p>
                </div>
                <p className="text-xs text-gray-400 mt-2">{schedule!.blocks.length} sessions scheduled this week</p>
              </>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-gray-500">No schedule generated</p>
                <p className="text-xs text-gray-400 mt-1">Click to generate your smart weekly schedule →</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Intelligence Suite Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Prediction Engine Card */}
          <div
            onClick={() => router.push('/predictions')}
            className="bg-white border border-gray-200 rounded-xl shadow p-5 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <BrainCircuit size={20} className="text-indigo-500" />
                <span className="font-semibold text-gray-800 text-sm">AI Prediction Engine</span>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
            </div>
            {prediction ? (
              <>
                <div className="flex items-baseline space-x-2 mb-2">
                  <span className={`text-3xl font-bold ${prediction.overallHealth === 'critical' ? 'text-red-600' : prediction.overallHealth === 'at_risk' ? 'text-orange-500' : prediction.overallHealth === 'moderate' ? 'text-amber-500' : 'text-green-600'}`}>
                    {prediction.overallHealth === 'healthy' ? '✓' : prediction.overallScore}
                  </span>
                  <span className="text-sm text-gray-500 capitalize">{prediction.overallHealth.replace('_', ' ')} health</span>
                </div>
                <p className="text-xs text-gray-400">Failure risk: {prediction.failureRisk}% · Burnout: {prediction.burnoutProbability}%</p>
              </>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-gray-500">Real-time academic forecasting</p>
                <p className="text-xs text-gray-400 mt-1">6 predictive scores • interventions • recovery plans →</p>
              </div>
            )}
          </div>

          {/* Analytics Card */}
          <div
            onClick={() => router.push('/analytics')}
            className="bg-white border border-gray-200 rounded-xl shadow p-5 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <BarChart2 size={20} className="text-violet-500" />
                <span className="font-semibold text-gray-800 text-sm">Learning Analytics</span>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">Behavioral intelligence engine</p>
              <p className="text-xs text-gray-400 mt-1">Study patterns • adaptive AI • subject analysis →</p>
            </div>
          </div>
        </div>

        {/* Plan progress alert */}
        {plans.length > 0 && avgProgress < 50 && (
          <div className="flex items-start space-x-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Study plans need attention</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Average plan progress is {avgProgress}%. Consider running the <a href="/optimizer" className="underline">Schedule Optimizer</a> to redistribute your workload.
              </p>
            </div>
          </div>
        )}

        {plans.length > 0 && avgProgress === 100 && (
          <div className="flex items-start space-x-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">All your study plans are completed. Excellent work!</p>
          </div>
        )}

        <ProfileSummary user={user} onEdit={() => router.push('/profile')} />

        <RecommendationsCard recommendations={recommendations} loading={recsLoading} />

        <div className="flex justify-center pt-2">
          <button onClick={() => router.push('/planner')} className="btn-primary flex items-center space-x-2">
            <Plus size={18} />
            <span>Create Study Plan</span>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
