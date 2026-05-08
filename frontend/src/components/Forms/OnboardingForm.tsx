import React, { useState } from 'react';
import { User } from '@/types';
import { MAJORS, YEARS, SCE_SUBJECTS_BY_MAJOR } from '@/utils/constants';

interface OnboardingFormProps {
  onSubmit: (data: Omit<User, 'id'>) => Promise<unknown>;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    major: '',
    year: '',
    learning_style: '',
    subjects_of_interest: [],
    difficulty_level: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'major') {
      // Reset subjects when major changes
      setFormData((prev) => ({ ...prev, major: value, subjects_of_interest: [] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setError(null);
  };

  const handleSubjectToggle = (subject: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      subjects_of_interest: checked
        ? [...prev.subjects_of_interest, subject]
        : prev.subjects_of_interest.filter((s) => s !== subject),
    }));
  };

  const availableSubjects = SCE_SUBJECTS_BY_MAJOR[formData.major] || [];

  const isStepValid = () => {
    if (step === 1) return formData.major && formData.year;
    if (step === 2) return formData.learning_style && formData.difficulty_level;
    if (step === 3) return formData.subjects_of_interest.length > 0;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStepValid() && step === 3) return;

    if (step < 3) {
      if (isStepValid()) setStep(step + 1);
      return;
    }

    try {
      setError(null);
      setSubmitting(true);
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const STEP_LABELS = ['Department & Year', 'Learning Style', 'Subjects'];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary mb-2">Welcome to Busla</h1>
        <p className="text-gray-600 mb-4">Your personal SCE academic assistant — let's set up your profile.</p>

        {/* Step indicator */}
        <div className="flex items-center space-x-2">
          {STEP_LABELS.map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center space-x-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > i + 1 ? 'bg-green-500 text-white' :
                  step === i + 1 ? 'bg-primary text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step === i + 1 ? 'text-primary' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 ${step > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-6">

        {/* Step 1: Department & Year */}
        {step === 1 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Which SCE department are you in?
              </label>
              <select
                name="major"
                value={formData.major}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base"
              >
                <option value="">Select your department</option>
                {MAJORS.map((major) => (
                  <option key={major} value={major}>{major}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What year are you in?
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base"
              >
                <option value="">Select your year</option>
                {YEARS.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Inline hint when only one field is filled */}
            {(formData.major && !formData.year) && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Please also select your year to continue.
              </p>
            )}
            {(!formData.major && formData.year) && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Please also select your department to continue.
              </p>
            )}
          </>
        )}

        {/* Step 2: Learning Style & Difficulty */}
        {step === 2 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What's your preferred learning style?
              </label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: 'Visual', label: 'Visual', desc: 'I learn best from diagrams, charts, and structured visual notes' },
                  { value: 'Analytical', label: 'Analytical', desc: 'I prefer understanding the theory and reasoning behind everything' },
                  { value: 'Kinesthetic', label: 'Kinesthetic (Practice-based)', desc: 'I learn by doing — coding, solving problems, hands-on practice' },
                ].map((style) => (
                  <label key={style.value} className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.learning_style === style.value ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="learning_style"
                      value={style.value}
                      checked={formData.learning_style === style.value}
                      onChange={handleChange}
                      className="mt-0.5 text-primary"
                    />
                    <div>
                      <p className="font-medium text-gray-800">{style.label}</p>
                      <p className="text-sm text-gray-500">{style.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How would you describe your current level?
              </label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: 'beginner', label: 'Beginner', desc: 'I am new to many topics or just started my studies at SCE' },
                  { value: 'intermediate', label: 'Intermediate', desc: 'I have a solid foundation but still struggle with advanced material' },
                  { value: 'advanced', label: 'Advanced', desc: 'I am comfortable with most material and looking for deeper understanding' },
                ].map((lvl) => (
                  <label key={lvl.value} className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.difficulty_level === lvl.value ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="difficulty_level"
                      value={lvl.value}
                      checked={formData.difficulty_level === lvl.value}
                      onChange={handleChange}
                      className="mt-0.5 text-primary"
                    />
                    <div>
                      <p className="font-medium text-gray-800">{lvl.label}</p>
                      <p className="text-sm text-gray-500">{lvl.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Step 3: Subjects of Interest */}
        {step === 3 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Which subjects are you currently studying or most focused on?
            </label>
            <p className="text-xs text-gray-400 mb-4">
              Showing subjects for <strong>{formData.major}</strong>. Select all that apply.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {availableSubjects.map((subject) => (
                <label
                  key={subject}
                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.subjects_of_interest.includes(subject)
                      ? 'border-primary bg-blue-50 text-primary'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.subjects_of_interest.includes(subject)}
                    onChange={(e) => handleSubjectToggle(subject, e.target.checked)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm font-medium">{subject}</span>
                </label>
              ))}
            </div>
            {formData.subjects_of_interest.length > 0 && (
              <p className="text-xs text-primary mt-2">{formData.subjects_of_interest.length} subject(s) selected</p>
            )}
          </div>
        )}

        <div className="flex justify-between pt-4">
          {step > 1 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary">
              Back
            </button>
          ) : <div />}
          <button
            type="submit"
            disabled={submitting || !isStepValid()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : step === 3 ? 'Complete Setup' : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
};
