import { useState, useCallback, useEffect } from 'react';
import { coursesService } from '@/services/coursesService';
import { Course, CourseMaterial, ChatMessage } from '@/types';

export const useCourses = (userId: string | null) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await coursesService.getUserCourses(userId);
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const createCourse = useCallback(
    async (data: { name: string; code?: string; description?: string }) => {
      if (!userId) return null;
      try {
        setLoading(true);
        const course = await coursesService.createCourse(userId, data);
        setCourses((prev) => [course, ...prev]);
        return course;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create course');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const deleteCourse = useCallback(async (courseId: string) => {
    try {
      setLoading(true);
      await coursesService.deleteCourse(courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course');
    } finally {
      setLoading(false);
    }
  }, []);

  return { courses, loading, error, createCourse, deleteCourse, refresh: fetchCourses };
};

export const useCourseMaterials = (courseId: string | null) => {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await coursesService.getMaterials(courseId);
      setMaterials(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const addTextMaterial = useCallback(
    async (title: string, content: string) => {
      if (!courseId) return null;
      try {
        setLoading(true);
        const material = await coursesService.addTextMaterial(courseId, title, content);
        setMaterials((prev) => [material, ...prev]);
        return material;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add material');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [courseId]
  );

  const uploadFile = useCallback(
    async (title: string, file: File) => {
      if (!courseId) return null;
      try {
        setLoading(true);
        const material = await coursesService.uploadFileMaterial(courseId, title, file);
        setMaterials((prev) => [material, ...prev]);
        return material;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload file');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [courseId]
  );

  const deleteMaterial = useCallback(
    async (materialId: string) => {
      if (!courseId) return;
      try {
        setLoading(true);
        await coursesService.deleteMaterial(courseId, materialId);
        setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete material');
      } finally {
        setLoading(false);
      }
    },
    [courseId]
  );

  return { materials, loading, error, addTextMaterial, uploadFile, deleteMaterial, refresh: fetchMaterials };
};

export const useCourseChat = (sessionId: string | null, userId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (courseId: string, content: string) => {
      if (!sessionId || !userId) {
        setError('Session not initialized');
        return null;
      }
      try {
        setLoading(true);
        setError(null);
        setMessages((prev) => [...prev, { role: 'user', content, timestamp: Date.now() }]);

        const response = await coursesService.sendCourseMessage(sessionId, userId, courseId, content);

        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: response.answer,
          timestamp: Date.now(),
        }]);
        return response;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [sessionId, userId]
  );

  // Local-only clear — used for navigation between courses
  const clearMessages = useCallback(() => setMessages([]), []);

  // Full clear — clears DB + local state, used for the explicit Clear button
  const clearHistory = useCallback(async (courseId: string) => {
    if (sessionId) {
      try {
        await coursesService.clearCourseHistory(sessionId, courseId);
      } catch {
        // still clear local state even if API fails
      }
    }
    setMessages([]);
  }, [sessionId]);

  const clearError = useCallback(() => setError(null), []);

  return { messages, loading, error, clearError, sendMessage, clearMessages, clearHistory };
};
