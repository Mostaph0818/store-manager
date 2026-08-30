export interface User {
  id: number;
  username: string;
  email: string;
  apiKey?: string;
  createdAt?: string;
}

export interface Product {
  id: number;
  userId: number;
  name: string;
  description?: string | null;
  barcode?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  costPrice: number | string;
  sellingPrice: number | string;
  stockQuantity: number;
  isOutOfStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryRate {
  id: number;
  userId: number;
  wilayaCode: string;
  wilayaName: string;
  homeDeliveryPrice: number | string;
  deskDeliveryPrice: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface Order {
  id: number;
  userId: number;
  customerName: string;
  customerPhone: string;
  wilayaCode: string;
  wilayaName: string;
  address: string;
  productId: number;
  quantity: number;
  productUnitPrice: number | string;
  deliveryType: 'home' | 'desk';
  deliveryFee: number | string;
  totalAmount: number | string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: number;
    name: string;
    sellingPrice?: number | string;
  };
}

export interface DashboardStats {
  totalProducts: number;
  outOfStockProducts: number;
  totalOrders: number;
  newOrders: number;
  totalRevenue: number | string;
  inventoryValue: number | string;
  recentOrders: Order[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
