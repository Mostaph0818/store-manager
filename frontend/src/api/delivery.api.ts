import apiClient from './client';
import { DeliveryRate } from '../types';

export const deliveryApi = {
  getAll: async (search?: string): Promise<{ success: boolean; data: DeliveryRate[] }> => {
    const res = await apiClient.get('/delivery/rates', {
      params: search ? { search } : undefined,
    });
    return res.data;
  },

  update: async (
    wilayaCode: string,
    data: {
      homeDeliveryPrice: number;
      deskDeliveryPrice: number;
    }
  ): Promise<{ success: boolean; data: DeliveryRate; message?: string }> => {
    const res = await apiClient.put(`/delivery/rates/${wilayaCode}`, data);
    return res.data;
  },

  bulkUpdate: async (
    rates: Array<{
      wilayaCode: string;
      homeDeliveryPrice: number;
      deskDeliveryPrice: number;
    }>
  ): Promise<{ success: boolean; message?: string }> => {
    const res = await apiClient.put('/delivery/rates/bulk', rates);
    return res.data;
  },
};
