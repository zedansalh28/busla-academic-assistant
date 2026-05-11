import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/Common/DashboardLayout';
import { Loading } from '@/components/Common/Loaders';
import { riskService } from '@/services/riskService';
import { RiskAssessment, OptimizerCourse } from '@/types';
import { AlertTriangle, CheckCircle, RefreshCw, ArrowRight, Shield } from 'lucide-react';

const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard', 'very hard'] as const;

const LEVEL_CONFIG = {
  low:    { color: 'green',  bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-700',  bar: 'bg-green-400',  label: 'Low Load',    icon: CheckCircle },
  medium: { color: 'amber',  bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700',  bar: 'bg-amber-400',  label: 'Medium Load', icon: AlertTriangle },
  high:   { color: 'red',    bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',    bar: 'bg-red-500',    label: 'High Load',   icon: AlertTriangle },
};

export default function RiskPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [courses, setCourses] = useState<OptimizerCourse[]>([{ name: '', difficulty: 'medium' }]);
  const [hours, setHours] = useState(15);
  const [upcomingExams, setUpcomingExams] = useState(0);
  const [daysToExam, setDaysToExam] = useState(30);
  const [stressLevel, setStressLevel] = useState(3);
  const [hasFinalProject, setHasFinalProject] = useState(false);

  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [recoveryPlan, setRecoveryPlan] = useState<{ title: string; steps: { day: string; action: string }[] } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  if (authLoading || !user) return <Loading />;

  const validCourses = courses.filter(c => c.name.trim());

  const handleAnalyze = async () => {
    setError('');
    setAnalyzing(true);
    setRecoveryPlan(null);
    try {
      const result = await riskService.analyze(user.id, {
        active_courses: validCourses,
        available_hours: hours,
        upcoming_exams: upcomingExams,
        days_until_nearest_exam: daysToExam,
        self_stress_level: stressLevel,
        has_final_project: hasFinalProject,
        academic_stage: user.year,
      });
      setAssessment(result);
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRecoveryPlan = async () => {
    if (!assessment) return;
    setLoadingPlan(true);
    try {
      const plan = await riskService.getRecoveryPlan(user.id, assessment.score, assessment.level, assessment.factors);
      setRecoveryPlan(plan);
    } catch {
      setError('Failed to generate recovery plan.');
    } finally {
      setLoadingPlan(false);
    }
  };

  const cfg = assessment ? LEVEL_CONFIG[assessment.level] : null;

  return (
    <DashboardLayout onLogout={logout} title="Academic Load Check">
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-secondary flex items-center space-x-2">
            <Shield size={24} className="text-primary" />
            <span>Academic Load Check</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Answer a few questions about your current semester. Busla will calculate your academic load score and suggest actions — not a diagnosis, just a helpful self-check.
          </p>
          <p className="text-xs text-gray-400 mt-1 italic">
            Busla uses only the information you enter here. No official grades or college records are accessed.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── LEFT: Input Form ── */}
          <div className="space-y-5">
            {/* Courses */}
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Active Courses This Semester</h3>
              <div className="space-y-2">
                {courses.map((c, i) => (
                  <div key={i} className="flex space-x-2">
                    <input
                      value={c.name}
                      onChange={e => { const nc = [...courses]; nc[i].name = e.target.value; setCourses(nc); }}
                      placeholder={`Course ${i + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                    />
                    <select
                      value={c.difficulty}
                      onChange={e => { const nc = [...courses]; nc[i].difficulty = e.target.value as OptimizerCourse['difficulty']; setCourses(nc); }}
                      className="px-2 py-2 border border-gray-300 rounded-lg text-xs"
                    >
                      {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {courses.length > 1 && (
                      <button onClick={() => setCourses(courses.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 px-1 text-sm">✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => setCourses([...courses, { name: '', difficulty: 'medium' }])} className="text-xs text-primary hover:underline">+ Add course</button>
              </div>
            </div>

            {/* Time & Exams */}
            <div className="bg-white rounded-xl shadow p-5 space-y-4">
              <h3 className="font-semibold text-gray-800">Time & Exams</h3>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Available study hours/week: <strong>{hours}h</strong></label>
                <input type="range" min={2} max={40} value={hours} onChange={e => setHours(+e.target.value)} className="w-full accent-primary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Upcoming exams (count)</label>
                  <input type="number" min={0} max={10} value={upcomingExams} onChange={e => setUpcomingExams(+e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Days until nearest exam</label>
                  <input type="number" min={0} max={90} value={daysToExam} onChange={e => setDaysToExam(+e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
            </div>

            {/* Stress & Final Project */}
            <div className="bg-white rounded-xl shadow p-5 space-y-4">
              <h3 className="font-semibold text-gray-800">Self-Assessment</h3>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Stress level: <strong className={stressLevel >= 4 ? 'text-red-600' : stressLevel >= 3 ? 'text-amber-600' : 'text-green-600'}>
                    {['', 'Very Low', 'Low', 'Moderate', 'High', 'Very High'][stressLevel]}
                  </strong>
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setStressLevel(n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${stressLevel === n ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary'}`}>
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Low</span><span>Very High</span></div>
              </div>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" checked={hasFinalProject} onChange={e => setHasFinalProject(e.target.checked)} className="w-4 h-4 text-primary" />
                <span className="text-sm text-gray-700">I have a Final Project this semester</span>
              </label>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full btn-primary py-3 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {analyzing ? <><RefreshCw size={18} className="animate-spin" /><span>Analyzing...</span></> : <><Shield size={18} /><span>Check My Academic Load</span></>}
            </button>
          </div>

          {/* ── RIGHT: Results ── */}
          <div className="space-y-4">
            {!assessment ? (
              <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
                <Shield size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Your load check will appear here</p>
                <p className="text-sm mt-1">Fill in your semester details and click Analyze</p>
              </div>
            ) : (
              <>
                {/* Score card */}
                <div className={`${cfg!.bg} ${cfg!.border} border rounded-xl p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Academic Load Score</p>
                      <p className={`text-4xl font-bold ${cfg!.text}`}>{assessment.score}<span className="text-lg font-normal">/100</span></p>
                    </div>
                    <div className={`px-4 py-2 ${cfg!.bg} ${cfg!.border} border rounded-full`}>
                      <span className={`font-bold text-sm ${cfg!.text}`}>{cfg!.label}</span>
                    </div>
                  </div>
                  <div className="w-full bg-white bg-opacity-60 rounded-full h-3">
                    <div className={`${cfg!.bar} h-3 rounded-full transition-all`} style={{ width: `${assessment.score}%` }} />
                  </div>
                </div>

                {/* Top risk factors */}
                <div className="bg-white rounded-xl shadow p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Main Load Factors</h3>
                  {assessment.factors.length === 0 ? (
                    <p className="text-sm text-green-600">No significant risk factors detected.</p>
                  ) : (
                    <div className="space-y-2">
                      {assessment.factors.slice(0, 5).map((f, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{f.label}</span>
                          <span className="text-xs text-gray-400 ml-auto">+{f.weight}pts</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-xl shadow p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Recommendations</h3>
                  <div className="space-y-2">
                    {assessment.recommendations.map((r, i) => (
                      <div key={i} className="flex items-start space-x-2">
                        <span className="text-primary mt-0.5 flex-shrink-0">→</span>
                        <span className="text-sm text-gray-700">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleRecoveryPlan}
                    disabled={loadingPlan}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-secondary text-white rounded-xl text-sm font-medium hover:bg-opacity-90 disabled:opacity-50"
                  >
                    {loadingPlan ? <RefreshCw size={16} className="animate-spin" /> : <Shield size={16} />}
                    <span>{loadingPlan ? 'Creating...' : 'Recovery Plan'}</span>
                  </button>
                  <button
                    onClick={() => router.push('/optimizer')}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 border border-primary text-primary rounded-xl text-sm font-medium hover:bg-blue-50"
                  >
                    <ArrowRight size={16} /><span>Open Optimizer</span>
                  </button>
                </div>

                {/* Recovery plan */}
                {recoveryPlan && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <h3 className="font-semibold text-indigo-800 mb-3">{recoveryPlan.title}</h3>
                    <div className="space-y-2">
                      {recoveryPlan.steps.map((step, i) => (
                        <div key={i} className="flex space-x-3">
                          <span className="text-xs font-bold text-indigo-600 w-16 flex-shrink-0">{step.day}</span>
                          <span className="text-sm text-indigo-800">{step.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
