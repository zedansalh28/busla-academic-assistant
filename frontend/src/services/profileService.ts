import api from './api';
import { User } from '@/types';
import { storage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/utils/constants';

export const profileService = {
  async createProfile(userId: string, profileData: Omit<User, 'id'>): Promise<User> {
    const response = await api.post('/profiles', { ...profileData, userId });
    storage.setItem(STORAGE_KEYS.PROFILE, response.data);
    return response.data;
  },

  async getProfile(userId: string): Promise<User> {
    const response = await api.get(`/profiles/${userId}`);
    storage.setItem(STORAGE_KEYS.PROFILE, response.data);
    return response.data;
  },

  async updateProfile(userId: string, profileData: Partial<User>): Promise<User> {
    const response = await api.put(`/profiles/${userId}`, profileData);
    storage.setItem(STORAGE_KEYS.PROFILE, response.data);
    return response.data;
  },

  async deleteProfile(userId: string) {
    await api.delete(`/profiles/${userId}`);
    storage.removeItem(STORAGE_KEYS.PROFILE);
  },

  getStoredProfile(): User | null {
    return storage.getItem(STORAGE_KEYS.PROFILE);
  },
};
