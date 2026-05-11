import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { useCourses, useCourseMaterials, useCourseChat } from '@/hooks/useCourses';
import { DashboardLayout } from '@/components/Common/DashboardLayout';
import { CourseList, CourseDetail, AddCourseModal } from '@/components/Courses';
import { Loading } from '@/components/Common';
import { Plus } from 'lucide-react';
import { Course } from '@/types';

export default function CoursesPage() {
  const router = useRouter();
  const { user, sessionId, loading: authLoading, logout } = useAuth();
  const { courses, loading: coursesLoading, createCourse, deleteCourse } = useCourses(user?.id || null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { materials, loading: materialsLoading, addTextMaterial, uploadFile, deleteMaterial } =
    useCourseMaterials(selectedCourse?.id || null);

  const { messages, loading: chatLoading, sendMessage, clearMessages, clearHistory } = useCourseChat(
    sessionId,
    user?.id || null
  );

  const handleClearChat = useCallback(() => {
    if (selectedCourse) clearHistory(selectedCourse.id);
  }, [selectedCourse, clearHistory]);

  React.useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  if (authLoading || !user) return <Loading />;

  const handleCreateCourse = async (data: { name: string; code?: string; description?: string }) => {
    const course = await createCourse(data);
    if (course) setShowAddModal(false);
  };

  const handleSelectCourse = (course: Course) => {
    clearMessages();
    setSelectedCourse(course);
  };

  const handleBack = () => {
    clearMessages();
    setSelectedCourse(null);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedCourse) return;
    await sendMessage(selectedCourse.id, content);
  };

  return (
    <DashboardLayout onLogout={logout} title="Course Library">
      <div className="space-y-6">
        {!selectedCourse ? (
          <>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-secondary">My Course Library</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Add courses, upload materials, and ask Busla for explanations.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Course</span>
              </button>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
              <strong>Privacy notice:</strong> Busla only uses materials you upload yourself.
              It does not access SCE systems, Moodle, grades, or any private student records.
            </div>

            <CourseList
              courses={courses}
              onSelectCourse={handleSelectCourse}
              onDeleteCourse={deleteCourse}
              loading={coursesLoading}
            />
          </>
        ) : (
          <CourseDetail
            course={selectedCourse}
            materials={materials}
            messages={messages}
            chatLoading={chatLoading}
            materialsLoading={materialsLoading}
            onBack={handleBack}
            onAddText={addTextMaterial}
            onUploadFile={uploadFile}
            onDeleteMaterial={deleteMaterial}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
          />
        )}
      </div>

      <AddCourseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleCreateCourse}
        loading={coursesLoading}
      />
    </DashboardLayout>
  );
}
