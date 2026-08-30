import { z } from 'zod';

export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(200, 'Product name must not exceed 200 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .trim()
    .optional(),
  barcode: z.string().trim().optional(),
  category: z.string().trim().optional(),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  costPrice: z
    .number({ invalid_type_error: 'Cost price must be a number' })
    .nonnegative('Cost price cannot be negative'),
  sellingPrice: z
    .number({ invalid_type_error: 'Selling price must be a number' })
    .positive('Selling price must be greater than 0'),
  stockQuantity: z
    .number({ invalid_type_error: 'Stock quantity must be a number' })
    .int('Stock quantity must be an integer')
    .nonnegative('Stock quantity cannot be negative'),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
