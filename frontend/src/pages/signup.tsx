import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { authService } from '@/services/authService';
import { BookOpen, Eye, EyeOff, ChevronRight, ChevronLeft } from 'lucide-react';
import { MAJORS, YEARS, LEARNING_STYLES, DIFFICULTY_LEVELS, SCE_SUBJECTS_BY_MAJOR } from '@/utils/constants';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = account, 2 = academic profile
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', display_name: '',
    major: '', year: '', learning_style: '', difficulty_level: '',
    subjects_of_interest: [] as string[],
  });

  useEffect(() => {
    if (authService.getStoredToken()) router.replace('/dashboard');
  }, [router]);

  const availableSubjects = SCE_SUBJECTS_BY_MAJOR[form.major] || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'major') {
      setForm(prev => ({ ...prev, major: value, subjects_of_interest: [] }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleSubject = (subject: string) => {
    setForm(prev => ({
      ...prev,
      subjects_of_interest: prev.subjects_of_interest.includes(subject)
        ? prev.subjects_of_interest.filter(s => s !== subject)
        : [...prev.subjects_of_interest, subject],
    }));
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.signup(form);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Sign up failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Busla</span>
        </Link>
        <Link href="/login" className="text-sm text-primary font-medium hover:underline">
          Already have an account?
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-6 space-x-3">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  s === step ? 'bg-primary text-white' : s < step ? 'bg-accent text-white' : 'bg-gray-200 text-gray-500'
                }`}>{s}</div>
                {s < 2 && <div className={`w-12 h-1 mx-1 ${step > 1 ? 'bg-accent' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            {step === 1 ? (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
                  <p className="text-sm text-gray-500 mt-1">Step 1 of 2 — Account details</p>
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
                )}

                <form onSubmit={handleStep1} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                    <input name="display_name" value={form.display_name} onChange={handleChange} required placeholder="Your name" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@sce.ac.il" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} required placeholder="Min 6 characters" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" className="w-full btn-primary py-2.5 flex items-center justify-center space-x-2">
                    <span>Continue</span><ChevronRight size={18} />
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Academic Profile</h1>
                  <p className="text-sm text-gray-500 mt-1">Step 2 of 2 — Helps Busla personalize your experience</p>
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                      <select name="major" value={form.major} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary">
                        <option value="">Select</option>
                        {MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                      <select name="year" value={form.year} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary">
                        <option value="">Select</option>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Learning Style</label>
                      <select name="learning_style" value={form.learning_style} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary">
                        <option value="">Select</option>
                        {LEARNING_STYLES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Level</label>
                      <select name="difficulty_level" value={form.difficulty_level} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary">
                        <option value="">Select</option>
                        {DIFFICULTY_LEVELS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  {form.major && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Subjects of Interest <span className="text-gray-400">(optional)</span></label>
                      <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                        {availableSubjects.map(s => (
                          <label key={s} className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer text-xs transition-colors ${form.subjects_of_interest.includes(s) ? 'border-primary bg-blue-50 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                            <input type="checkbox" checked={form.subjects_of_interest.includes(s)} onChange={() => toggleSubject(s)} className="w-3 h-3" />
                            <span>{s}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-2">
                    <button type="button" onClick={() => setStep(1)} className="flex items-center space-x-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      <ChevronLeft size={16} /><span>Back</span>
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 btn-primary py-2.5 disabled:opacity-50">
                      {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              </>
            )}

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">Log in</Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Busla uses only the information you enter. It does not access official college systems or private academic records.
          </p>
        </div>
      </div>
    </div>
  );
}
