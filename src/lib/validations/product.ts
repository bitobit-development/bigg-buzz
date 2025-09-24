import { z } from 'zod';

// Product category enum matching database schema
export const ProductCategorySchema = z.enum([
  'FLOWER',
  'CONCENTRATES',
  'EDIBLES',
  'ACCESSORIES',
  'WELLNESS',
  'SEEDS',
  'CLONES',
  'TOPICALS',
  'TINCTURES',
  'VAPES'
]);

// Strain type enum
export const StrainTypeSchema = z.enum(['INDICA', 'SATIVA', 'HYBRID']);

// Product filter schema for API endpoints
export const ProductFilterSchema = z.object({
  category: ProductCategorySchema.optional(),
  strain: StrainTypeSchema.optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  inStock: z.boolean().optional(),
  search: z.string().min(1).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'price', 'createdAt', 'thcContent']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  vendorId: z.string().cuid().optional()
});

// Product creation schema
export const ProductCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  category: ProductCategorySchema,
  strain: StrainTypeSchema.optional(),
  thcContent: z.number().min(0).max(100).optional(),
  cbdContent: z.number().min(0).max(100).optional(),
  weight: z.number().min(0).optional(),
  stockQuantity: z.number().int().min(0).default(0),
  images: z.string().default('[]'), // JSON string for SQLite
  vendorId: z.string().cuid('Invalid vendor ID'),
  sku: z.string().min(1, 'SKU is required').max(100),
  compliance: z.string().optional() // JSON string for SQLite
});

// Product update schema
export const ProductUpdateSchema = ProductCreateSchema.partial().extend({
  id: z.string().cuid('Invalid product ID')
});

// Product variant schema for cart items
export const ProductVariantSchema = z.object({
  size: z.enum(['1g', '3.5g', '7g', '14g', '28g']).optional(),
  strain: z.enum(['indica', 'sativa', 'hybrid']).optional(),
  thc: z.number().min(0).max(100).optional(),
  cbd: z.number().min(0).max(100).optional()
});

// Legacy schemas for backward compatibility
export const productCategorySchema = z.enum([
  'flower',
  'concentrate',
  'edible',
  'vape',
  'topical',
  'accessory',
  'seed',
]);

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
export type ProductFilter = z.infer<typeof ProductFilterSchema>;
export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type ProductCategory = z.infer<typeof ProductCategorySchema>;
export type StrainType = z.infer<typeof StrainTypeSchema>;

// Legacy type exports
export type Product = z.infer<typeof productSchema>;
export type LegacyProductUpdate = z.infer<typeof productUpdateSchema>;
export type LegacyProductFilter = z.infer<typeof productFilterSchema>;
export type LegacyProductCategory = z.infer<typeof productCategorySchema>;