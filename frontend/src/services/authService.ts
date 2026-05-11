import api from './api';
import { STORAGE_KEYS } from '@/utils/constants';
import { AuthResponse, AuthUser, User } from '@/types';

export const authService = {
  async signup(data: {
    email: string;
    password: string;
    display_name: string;
    major?: string;
    year?: string;
    learning_style?: string;
    difficulty_level?: string;
    subjects_of_interest?: string[];
  }): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    authService.storeAuth(response.data);
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    authService.storeAuth(response.data);
    return response.data;
  },

  async getMe(): Promise<{ user: AuthUser; profile: User | null }> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  storeAuth(data: AuthResponse) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(data.user));
    localStorage.setItem(STORAGE_KEYS.USER_ID, data.user.id);
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, data.session_id);
  },

  clearAuth() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.IS_DEMO);
  },

  getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  getStoredAuthUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};
