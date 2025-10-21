import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Colors } from '../utils/theme';
import api from '../utils/api';

interface AddressAutocompleteProps {
  onSelectAddress: (address: {
    fullAddress: string;
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    latitude: number;
    longitude: number;
  }) => void;
  placeholder?: string;
  defaultValue?: string;
  label?: string;
}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function AddressAutocomplete({
  onSelectAddress,
  placeholder = 'Enter address...',
  defaultValue = '',
  label,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (inputValue.length > 2) {
      fetchSuggestions(inputValue);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue]);

  const fetchSuggestions = async (input: string) => {
    try {
      const response = await api.get(`/google-places/autocomplete?input=${encodeURIComponent(input)}`);
      
      if (response.data.status === 'REQUEST_DENIED') {
        console.error('Google Places API error:', response.data.error_message);
        return;
      }
      
      if (response.data.predictions) {
        setSuggestions(response.data.predictions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
    }
  };

  const selectAddress = async (placeId: string, description: string) => {
    try {
      // Fetch place details via backend proxy
      const response = await api.get(`/google-places/details?place_id=${placeId}`);
      
      if (response.data.result) {
        const details = response.data.result;
        const addressComponents = details.address_components || [];
        
        let street = '';
        let city = '';
        let province = '';
        let postalCode = '';
        let country = '';

        // Parse address components
        addressComponents.forEach((component: any) => {
          const types = component.types;
          
          if (types.includes('street_number')) {
            street = component.long_name + ' ';
          }
          if (types.includes('route')) {
            street += component.long_name;
          }
          if (types.includes('locality')) {
            city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            province = component.short_name;
          }
          if (types.includes('postal_code')) {
            postalCode = component.long_name;
          }
          if (types.includes('country')) {
            country = component.long_name;
          }
        });

        const addressData = {
          fullAddress: details.formatted_address || description,
          street: street.trim(),
          city,
          province,
          postalCode,
          country,
          latitude: details.geometry?.location?.lat || 0,
          longitude: details.geometry?.location?.lng || 0,
        };

        setInputValue(addressData.fullAddress);
        setShowSuggestions(false);
        onSelectAddress(addressData);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      // Fallback: just use the description
      setInputValue(description);
      setShowSuggestions(false);
      onSelectAddress({
        fullAddress: description,
        street: '',
        city: '',
        province: '',
        postalCode: '',
        country: '',
        latitude: 0,
        longitude: 0,
      });
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        value={inputValue}
        onChangeText={setInputValue}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray400}
      />
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => selectAddress(item.place_id, item.description)}
              >
                <Text style={styles.suggestionText}>{item.description}</Text>
              </TouchableOpacity>
            )}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    height: 48,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 76 : 48,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
});
