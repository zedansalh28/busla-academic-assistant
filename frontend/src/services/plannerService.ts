import api from './api';
import { StudyPlan, StudyTask, Recommendation } from '@/types';

export const plannerService = {
  // Plans
  async createPlan(userId: string, planData: Omit<StudyPlan, 'id' | 'created_at' | 'updated_at'>): Promise<StudyPlan> {
    const response = await api.post('/plans', { ...planData, user_id: userId });
    return response.data;
  },

  async getUserPlans(userId: string): Promise<StudyPlan[]> {
    const response = await api.get(`/plans/user/${userId}`);
    return response.data.plans || [];
  },

  async getPlan(planId: string): Promise<StudyPlan> {
    const response = await api.get(`/plans/${planId}`);
    return response.data;
  },

  async updatePlan(planId: string, updateData: Partial<StudyPlan>): Promise<StudyPlan> {
    const response = await api.put(`/plans/${planId}`, updateData);
    return response.data;
  },

  async deletePlan(planId: string) {
    await api.delete(`/plans/${planId}`);
  },

  // Tasks
  async addTask(planId: string, taskData: Omit<StudyTask, 'id' | 'created_at' | 'updated_at'>): Promise<StudyTask> {
    const response = await api.post(`/plans/${planId}/tasks`, taskData);
    return response.data;
  },

  async getPlanTasks(planId: string): Promise<StudyTask[]> {
    const response = await api.get(`/plans/${planId}/tasks`);
    return response.data.tasks || [];
  },

  async updateTask(taskId: string, updateData: Partial<StudyTask>): Promise<StudyTask> {
    const response = await api.put(`/plans/tasks/${taskId}`, updateData);
    return response.data;
  },

  async deleteTask(taskId: string) {
    await api.delete(`/plans/tasks/${taskId}`);
  },

  // Recommendations
  async getPlanRecommendations(planId: string) {
    const response = await api.get(`/plans/${planId}/recommendations`);
    return response.data;
  },
};

export const recommendationService = {
  async getRecommendations(userId: string, limit: number = 5): Promise<Recommendation[]> {
    const response = await api.get(`/recommendations/user/${userId}?limit=${limit}`);
    return response.data.recommendations || [];
  },

  async getSavedRecommendations(userId: string, limit: number = 10): Promise<Recommendation[]> {
    const response = await api.get(`/recommendations/user/${userId}/saved?limit=${limit}`);
    return response.data.recommendations || [];
  },
};
