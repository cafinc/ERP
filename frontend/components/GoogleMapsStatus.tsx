import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';
import { validateGoogleMapsConfig } from '../config/maps';

export default function GoogleMapsStatus() {
  const isConfigured = validateGoogleMapsConfig();
  
  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <Ionicons 
          name={isConfigured ? "checkmark-circle" : "alert-circle"} 
          size={20} 
          color={isConfigured ? Colors.success : Colors.warning} 
        />
        <Text style={styles.statusText}>
          Google Maps API: {isConfigured ? "✅ Configured" : "⚠️ Setup Required"}
        </Text>
      </View>
      
      <View style={styles.statusRow}>
        <Ionicons 
          name="phone-portrait" 
          size={20} 
          color={Platform.OS !== 'web' ? Colors.success : Colors.gray400} 
        />
        <Text style={styles.statusText}>
          Native Maps: {Platform.OS !== 'web' ? "✅ Available" : "📱 Mobile Only"}
        </Text>
      </View>
      
      {isConfigured && Platform.OS !== 'web' && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>
            🎉 Google Maps is ready! Navigate to GPS tab to see enhanced mapping.
          </Text>
        </View>
      )}
      
      {isConfigured && Platform.OS === 'web' && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            📱 Google Maps works on mobile devices. Web version shows configuration status.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  successContainer: {
    backgroundColor: Colors.successLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  successText: {
    fontSize: 14,
    color: Colors.success,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
  },
});