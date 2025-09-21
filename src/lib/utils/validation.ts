/**
 * Validates South African ID number using the Luhn algorithm
 */
export function validateSAId(idNumber: string): boolean {
  if (!/^\d{13}$/.test(idNumber)) {
    return false;
  }

  const digits = idNumber.split('').map(Number);
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
}

/**
 * Extracts date of birth from SA ID number
 */
export function extractDateFromSAId(idNumber: string): Date | null {
  if (!validateSAId(idNumber)) {
    return null;
  }

  const year = parseInt(idNumber.substring(0, 2));
  const month = parseInt(idNumber.substring(2, 4));
  const day = parseInt(idNumber.substring(4, 6));

  // Determine century (assuming people born after 2000 will have years 00-30)
  const currentYear = new Date().getFullYear() % 100;
  const fullYear = year <= currentYear ? 2000 + year : 1900 + year;

  // Validate month and day
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return new Date(fullYear, month - 1, day);
}

/**
 * Calculates age from SA ID number
 */
export function calculateAgeFromSAId(idNumber: string): number | null {
  const dateOfBirth = extractDateFromSAId(idNumber);
  if (!dateOfBirth) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Validates South African mobile phone number
 */
export function validateSAMobile(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Check for valid SA mobile patterns
  const patterns = [
    /^27[6-8]\d{8}$/, // +27 format
    /^0[6-8]\d{8}$/, // 0 format
  ];

  return patterns.some(pattern => pattern.test(cleaned));
}

/**
 * Normalizes SA mobile phone number to +27 format
 */
export function normalizeSAMobile(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    return `+27${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith('27')) {
    return `+${cleaned}`;
  }

  return phone;
}

/**
 * Validates email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password must be at least 8 characters long');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one lowercase letter');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one uppercase letter');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one number');
  }

  if (/[@$!%*?&]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one special character');
  }

  return {
    isValid: score >= 4,
    score,
    feedback,
  };
}