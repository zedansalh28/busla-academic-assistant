import { useState, useCallback, useEffect } from 'react';
import { plannerService, recommendationService } from '@/services/plannerService';
import { StudyPlan, StudyTask, Recommendation } from '@/types';

export const usePlans = (userId: string | null) => {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const data = await plannerService.getUserPlans(userId);
      setPlans(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch plans';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const createPlan = useCallback(
    async (planData: Omit<StudyPlan, 'id' | 'created_at' | 'updated_at'>) => {
      if (!userId) return null;

      try {
        setLoading(true);
        const newPlan = await plannerService.createPlan(userId, planData);
        setPlans((prev) => [...prev, newPlan]);
        return newPlan;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create plan';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const updatePlan = useCallback(async (planId: string, updates: Partial<StudyPlan>) => {
    try {
      setLoading(true);
      const updated = await plannerService.updatePlan(planId, updates);
      setPlans((prev) => prev.map((p) => (p.id === planId ? updated : p)));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update plan';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePlan = useCallback(async (planId: string) => {
    try {
      setLoading(true);
      await plannerService.deletePlan(planId);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete plan';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    plans,
    loading,
    error,
    createPlan,
    updatePlan,
    deletePlan,
    refresh: fetchPlans,
  };
};

export const useTasks = (planId: string | null) => {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!planId) return;

    try {
      setLoading(true);
      const data = await plannerService.getPlanTasks(planId);
      setTasks(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(
    async (taskData: Omit<StudyTask, 'id' | 'created_at' | 'updated_at'>) => {
      if (!planId) return null;

      try {
        setLoading(true);
        const newTask = await plannerService.addTask(planId, taskData);
        setTasks((prev) => [...prev, newTask]);
        return newTask;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add task';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [planId]
  );

  const updateTask = useCallback(async (taskId: string, updates: Partial<StudyTask>) => {
    try {
      setLoading(true);
      const updated = await plannerService.updateTask(taskId, updates);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      setLoading(true);
      await plannerService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    refresh: fetchTasks,
  };
};

export const useRecommendations = (userId: string | null) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const data = await recommendationService.getRecommendations(userId, 5);
      setRecommendations(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch recommendations';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    recommendations,
    loading,
    error,
    refresh: fetchRecommendations,
  };
};

export { useCourses, useCourseMaterials, useCourseChat } from './useCourses';
