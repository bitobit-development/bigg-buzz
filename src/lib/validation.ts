import { z } from 'zod'

/**
 * Validates South African ID number using Luhn algorithm
 * Format: YYMMDDGSSSCAZ
 * YY = Year of birth
 * MM = Month of birth
 * DD = Day of birth
 * G = Gender (0-4 = female, 5-9 = male)
 * SSS = Sequence number
 * C = Citizenship (0 = SA citizen, 1 = permanent resident)
 * A = Usually 8 or 9
 * Z = Checksum digit
 */
export function validateSAID(id: string): boolean {
  if (!id || typeof id !== 'string') return false

  // Remove any spaces or dashes
  const cleanId = id.replace(/[\s-]/g, '')

  // Must be exactly 13 digits
  if (!/^\d{13}$/.test(cleanId)) return false

  // Extract components
  const year = parseInt(cleanId.substring(0, 2))
  const month = parseInt(cleanId.substring(2, 4))
  const day = parseInt(cleanId.substring(4, 6))
  const gender = parseInt(cleanId.substring(6, 7))
  const citizenship = parseInt(cleanId.substring(10, 11))
  const checksum = parseInt(cleanId.substring(12, 13))

  // Validate date components
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false

  // Basic date validation (doesn't check leap years for simplicity)
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (day > (daysInMonth[month - 1] ?? 31)) return false

  // Validate gender digit (0-9)
  if (gender < 0 || gender > 9) return false

  // Validate citizenship (0 or 1)
  if (citizenship !== 0 && citizenship !== 1) return false

  // Luhn algorithm checksum validation
  let sum = 0
  let multiply = 2

  for (let i = 11; i >= 0; i--) {
    let digit = parseInt(cleanId.charAt(i))

    if (multiply === 2) {
      digit *= 2
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10)
      }
    }

    sum += digit
    multiply = multiply === 2 ? 1 : 2
  }

  const calculatedChecksum = (10 - (sum % 10)) % 10

  return calculatedChecksum === checksum
}

/**
 * Extracts information from SA ID number
 */
export function parseSAID(id: string) {
  if (!validateSAID(id)) {
    throw new Error('Invalid SA ID number')
  }

  const cleanId = id.replace(/[\s-]/g, '')

  const year = parseInt(cleanId.substring(0, 2))
  const month = parseInt(cleanId.substring(2, 4))
  const day = parseInt(cleanId.substring(4, 6))
  const gender = parseInt(cleanId.substring(6, 7))
  const citizenship = parseInt(cleanId.substring(10, 11))

  // Determine full year (assume people are not older than 100)
  const currentYear = new Date().getFullYear()
  const currentCentury = Math.floor(currentYear / 100)
  const fullYear = year <= (currentYear % 100)
    ? currentCentury * 100 + year
    : (currentCentury - 1) * 100 + year

  const dateOfBirth = new Date(fullYear, month - 1, day)
  const age = Math.floor((Date.now() - dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

  return {
    dateOfBirth,
    age,
    gender: gender >= 5 ? 'male' : 'female',
    isSACitizen: citizenship === 0,
    isValidAge: age >= 18, // Cannabis legal age in SA
  }
}

/**
 * Validates South African mobile number format
 * Valid prefixes: 082, 083, 084, 072, 073, 074, 076, 078, 079, 081, 071
 * Format: 0XX XXX XXXX (10 digits total)
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false

  // Remove any formatting
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')

  // SA mobile number patterns - must start with valid mobile prefixes
  const validPrefixes = ['082', '083', '084', '072', '073', '074', '076', '078', '079', '081', '071']

  // Check local format (0XX XXX XXXX)
  if (/^0\d{9}$/.test(cleanPhone)) {
    const prefix = cleanPhone.substring(0, 3)
    return validPrefixes.includes(prefix)
  }

  // Check international format (+27XX XXX XXXX)
  if (/^(\+27|0027|27)\d{9}$/.test(cleanPhone)) {
    let mobileNumber = cleanPhone
    if (mobileNumber.startsWith('+27')) {
      mobileNumber = mobileNumber.substring(3)
    } else if (mobileNumber.startsWith('0027')) {
      mobileNumber = mobileNumber.substring(4)
    } else if (mobileNumber.startsWith('27')) {
      mobileNumber = mobileNumber.substring(2)
    }

    const prefix = mobileNumber.substring(0, 2)
    const fullPrefix = '0' + prefix
    return validPrefixes.includes(fullPrefix)
  }

  return false
}

/**
 * Normalizes phone number to international format
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return ''

  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')

  // Convert to international format
  if (cleanPhone.startsWith('0')) {
    return '+27' + cleanPhone.substring(1)
  } else if (cleanPhone.startsWith('27')) {
    return '+' + cleanPhone
  } else if (cleanPhone.startsWith('+27')) {
    return cleanPhone
  }

  return phone // Return original if format not recognized
}

// Zod schemas for API validation
export const saIdSchema = z.string()
  .min(13, 'SA ID must be 13 digits')
  .max(13, 'SA ID must be 13 digits')
  .regex(/^\d{13}$/, 'SA ID must contain only digits')
  .refine(validateSAID, 'Invalid SA ID number')

export const phoneSchema = z.string()
  .min(10, 'Phone number too short')
  .max(15, 'Phone number too long')
  .refine(validatePhoneNumber, 'Invalid phone number format')

export const registrationSchema = z.object({
  saId: saIdSchema,
  phone: phoneSchema,
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email().optional(),
  marketingConsent: z.boolean().default(false),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  privacyAccepted: z.boolean().refine(val => val === true, 'You must accept the privacy policy'),
})

export const loginSchema = z.object({
  saId: saIdSchema,
  phone: phoneSchema,
})

export const otpVerificationSchema = z.object({
  phone: phoneSchema,
  otp: z.string().min(4, 'OTP must be at least 4 digits').max(8, 'OTP too long'),
})

// Utility functions for data sanitization
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function maskSAID(saId: string): string {
  if (!saId || saId.length !== 13) return saId
  return saId.substring(0, 6) + '*******'
}

export function maskPhone(phone: string): string {
  if (!phone) return phone
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
  if (cleanPhone.length < 6) return phone
  return cleanPhone.substring(0, 3) + '***' + cleanPhone.substring(cleanPhone.length - 2)
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email
  const [username, domain] = email.split('@')
  if (!username || username.length <= 2) return email
  return username.substring(0, 2) + '***@' + domain
}

/**
 * Formats South African mobile number for display
 * Converts 0823292438 to 082 329 2438
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return ''

  // Remove any existing formatting
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')

  // Handle local format (0XXXXXXXXX)
  if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
    return `${cleanPhone.substring(0, 3)} ${cleanPhone.substring(3, 6)} ${cleanPhone.substring(6)}`
  }

  // Handle international format
  if (cleanPhone.startsWith('+27') && cleanPhone.length === 12) {
    const localNumber = '0' + cleanPhone.substring(3)
    return formatPhoneNumber(localNumber)
  }

  return phone // Return original if format not recognized
}

/**
 * Removes formatting from phone number input
 * Converts "082 329 2438" to "0823292438"
 */
export function unformatPhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '')
}