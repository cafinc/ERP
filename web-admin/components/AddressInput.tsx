'use client';

import { useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: any) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  onCityChange?: (value: string) => void;
  onProvinceChange?: (value: string) => void;
  onPostalCodeChange?: (value: string) => void;
  showCityProvincePostal?: boolean;
}

const CANADIAN_PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'YT', name: 'Yukon' },
];

export default function AddressInput({
  value,
  onChange,
  onPlaceSelect,
  label = 'Address',
  required = false,
  placeholder = '123 Main Street',
  error,
  city = '',
  province = 'AB',
  postalCode = '',
  onCityChange,
  onProvinceChange,
  onPostalCodeChange,
  showCityProvincePostal = true,
}: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && inputRef.current) {
      // Initialize Google Places Autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'ca' },
        fields: ['address_components', 'formatted_address', 'geometry'],
      });

      // Listen for place selection
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        
        if (place.formatted_address) {
          onChange(place.formatted_address);
        }

        // Extract address components
        if (place.address_components && onPlaceSelect) {
          const addressData: any = {
            formatted_address: place.formatted_address,
            lat: place.geometry?.location?.lat(),
            lng: place.geometry?.location?.lng(),
          };

          place.address_components.forEach((component: any) => {
            const types = component.types;
            
            if (types.includes('locality')) {
              addressData.city = component.long_name;
              if (onCityChange) onCityChange(component.long_name);
            }
            if (types.includes('administrative_area_level_1')) {
              addressData.province = component.short_name;
              if (onProvinceChange) onProvinceChange(component.short_name);
            }
            if (types.includes('postal_code')) {
              addressData.postal_code = component.long_name;
              if (onPostalCodeChange) onPostalCodeChange(component.long_name);
            }
            if (types.includes('country')) {
              addressData.country = component.long_name;
            }
          });

          onPlaceSelect(addressData);
        }
      });
    }
  }, [onChange, onPlaceSelect, onCityChange, onProvinceChange, onPostalCodeChange]);

  return (
    <div className="space-y-4">
      {/* Address Field */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white font-semibold transition-all ${
              error ? 'border-red-500' : 'border-gray-200'
            }`}
            placeholder={placeholder}
            required={required}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
            <img 
              src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" 
              alt="Powered by Google"
              className="h-4"
            />
          </div>
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        <p className="text-xs text-gray-500 mt-1">
          Start typing to use Google address autocomplete
        </p>
      </div>

      {/* City, Province, Postal Code Grid */}
      {showCityProvincePostal && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              City {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => onCityChange && onCityChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white font-semibold transition-all"
              placeholder="Calgary"
              required={required}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Province {required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={province}
              onChange={(e) => onProvinceChange && onProvinceChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white font-semibold transition-all"
              required={required}
            >
              {CANADIAN_PROVINCES.map(prov => (
                <option key={prov.code} value={prov.code}>
                  {prov.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Postal Code {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => onPostalCodeChange && onPostalCodeChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white font-semibold transition-all"
              placeholder="T2P 1J9"
              required={required}
            />
          </div>
        </div>
      )}
    </div>
  );
}
