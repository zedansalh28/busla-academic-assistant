import api from './api';
import { Course, CourseMaterial, CourseChatResponse } from '@/types';

export const coursesService = {
  async getUserCourses(userId: string): Promise<Course[]> {
    const response = await api.get(`/courses/user/${userId}`);
    return response.data.courses || [];
  },

  async getCourse(courseId: string): Promise<Course> {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
  },

  async createCourse(
    userId: string,
    data: { name: string; code?: string; description?: string }
  ): Promise<Course> {
    const response = await api.post('/courses', { user_id: userId, ...data });
    return response.data;
  },

  async deleteCourse(courseId: string): Promise<void> {
    await api.delete(`/courses/${courseId}`);
  },

  async getMaterials(courseId: string): Promise<CourseMaterial[]> {
    const response = await api.get(`/courses/${courseId}/materials`);
    return response.data.materials || [];
  },

  async addTextMaterial(
    courseId: string,
    title: string,
    content: string
  ): Promise<CourseMaterial> {
    const response = await api.post(`/courses/${courseId}/materials`, { title, content });
    return response.data;
  },

  async uploadFileMaterial(
    courseId: string,
    title: string,
    file: File
  ): Promise<CourseMaterial> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name.replace(/\.[^.]+$/, ''));

    const response = await api.post(`/courses/${courseId}/materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteMaterial(courseId: string, materialId: string): Promise<void> {
    await api.delete(`/courses/${courseId}/materials/${materialId}`);
  },

  async clearCourseHistory(sessionId: string, courseId: string): Promise<void> {
    await api.delete(`/chat/course-history/${sessionId}/${courseId}`);
  },

  async sendCourseMessage(
    sessionId: string,
    userId: string,
    courseId: string,
    message: string
  ): Promise<CourseChatResponse> {
    const response = await api.post('/chat/course', {
      session_id: sessionId,
      user_id: userId,
      course_id: courseId,
      message,
    });
    return response.data;
  },
};
