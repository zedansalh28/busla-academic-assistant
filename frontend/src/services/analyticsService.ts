import api from './api';
import { AnalyticsDashboard } from '@/types';

export const analyticsService = {
  async getDashboard(userId: string): Promise<AnalyticsDashboard> {
    const res = await api.get(`/analytics/dashboard/${userId}`);
    return res.data;
  },

  async computePatterns(userId: string) {
    const res = await api.post(`/analytics/compute/${userId}`);
    return res.data;
  },

  async getPreferences(userId: string) {
    const res = await api.get(`/analytics/preferences/${userId}`);
    return res.data;
  },

  async trackEvent(userId: string, eventType: string, subject?: string, metadata?: Record<string, unknown>) {
    try {
      await api.post('/analytics/event', { user_id: userId, event_type: eventType, subject, metadata });
    } catch (_) {
      // Event tracking must never break the UI
    }
  },
};
