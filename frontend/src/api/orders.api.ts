import apiClient from './client';
import { Order, OrderStatus, Pagination } from '../types';

export interface OrdersFilter {
  status?: OrderStatus;
  wilayaCode?: string;
  search?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const ordersApi = {
  getAll: async (
    filter?: OrdersFilter
  ): Promise<{ success: boolean; data: { orders: Order[]; pagination: Pagination } }> => {
    const res = await apiClient.get('/orders', { params: filter });
    return res.data;
  },

  getById: async (id: number): Promise<{ success: boolean; data: Order }> => {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data;
  },

  create: async (data: {
    customerName: string;
    customerPhone: string;
    wilayaCode: string;
    address: string;
    productId: number;
    quantity: number;
    deliveryType: 'home' | 'desk';
  }): Promise<{ success: boolean; data: Order; message?: string }> => {
    const res = await apiClient.post('/orders', data);
    return res.data;
  },

  updateStatus: async (
    id: number,
    status: OrderStatus
  ): Promise<{ success: boolean; data: Order; message?: string }> => {
    const res = await apiClient.patch(`/orders/${id}/status`, { status });
    return res.data;
  },
};
