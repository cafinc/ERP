/**
 * Input formatting utilities for autofill and smart filling
 */

/**
 * Format phone number as user types
 * Supports: (555) 123-4567 format
 */
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length <= 3) {
    return cleaned;
  } else if (cleaned.length <= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  } else {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }
};

/**
 * Extract clean phone number (digits only)
 */
export const cleanPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Auto-capitalize first letter of each word
 */
export const capitalizeWords = (value: string): string => {
  return value
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

/**
 * Auto-capitalize first letter only
 */
export const capitalizeFirst = (value: string): string => {
  if (value.length === 0) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

/**
 * Format email (lowercase)
 */
export const formatEmail = (value: string): string => {
  return value.toLowerCase().trim();
};

/**
 * Format address - capitalize each word
 */
export const formatAddress = (value: string): string => {
  return capitalizeWords(value);
};

/**
 * Format postal/zip code
 */
export const formatPostalCode = (value: string): string => {
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  // US ZIP: 12345 or 12345-6789
  if (/^\d+$/.test(cleaned)) {
    if (cleaned.length <= 5) {
      return cleaned;
    } else {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 9)}`;
    }
  }
  
  // Canadian postal code: A1A 1A1
  if (/^[A-Z0-9]+$/.test(cleaned) && cleaned.length <= 6) {
    if (cleaned.length <= 3) {
      return cleaned;
    } else {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`;
    }
  }
  
  return cleaned;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (must be 10 digits)
 */
export const isValidPhone = (phone: string): boolean => {
  const cleaned = cleanPhoneNumber(phone);
  return cleaned.length === 10;
};

/**
 * Get autocomplete type for native support
 */
export const getAutoCompleteType = (fieldName: string): string => {
  const mapping: { [key: string]: string } = {
    // Personal Info
    'name': 'name',
    'firstName': 'given-name',
    'lastName': 'family-name',
    'fullName': 'name',
    'email': 'email',
    'phone': 'tel',
    'phoneNumber': 'tel',
    'mobile': 'tel',
    
    // Address
    'address': 'street-address',
    'address1': 'address-line1',
    'address2': 'address-line2',
    'city': 'address-level2',
    'state': 'address-level1',
    'province': 'address-level1',
    'region': 'address-level1',
    'postalCode': 'postal-code',
    'zipCode': 'postal-code',
    'country': 'country-name',
    
    // Credentials
    'username': 'username',
    'password': 'password',
    'newPassword': 'new-password',
    'currentPassword': 'current-password',
    
    // Payment (for future use)
    'cardNumber': 'cc-number',
    'cardName': 'cc-name',
    'cardExpiry': 'cc-exp',
    'cardCvc': 'cc-csc',
    
    // Organization
    'organization': 'organization',
    'companyName': 'organization',
    'jobTitle': 'organization-title',
  };
  
  return mapping[fieldName] || 'off';
};

/**
 * Get iOS textContentType for native support
 */
export const getTextContentType = (fieldName: string): string => {
  const mapping: { [key: string]: string } = {
    'name': 'name',
    'firstName': 'givenName',
    'lastName': 'familyName',
    'email': 'emailAddress',
    'phone': 'telephoneNumber',
    'phoneNumber': 'telephoneNumber',
    'address': 'fullStreetAddress',
    'address1': 'streetAddressLine1',
    'address2': 'streetAddressLine2',
    'city': 'addressCity',
    'state': 'addressState',
    'postalCode': 'postalCode',
    'zipCode': 'postalCode',
    'country': 'countryName',
    'username': 'username',
    'password': 'password',
    'newPassword': 'newPassword',
    'oneTimeCode': 'oneTimeCode',
  };
  
  return mapping[fieldName] || 'none';
};
