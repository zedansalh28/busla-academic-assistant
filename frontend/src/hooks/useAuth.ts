import { useState, useEffect, useCallback } from 'react';
import { sessionService } from '@/services/sessionService';
import { profileService } from '@/services/profileService';
import { User } from '@/types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize or restore session
  useEffect(() => {
    const initSession = async () => {
      try {
        const stored = sessionService.getStoredSession();
        if (stored.session_id && stored.user_id) {
          setSessionId(stored.session_id);
          try {
            const profile = await profileService.getProfile(stored.user_id);
            setUser(profile);
          } catch {
            // Profile doesn't exist yet, that's ok
          }
        } else {
          const { session_id } = await sessionService.createSession();
          setSessionId(session_id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize session');
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  const createProfile = useCallback(async (profileData: Omit<User, 'id'>) => {
    try {
      setLoading(true);
      const stored = sessionService.getStoredSession();
      const userId = stored.user_id;
      if (!userId) throw new Error('No active session');
      const profile = await profileService.createProfile(userId, profileData);
      setUser(profile);
      return profile;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create profile';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    try {
      setLoading(true);
      const updated = await profileService.updateProfile(user.id, updates);
      setUser(updated);
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const logout = useCallback(() => {
    sessionService.clearSession();
    setUser(null);
    setSessionId(null);
  }, []);

  return {
    user,
    sessionId,
    loading,
    error,
    createProfile,
    updateProfile,
    logout,
    isAuthenticated: !!user,
  };
};
