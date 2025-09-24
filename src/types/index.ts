// Re-export specific types to avoid conflicts
export * from './auth';
export * from './product';
export * from './order';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Common UI types
export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<any>;
  disabled?: boolean;
  external?: boolean;
  children?: NavItem[];
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'date' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  options?: SelectOption[];
  validation?: any;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Search types
export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'product' | 'vendor' | 'category';
  url: string;
  image?: string;
}

// File upload types
export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}