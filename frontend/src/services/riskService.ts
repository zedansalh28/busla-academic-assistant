import api from './api';
import { RiskAssessment, RiskInputs } from '@/types';

export const riskService = {
  async analyze(userId: string, inputs: Partial<RiskInputs>): Promise<RiskAssessment & { inputs_used: RiskInputs }> {
    const response = await api.post('/risk/analyze', { user_id: userId, ...inputs });
    return response.data;
  },

  async getLatest(userId: string): Promise<RiskAssessment | null> {
    try {
      const response = await api.get(`/risk/user/${userId}/latest`);
      return response.data;
    } catch {
      return null;
    }
  },

  async getRecoveryPlan(userId: string, score: number, level: string, factors: { label: string; weight: number }[]) {
    const response = await api.post('/risk/recovery-plan', { user_id: userId, score, level, factors });
    return response.data;
  },
};
