# Customer Form Improvements - Implementation Plan

## 🎯 Requirements

### Individual Form Improvements:
1. ✅ Default to "individual" type (pre-selected)
2. ✅ Separate first name and last name fields
3. ✅ Option for mobile number (separate from phone)
4. ✅ Address broken out:
   - Street Address
   - City
   - Province/State
   - Postal Code
   - Country
5. ✅ Google Places API integration for address verification
6. ✅ Phone number auto-formatting (as user types)

### Company Form Improvements:
1. ✅ Company-specific fields:
   - Company name
   - Address (broken out like individual)
   - Email
   - Phone (auto-formatted)
2. ✅ Main Contact section:
   - First Name
   - Last Name
   - Phone (auto-formatted)
   - Email
   - Position (dropdown: Owner, Manager, Accountant, Other)
3. ✅ On save:
   - Create company customer
   - Create individual customer for main contact
   - Link contact to company via company_id

## 🔧 Implementation

This requires:
1. Complete form redesign
2. Google Places API integration (already have API key)
3. Phone formatting library or custom formatter
4. Backend logic to create company + contact
5. State management for complex form

## 📝 Form Fields

### Individual Customer:
```
First Name: [_______]
Last Name: [_______]
Email: [_______]
Phone: [___-___-____] (auto-format)
Mobile: [___-___-____] (auto-format, optional)

Address:
  Street Address: [____________] (Google autocomplete)
  City: [_______]
  Province: [AB ▼]
  Postal Code: [_______]
  Country: [Canada ▼]
```

### Company Customer:
```
Company Name: [_______]
Email: [_______]
Phone: [___-___-____] (auto-format)

Address:
  Street Address: [____________] (Google autocomplete)
  City: [_______]
  Province: [AB ▼]
  Postal Code: [_______]
  Country: [Canada ▼]

Main Contact:
  First Name: [_______]
  Last Name: [_______]
  Phone: [___-___-____] (auto-format)
  Email: [_______]
  Position: [Manager ▼]
```

## 🚀 Next Steps

Due to the complexity of this overhaul, I recommend:

1. **Phase 1:** Update form UI with new fields (30 min)
2. **Phase 2:** Add phone formatting (10 min)
3. **Phase 3:** Integrate Google Places API (20 min)
4. **Phase 4:** Backend logic for company + contact (15 min)
5. **Phase 5:** Testing and refinement (15 min)

**Total estimated time:** ~90 minutes

This is a significant improvement that will greatly enhance the user experience!
