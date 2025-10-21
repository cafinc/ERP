# Autofill & Smart Filling Implementation Guide

## Overview
This app now supports comprehensive autofill and smart filling features to help users fill forms faster with:
- **Browser-native autofill** for passwords, emails, addresses (works with 1Password, LastPass, Chrome, Safari, etc.)
- **Custom smart filling** that learns from usage patterns
- **Auto-formatting** for phone numbers, names, and addresses
- **Quick-fill buttons** and form templates (coming soon)

## Components & Utilities

### 1. FormattedTextInput Component
Location: `/app/frontend/components/FormattedTextInput.tsx`

**Usage:**
```tsx
import FormattedTextInput from '../components/FormattedTextInput';

// Phone number with auto-formatting
<FormattedTextInput
  formatting="phone"
  fieldName="phone"
  placeholder="+1 (555) 123-4567"
  value={phone}
  onChangeText={setPhone}
  onChangeValue={(clean) => console.log(clean)} // Gets "+15551234567"
/>

// Email with autofill
<FormattedTextInput
  formatting="email"
  fieldName="email"
  placeholder="email@example.com"
  value={email}
  onChangeText={setEmail}
/>

// Name with auto-capitalization
<FormattedTextInput
  formatting="capitalize-words"
  fieldName="firstName"
  value={name}
  onChangeText={setName}
/>

// Address with formatting
<FormattedTextInput
  formatting="address"
  fieldName="address"
  value={address}
  onChangeText={setAddress}
/>
```

**Available Formatting Types:**
- `phone` - Auto-formats phone numbers (555) 123-4567
- `email` - Lowercase formatting
- `capitalize-words` - Capitalizes each word
- `capitalize-first` - Capitalizes first letter only
- `address` - Auto-capitalizes address
- `postal-code` - Formats ZIP/postal codes
- `none` - No formatting

### 2. Input Formatters Utility
Location: `/app/frontend/utils/inputFormatters.ts`

**Functions:**
```tsx
import {
  formatPhoneNumber,
  cleanPhoneNumber,
  capitalizeWords,
  formatEmail,
  formatAddress,
  formatPostalCode,
  isValidEmail,
  isValidPhone,
  getAutoCompleteType,
  getTextContentType,
} from '../utils/inputFormatters';

// Format as user types
const formatted = formatPhoneNumber("5551234567"); // "(555) 123-4567"

// Validate
if (isValidEmail(email)) { /* ... */ }
if (isValidPhone(phone)) { /* ... */ }
```

### 3. SmartFill Context
Location: `/app/frontend/contexts/SmartFillContext.tsx`

**Purpose:** Tracks usage patterns and provides smart suggestions based on frequency and context.

**Usage:**
```tsx
import { useSmartFill } from '../contexts/SmartFillContext';

function MyForm() {
  const { recordUsage, getSuggestions, getLastUsed } = useSmartFill();

  // Record when user selects/uses a value
  const handleCrewSelect = async (crewId: string) => {
    await recordUsage('crews', crewId, 'dispatch');
    // ... rest of your logic
  };

  // Get suggestions for autocomplete
  const crewSuggestions = getSuggestions('crews', 5, 'dispatch');
  // Returns: [{ value: "crew123", count: 15, lastUsed: "2025-..." }, ...]

  // Get last used value for "same as last time" feature
  const lastCrew = getLastUsed('crews');
  if (lastCrew) {
    console.log(`Last used: ${lastCrew.value}`);
  }
}
```

**Available Categories:**
- `crews` - Track crew member selections
- `equipment` - Track equipment usage
- `services` - Track service selections
- `contacts` - Track contact information
- `addresses` - Track address entries

**Methods:**
- `recordUsage(category, value, context?)` - Record usage for learning
- `getSuggestions(category, limit?, context?)` - Get top suggestions
- `getLastUsed(category)` - Get most recently used
- `clearHistory(category?)` - Clear specific or all history

## Native Autofill Support

### For Regular TextInput
```tsx
<TextInput
  // Email
  autoComplete="email"
  textContentType="emailAddress"
  keyboardType="email-address"
  
  // Phone
  autoComplete="tel"
  textContentType="telephoneNumber"
  keyboardType="phone-pad"
  
  // Password
  autoComplete="password"
  textContentType="password"
  secureTextEntry
  
  // One-Time Code (SMS)
  autoComplete="one-time-code"
  textContentType="oneTimeCode"
  
  // Name
  autoComplete="name"
  textContentType="name"
  
  // Address
  autoComplete="street-address"
  textContentType="fullStreetAddress"
  
  // City
  autoComplete="address-level2"
  textContentType="addressCity"
  
  // State/Province
  autoComplete="address-level1"
  textContentType="addressState"
  
  // Postal Code
  autoComplete="postal-code"
  textContentType="postalCode"
/>
```

## Implementation Checklist

### For Any New Form:

1. **Add SmartFill tracking**
   ```tsx
   const { recordUsage, getSuggestions } = useSmartFill();
   ```

2. **Replace TextInput with FormattedTextInput where appropriate**
   ```tsx
   // Before
   <TextInput value={phone} onChangeText={setPhone} />
   
   // After
   <FormattedTextInput 
     formatting="phone" 
     fieldName="phone"
     value={phone} 
     onChangeText={setPhone}
   />
   ```

3. **Add proper autofill attributes**
   - Use `autoComplete` for web/Android
   - Use `textContentType` for iOS
   - Use proper `keyboardType`

4. **Record usage when form is submitted**
   ```tsx
   const handleSubmit = async () => {
     // ... save data
     
     // Record for smart fill
     await recordUsage('crews', selectedCrew);
     await recordUsage('equipment', selectedEquipment);
   };
   ```

5. **Add "Use Last" buttons (optional)**
   ```tsx
   const lastUsed = getLastUsed('crews');
   
   {lastUsed && (
     <TouchableOpacity onPress={() => setSelectedCrew(lastUsed.value)}>
       <Text>Use Last: {lastUsed.value}</Text>
     </TouchableOpacity>
   )}
   ```

## Forms Already Updated

✅ **Login Page** (`/app/login.tsx`)
- Phone number autofill + formatting
- Email autofill
- Password autofill  
- One-time code autofill

## Forms To Update Next

- [ ] Customer Creation (`/app/customers/create.tsx`)
- [ ] Site Creation (`/app/sites/create.tsx`)
- [ ] Dispatch Forms
- [ ] Team Member Forms
- [ ] Equipment Forms

## Testing

### Test Browser Autofill:
1. Fill out a form and save in password manager
2. Return to form - should see autofill suggestions
3. Test on iOS Safari (should show QuickType bar)
4. Test on Chrome/Firefox (should show dropdown)

### Test Smart Filling:
1. Create multiple dispatches with same crew
2. Next time, that crew should appear in suggestions
3. Check `getLastUsed()` returns correct value

### Test Formatting:
1. Type phone number without formatting
2. Should auto-format as you type
3. Names should auto-capitalize
4. Addresses should format properly

## Best Practices

1. **Always provide fieldName** to FormattedTextInput for proper autofill
2. **Record usage immediately after submit** for accurate learning
3. **Use context** when recording (e.g., 'dispatch', 'site') for better suggestions
4. **Clear sensitive data** from smart fill if needed: `clearHistory('contacts')`
5. **Test on both iOS and Android** - autofill behavior differs

## Future Enhancements

- [ ] Form templates (save/load entire forms)
- [ ] Server-side storage of smart fill data
- [ ] Export/import autofill preferences
- [ ] ML-based predictions for field values
- [ ] Voice input integration
