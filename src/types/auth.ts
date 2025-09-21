export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  idNumber: string;
  dateOfBirth: Date;
  address?: Address;
  avatar?: string;
  preferences?: UserPreferences;
}

export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  theme: 'light' | 'dark' | 'system';
  currency: string;
  language: string;
}

export type UserRole = 'customer' | 'vendor' | 'admin' | 'moderator';

export interface AuthSession {
  user: User;
  expires: string;
  accessToken: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  dateOfBirth: string;
  idNumber: string;
  terms: boolean;
  ageVerification: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface VerificationToken {
  token: string;
  type: 'email' | 'phone' | 'password-reset';
  expiresAt: Date;
}