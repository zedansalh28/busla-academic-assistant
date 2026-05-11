import api from './api';
import {
  PredictionResponse,
  PredictionComputeResponse,
  Intervention,
  RecoveryPlan,
  PredictionTimelineEntry,
} from '@/types';

export const predictionsService = {
  async getPrediction(userId: string): Promise<PredictionResponse> {
    const res = await api.get(`/predictions/${userId}`);
    return res.data;
  },

  async recompute(userId: string): Promise<PredictionComputeResponse> {
    const res = await api.post(`/predictions/compute/${userId}`);
    return res.data;
  },

  async getTimeline(userId: string): Promise<{ timeline: PredictionTimelineEntry[] }> {
    const res = await api.get(`/predictions/timeline/${userId}`);
    return res.data;
  },

  async getInterventions(userId: string): Promise<{ interventions: Intervention[] }> {
    const res = await api.get(`/predictions/interventions/${userId}`);
    return res.data;
  },

  async acknowledgeIntervention(interventionId: string): Promise<void> {
    await api.post(`/predictions/interventions/${interventionId}/acknowledge`);
  },

  async getRecoveryPlan(userId: string): Promise<{ plan: RecoveryPlan; overall_health: string; failure_risk: number }> {
    const res = await api.get(`/predictions/recovery-plan/${userId}`);
    return res.data;
  },
};
