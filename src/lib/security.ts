import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const ALGORITHM = 'AES-GCM'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const ITERATIONS = 100000

/**
 * Encrypt sensitive data using AES-256-GCM with Web Crypto API
 */
export async function encrypt(text: string): Promise<string> {
  const encryptionKey = process.env.ENCRYPTION_KEY
  if (!encryptionKey || encryptionKey.length < 32) {
    throw new Error('Invalid encryption key')
  }

  // Generate random IV and salt
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))

  // Derive key using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(encryptionKey),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt']
  )

  // Encrypt the text
  const encoded = new TextEncoder().encode(text)
  const encrypted = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    encoded
  )

  // Convert to hex and combine salt + iv + encrypted
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('')
  const encryptedHex = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('')

  return saltHex + ':' + ivHex + ':' + encryptedHex
}

/**
 * Decrypt sensitive data using Web Crypto API
 */
export async function decrypt(encryptedData: string): Promise<string> {
  const encryptionKey = process.env.ENCRYPTION_KEY
  if (!encryptionKey || encryptionKey.length < 32) {
    throw new Error('Invalid encryption key')
  }

  const parts = encryptedData.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format')
  }

  // Convert hex back to bytes
  const saltMatch = parts[0]?.match(/.{1,2}/g)
  const ivMatch = parts[1]?.match(/.{1,2}/g)
  const encryptedMatch = parts[2]?.match(/.{1,2}/g)

  if (!saltMatch || !ivMatch || !encryptedMatch) {
    throw new Error('Invalid encrypted data format')
  }

  const salt = new Uint8Array(saltMatch.map(byte => parseInt(byte, 16)))
  const iv = new Uint8Array(ivMatch.map(byte => parseInt(byte, 16)))
  const encrypted = new Uint8Array(encryptedMatch.map(byte => parseInt(byte, 16)))

  // Derive the same key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(encryptionKey),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ['decrypt']
  )

  // Decrypt the data
  const decrypted = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    encrypted
  )

  return new TextDecoder().decode(decrypted)
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate JWT token
 */
export async function generateJWT(payload: any, expiresIn: string = '90d'): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)

  if (!secret || process.env.JWT_SECRET!.length < 32) {
    throw new Error('Invalid JWT secret')
  }

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret)
}

/**
 * Verify JWT token
 */
export async function verifyJWT(token: string): Promise<any> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)

  if (!secret || process.env.JWT_SECRET!.length < 32) {
    throw new Error('Invalid JWT secret')
  }

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

/**
 * Generate secure random token using Web Crypto API
 */
export function generateSecureToken(length: number = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate API key using Web Crypto API
 */
export function generateAPIKey(): string {
  const prefix = 'bb_'
  const timestamp = Date.now().toString(36)
  const randomBytes = crypto.getRandomValues(new Uint8Array(16))
  const randomPart = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${prefix}${timestamp}_${randomPart}`
}

/**
 * Validate API key format
 */
export function validateAPIKey(apiKey: string): boolean {
  const pattern = /^bb_[a-z0-9]+_[a-f0-9]{32}$/
  return pattern.test(apiKey)
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Generate CSRF token using Web Crypto API
 */
export function generateCSRFToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate CSRF token using constant time comparison
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (token.length !== sessionToken.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ sessionToken.charCodeAt(i)
  }
  return result === 0
}

/**
 * Rate limiting key generator
 */
export function generateRateLimitKey(identifier: string, action: string): string {
  return `rate_limit:${action}:${identifier}`
}

/**
 * Generate secure session ID using Web Crypto API
 */
export function generateSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Constant time string comparison to prevent timing attacks
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Generate secure random OTP using Web Crypto API
 */
export function generateSecureOTP(length: number = 6): string {
  const digits = '0123456789'
  let otp = ''

  for (let i = 0; i < length; i++) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(1))
    const randomIndex = randomBytes[0]! % digits.length
    otp += digits[randomIndex]
  }

  return otp
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: any): any {
  const sensitiveFields = [
    'password',
    'saId',
    'ssn',
    'creditCard',
    'cardNumber',
    'cvv',
    'pin',
    'token',
    'secret',
    'key',
    'otp',
  ]

  if (typeof data === 'string') {
    return data.substring(0, 4) + '****'
  }

  if (typeof data === 'object' && data !== null) {
    const masked = { ...data }

    for (const key in masked) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        if (typeof masked[key] === 'string') {
          masked[key] = masked[key].substring(0, 4) + '****'
        } else {
          masked[key] = '****'
        }
      } else if (typeof masked[key] === 'object') {
        masked[key] = maskSensitiveData(masked[key])
      }
    }

    return masked
  }

  return data
}

/**
 * Validate request origin
 */
export function validateOrigin(origin: string): boolean {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.CORS_ORIGIN,
    'http://localhost:3000',
    'https://biggbuzz.co.za',
  ].filter(Boolean)

  return allowedOrigins.includes(origin)
}

/**
 * Generate content security policy
 */
export function generateCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ')
}