import { z } from 'zod';

export const updateDeliveryRateSchema = z.object({
  homeDeliveryPrice: z
    .number({ invalid_type_error: 'Home delivery price must be a number' })
    .nonnegative('Home delivery price cannot be negative'),
  deskDeliveryPrice: z
    .number({ invalid_type_error: 'Desk delivery price must be a number' })
    .nonnegative('Desk delivery price cannot be negative'),
});

export type UpdateDeliveryRateInput = z.infer<typeof updateDeliveryRateSchema>;
