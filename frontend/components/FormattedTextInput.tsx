import React, { useState } from 'react';
import {
  TextInput,
  TextInputProps,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  formatPhoneNumber,
  cleanPhoneNumber,
  capitalizeWords,
  formatEmail,
  formatAddress,
  formatPostalCode,
  getAutoCompleteType,
  getTextContentType,
} from '../utils/inputFormatters';

export type FormattingType = 
  | 'phone' 
  | 'email' 
  | 'capitalize-words'
  | 'capitalize-first' 
  | 'address' 
  | 'postal-code'
  | 'none';

interface FormattedTextInputProps extends TextInputProps {
  formatting?: FormattingType;
  onChangeValue?: (value: string) => void; // Returns unformatted value
  fieldName?: string; // For autocomplete attributes
}

/**
 * Enhanced TextInput with auto-formatting and native autofill support
 */
export const FormattedTextInput: React.FC<FormattedTextInputProps> = ({
  formatting = 'none',
  onChangeText,
  onChangeValue,
  value,
  fieldName,
  keyboardType,
  textContentType,
  autoComplete,
  autoCapitalize,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState(value || '');

  const handleChange = (text: string) => {
    let formatted = text;
    let cleanValue = text;

    // Apply formatting based on type
    switch (formatting) {
      case 'phone':
        formatted = formatPhoneNumber(text);
        cleanValue = cleanPhoneNumber(text);
        break;
      case 'email':
        formatted = formatEmail(text);
        cleanValue = formatted;
        break;
      case 'capitalize-words':
        formatted = capitalizeWords(text);
        cleanValue = formatted;
        break;
      case 'address':
        formatted = formatAddress(text);
        cleanValue = formatted;
        break;
      case 'postal-code':
        formatted = formatPostalCode(text);
        cleanValue = formatted;
        break;
      default:
        formatted = text;
        cleanValue = text;
    }

    setDisplayValue(formatted);
    
    // Call onChangeText with formatted value
    if (onChangeText) {
      onChangeText(formatted);
    }
    
    // Call onChangeValue with clean value (useful for API calls)
    if (onChangeValue) {
      onChangeValue(cleanValue);
    }
  };

  // Auto-determine keyboard type
  const getKeyboardType = () => {
    if (keyboardType) return keyboardType;
    
    switch (formatting) {
      case 'phone':
        return 'phone-pad';
      case 'email':
        return 'email-address';
      case 'postal-code':
        return 'default';
      default:
        return 'default';
    }
  };

  // Auto-determine autoCapitalize
  const getAutoCapitalize = () => {
    if (autoCapitalize) return autoCapitalize;
    
    switch (formatting) {
      case 'email':
        return 'none';
      case 'capitalize-words':
      case 'address':
        return 'words';
      default:
        return 'sentences';
    }
  };

  // Determine autocomplete attributes
  const autoCompleteAttr = autoComplete || (fieldName ? getAutoCompleteType(fieldName) : 'off');
  const textContentTypeAttr = textContentType || (fieldName ? getTextContentType(fieldName) : undefined);

  return (
    <TextInput
      {...props}
      value={displayValue}
      onChangeText={handleChange}
      keyboardType={getKeyboardType()}
      autoCapitalize={getAutoCapitalize()}
      autoComplete={autoCompleteAttr as any}
      textContentType={textContentTypeAttr as any}
      style={[styles.input, props.style]}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    fontSize: 16,
    color: '#111827',
  },
});

export default FormattedTextInput;
