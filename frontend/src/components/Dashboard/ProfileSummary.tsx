import React from 'react';
import { User } from '@/types';
import { BarChart2, BookOpen, Target, Award } from 'lucide-react';

interface ProfileSummaryProps {
  user: User;
  onEdit: () => void;
}

export const ProfileSummary: React.FC<ProfileSummaryProps> = ({ user, onEdit }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Your Profile</h2>
          <p className="text-gray-600">Academic Information</p>
        </div>
        <button onClick={onEdit} className="btn-primary">
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center space-x-4">
          <div className="bg-primary bg-opacity-10 rounded-lg p-3">
            <BookOpen className="text-primary" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Major</p>
            <p className="font-semibold text-secondary">{user.major}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-primary bg-opacity-10 rounded-lg p-3">
            <Award className="text-primary" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Year</p>
            <p className="font-semibold text-secondary">{user.year}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-primary bg-opacity-10 rounded-lg p-3">
            <Target className="text-primary" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Learning Style</p>
            <p className="font-semibold text-secondary">{user.learning_style}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-primary bg-opacity-10 rounded-lg p-3">
            <BarChart2 className="text-primary" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Difficulty Level</p>
            <p className="font-semibold text-secondary">{user.difficulty_level}</p>
          </div>
        </div>
      </div>

      {user.subjects_of_interest && user.subjects_of_interest.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-600 mb-3">Subjects of Interest</p>
          <div className="flex flex-wrap gap-2">
            {user.subjects_of_interest.map((subject) => (
              <span
                key={subject}
                className="px-3 py-1 bg-accent bg-opacity-20 text-accent rounded-full text-sm font-medium"
              >
                {subject}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
