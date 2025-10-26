import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, Polygon, Polyline, Circle as MapCircle } from 'react-native-maps';
import api from '../../../utils/api';
import { Colors } from '../../../utils/theme';

const { width, height } = Dimensions.get('window');

interface Site {
  id: string;
  name: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

interface Geofence {
  polygon_coordinates: Array<{ lat: number; lng: number }>;
  color: string;
  opacity: number;
  stroke_color: string;
}

interface SiteMap {
  id: string;
  name: string;
  version: number;
  annotations: any[];
  measurements?: any[];
  is_current: boolean;
  created_at: string;
}

export default function SiteMapsScreen() {
  const { id } = useLocalSearchParams();
  const [site, setSite] = useState<Site | null>(null);
  const [geofence, setGeofence] = useState<Geofence | null>(null);
  const [siteMaps, setSiteMaps] = useState<SiteMap[]>([]);
  const [currentMap, setCurrentMap] = useState<SiteMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'geofence' | 'annotations'>('overview');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // Fetch site details
      const siteRes = await api.get(`/sites/${id}`);
      setSite(siteRes.data);

      // Fetch geofence
      try {
        const geofenceRes = await api.get(`/sites/${id}/geofence`);
        if (geofenceRes.data.has_geofence) {
          setGeofence(geofenceRes.data.geofence);
        }
      } catch (error) {
        console.log('No geofence found');
      }

      // Fetch site maps
      try {
        const mapsRes = await api.get(`/site-maps/site/${id}`);
        setSiteMaps(mapsRes.data || []);
        const current = mapsRes.data.find((m: SiteMap) => m.is_current);
        if (current) {
          setCurrentMap(current);
        }
      } catch (error) {
        console.log('No site maps found');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (!site) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
        <Text style={styles.errorText}>Site not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{site.name} - Maps</Text>
          <Text style={styles.headerSubtitle}>{site.location.address}</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeView === 'overview' && styles.activeTab]}
          onPress={() => setActiveView('overview')}
        >
          <Ionicons
            name="location-outline"
            size={20}
            color={activeView === 'overview' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.tabText, activeView === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeView === 'geofence' && styles.activeTab]}
          onPress={() => setActiveView('geofence')}
        >
          <Ionicons
            name="shapes-outline"
            size={20}
            color={activeView === 'geofence' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.tabText, activeView === 'geofence' && styles.activeTabText]}>
            Geofence
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeView === 'annotations' && styles.activeTab]}
          onPress={() => setActiveView('annotations')}
        >
          <Ionicons
            name="map-outline"
            size={20}
            color={activeView === 'annotations' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.tabText, activeView === 'annotations' && styles.activeTabText]}>
            Annotations
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map View */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: site.location.latitude,
          longitude: site.location.longitude,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
        }}
        mapType="satellite"
      >
        {/* Site Marker */}
        <Marker
          coordinate={{
            latitude: site.location.latitude,
            longitude: site.location.longitude,
          }}
          title={site.name}
          description={site.location.address}
          pinColor={Colors.primary}
        />

        {/* Geofence Polygon */}
        {activeView !== 'overview' && geofence && (
          <Polygon
            coordinates={geofence.polygon_coordinates.map(coord => ({
              latitude: coord.lat,
              longitude: coord.lng,
            }))}
            fillColor={`${geofence.color}40`}
            strokeColor={geofence.stroke_color}
            strokeWidth={2}
          />
        )}
      </MapView>

      {/* Info Cards */}
      <ScrollView style={styles.infoContainer}>
        {activeView === 'overview' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Property Information</Text>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>{site.location.address}</Text>
            </View>
            {geofence && (
              <View style={styles.infoRow}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.infoText}>Geofence Active</Text>
              </View>
            )}
          </View>
        )}

        {activeView === 'geofence' && geofence && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Geofence Details</Text>
            <View style={styles.infoRow}>
              <Ionicons name="shapes" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                {geofence.polygon_coordinates.length} boundary points
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.infoText}>Active</Text>
            </View>
          </View>
        )}

        {activeView === 'geofence' && !geofence && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No Geofence</Text>
            <Text style={styles.infoText}>
              No geofence has been set for this site. Use the web admin to create one.
            </Text>
          </View>
        )}

        {activeView === 'annotations' && siteMaps.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Saved Maps ({siteMaps.length})</Text>
            {siteMaps.map((map) => (
              <TouchableOpacity
                key={map.id}
                style={[styles.mapCard, currentMap?.id === map.id && styles.currentMapCard]}
                onPress={() => setCurrentMap(map)}
              >
                <View style={styles.mapCardHeader}>
                  <Text style={styles.mapCardTitle}>{map.name}</Text>
                  {map.is_current && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.mapCardSubtitle}>
                  Version {map.version} • {map.annotations?.length || 0} annotations
                </Text>
                {map.measurements && map.measurements.length > 0 && (
                  <Text style={styles.mapCardMeasurements}>
                    📏 {map.measurements.length} measurement{map.measurements.length !== 1 ? 's' : ''}
                  </Text>
                )}
                <Text style={styles.mapCardDate}>
                  {new Date(map.created_at).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeView === 'annotations' && siteMaps.length === 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No Annotations</Text>
            <Text style={styles.infoText}>
              No map annotations have been created yet. Use the web admin to add annotations and measurements.
            </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  map: {
    width: width,
    height: height * 0.4,
  },
  infoContainer: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  mapCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currentMapCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  mapCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mapCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  currentBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  mapCardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  mapCardMeasurements: {
    fontSize: 12,
    color: Colors.primary,
    marginBottom: 4,
  },
  mapCardDate: {
    fontSize: 11,
    color: Colors.textSecondary,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
