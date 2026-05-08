import React, { useState } from 'react';
import { User } from '@/types';
import { MAJORS, YEARS, LEARNING_STYLES, DIFFICULTY_LEVELS, SCE_SUBJECTS_BY_MAJOR } from '@/utils/constants';

interface ProfileFormProps {
  initialData?: User;
  onSubmit: (data: Omit<User, 'id'>) => Promise<void>;
  loading?: boolean;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState<Omit<User, 'id'>>(
    initialData || {
      major: '',
      year: '',
      learning_style: '',
      subjects_of_interest: [],
      difficulty_level: '',
    }
  );
  const [error, setError] = useState<string | null>(null);

  const availableSubjects = SCE_SUBJECTS_BY_MAJOR[formData.major] || [];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'major') {
      // Keep only subjects that exist in the new major's list
      const newSubjects = SCE_SUBJECTS_BY_MAJOR[value] || [];
      setFormData((prev) => ({
        ...prev,
        major: value,
        subjects_of_interest: prev.subjects_of_interest.filter((s) =>
          newSubjects.includes(s)
        ),
      }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
          <select
            name="major"
            value={formData.major}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select your department</option>
            {MAJORS.map((major) => (
              <option key={major} value={major}>{major}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
          <select
            name="year"
            value={formData.year}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select your year</option>
            {YEARS.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Learning Style</label>
          <select
            name="learning_style"
            value={formData.learning_style}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select your learning style</option>
            {LEARNING_STYLES.map((style) => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
          <select
            name="difficulty_level"
            value={formData.difficulty_level}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select difficulty level</option>
            {DIFFICULTY_LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Subjects of interest — filtered checkboxes matching onboarding */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subjects of Interest
        </label>
        {!formData.major ? (
          <p className="text-sm text-gray-400 italic">Select your department above to choose subjects.</p>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3">
              Showing subjects for <strong>{formData.major}</strong>. Select all that apply.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
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
              <p className="text-xs text-primary mt-2">
                {formData.subjects_of_interest.length} subject(s) selected
              </p>
            )}
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
};
