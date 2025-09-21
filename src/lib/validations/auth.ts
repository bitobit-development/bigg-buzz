import { z } from 'zod';

// South African ID Number validation
export const saIdNumberSchema = z
  .string()
  .min(13, 'SA ID number must be 13 digits')
  .max(13, 'SA ID number must be 13 digits')
  .regex(/^\d{13}$/, 'SA ID number must contain only digits')
  .refine((value) => {
    // Basic Luhn checksum validation for SA ID numbers
    const digits = value.split('').map(Number);
    let sum = 0;

    for (let i = 0; i < 12; i++) {
      if (i % 2 === 0) {
        sum += digits[i]!;
      } else {
        const doubled = digits[i]! * 2;
        sum += doubled > 9 ? doubled - 9 : doubled;
      }
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === digits[12];
  }, 'Invalid SA ID number');

// South African mobile phone number validation
export const saMobileSchema = z
  .string()
  .regex(
    /^(\+27|0)[6-8]\d{8}$/,
    'Please enter a valid SA mobile number (e.g., 0821234567 or +27821234567)'
  );

// Basic schemas
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    phone: saMobileSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    idNumber: saIdNumberSchema,
    terms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
    ageVerification: z.boolean().refine((val) => val === true, {
      message: 'You must confirm you are 18 or older',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      // Validate age from ID number (basic validation)
      const idNumber = data.idNumber;
      const birthYear = parseInt(idNumber.substring(0, 2));
      const currentYear = new Date().getFullYear() % 100;
      const fullBirthYear = birthYear <= currentYear ? 2000 + birthYear : 1900 + birthYear;
      const age = new Date().getFullYear() - fullBirthYear;
      return age >= 18;
    },
    {
      message: 'You must be 18 or older to register',
      path: ['idNumber'],
    }
  );

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
    token: z.string().min(1, 'Reset token is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ['confirmPassword'],
  });

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;