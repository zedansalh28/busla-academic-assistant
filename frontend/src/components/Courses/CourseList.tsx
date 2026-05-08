import React from 'react';
import { Course } from '@/types';
import { BookOpen, Trash2, ChevronRight, Star } from 'lucide-react';

interface CourseListProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => Promise<void>;
  loading?: boolean;
}

export const CourseList: React.FC<CourseListProps> = ({
  courses,
  onSelectCourse,
  onDeleteCourse,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-5 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <BookOpen size={48} className="mx-auto mb-4 opacity-40" />
        <p className="text-lg font-medium">No courses yet</p>
        <p className="text-sm mt-1">Add your first course or explore the demo courses below.</p>
      </div>
    );
  }

  const demoCourses = courses.filter((c) => c.is_demo === 1);
  const myCourses = courses.filter((c) => c.is_demo === 0);

  const renderCourse = (course: Course) => (
    <div
      key={course.id}
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100 flex flex-col"
    >
      <div
        className="p-5 flex-1 cursor-pointer"
        onClick={() => onSelectCourse(course)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-primary bg-opacity-10 flex items-center justify-center flex-shrink-0">
              <BookOpen size={16} className="text-primary" />
            </div>
            {course.is_demo === 1 && (
              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium flex items-center space-x-1">
                <Star size={10} />
                <span>Demo</span>
              </span>
            )}
          </div>
          {course.code && (
            <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">
              {course.code}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-gray-800 mt-2 leading-tight">{course.name}</h3>
        {course.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>
        )}
      </div>
      <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
        <button
          onClick={() => onSelectCourse(course)}
          className="flex items-center space-x-1 text-primary text-sm font-medium hover:underline"
        >
          <span>Open</span>
          <ChevronRight size={14} />
        </button>
        {course.is_demo === 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete "${course.name}"?`)) onDeleteCourse(course.id);
            }}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Delete course"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {myCourses.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">My Courses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCourses.map(renderCourse)}
          </div>
        </div>
      )}
      {demoCourses.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            SCE Demo Courses
          </h3>
          <p className="text-sm text-gray-400 mb-3">
            Pre-loaded sample materials — ask Busla anything about these courses.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoCourses.map(renderCourse)}
          </div>
        </div>
      )}
    </div>
  );
};
