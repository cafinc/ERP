import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
  useWindowDimensions,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import UnifiedMapTracker from '../../components/UnifiedMapTracker';
import WebAdminLayout from '../../components/WebAdminLayout';

interface CrewLocation {
  crew_id: string;
  crew_name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  accuracy?: number;
  bearing?: number;
  dispatch_id?: string;
  dispatch_site?: string;
  status?: string;
}

interface TrackingStats {
  distance_km: number;
  duration_minutes: number;
  average_speed_kmh: number;
  locations_recorded: number;
}

function TrackingContent() {
  const { currentUser, isAdmin, isCrew } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [autoTracking, setAutoTracking] = useState(false);
  const [crewLocations, setCrewLocations] = useState<CrewLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeDispatch, setActiveDispatch] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [trackingStats, setTrackingStats] = useState<TrackingStats | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;

  useEffect(() => {
    initializeTracking();
    fetchTrackingData();
    
    const interval = setInterval(() => {
      fetchTrackingData();
    }, 30000);
    
    return () => {
      clearInterval(interval);
      // Clean up location subscription
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Fetch stats when dispatch is active
  useEffect(() => {
    if (activeDispatch && isCrew) {
      fetchTrackingStats();
    }
  }, [activeDispatch]);

  const fetchTrackingStats = async () => {
    try {
      if (!activeDispatch?.id) return;
      
      const response = await api.get(`/gps-location/route/${activeDispatch.id}`);
      if (response.data) {
        setTrackingStats({
          distance_km: response.data.total_distance_km || 0,
          duration_minutes: response.data.duration_minutes || 0,
          average_speed_kmh: response.data.average_speed_kmh || 0,
          locations_recorded: response.data.locations?.length || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching tracking stats:', error);
    }
  };

  const initializeTracking = async () => {
    try {
      if (Platform.OS === 'web' || !Location) {
        setLoading(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for GPS tracking');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error initializing tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingData = async () => {
    try {
      if (isAdmin) {
        await fetchAllCrewLocations();
      } else if (isCrew) {
        await fetchActiveDispatch();
        await fetchMyLocation();
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    }
  };

  const fetchAllCrewLocations = async () => {
    try {
      const crewResponse = await api.get('/users?role=crew');
      const crews = crewResponse.data;
      
      const locationPromises = crews.map(async (crew: any) => {
        try {
          const locResponse = await api.get(`/gps-location/live/${crew.id}`);
          if (locResponse.data) {
            const dispatchResponse = await api.get(`/dispatches?crew_id=${crew.id}&status=in_progress`);
            const activeDispatch = dispatchResponse.data.length > 0 ? dispatchResponse.data[0] : null;
            
            return {
              crew_id: crew.id,
              crew_name: crew.name,
              latitude: locResponse.data.latitude,
              longitude: locResponse.data.longitude,
              timestamp: locResponse.data.timestamp,
              speed: locResponse.data.speed,
              accuracy: locResponse.data.accuracy,
              bearing: locResponse.data.bearing,
              dispatch_id: activeDispatch?.id,
              dispatch_site: activeDispatch?.site_name,
              status: activeDispatch ? 'active' : 'idle',
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      });
      
      const locations = await Promise.all(locationPromises);
      setCrewLocations(locations.filter(loc => loc !== null) as CrewLocation[]);
    } catch (error) {
      console.error('Error fetching crew locations:', error);
    }
  };

  const fetchActiveDispatch = async () => {
    try {
      const response = await api.get(`/dispatches?crew_id=${currentUser?.id}&status=in_progress`);
      if (response.data.length > 0) {
        setActiveDispatch(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching active dispatch:', error);
    }
  };

  const fetchMyLocation = async () => {
    try {
      const response = await api.get(`/gps-location/live/${currentUser?.id}`);
      if (response.data) {
        setCrewLocations([{
          crew_id: currentUser!.id,
          crew_name: currentUser!.name,
          latitude: response.data.latitude,
          longitude: response.data.longitude,
          timestamp: response.data.timestamp,
          speed: response.data.speed,
          accuracy: response.data.accuracy,
          bearing: response.data.bearing,
          dispatch_id: activeDispatch?.id,
          dispatch_site: activeDispatch?.site_name,
          status: activeDispatch ? 'active' : 'idle',
        }]);
      }
    } catch (error) {
      console.error('Error fetching my location:', error);
    }
  };

  const startTracking = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Web Platform', 'GPS tracking is not available on web. Please use the mobile app.');
      return;
    }

    if (!activeDispatch && isCrew) {
      Alert.alert('No Active Dispatch', 'Please start a dispatch to begin tracking');
      return;
    }

    try {
      setIsTracking(true);
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      await api.post('/gps-location', {
        crew_id: currentUser?.id,
        dispatch_id: activeDispatch?.id,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        speed: location.coords.speed,
        accuracy: location.coords.accuracy,
        bearing: location.coords.heading,
      });

      setCurrentLocation(location);
      
      // Start continuous tracking if enabled
      if (autoTracking) {
        await startContinuousTracking();
      }
      
      Alert.alert('Success', 'Location tracking started');
      fetchTrackingData();
      fetchTrackingStats();
    } catch (error) {
      console.error('Error starting tracking:', error);
      Alert.alert('Error', 'Failed to start tracking');
      setIsTracking(false);
    }
  };

  const startContinuousTracking = async () => {
    try {
      // Request background permission
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        Alert.alert(
          'Background Permission Required',
          'Background location permission is needed for continuous tracking. You can continue with manual tracking.'
        );
        setAutoTracking(false);
        return;
      }

      // Start watching position
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // Update every 30 seconds
          distanceInterval: 50, // Or when moved 50 meters
        },
        async (location) => {
          try {
            await api.post('/gps-location', {
              crew_id: currentUser?.id,
              dispatch_id: activeDispatch?.id,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              speed: location.coords.speed,
              accuracy: location.coords.accuracy,
              bearing: location.coords.heading,
            });
            
            setCurrentLocation(location);
            setLastUpdate(new Date());
            
            // Fetch updated stats
            if (activeDispatch) {
              fetchTrackingStats();
            }
          } catch (error) {
            console.error('Error recording location:', error);
          }
        }
      );
    } catch (error) {
      console.error('Error starting continuous tracking:', error);
      Alert.alert('Error', 'Failed to start continuous tracking');
      setAutoTracking(false);
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    setAutoTracking(false);
    
    // Stop watching position
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    
    Alert.alert('Tracking Stopped', 'GPS tracking has been stopped');
  };

  const toggleAutoTracking = async (value: boolean) => {
    setAutoTracking(value);
    
    if (value && isTracking) {
      await startContinuousTracking();
    } else if (!value && locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrackingData();
    setRefreshing(false);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleString();
  };

  const formatSpeed = (speed?: number) => {
    if (!speed) return '0 km/h';
    return `${Math.round(speed * 3.6)} km/h`;
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Initializing GPS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📍 Live Tracking</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Map Component - Admin shows all crew, Crew shows own location */}
        {isAdmin ? (
          <UnifiedMapTracker 
            showAllCrew={true} 
            height={400}
          />
        ) : isCrew && activeDispatch ? (
          <UnifiedMapTracker 
            crewId={currentUser?.id}
            dispatchId={activeDispatch.id}
            height={400}
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.placeholderText}>
              No active dispatch
            </Text>
            <Text style={styles.placeholderSubtext}>
              Start a dispatch to enable GPS tracking
            </Text>
          </View>
        )}

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Ionicons name="people" size={20} color={Colors.primary} />
              <Text style={styles.statusValue}>{crewLocations.length}</Text>
              <Text style={styles.statusLabel}>Tracked</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.statusValue}>
                {crewLocations.filter(c => c.status === 'active').length}
              </Text>
              <Text style={styles.statusLabel}>Active</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="time" size={20} color={Colors.gray500} />
              <Text style={styles.statusValue}>
                {crewLocations.filter(c => c.status === 'idle').length}
              </Text>
              <Text style={styles.statusLabel}>Idle</Text>
            </View>
          </View>
          <Text style={styles.lastUpdate}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Text>
        </View>

        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Crews</Text>
            {crewLocations.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="location-outline" size={48} color={Colors.gray400} />
                <Text style={styles.emptyText}>No crew locations available</Text>
                <Text style={styles.emptySubtext}>
                  Crews need to start tracking from their devices
                </Text>
              </View>
            ) : (
              crewLocations.map((crew) => (
                <View key={crew.crew_id} style={styles.crewCard}>
                  <View style={styles.crewHeader}>
                    <View style={styles.crewInfo}>
                      <View style={styles.crewNameRow}>
                        <Ionicons name="person" size={20} color={Colors.primary} />
                        <Text style={styles.crewName}>{crew.crew_name}</Text>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        crew.status === 'active' ? styles.statusActive : styles.statusIdle
                      ]}>
                        <View style={[
                          styles.statusDot,
                          crew.status === 'active' ? styles.dotActive : styles.dotIdle
                        ]} />
                        <Text style={styles.statusText}>
                          {crew.status === 'active' ? 'On Dispatch' : 'Idle'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {crew.dispatch_site && (
                    <View style={styles.dispatchInfo}>
                      <Ionicons name="business" size={16} color={Colors.textSecondary} />
                      <Text style={styles.dispatchText}>
                        Assigned to: {crew.dispatch_site}
                      </Text>
                    </View>
                  )}

                  <View style={styles.locationDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="location" size={16} color={Colors.textSecondary} />
                      <Text style={styles.detailText}>
                        {formatCoordinates(crew.latitude, crew.longitude)}
                      </Text>
                    </View>
                    {crew.speed !== undefined && (
                      <View style={styles.detailRow}>
                        <Ionicons name="speedometer" size={16} color={Colors.textSecondary} />
                        <Text style={styles.detailText}>{formatSpeed(crew.speed)}</Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={16} color={Colors.textSecondary} />
                      <Text style={styles.detailText}>
                        {formatTimestamp(crew.timestamp)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {isCrew && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Location</Text>
            
            {activeDispatch && (
              <View style={styles.activeDispatchCard}>
                <View style={styles.dispatchHeader}>
                  <Ionicons name="briefcase" size={24} color={Colors.primary} />
                  <Text style={styles.dispatchTitle}>Active Dispatch</Text>
                </View>
                <Text style={styles.dispatchSite}>{activeDispatch.site_name}</Text>
                <Text style={styles.dispatchDetails}>
                  Status: {activeDispatch.status}
                </Text>
                
                {/* Tracking Stats */}
                {trackingStats && (
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Ionicons name="navigate" size={16} color={Colors.primary} />
                      <Text style={styles.statValue}>{trackingStats.distance_km.toFixed(2)} km</Text>
                      <Text style={styles.statLabel}>Distance</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="time" size={16} color={Colors.primary} />
                      <Text style={styles.statValue}>{trackingStats.duration_minutes} min</Text>
                      <Text style={styles.statLabel}>Duration</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="speedometer" size={16} color={Colors.primary} />
                      <Text style={styles.statValue}>{trackingStats.average_speed_kmh.toFixed(1)} km/h</Text>
                      <Text style={styles.statLabel}>Avg Speed</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="location" size={16} color={Colors.primary} />
                      <Text style={styles.statValue}>{trackingStats.locations_recorded}</Text>
                      <Text style={styles.statLabel}>Points</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {currentLocation && (
              <View style={styles.myLocationCard}>
                <Text style={styles.myLocationTitle}>Current Position</Text>
                <View style={styles.locationDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>
                      {formatCoordinates(
                        currentLocation.coords.latitude,
                        currentLocation.coords.longitude
                      )}
                    </Text>
                  </View>
                  {currentLocation.coords.speed && (
                    <View style={styles.detailRow}>
                      <Ionicons name="speedometer" size={16} color={Colors.textSecondary} />
                      <Text style={styles.detailText}>
                        {formatSpeed(currentLocation.coords.speed)}
                      </Text>
                    </View>
                  )}
                  {currentLocation.coords.accuracy && (
                    <View style={styles.detailRow}>
                      <Ionicons name="radio" size={16} color={Colors.textSecondary} />
                      <Text style={styles.detailText}>
                        Accuracy: {Math.round(currentLocation.coords.accuracy)}m
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={styles.controlsCard}>
              {Platform.OS !== 'web' && (
                <View style={styles.autoTrackingRow}>
                  <View style={styles.autoTrackingInfo}>
                    <Ionicons name="sync" size={20} color={Colors.primary} />
                    <View style={styles.autoTrackingText}>
                      <Text style={styles.autoTrackingTitle}>Continuous Tracking</Text>
                      <Text style={styles.autoTrackingSubtitle}>
                        Auto-record location every 30s
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={autoTracking}
                    onValueChange={toggleAutoTracking}
                    trackColor={{ false: Colors.gray300, true: Colors.primary + '60' }}
                    thumbColor={autoTracking ? Colors.primary : Colors.gray50}
                    disabled={!isTracking}
                  />
                </View>
              )}
              
              <TouchableOpacity
                style={[
                  styles.trackingButton,
                  isTracking ? styles.trackingButtonStop : styles.trackingButtonStart
                ]}
                onPress={isTracking ? stopTracking : startTracking}
              >
                <Ionicons
                  name={isTracking ? "stop-circle" : "play-circle"}
                  size={24}
                  color={Colors.white}
                />
                <Text style={styles.trackingButtonText}>
                  {isTracking ? 'Stop Tracking' : 'Start Tracking'}
                </Text>
              </TouchableOpacity>
              
              {isTracking && (
                <View style={styles.trackingInfo}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.trackingInfoText}>
                    {autoTracking ? 'Continuous tracking active' : 'Manual tracking mode'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  mapContainer: {
    marginBottom: 16,
  },
  mapPlaceholder: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginVertical: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  lastUpdate: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  crewCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  crewHeader: {
    marginBottom: 12,
  },
  crewInfo: {
    flex: 1,
  },
  crewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  crewName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: Colors.success + '20',
  },
  statusIdle: {
    backgroundColor: Colors.gray200,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: Colors.success,
  },
  dotIdle: {
    backgroundColor: Colors.gray500,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dispatchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dispatchText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  locationDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  activeDispatchCard: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  dispatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dispatchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  dispatchSite: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  dispatchDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  myLocationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  myLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  controlsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 8,
  },
  trackingButtonStart: {
    backgroundColor: Colors.success,
  },
  trackingButtonStop: {
    backgroundColor: Colors.error,
  },
  trackingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  autoTrackingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  autoTrackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  autoTrackingText: {
    flex: 1,
  },
  autoTrackingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  autoTrackingSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    justifyContent: 'center',
  },
  trackingInfoText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '500',
  },
  webNotice: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  webNoticeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  webNoticeText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default function UnifiedTrackingScreen() {
  const auth = useAuth();
  const isWeb = Platform.OS === 'web';
  
  // Tab screens need sidebar but not duplicate header
  if (isWeb && auth?.isAdmin) {
    return <WebAdminLayout showHeader={false}><TrackingContent /></WebAdminLayout>;
  }
  
  return <TrackingContent />;
}
