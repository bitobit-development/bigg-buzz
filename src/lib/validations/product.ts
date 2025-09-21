import { z } from 'zod';

// Product category enum
export const productCategorySchema = z.enum([
  'flower',
  'concentrate',
  'edible',
  'vape',
  'topical',
  'accessory',
  'seed',
]);

// Product schemas
export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(100, 'Product name must be less than 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  category: productCategorySchema,
  price: z
    .number()
    .min(0.01, 'Price must be greater than 0')
    .max(10000, 'Price must be reasonable'),
  images: z
    .array(z.string().url('Invalid image URL'))
    .min(1, 'At least one image is required')
    .max(10, 'Maximum 10 images allowed'),
  strain: z.string().optional(),
  thcContent: z
    .number()
    .min(0, 'THC content cannot be negative')
    .max(100, 'THC content cannot exceed 100%')
    .optional(),
  cbdContent: z
    .number()
    .min(0, 'CBD content cannot be negative')
    .max(100, 'CBD content cannot exceed 100%')
    .optional(),
  weight: z
    .number()
    .min(0.1, 'Weight must be at least 0.1g')
    .max(1000, 'Weight cannot exceed 1000g')
    .optional(),
  inStock: z.boolean().default(true),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
});

export const productUpdateSchema = productSchema.partial();

export const productFilterSchema = z.object({
  category: productCategorySchema.optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  strain: z.string().optional(),
  minThc: z.number().min(0).max(100).optional(),
  maxThc: z.number().min(0).max(100).optional(),
  minCbd: z.number().min(0).max(100).optional(),
  maxCbd: z.number().min(0).max(100).optional(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'price', 'created', 'rating']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Type exports
export type Product = z.infer<typeof productSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;
export type ProductFilter = z.infer<typeof productFilterSchema>;
export type ProductCategory = z.infer<typeof productCategorySchema>;