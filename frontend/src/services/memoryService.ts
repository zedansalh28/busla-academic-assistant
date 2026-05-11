import api from './api';
import {
  LearningBrainDashboard,
  StudentLearningProfile,
  ConceptMemory,
  KnowledgeGap,
  RevisionPriority,
} from '@/types';

export const memoryService = {
  async getDashboard(userId: string): Promise<LearningBrainDashboard> {
    const res = await api.get(`/memory/dashboard/${userId}`);
    return res.data;
  },

  async getProfile(userId: string): Promise<StudentLearningProfile> {
    const res = await api.get(`/memory/profile/${userId}`);
    return res.data;
  },

  async getConcepts(userId: string): Promise<{ concepts: ConceptMemory[] }> {
    const res = await api.get(`/memory/concepts/${userId}`);
    return res.data;
  },

  async getGaps(userId: string): Promise<{ gaps: KnowledgeGap[] }> {
    const res = await api.get(`/memory/gaps/${userId}`);
    return res.data;
  },

  async getRevisionQueue(userId: string): Promise<{ revision_queue: RevisionPriority[] }> {
    const res = await api.get(`/memory/revision/${userId}`);
    return res.data;
  },

  async recompute(userId: string): Promise<{ recomputed: boolean; computed_at: number; profile: StudentLearningProfile; forgetting_alerts: number; gap_count: number }> {
    const res = await api.post(`/memory/compute/${userId}`);
    return res.data;
  },
};
