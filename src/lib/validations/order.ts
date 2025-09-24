import { z } from 'zod';

// Order status enum matching database schema
export const OrderStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED'
]);

// Delivery method enum matching database schema
export const DeliveryMethodSchema = z.enum([
  'STANDARD',
  'EXPRESS',
  'PICKUP'
]);

// Create order schema (checkout)
export const CreateOrderSchema = z.object({
  deliveryAddress: z.object({
    street: z.string()
      .min(5, 'Street address must be at least 5 characters')
      .max(100, 'Street address too long')
      .trim(),
    city: z.string()
      .min(2, 'City name must be at least 2 characters')
      .max(50, 'City name too long')
      .trim(),
    province: z.string()
      .min(2, 'Province must be at least 2 characters')
      .max(50, 'Province name too long')
      .trim(),
    postalCode: z.string()
      .regex(/^[0-9]{4}$/, 'Invalid postal code format (4 digits required)')
      .transform(val => val.trim()),
    country: z.string()
      .max(50, 'Country name too long')
      .default('South Africa')
      .transform(val => val.trim())
  }),
  deliveryMethod: DeliveryMethodSchema.default('STANDARD'),
  notes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .transform(val => val?.trim()),
  paymentMethod: z.enum(['TOKENS', 'CASH_ON_DELIVERY']).default('TOKENS')
});

// Order update schema
export const UpdateOrderSchema = z.object({
  status: OrderStatusSchema.optional(),
  trackingNumber: z.string()
    .min(3, 'Tracking number must be at least 3 characters')
    .max(50, 'Tracking number too long')
    .optional()
    .transform(val => val?.trim()),
  notes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .transform(val => val?.trim())
});

// Order filter schema
export const OrderFilterSchema = z.object({
  status: OrderStatusSchema.optional(),
  subscriberId: z.string().cuid().optional(),
  vendorId: z.string().cuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minTotal: z.number().min(0).optional(),
  maxTotal: z.number().min(0).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'total', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Type exports
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type UpdateOrder = z.infer<typeof UpdateOrderSchema>;
export type OrderFilter = z.infer<typeof OrderFilterSchema>;
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type DeliveryMethod = z.infer<typeof DeliveryMethodSchema>;