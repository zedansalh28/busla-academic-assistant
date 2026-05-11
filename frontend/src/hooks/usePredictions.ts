import { useState, useEffect, useCallback } from 'react';
import { predictionsService } from '@/services/predictionsService';
import { PredictionResponse, PredictionTimelineEntry, Intervention } from '@/types';

export const usePredictions = (userId: string | null) => {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [timeline, setTimeline] = useState<PredictionTimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const [predData, timelineData] = await Promise.all([
        predictionsService.getPrediction(userId),
        predictionsService.getTimeline(userId),
      ]);
      setPrediction(predData);
      setTimeline(timelineData.timeline);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const recompute = useCallback(async () => {
    if (!userId) return;
    try {
      setRecomputing(true);
      setError(null);
      await predictionsService.recompute(userId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recompute predictions');
    } finally {
      setRecomputing(false);
    }
  }, [userId, load]);

  const acknowledgeIntervention = useCallback(async (interventionId: string) => {
    await predictionsService.acknowledgeIntervention(interventionId);
    setPrediction(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        interventions: prev.interventions.map((iv: Intervention) =>
          iv.id === interventionId ? { ...iv, acknowledged: 1 } : iv
        ),
      };
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { prediction, timeline, loading, recomputing, error, reload: load, recompute, acknowledgeIntervention };
};
