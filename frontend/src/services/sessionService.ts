import api from './api';
import { storage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/utils/constants';

export const sessionService = {
  async createSession() {
    const response = await api.post('/sessions/create');
    const { user_id, session_id } = response.data;
    
    storage.setItem(STORAGE_KEYS.USER_ID, user_id);
    storage.setItem(STORAGE_KEYS.SESSION_ID, session_id);
    
    return { user_id, session_id };
  },

  async getSession(sessionId: string) {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },

  getStoredSession() {
    return {
      user_id: storage.getItem(STORAGE_KEYS.USER_ID),
      session_id: storage.getItem(STORAGE_KEYS.SESSION_ID),
    };
  },

  clearSession() {
    storage.removeItem(STORAGE_KEYS.USER_ID);
    storage.removeItem(STORAGE_KEYS.SESSION_ID);
    storage.removeItem(STORAGE_KEYS.PROFILE);
    storage.removeItem(STORAGE_KEYS.IS_DEMO);
  },

  isDemoMode(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.IS_DEMO) === 'true';
  },
};
