/**
 * Format phone number to (999) 888-7777 format
 * Automatically fixes incorrect formats
 */
export const formatPhoneNumber = (value: string): string => {
  if (!value) return '';
  
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '');
  
  // Handle different lengths
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  if (cleaned.length <= 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  
  // Truncate if more than 10 digits
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
};

/**
 * Get clean phone number (digits only) from formatted string
 */
export const cleanPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Validate and format phone number for display
 * Returns formatted phone or empty string if invalid
 */
export const validateAndFormatPhone = (value: string): string => {
  const cleaned = cleanPhoneNumber(value);
  if (cleaned.length !== 10) return value; // Return as-is if not 10 digits
  return formatPhoneNumber(cleaned);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate email and return error message if invalid
 */
export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  if (!email.includes('@')) return 'Email must contain @';
  if (!isValidEmail(email)) return 'Please enter a valid email address';
  return null;
};
