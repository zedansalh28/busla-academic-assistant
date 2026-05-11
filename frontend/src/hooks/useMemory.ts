import { useState, useEffect, useCallback } from 'react';
import { memoryService } from '@/services/memoryService';
import { LearningBrainDashboard } from '@/types';

export const useMemory = (userId: string | null) => {
  const [dashboard, setDashboard] = useState<LearningBrainDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await memoryService.getDashboard(userId);
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load learning brain data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const recompute = useCallback(async () => {
    if (!userId) return;
    try {
      setRecomputing(true);
      setError(null);
      await memoryService.recompute(userId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recompute memory profile');
    } finally {
      setRecomputing(false);
    }
  }, [userId, load]);

  useEffect(() => {
    load();
  }, [load]);

  return { dashboard, loading, recomputing, error, reload: load, recompute };
};
