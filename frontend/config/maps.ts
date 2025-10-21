// Google Maps Configuration for Snow Removal App
// Replace with your Google Maps API key

export const GOOGLE_MAPS_CONFIG = {
  // Get your API key from: https://console.cloud.google.com/apis/credentials
  // Required APIs: Maps JavaScript API, Maps SDK for Android/iOS
  API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
  
  // Default map settings
  DEFAULT_REGION: {
    latitude: 43.6532,  // Toronto, ON (adjust for your business location)
    longitude: -79.3832,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
  
  // Map styling options
  MAP_STYLES: {
    STANDARD: 'standard',
    SATELLITE: 'satellite',
    HYBRID: 'hybrid',
    TERRAIN: 'terrain',
  },
  
  // Geofencing settings
  GEOFENCE_RADIUS: 100, // meters
  
  // Tracking settings
  TRACKING_INTERVAL: 30000, // 30 seconds
  DISTANCE_FILTER: 10, // 10 meters
};

// Validation function
export const validateGoogleMapsConfig = (): boolean => {
  if (!GOOGLE_MAPS_CONFIG.API_KEY || GOOGLE_MAPS_CONFIG.API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    console.warn('⚠️ Google Maps API key not configured. Please set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env file');
    return false;
  }
  return true;
};