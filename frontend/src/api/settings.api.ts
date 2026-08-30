import apiClient from './client';
import { User } from '../types';

export const settingsApi = {
  getSettings: async (): Promise<{ success: boolean; data: User }> => {
    const res = await apiClient.get('/settings');
    return res.data;
  },

  regenerateApiKey: async (): Promise<{ success: boolean; data: { apiKey: string }; message?: string }> => {
    const res = await apiClient.post('/settings/regenerate-api-key');
    return res.data;
  },
};
