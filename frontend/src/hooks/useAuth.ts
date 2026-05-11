import { useState, useEffect, useCallback } from 'react';
import { sessionService } from '@/services/sessionService';
import { profileService } from '@/services/profileService';
import { authService } from '@/services/authService';
import { User, AuthUser } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const token = authService.getStoredToken();

        if (token) {
          // JWT-authenticated user
          try {
            const { user: au, profile } = await authService.getMe();
            setAuthUser(au);
            if (profile) setUser(profile);
            const stored = sessionService.getStoredSession();
            setSessionId(stored.session_id);
          } catch {
            // Token expired/invalid — clear and fall through to landing
            authService.clearAuth();
          }
        } else {
          // Anonymous / demo flow
          const stored = sessionService.getStoredSession();
          if (stored.session_id && stored.user_id) {
            setSessionId(stored.session_id);
            try {
              const profile = await profileService.getProfile(stored.user_id);
              setUser(profile);
            } catch {
              // no profile yet
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setLoading(false);
      }
    };
    init();
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
    authService.clearAuth();
    sessionService.clearSession();
    setUser(null);
    setAuthUser(null);
    setSessionId(null);
  }, []);

  const isDemo = typeof window !== 'undefined'
    ? localStorage.getItem(STORAGE_KEYS.IS_DEMO) === 'true'
    : false;

  return {
    user,
    authUser,
    sessionId,
    loading,
    error,
    isDemo,
    createProfile,
    updateProfile,
    logout,
    isAuthenticated: !!(user || authUser),
  };
};
