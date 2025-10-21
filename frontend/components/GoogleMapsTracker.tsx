import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Colors } from '../utils/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GPSLocation {
  id: string;
  crew_id: string;
  crew_name?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  accuracy?: number;
  bearing?: number;
  dispatch_id?: string;
  dispatch_name?: string;
}

interface Site {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

interface GoogleMapsTrackerProps {
  dispatchId?: string;
  crewId?: string;
  showAllCrew?: boolean;
  height?: number;
}

export default function GoogleMapsTracker({ 
  dispatchId, 
  crewId, 
  showAllCrew = false,
  height = 400 
}: GoogleMapsTrackerProps) {
  const { currentUser, isAdmin, isCrew } = useAuth();
  const mapRef = useRef<MapView>(null);
  
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [crewLocations, setCrewLocations] = useState<GPSLocation[]>([]);
  const [route, setRoute] = useState<GPSLocation[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');

  useEffect(() => {
    initializeMap();
    fetchData();
    
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [dispatchId, crewId, showAllCrew]);

  const initializeMap = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for GPS tracking');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
      
      // Center map on current location
      if (mapRef.current && location) {
        mapRef.current.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchCrewLocations(),
        fetchSites(),
        dispatchId ? fetchRoute() : Promise.resolve()
      ]);
    } catch (error) {
      console.error('Error fetching map data:', error);
    }
  };

  const fetchCrewLocations = async () => {
    try {
      let locations: GPSLocation[] = [];
      
      if (showAllCrew) {
        // Fetch all crew locations for admin view
        const crewResponse = await api.get('/users?role=crew');
        const crews = crewResponse.data;
        
        const locationPromises = crews.map(async (crew: any) => {
          try {
            const locationResponse = await api.get(`/gps-location/live/${crew.id}`);
            return {
              ...locationResponse.data,
              crew_name: crew.name
            };
          } catch (error) {
            return null;
          }
        });
        
        const results = await Promise.all(locationPromises);
        locations = results.filter(Boolean);
      } else if (crewId) {
        // Fetch specific crew location
        const response = await api.get(`/gps-location/live/${crewId}`);
        if (response.data) {
          locations = [response.data];
        }
      } else if (currentUser?.role === 'crew') {
        // Fetch current user's location
        const response = await api.get(`/gps-location/live/${currentUser.id}`);
        if (response.data) {
          locations = [response.data];
        }
      }
      
      setCrewLocations(locations);
    } catch (error) {
      console.error('Error fetching crew locations:', error);
    }
  };

  const fetchRoute = async () => {
    if (!dispatchId) return;
    
    try {
      const response = await api.get(`/gps-location/route/${dispatchId}`);
      setRoute(response.data.route || []);
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  const fetchSites = async () => {
    try {
      let response;
      if (dispatchId) {
        // Get sites for specific dispatch
        const dispatchResponse = await api.get(`/dispatches/${dispatchId}`);
        const siteIds = dispatchResponse.data.site_ids || [];
        
        if (siteIds.length > 0) {
          const sitePromises = siteIds.map((siteId: string) => 
            api.get(`/sites/${siteId}`)
          );
          const siteResults = await Promise.all(sitePromises);
          response = { data: siteResults.map(r => r.data) };
        } else {
          response = { data: [] };
        }
      } else {
        // Get all sites
        response = await api.get('/sites');
      }
      
      setSites(response.data);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const startTracking = async () => {
    setTracking(true);
    
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000, // 30 seconds
          distanceInterval: 10, // 10 meters
        },
        (location) => {
          setCurrentLocation(location);
          sendLocationUpdate(location);
        }
      );

      return subscription;
    } catch (error) {
      console.error('Error starting tracking:', error);
      setTracking(false);
    }
  };

  const stopTracking = () => {
    setTracking(false);
  };

  const sendLocationUpdate = async (location: Location.LocationObject) => {
    try {
      await api.post('/gps-location', {
        crew_id: currentUser?.id,
        dispatch_id: dispatchId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        speed: location.coords.speed || 0,
        accuracy: location.coords.accuracy || 0,
        bearing: location.coords.heading || 0,
      });
    } catch (error) {
      console.error('Error sending location update:', error);
    }
  };

  const centerOnLocation = (latitude: number, longitude: number) => {
    mapRef.current?.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 1000);
  };

  const fitToCoordinates = () => {
    const coordinates: Array<{latitude: number, longitude: number}> = [];
    
    // Add crew locations
    crewLocations.forEach(location => {
      coordinates.push({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    });
    
    // Add sites
    sites.forEach(site => {
      if (site.location?.latitude && site.location?.longitude) {
        coordinates.push({
          latitude: site.location.latitude,
          longitude: site.location.longitude,
        });
      }
    });
    
    // Add current location
    if (currentLocation) {
      coordinates.push({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    }
    
    if (coordinates.length > 0) {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const getMarkerColor = (crewLocation: GPSLocation): string => {
    const lastUpdate = new Date(crewLocation.timestamp);
    const now = new Date();
    const minutesAgo = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesAgo < 5) return '#4CAF50'; // Green - Active
    if (minutesAgo < 30) return '#FF9800'; // Orange - Idle
    return '#9E9E9E'; // Gray - Offline
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { height }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading GPS...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
        >
          <Ionicons 
            name={mapType === 'standard' ? 'layers' : 'map'} 
            size={20} 
            color={Colors.primary} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={fitToCoordinates}
        >
          <Ionicons name="expand" size={20} color={Colors.primary} />
        </TouchableOpacity>
        
        {currentLocation && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => centerOnLocation(
              currentLocation.coords.latitude,
              currentLocation.coords.longitude
            )}
          >
            <Ionicons name="locate" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Google Maps */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        mapType={mapType}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsTraffic={true}
        initialRegion={{
          latitude: currentLocation?.coords.latitude || 43.6532,
          longitude: currentLocation?.coords.longitude || -79.3832,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Crew Location Markers */}
        {crewLocations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.crew_name || `Crew ${location.crew_id}`}
            description={`Last update: ${new Date(location.timestamp).toLocaleTimeString()}`}
            pinColor={getMarkerColor(location)}
          >
            <View style={[styles.crewMarker, { backgroundColor: getMarkerColor(location) }]}>
              <Ionicons name="person" size={16} color="white" />
            </View>
          </Marker>
        ))}

        {/* Site Markers */}
        {sites.map((site) => (
          site.location?.latitude && site.location?.longitude && (
            <Marker
              key={site.id}
              coordinate={{
                latitude: site.location.latitude,
                longitude: site.location.longitude,
              }}
              title={site.name}
              description={site.location.address}
            >
              <View style={styles.siteMarker}>
                <Ionicons name="location" size={20} color={Colors.primary} />
              </View>
            </Marker>
          )
        ))}

        {/* Route Polyline */}
        {route.length > 1 && (
          <Polyline
            coordinates={route.map(point => ({
              latitude: point.latitude,
              longitude: point.longitude,
            }))}
            strokeColor={Colors.primary}
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )}

        {/* Geofencing circles around sites */}
        {sites.map((site) => (
          site.location?.latitude && site.location?.longitude && (
            <Circle
              key={`geofence-${site.id}`}
              center={{
                latitude: site.location.latitude,
                longitude: site.location.longitude,
              }}
              radius={100} // 100 meter radius
              strokeColor={Colors.primaryLight}
              fillColor={`${Colors.primaryLight}20`}
              strokeWidth={2}
            />
          )
        ))}
      </MapView>

      {/* Tracking Controls */}
      {isCrew && (
        <View style={styles.trackingControls}>
          <TouchableOpacity
            style={[
              styles.trackingButton,
              tracking ? styles.stopButton : styles.startButton
            ]}
            onPress={tracking ? stopTracking : startTracking}
          >
            <Ionicons 
              name={tracking ? "stop-circle" : "play-circle"} 
              size={20} 
              color="white" 
            />
            <Text style={styles.trackingButtonText}>
              {tracking ? 'Stop Tracking' : 'Start Tracking'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Legend */}
      {showAllCrew && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Active</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>Idle</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#9E9E9E' }]} />
            <Text style={styles.legendText}>Offline</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: Colors.background,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.white,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  crewMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  siteMarker: {
    backgroundColor: Colors.white,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  trackingControls: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  startButton: {
    backgroundColor: Colors.success,
  },
  stopButton: {
    backgroundColor: Colors.error,
  },
  trackingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  legend: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});