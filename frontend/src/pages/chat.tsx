import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useCourses, useCourseChat } from '@/hooks/useCourses';
import { DashboardLayout } from '@/components/Common/DashboardLayout';
import { ChatWindow, ChatInput } from '@/components/Chat';
import { Loading, ErrorAlert } from '@/components/Common/Loaders';
import { Trash2, BookOpen, X } from 'lucide-react';
import { Course } from '@/types';

export default function Chat() {
  const router = useRouter();
  const { user, sessionId, loading: authLoading, logout } = useAuth();

  // General chat (no course)
  const { messages, loading, error, clearError, sendMessage, loadHistory, clearHistory } = useChat(
    sessionId,
    user?.id || null
  );

  // Course context
  const { courses } = useCourses(user?.id || null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const {
    messages: courseMessages,
    loading: courseLoading,
    error: courseError,
    clearError: clearCourseError,
    sendMessage: sendCourseMessage,
    clearMessages: clearCourseMessages,
    clearHistory: clearCourseHistory,
  } = useCourseChat(sessionId, user?.id || null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (sessionId && !selectedCourse) loadHistory();
  }, [sessionId, loadHistory, selectedCourse]);

  if (authLoading || !user || !sessionId) return <Loading />;

  const isCourseModeActive = !!selectedCourse;
  const activeMessages = isCourseModeActive ? courseMessages : messages;
  const activeLoading = isCourseModeActive ? courseLoading : loading;
  const activeError = isCourseModeActive ? courseError : error;
  const activeClearError = isCourseModeActive ? clearCourseError : clearError;

  const handleSend = async (content: string) => {
    if (isCourseModeActive && selectedCourse) {
      await sendCourseMessage(selectedCourse.id, content);
    } else {
      await sendMessage(content);
    }
  };

  const handleClear = async () => {
    if (isCourseModeActive && selectedCourse) {
      await clearCourseHistory(selectedCourse.id);
    } else {
      await clearHistory();
    }
  };

  const handleSelectCourse = (course: Course | null) => {
    clearCourseMessages();
    setSelectedCourse(course);
  };

  return (
    <DashboardLayout onLogout={logout} title="Chat with Busla">
      <div className="h-[calc(100vh-120px)] flex flex-col bg-white rounded-lg shadow overflow-hidden">

        {/* Chat header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {isCourseModeActive ? `Busla — ${selectedCourse!.name}` : 'Academic Assistant'}
            </h2>
            <p className="text-sm text-blue-100">
              {isCourseModeActive
                ? 'Answering based on your uploaded course materials'
                : 'Ask anything about your studies'}
            </p>
          </div>
          <button
            onClick={handleClear}
            className="flex items-center space-x-2 px-3 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all text-sm"
          >
            <Trash2 size={16} />
            <span>Clear</span>
          </button>
        </div>

        {/* Course selector bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <div className="flex items-center space-x-1 text-xs text-gray-500 flex-shrink-0">
              <BookOpen size={13} />
              <span>Course context:</span>
            </div>

            {/* General chip */}
            <button
              onClick={() => handleSelectCourse(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !selectedCourse
                  ? 'bg-primary text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'
              }`}
            >
              General
            </button>

            {/* Course chips */}
            {courses.slice(0, 8).map((course) => (
              <button
                key={course.id}
                onClick={() => handleSelectCourse(course)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCourse?.id === course.id
                    ? 'bg-primary text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'
                }`}
              >
                {course.code || course.name}
              </button>
            ))}

            {selectedCourse && (
              <button
                onClick={() => handleSelectCourse(null)}
                className="ml-auto flex items-center space-x-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={12} />
                <span>Remove context</span>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {isCourseModeActive
              ? `Busla will answer using materials uploaded for "${selectedCourse!.name}".`
              : 'Select a course above to get answers based on your uploaded materials.'}
          </p>
        </div>

        {activeError && (
          <div className="p-4">
            <ErrorAlert message={activeError} onDismiss={activeClearError} />
          </div>
        )}

        <ChatWindow
          messages={activeMessages}
          loading={activeLoading}
          onExampleClick={handleSend}
        />
        <ChatInput onSendMessage={handleSend} loading={activeLoading} />
      </div>
    </DashboardLayout>
  );
}
