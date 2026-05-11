import api from './api';
import { GeneratedSchedule, OptimizerInputs } from '@/types';

export const optimizerService = {
  async generate(userId: string, inputs: Partial<OptimizerInputs>): Promise<GeneratedSchedule> {
    const response = await api.post<GeneratedSchedule>('/optimizer/generate', { user_id: userId, ...inputs });
    return response.data;
  },

  async getLatest(userId: string): Promise<GeneratedSchedule | null> {
    try {
      const response = await api.get(`/optimizer/user/${userId}`);
      return response.data;
    } catch {
      return null;
    }
  },

  async saveToPlanner(userId: string, blocks: GeneratedSchedule['blocks']): Promise<{ created_plans: number }> {
    const response = await api.post('/optimizer/save-to-planner', { user_id: userId, blocks });
    return response.data;
  },
};
