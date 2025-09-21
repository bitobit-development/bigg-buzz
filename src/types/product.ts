export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  images: ProductImage[];
  vendor: Vendor;
  strain?: string;
  thcContent?: number;
  cbdContent?: number;
  weight?: number;
  inStock: boolean;
  quantity: number;
  featured: boolean;
  tags: string[];
  ratings: ProductRating[];
  averageRating: number;
  totalRatings: number;
  variants?: ProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  weight?: number;
  thcContent?: number;
  cbdContent?: number;
  inStock: boolean;
  quantity: number;
  sku: string;
}

export interface ProductRating {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  review?: string;
  images?: string[];
  verified: boolean;
  helpful: number;
  createdAt: Date;
}

export interface Vendor {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  banner?: string;
  location: string;
  isVerified: boolean;
  rating: number;
  totalProducts: number;
  totalSales: number;
  joinedAt: Date;
  socialLinks?: VendorSocialLinks;
  businessInfo: VendorBusinessInfo;
}

export interface VendorSocialLinks {
  website?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
}

export interface VendorBusinessInfo {
  registrationNumber: string;
  taxNumber: string;
  contactEmail: string;
  contactPhone: string;
  address: Address;
  bankingDetails?: BankingDetails;
}

export interface BankingDetails {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  branchCode: string;
  accountType: 'savings' | 'current';
}

export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export type ProductCategory =
  | 'flower'
  | 'concentrate'
  | 'edible'
  | 'vape'
  | 'topical'
  | 'accessory'
  | 'seed';

export interface ProductFilter {
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  strain?: string;
  minThc?: number;
  maxThc?: number;
  minCbd?: number;
  maxCbd?: number;
  inStock?: boolean;
  featured?: boolean;
  vendorId?: string;
  search?: string;
  sortBy?: 'name' | 'price' | 'created' | 'rating' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}