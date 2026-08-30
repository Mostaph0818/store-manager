import apiClient from './client';
import { DashboardStats } from '../types';

export const dashboardApi = {
  getStats: async (): Promise<{ success: boolean; data: DashboardStats }> => {
    const res = await apiClient.get('/dashboard/stats');
    return res.data;
  },
};
