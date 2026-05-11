import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/Common/DashboardLayout';
import { Loading } from '@/components/Common/Loaders';
import { optimizerService } from '@/services/optimizerService';
import { GeneratedSchedule, OptimizerCourse, ScheduleBlock } from '@/types';
import { SCE_SUBJECTS_BY_MAJOR } from '@/utils/constants';
import { Calendar, Zap, AlertTriangle, CheckCircle, Save, RefreshCw } from 'lucide-react';

const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard', 'very hard'] as const;
const SCE_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const BLOCK_TYPE_LABEL: Record<string, string> = {
  exam_prep: 'Exam Prep',
  weak_subject: 'Weak Subject Focus',
  study: 'Study Session',
};
const BLOCK_TYPE_COLOR: Record<string, string> = {
  exam_prep: 'bg-red-100 text-red-700 border-red-200',
  weak_subject: 'bg-amber-100 text-amber-700 border-amber-200',
  study: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function OptimizerPage() {
  const router = useRouter();
  const { user, sessionId, loading: authLoading, logout } = useAuth();

  const [courses, setCourses] = useState<OptimizerCourse[]>([{ name: '', difficulty: 'medium' }]);
  const [hours, setHours] = useState(15);
  const [preferredDays, setPreferredDays] = useState<string[]>(SCE_DAYS);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [examDates, setExamDates] = useState<{ course: string; date: string }[]>([]);
  const [deadlines, setDeadlines] = useState<{ title: string; date: string }[]>([]);

  const [schedule, setSchedule] = useState<GeneratedSchedule | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  React.useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  if (authLoading || !user) return <Loading />;

  const validCourses = courses.filter(c => c.name.trim());
  const allSubjects = Object.values(SCE_SUBJECTS_BY_MAJOR).flat();
  const uniqueSubjects = [...new Set(allSubjects)].sort();

  const toggleDay = (day: string) => {
    setPreferredDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const toggleWeak = (subject: string) => {
    setWeakSubjects(prev => prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]);
  };

  const handleGenerate = async () => {
    if (!validCourses.length) { setError('Add at least one course.'); return; }
    setError('');
    setGenerating(true);
    try {
      const result = await optimizerService.generate(user.id, {
        courses: validCourses,
        available_hours_per_week: hours,
        preferred_days: preferredDays.length ? preferredDays : SCE_DAYS,
        weak_subjects: weakSubjects,
        academic_stage: user.year,
        exam_dates: examDates.filter(e => e.course && e.date),
        deadlines: deadlines.filter(d => d.title && d.date),
      });
      setSchedule(result);
    } catch {
      setError('Failed to generate schedule. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToPlanner = async () => {
    if (!schedule) return;
    setSaving(true);
    try {
      const result = await optimizerService.saveToPlanner(user.id, schedule.blocks);
      setSavedMsg(`${result.created_plans} study plan(s) created in your Planner!`);
    } catch {
      setError('Failed to save to planner.');
    } finally {
      setSaving(false);
    }
  };

  // Group blocks by day
  const blocksByDay: Record<string, ScheduleBlock[]> = {};
  if (schedule) {
    for (const block of schedule.blocks) {
      if (!blocksByDay[block.day]) blocksByDay[block.day] = [];
      blocksByDay[block.day].push(block);
    }
  }

  return (
    <DashboardLayout onLogout={logout} title="Study Schedule Optimizer">
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-secondary flex items-center space-x-2">
            <Calendar size={24} className="text-primary" />
            <span>Study Schedule Optimizer</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter your courses and available hours. Busla will build a smart weekly schedule prioritizing urgent and difficult subjects.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── LEFT: Input Form ── */}
          <div className="space-y-5">
            {/* Courses */}
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Your Courses</h3>
              <div className="space-y-2">
                {courses.map((c, i) => (
                  <div key={i} className="flex space-x-2">
                    <input
                      value={c.name}
                      onChange={e => { const nc = [...courses]; nc[i].name = e.target.value; setCourses(nc); }}
                      placeholder={`Course ${i + 1} (e.g. Calculus 2)`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                    />
                    <select
                      value={c.difficulty}
                      onChange={e => { const nc = [...courses]; nc[i].difficulty = e.target.value as OptimizerCourse['difficulty']; setCourses(nc); }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                    >
                      {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {courses.length > 1 && (
                      <button onClick={() => setCourses(courses.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 px-2">✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => setCourses([...courses, { name: '', difficulty: 'medium' }])} className="text-sm text-primary hover:underline">+ Add course</button>
              </div>
            </div>

            {/* Hours & Days */}
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Available Study Time</h3>
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-1 block">Hours per week: <strong>{hours}h</strong></label>
                <input type="range" min={4} max={40} value={hours} onChange={e => setHours(+e.target.value)} className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>4h</span><span>40h</span></div>
              </div>

              <label className="text-sm text-gray-600 mb-2 block">Preferred study days:</label>
              <div className="flex flex-wrap gap-2">
                {SCE_DAYS.map(day => (
                  <button key={day} onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${preferredDays.includes(day) ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary'}`}>
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Weak subjects */}
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="font-semibold text-gray-800 mb-1">Weak Subjects <span className="text-gray-400 font-normal text-sm">(optional)</span></h3>
              <p className="text-xs text-gray-400 mb-3">These get more study time in the schedule.</p>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {validCourses.map(c => (
                  <button key={c.name} onClick={() => toggleWeak(c.name)}
                    className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${weakSubjects.includes(c.name) ? 'bg-amber-100 text-amber-700 border-amber-300' : 'border-gray-200 text-gray-600 hover:border-amber-300'}`}>
                    {c.name}
                  </button>
                ))}
                {!validCourses.length && <p className="text-xs text-gray-400 italic">Add courses above first</p>}
              </div>
            </div>

            {/* Exam dates */}
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Exam Dates <span className="text-gray-400 font-normal text-sm">(optional)</span></h3>
              <div className="space-y-2">
                {examDates.map((e, i) => (
                  <div key={i} className="flex space-x-2">
                    <input value={e.course} onChange={ev => { const ne = [...examDates]; ne[i].course = ev.target.value; setExamDates(ne); }} placeholder="Course name" className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs" />
                    <input type="date" value={e.date} onChange={ev => { const ne = [...examDates]; ne[i].date = ev.target.value; setExamDates(ne); }} className="px-3 py-1.5 border border-gray-300 rounded text-xs" />
                    <button onClick={() => setExamDates(examDates.filter((_, j) => j !== i))} className="text-red-400 text-xs">✕</button>
                  </div>
                ))}
                <button onClick={() => setExamDates([...examDates, { course: '', date: '' }])} className="text-xs text-primary hover:underline">+ Add exam</button>
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

            <button
              onClick={handleGenerate}
              disabled={generating || !validCourses.length}
              className="w-full btn-primary py-3 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {generating ? <><RefreshCw size={18} className="animate-spin" /><span>Generating...</span></> : <><Zap size={18} /><span>Generate Study Schedule</span></>}
            </button>
          </div>

          {/* ── RIGHT: Generated Schedule ── */}
          <div className="space-y-4">
            {!schedule ? (
              <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
                <Calendar size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Your schedule will appear here</p>
                <p className="text-sm mt-1">Fill in your courses and click Generate</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800">{schedule.summary}</p>
                  <p className="text-xs text-blue-600 mt-1">Total: <strong>{schedule.total_hours}h/week</strong> across {schedule.blocks.length} sessions</p>
                </div>

                {/* Warnings */}
                {schedule.warnings.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
                    <div className="flex items-center space-x-2 text-amber-700 font-medium text-sm mb-2">
                      <AlertTriangle size={16} /><span>Notices</span>
                    </div>
                    {schedule.warnings.map((w, i) => <p key={i} className="text-xs text-amber-700">• {w}</p>)}
                  </div>
                )}

                {/* Weekly schedule */}
                <div className="bg-white rounded-xl shadow p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Weekly Schedule</h3>
                  <div className="space-y-4">
                    {SCE_DAYS.filter(d => blocksByDay[d]?.length).map(day => (
                      <div key={day}>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{day}</h4>
                        <div className="space-y-1.5">
                          {blocksByDay[day].map((block, i) => (
                            <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${BLOCK_TYPE_COLOR[block.block_type] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                              <div>
                                <span className="font-semibold">{block.start_time}–{block.end_time}</span>
                                <span className="ml-2">{block.course_name}</span>
                              </div>
                              <span className="text-xs opacity-80">{BLOCK_TYPE_LABEL[block.block_type] || block.block_type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Course breakdown */}
                <div className="bg-white rounded-xl shadow p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Why this schedule?</h3>
                  <div className="space-y-2">
                    {schedule.course_breakdown.map((c, i) => (
                      <div key={i} className="text-xs text-gray-600">
                        <span className="font-medium text-gray-800">{c.name}</span>: {c.hours}h/week — {c.reason}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save to planner */}
                {savedMsg ? (
                  <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 flex items-center space-x-2 text-sm">
                    <CheckCircle size={16} /><span>{savedMsg}</span>
                  </div>
                ) : (
                  <button onClick={handleSaveToPlanner} disabled={saving} className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-accent text-white rounded-xl font-medium text-sm hover:bg-green-600 transition-colors disabled:opacity-50">
                    {saving ? <><RefreshCw size={16} className="animate-spin" /><span>Saving...</span></> : <><Save size={16} /><span>Save to Planner</span></>}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
