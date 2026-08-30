import apiClient from './client';
import { Product } from '../types';

export const productsApi = {
  getAll: async (search?: string): Promise<{ success: boolean; data: Product[] }> => {
    const res = await apiClient.get('/products', {
      params: search ? { search } : undefined,
    });
    return res.data;
  },

  getById: async (id: number): Promise<{ success: boolean; data: Product }> => {
    const res = await apiClient.get(`/products/${id}`);
    return res.data;
  },

  create: async (data: {
    name: string;
    description?: string;
    barcode?: string;
    category?: string;
    imageUrl?: string;
    costPrice: number;
    sellingPrice: number;
    stockQuantity: number;
  }): Promise<{ success: boolean; data: Product; message?: string }> => {
    const res = await apiClient.post('/products', data);
    return res.data;
  },

  update: async (
    id: number,
    data: Partial<{
      name: string;
      description?: string;
      barcode?: string;
      category?: string;
      imageUrl?: string;
      costPrice: number;
      sellingPrice: number;
      stockQuantity: number;
    }>
  ): Promise<{ success: boolean; data: Product; message?: string }> => {
    const res = await apiClient.put(`/products/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<{ success: boolean; message?: string }> => {
    const res = await apiClient.delete(`/products/${id}`);
    return res.data;
  },
};
