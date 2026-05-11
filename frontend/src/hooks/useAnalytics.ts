import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '@/services/analyticsService';
import { AnalyticsDashboard } from '@/types';

export const useAnalytics = (userId: string | null) => {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getDashboard(userId);
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const recompute = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      await analyticsService.computePatterns(userId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recompute patterns');
    } finally {
      setLoading(false);
    }
  }, [userId, load]);

  useEffect(() => {
    load();
  }, [load]);

  return { dashboard, loading, error, reload: load, recompute };
};
