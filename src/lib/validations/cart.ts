import { z } from 'zod';

// Cart item schema for adding items to cart
export const CartItemSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  quantity: z.number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(50, 'Maximum 50 items per product'),
  variant: z.string()
    .nullable()
    .optional()
    .refine((val) => {
      if (!val) return true
      try {
        JSON.parse(val)
        return true
      } catch {
        return false
      }
    }, 'Variant must be valid JSON')
});

// Cart item update schema
export const CartItemUpdateSchema = z.object({
  quantity: z.number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(50, 'Maximum 50 items per product')
});

// Checkout schema
export const CheckoutSchema = z.object({
  deliveryAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    province: z.string().min(1, 'Province is required'),
    postalCode: z.string().regex(/^[0-9]{4}$/, 'Invalid postal code format'), // South African postal codes
    country: z.string().default('South Africa')
  }),
  deliveryMethod: z.enum(['STANDARD', 'EXPRESS', 'PICKUP']).default('STANDARD'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
});

// Type exports
export type CartItem = z.infer<typeof CartItemSchema>;
export type CartItemUpdate = z.infer<typeof CartItemUpdateSchema>;
export type Checkout = z.infer<typeof CheckoutSchema>;