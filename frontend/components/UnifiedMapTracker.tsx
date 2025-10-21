import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Colors } from '../utils/theme';

// Platform-specific imports
let MapView: any;
let MapViewNative: any;
let MapViewWeb: any;
let Marker: any;
let Source: any;
let Layer: any;
let MarkerNative: any;
let ShapeSourceNative: any;
let LineLayerNative: any;
let CircleLayerNative: any;

if (Platform.OS === 'web') {
  // Web: Use react-map-gl with MapLibre
  const ReactMapGL = require('react-map-gl/maplibre');
  MapViewWeb = ReactMapGL.Map;
  Marker = ReactMapGL.Marker;
  Source = ReactMapGL.Source;
  Layer = ReactMapGL.Layer;
} else {
  // Native: Use @maplibre/maplibre-react-native
  const MapLibreNative = require('@maplibre/maplibre-react-native');
  MapViewNative = MapLibreNative.MapView;
  MarkerNative = MapLibreNative.MarkerView;
  ShapeSourceNative = MapLibreNative.ShapeSource;
  LineLayerNative = MapLibreNative.LineLayer;
  CircleLayerNative = MapLibreNative.CircleLayer;
}

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

interface UnifiedMapTrackerProps {
  dispatchId?: string;
  crewId?: string;
  showAllCrew?: boolean;
  height?: number;
}

// High-quality map tile sources
const MAP_STYLES = {
  standard: {
    version: 8,
    sources: {
      'osm': {
        type: 'raster',
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors',
        maxzoom: 19
      }
    },
    layers: [
      {
        id: 'osm-tiles',
        type: 'raster',
        source: 'osm',
        minzoom: 0,
        maxzoom: 22
      }
    ]
  },
  satellite: {
    version: 8,
    sources: {
      'esri-world-imagery': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: 'Tiles © Esri',
        maxzoom: 18
      }
    },
    layers: [
      {
        id: 'esri-world-imagery-layer',
        type: 'raster',
        source: 'esri-world-imagery',
        minzoom: 0,
        maxzoom: 22
      }
    ]
  }
};

export default function UnifiedMapTracker({
  dispatchId,
  crewId,
  showAllCrew = false,
  height = 400,
}: UnifiedMapTrackerProps) {
  const { currentUser, isAdmin, isCrew } = useAuth();
  
  // State
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [crewLocations, setCrewLocations] = useState<GPSLocation[]>([]);
  const [route, setRoute] = useState<GPSLocation[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  
  // Web-specific state
  const [viewState, setViewState] = useState({
    longitude: -79.3832,
    latitude: 43.6532,
    zoom: 12,
  });

  useEffect(() => {
    initializeMap();
    fetchData();
    
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [dispatchId, crewId, showAllCrew]);

  const initializeMap = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web: Use browser geolocation with better error handling
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('Location obtained:', position.coords);
              setViewState({
                longitude: position.coords.longitude,
                latitude: position.coords.latitude,
                zoom: 14,
              });
              setCurrentLocation({
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  altitude: position.coords.altitude,
                  accuracy: position.coords.accuracy,
                  altitudeAccuracy: position.coords.altitudeAccuracy,
                  heading: position.coords.heading,
                  speed: position.coords.speed,
                },
                timestamp: position.timestamp,
              } as Location.LocationObject);
            },
            (error) => {
              console.error('Geolocation error:', error);
              // Use default location (Toronto) if geolocation fails
              setViewState({
                longitude: -79.3832,
                latitude: 43.6532,
                zoom: 12,
              });
              Alert.alert(
                'Location Access',
                'Location permission was denied. Using default location. Please enable location services in your browser settings to see your current position.',
                [{ text: 'OK' }]
              );
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        } else {
          console.log('Geolocation not supported by browser');
          // Use default location
          setViewState({
            longitude: -79.3832,
            latitude: 43.6532,
            zoom: 12,
          });
        }
      } else {
        // Native: Use expo-location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required for GPS tracking');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location);
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
        const response = await api.get(`/gps-location/live/${crewId}`);
        if (response.data) {
          locations = [response.data];
        }
      } else if (currentUser?.role === 'crew') {
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
        response = await api.get('/sites');
      }
      
      console.log('Sites fetched:', response.data.length);
      console.log('Sites with valid coordinates:', response.data.filter((s: Site) => s.location?.latitude && s.location?.longitude).length);
      setSites(response.data);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const startTracking = async () => {
    setTracking(true);
    
    try {
      if (Platform.OS === 'web') {
        // Web tracking
        if (navigator.geolocation) {
          const watchId = navigator.geolocation.watchPosition(
            (position) => {
              const location = {
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  altitude: position.coords.altitude,
                  accuracy: position.coords.accuracy,
                  altitudeAccuracy: position.coords.altitudeAccuracy,
                  heading: position.coords.heading,
                  speed: position.coords.speed,
                },
                timestamp: position.timestamp,
              } as Location.LocationObject;
              
              setCurrentLocation(location);
              sendLocationUpdate(location);
            },
            (error) => console.error('Watch position error:', error),
            { enableHighAccuracy: true }
          );
          
          // Store watchId for cleanup
          return () => navigator.geolocation.clearWatch(watchId);
        }
      } else {
        // Native tracking
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
      }
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

  const getMarkerColor = (crewLocation: GPSLocation): string => {
    const lastUpdate = new Date(crewLocation.timestamp);
    const now = new Date();
    const minutesAgo = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesAgo < 5) return '#4CAF50'; // Green - Active
    if (minutesAgo < 30) return '#FF9800'; // Orange - Idle
    return '#9E9E9E'; // Gray - Offline
  };

  // Create GeoJSON for routes (web)
  const createRouteGeoJSON = () => {
    if (route.length < 2) return null;
    
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: route.map(point => [point.longitude, point.latitude])
      },
      properties: {}
    };
  };

  // Create GeoJSON for geofences (web)
  const createGeofenceGeoJSON = () => {
    const features = sites
      .filter(site => site.location?.latitude && site.location?.longitude)
      .map(site => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [site.location.longitude, site.location.latitude]
        },
        properties: {
          radius: 100 // 100 meters
        }
      }));
    
    return {
      type: 'FeatureCollection',
      features
    };
  };

  // Create GeoJSON for site markers with clustering support
  const createSitesGeoJSON = () => {
    const features = sites
      .filter(site => site.location?.latitude && site.location?.longitude)
      .map(site => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [site.location.longitude, site.location.latitude]
        },
        properties: {
          id: site.id,
          name: site.name,
          siteType: site.site_type,
          address: site.location.address
        }
      }));
    
    return {
      type: 'FeatureCollection',
      features
    };
  };

  const renderWebMarkers = () => {
    if (!Marker) return null;
    
    return (
      <>
        {/* Crew Location Markers */}
        {crewLocations.map((location) => (
          <Marker
            key={location.id}
            longitude={location.longitude}
            latitude={location.latitude}
            anchor="center"
          >
            <View style={[styles.webCrewMarker, { backgroundColor: getMarkerColor(location) }]}>
              <Ionicons name="person" size={16} color="white" />
            </View>
          </Marker>
        ))}

        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            longitude={currentLocation.coords.longitude}
            latitude={currentLocation.coords.latitude}
            anchor="center"
          >
            <View style={styles.webCurrentLocationMarker}>
              <Ionicons name="navigate" size={20} color="white" />
            </View>
          </Marker>
        )}
      </>
    );
  };

  const renderWebLayers = () => {
    if (!Source || !Layer) return null;
    
    const routeGeoJSON = createRouteGeoJSON();
    const geofenceGeoJSON = createGeofenceGeoJSON();
    const sitesGeoJSON = createSitesGeoJSON();
    
    return (
      <>
        {/* Route Line */}
        {routeGeoJSON && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': Colors.primary,
                'line-width': 3,
                'line-dasharray': [2, 2]
              }}
            />
          </Source>
        )}
        
        {/* Geofence Circles */}
        {geofenceGeoJSON && geofenceGeoJSON.features.length > 0 && (
          <Source id="geofences" type="geojson" data={geofenceGeoJSON}>
            <Layer
              id="geofence-circles"
              type="circle"
              paint={{
                'circle-radius': {
                  stops: [
                    [0, 0],
                    [20, 100] // This creates a 100m radius at zoom level 20
                  ],
                  base: 2
                },
                'circle-color': Colors.primary,
                'circle-opacity': 0.1,
                'circle-stroke-width': 2,
                'circle-stroke-color': Colors.primary,
                'circle-stroke-opacity': 0.5
              }}
            />
          </Source>
        )}

        {/* Site Markers with Clustering */}
        {sitesGeoJSON && sitesGeoJSON.features.length > 0 && (
          <Source 
            id="sites" 
            type="geojson" 
            data={sitesGeoJSON}
            cluster={true}
            clusterMaxZoom={14}
            clusterRadius={50}
          >
            {/* Clusters */}
            <Layer
              id="clusters"
              type="circle"
              filter={['has', 'point_count']}
              paint={{
                'circle-color': [
                  'step',
                  ['get', 'point_count'],
                  '#51bbd6',
                  10,
                  '#f1f075',
                  20,
                  '#f28cb1'
                ],
                'circle-radius': [
                  'step',
                  ['get', 'point_count'],
                  20,
                  10,
                  30,
                  20,
                  40
                ]
              }}
            />
            
            {/* Cluster Count */}
            <Layer
              id="cluster-count"
              type="symbol"
              filter={['has', 'point_count']}
              layout={{
                'text-field': '{point_count_abbreviated}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
              }}
              paint={{
                'text-color': '#ffffff'
              }}
            />
            
            {/* Individual Sites */}
            <Layer
              id="unclustered-sites"
              type="circle"
              filter={['!', ['has', 'point_count']]}
              paint={{
                'circle-color': Colors.primary,
                'circle-radius': 8,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#fff'
              }}
            />
          </Source>
        )}
      </>
    );
  };

  const renderNativeAnnotations = () => {
    if (!MarkerNative || !ShapeSourceNative || !LineLayerNative || !CircleLayerNative) return null;
    
    const routeGeoJSON = createRouteGeoJSON();
    const geofenceGeoJSON = createGeofenceGeoJSON();
    
    return (
      <>
        {/* Crew Location Markers */}
        {crewLocations.map((location) => (
          <MarkerNative
            key={location.id}
            coordinate={[location.longitude, location.latitude]}
          >
            <View style={[styles.crewMarker, { backgroundColor: getMarkerColor(location) }]}>
              <Ionicons name="person" size={16} color="white" />
            </View>
          </MarkerNative>
        ))}
        
        {/* Site Markers */}
        {sites.map((site) => (
          site.location?.latitude && site.location?.longitude && (
            <MarkerNative
              key={site.id}
              coordinate={[site.location.longitude, site.location.latitude]}
            >
              <View style={styles.siteMarker}>
                <Ionicons name="location" size={24} color={Colors.primary} />
              </View>
            </MarkerNative>
          )
        ))}

        {/* Current Location Marker */}
        {currentLocation && (
          <MarkerNative
            coordinate={[currentLocation.coords.longitude, currentLocation.coords.latitude]}
          >
            <View style={styles.currentLocationMarker}>
              <Ionicons name="navigate" size={20} color="white" />
            </View>
          </MarkerNative>
        )}

        {/* Route Line */}
        {routeGeoJSON && (
          <ShapeSourceNative id="route" shape={routeGeoJSON}>
            <LineLayerNative
              id="route-line"
              style={{
                lineColor: Colors.primary,
                lineWidth: 3,
                lineDasharray: [2, 2]
              }}
            />
          </ShapeSourceNative>
        )}

        {/* Geofence Circles */}
        {geofenceGeoJSON && geofenceGeoJSON.features.length > 0 && (
          <ShapeSourceNative id="geofences" shape={geofenceGeoJSON}>
            <CircleLayerNative
              id="geofence-circles"
              style={{
                circleRadius: 100,
                circleColor: Colors.primary,
                circleOpacity: 0.1,
                circleStrokeWidth: 2,
                circleStrokeColor: Colors.primary,
                circleStrokeOpacity: 0.5
              }}
            />
          </ShapeSourceNative>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { height }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Map...</Text>
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
        
        {currentLocation && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              if (Platform.OS === 'web') {
                setViewState({
                  ...viewState,
                  longitude: currentLocation.coords.longitude,
                  latitude: currentLocation.coords.latitude,
                  zoom: 14,
                });
              }
            }}
          >
            <Ionicons name="locate" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* MapLibre Map - Platform specific rendering */}
      {Platform.OS === 'web' ? (
        <MapViewWeb
          {...viewState}
          onMove={(evt: any) => setViewState(evt.viewState)}
          mapStyle={mapType === 'standard' ? MAP_STYLES.standard : MAP_STYLES.satellite}
          style={{ width: '100%', height: '100%' }}
        >
          {renderWebLayers()}
          {renderWebMarkers()}
        </MapViewWeb>
      ) : (
        <MapViewNative
          style={styles.map}
          styleURL={mapType === 'standard' ? MAP_STYLES.standard : JSON.stringify(MAP_STYLES.satellite)}
          logoEnabled={false}
          attributionEnabled={true}
          attributionPosition={{ bottom: 8, left: 8 }}
          centerCoordinate={
            currentLocation 
              ? [currentLocation.coords.longitude, currentLocation.coords.latitude]
              : [-79.3832, 43.6532]
          }
          zoomLevel={12}
        >
          {renderNativeAnnotations()}
        </MapViewNative>
      )}

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
    zIndex: 1000,
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
  webCrewMarker: {
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
    padding: 12,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  webSiteMarker: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  currentLocationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  webCurrentLocationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  trackingControls: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 1000,
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
    zIndex: 1000,
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
