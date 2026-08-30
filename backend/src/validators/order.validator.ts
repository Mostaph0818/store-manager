import { z } from 'zod';

export const createOrderSchema = z.object({
  customerName: z
    .string()
    .min(1, 'Customer name is required')
    .max(200, 'Customer name must not exceed 200 characters')
    .trim(),
  customerPhone: z
    .string()
    .min(9, 'Phone number must be at least 9 digits')
    .max(20, 'Phone number must not exceed 20 characters')
    .trim(),
  wilayaCode: z
    .string()
    .min(1, 'Wilaya code is required')
    .max(3, 'Wilaya code must not exceed 3 characters')
    .trim(),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address must not exceed 500 characters')
    .trim(),
  productId: z
    .number({ invalid_type_error: 'Product ID must be a number' })
    .int('Product ID must be an integer')
    .positive('Product ID must be positive'),
  quantity: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be an integer')
    .positive('Quantity must be at least 1'),
  deliveryType: z.enum(['home', 'desk'], {
    errorMap: () => ({ message: 'Delivery type must be either "home" or "desk"' }),
  }),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(
    ['pending', 'processing', 'out_for_delivery', 'delivered', 'cancelled'],
    {
      errorMap: () => ({
        message:
          'Status must be one of: pending, processing, out_for_delivery, delivered, cancelled',
      }),
    }
  ),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
