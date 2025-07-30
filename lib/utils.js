import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a secure random password
 * @param {number} length - Password length (default: 12)
 * @param {object} options - Options for password generation
 * @returns {string} Generated password
 */
export function generateSecurePassword(length = 12, options = {}) {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeSimilar = true // Exclude similar looking characters like 0, O, l, 1, etc.
  } = options;

  let charset = '';
  
  if (includeLowercase) {
    charset += excludeSimilar ? 'abcdefghijkmnopqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  }
  
  if (includeUppercase) {
    charset += excludeSimilar ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  
  if (includeNumbers) {
    charset += excludeSimilar ? '23456789' : '0123456789';
  }
  
  if (includeSymbols) {
    charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  }

  if (charset === '') {
    throw new Error('At least one character type must be included');
  }

  let password = '';
  
  // Ensure at least one character from each selected type
  const requiredChars = [];
  if (includeLowercase) requiredChars.push(excludeSimilar ? 'abcdefghijkmnopqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz');
  if (includeUppercase) requiredChars.push(excludeSimilar ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  if (includeNumbers) requiredChars.push(excludeSimilar ? '23456789' : '0123456789');
  if (includeSymbols) requiredChars.push('!@#$%^&*()_+-=[]{}|;:,.<>?');

  // Add one character from each required type
  requiredChars.forEach(chars => {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  });

  // Fill the rest with random characters from the full charset
  for (let i = password.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
