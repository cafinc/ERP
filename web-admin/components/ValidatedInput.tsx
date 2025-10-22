'use client';

import React from 'react';
import { formatPhoneNumber, isValidEmail } from '@/lib/utils/formatters';

interface ValidatedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'number';
  required?: boolean;
  error?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  onBlur?: () => void;
}

/**
 * Validated Input Component
 * Automatically formats phone numbers and validates emails
 * Shows red border and error message for invalid input
 */
export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  error,
  placeholder,
  icon,
  className = '',
  onBlur,
}) => {
  const [localError, setLocalError] = React.useState<string>('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Auto-format phone numbers
    if (type === 'tel') {
      newValue = formatPhoneNumber(newValue);
    }
    
    onChange(newValue);
  };
  
  const handleBlur = () => {
    // Validate on blur
    if (type === 'email' && value) {
      if (!isValidEmail(value)) {
        setLocalError('Invalid email format');
      } else {
        setLocalError('');
      }
    }
    
    if (type === 'tel' && value) {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length > 0 && cleaned.length !== 10) {
        setLocalError('Phone must be 10 digits');
      } else {
        setLocalError('');
      }
    }
    
    if (onBlur) onBlur();
  };
  
  const displayError = error || localError;
  const hasError = !!displayError;
  
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {icon}
          </div>
        )}
        <input
          type={type === 'tel' ? 'text' : type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full ${icon ? 'pl-10' : 'px-4'} pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
            hasError
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-[#3f72af]'
          }`}
          placeholder={placeholder || (type === 'tel' ? '(555) 123-4567' : type === 'email' ? 'user@example.com' : '')}
          required={required}
        />
      </div>
      {displayError && (
        <p className="text-red-500 text-xs mt-1 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {displayError}
        </p>
      )}
    </div>
  );
};

export default ValidatedInput;
