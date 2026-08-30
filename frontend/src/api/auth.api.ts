import apiClient from './client';
import { User } from '../types';

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    token: string;
  };
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },

  register: async (username: string, email: string, password: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', { username, email, password });
    return res.data;
  },

  loginWithGoogle: async (credential: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/google', { credential });
    return res.data;
  },

  getMe: async (): Promise<{ success: boolean; data: User }> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};
