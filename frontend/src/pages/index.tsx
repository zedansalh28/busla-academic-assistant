import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/Common/Loaders';
import { storage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/utils/constants';
import {
  BookOpen, Zap, ArrowRight, Calendar, Shield, LogIn, UserPlus,
  Brain, BarChart2, BrainCircuit, MessageSquare, GraduationCap, ChevronRight,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, authUser, loading } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    if (!loading && (user || authUser)) {
      router.push('/dashboard');
    }
  }, [user, authUser, loading, router]);

  const handleDemoMode = async () => {
    setDemoLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/demo/load/0`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        storage.setItem(STORAGE_KEYS.USER_ID, data.userId);
        storage.setItem(STORAGE_KEYS.SESSION_ID, data.sessionId);
        localStorage.setItem(STORAGE_KEYS.IS_DEMO, 'true');
        window.location.reload();
      }
    } catch {
      alert('Failed to load demo. Is the backend running on port 3001?');
    } finally {
      setDemoLoading(false);
    }
  };

  if (loading) return <Loading message="Initializing Busla..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">

      {/* ── Navigation ── */}
      <nav className="bg-white bg-opacity-90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">Busla</span>
              <span className="text-xs text-gray-400 ml-2 hidden sm:inline">AI Academic Platform</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/login" className="flex items-center space-x-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">
              <LogIn size={15} />
              <span>Log In</span>
            </Link>
            <Link href="/signup" className="flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              <UserPlus size={15} />
              <span>Sign Up Free</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-12">
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-16">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-4 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>Final Year Project — SCE Sami Shamoon College of Engineering</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
            The Intelligent
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Academic Brain
            </span>
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto">
            Busla learns how you think, detects when you struggle, predicts academic risk before it happens,
            and adapts every response to your personal learning pattern.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/signup"
              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center space-x-2 group"
            >
              <span>Get Started Free</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={handleDemoMode}
              disabled={demoLoading}
              className="px-8 py-3.5 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span className="text-blue-600">▶</span>
              <span>{demoLoading ? 'Loading Demo…' : 'Try Live Demo'}</span>
            </button>
          </div>
          <p className="text-xs text-gray-400">
            No account needed for demo · Privacy-first · No official college data accessed
          </p>
        </div>

        {/* ── 3 Intelligence Systems ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: Brain,
              color: 'indigo',
              badge: 'System 1',
              title: 'AI Learning Brain',
              desc: 'Tracks concept mastery across 27 engineering topics. Detects forgetting via Ebbinghaus decay. Generates spaced-repetition revision priorities. Knowledge gaps auto-detected from prerequisites.',
              stats: ['27 concepts tracked', 'Ebbinghaus retention', 'Auto revision queue'],
            },
            {
              icon: BrainCircuit,
              color: 'violet',
              badge: 'System 2',
              title: 'Predictive Performance Engine',
              desc: '6-dimensional academic health scoring. Predicts failure risk, burnout probability, and schedule collapse before they happen. Generates personalized interventions and recovery plans.',
              stats: ['6 risk scores', 'Live interventions', '8-week trend history'],
            },
            {
              icon: BarChart2,
              color: 'blue',
              badge: 'System 3',
              title: 'Adaptive Intelligence Engine',
              desc: 'Analyzes study behavior patterns in real time. Adapts AI explanation depth, session length, and example frequency based on individual behavioral signals — automatically.',
              stats: ['Real-time adaptation', 'Behavior heatmaps', 'Pattern recognition'],
            },
          ].map(({ icon: Icon, color, badge, title, desc, stats }) => (
            <div key={title} className={`bg-white rounded-2xl border border-${color}-100 shadow-sm p-6 hover:shadow-md transition-shadow`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center`}>
                  <Icon size={24} className={`text-${color}-600`} />
                </div>
                <span className={`text-xs font-semibold text-${color}-600 bg-${color}-50 px-2 py-1 rounded-full`}>{badge}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{desc}</p>
              <ul className="space-y-1">
                {stats.map(s => (
                  <li key={s} className="flex items-center space-x-2 text-xs text-gray-500">
                    <div className={`w-1.5 h-1.5 rounded-full bg-${color}-500`} />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Platform Features ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Full Academic Platform</h2>
          <p className="text-gray-500 text-sm text-center mb-8">Six integrated tools, one intelligence layer</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { icon: MessageSquare, title: 'AI Chat Assistant', desc: 'LLM-powered academic chat adapted to your memory profile and learning style', color: 'blue' },
              { icon: Calendar, title: 'Study Schedule Optimizer', desc: 'Weekly schedule generation that integrates risk, forgetting alerts, and weak subjects', color: 'indigo' },
              { icon: Shield, title: 'Academic Load Check', desc: 'Instant risk assessment based on courses, exams, tasks, and stress level', color: 'amber' },
              { icon: GraduationCap, title: 'Course Assistant', desc: 'Upload lecture notes and PDFs — chat with AI about your specific course material', color: 'green' },
              { icon: BookOpen, title: 'Study Planner', desc: 'Create study plans with milestones and tasks, tracked for progress and overdue detection', color: 'violet' },
              { icon: Zap, title: 'Personalized Recommendations', desc: 'AI-generated topic recommendations based on your behavior and mastery gaps', color: 'orange' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex items-start space-x-3">
                <div className={`w-9 h-9 bg-${color}-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon size={17} className={`text-${color}-600`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Live Preview Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {/* Memory Brain preview */}
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 text-white flex items-center space-x-2">
              <Brain size={18} />
              <span className="font-semibold text-sm">Learning Brain — Concept Mastery</span>
            </div>
            <div className="p-5 space-y-3">
              {[
                { concept: 'OOP', subject: 'Programming', mastery: 78, status: 'Mastered', statusColor: 'text-green-600', bar: 'bg-green-500' },
                { concept: 'Recursion', subject: 'Programming', mastery: 68, status: 'Good', statusColor: 'text-blue-600', bar: 'bg-blue-500' },
                { concept: 'Dynamic Programming', subject: 'Programming', mastery: 32, status: 'Struggling', statusColor: 'text-red-600', bar: 'bg-red-500' },
                { concept: 'Integrals', subject: 'Calculus', mastery: 55, status: 'Improving', statusColor: 'text-amber-600', bar: 'bg-amber-500' },
              ].map(c => (
                <div key={c.concept}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{c.concept}</span>
                      <span className="text-xs text-gray-400 ml-2">{c.subject}</span>
                    </div>
                    <span className={`text-xs font-semibold ${c.statusColor}`}>{c.mastery}% — {c.status}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className={`${c.bar} h-1.5 rounded-full`} style={{ width: `${c.mastery}%` }} />
                  </div>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center space-x-2">
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">⚠ Forgetting Alert: Limits (25d inactive)</span>
              </div>
            </div>
          </div>

          {/* Prediction Engine preview */}
          <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3.5 text-white flex items-center space-x-2">
              <BrainCircuit size={18} />
              <span className="font-semibold text-sm">Prediction Engine — Academic Health</span>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-xl">
                <span className="text-sm font-semibold text-orange-800">Overall Health</span>
                <span className="text-sm font-bold text-orange-600">At Risk — 54/100</span>
              </div>
              {[
                { label: 'Exam Failure Risk', value: 67, color: 'bg-red-500' },
                { label: 'Burnout Probability', value: 45, color: 'bg-amber-500' },
                { label: 'Schedule Collapse', value: 38, color: 'bg-orange-400' },
                { label: 'Recovery Potential', value: 72, color: 'bg-emerald-500' },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600">{s.label}</span>
                    <span className="text-xs font-semibold text-gray-700">{s.value}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className={`${s.color} h-1.5 rounded-full`} style={{ width: `${s.value}%` }} />
                  </div>
                </div>
              ))}
              <div className="mt-1 pt-2 border-t border-gray-100">
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">🚨 Intervention: 4 knowledge gaps → urgent revision needed</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tech Stack ── */}
        <div className="text-center mb-8">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Built With</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Next.js 14', 'TypeScript', 'Express.js', 'SQLite', 'Cohere LLM', 'Tailwind CSS', 'Better-SQLite3'].map(t => (
              <span key={t} className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-medium">{t}</span>
            ))}
          </div>
        </div>

        {/* ── CTA Footer ── */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Ready to see your learning brain?</h2>
          <p className="text-blue-200 text-sm mb-6">No credit card. No installation. Just intelligence.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="px-8 py-3 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2">
              <span>Create Account</span>
              <ChevronRight size={16} />
            </Link>
            <button onClick={handleDemoMode} disabled={demoLoading} className="px-8 py-3 border-2 border-white border-opacity-50 text-white font-semibold rounded-xl hover:bg-white hover:bg-opacity-10 transition-colors disabled:opacity-50">
              {demoLoading ? 'Loading…' : 'Try Demo Mode'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-gray-200 mt-8">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">Busla © 2025 · Final Year Project · SCE Sami Shamoon College of Engineering</p>
          <p className="text-xs text-gray-400">Does not access official college systems or private academic records</p>
        </div>
      </div>
    </div>
  );
}
