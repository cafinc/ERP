import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import { useAuth } from '../../contexts/AuthContext';

interface Site {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface OptimizationResult {
  optimized_order: string[];
  estimated_distance_km: number;
  estimated_time_minutes: number;
  savings_km: number;
  savings_percentage: number;
  route_details: Array<{
    position: number;
    site_id: string;
    site_name: string;
    distance_from_previous_km?: number;
  }>;
}

export default function RouteOptimizeScreen() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  
  const router = useRouter();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await api.get('/sites?active=true');
      const sitesWithCoords = response.data.filter(
        (site: any) => site.location?.latitude && site.location?.longitude
      );
      setSites(sitesWithCoords);
    } catch (error) {
      console.error('Error fetching sites:', error);
      Alert.alert('Error', 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  const toggleSite = (siteId: string) => {
    if (selectedSites.includes(siteId)) {
      setSelectedSites(selectedSites.filter(id => id !== siteId));
    } else {
      setSelectedSites([...selectedSites, siteId]);
    }
    setOptimization(null); // Clear optimization when selection changes
  };

  const handleOptimize = async () => {
    if (selectedSites.length < 2) {
      Alert.alert('Error', 'Please select at least 2 sites');
      return;
    }

    setOptimizing(true);
    try {
      const response = await api.post('/routes/optimize', selectedSites);
      setOptimization(response.data);
      Alert.alert('Success', `Route optimized! Savings: ${response.data.savings_km.toFixed(2)} km`);
    } catch (error) {
      console.error('Error optimizing route:', error);
      Alert.alert('Error', 'Failed to optimize route');
    } finally {
      setOptimizing(false);
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Route Optimization</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={64} color={Colors.textSecondary} />
          <Text style={styles.accessDeniedText}>Admin access required</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading sites...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Route Optimization</Text>
          <View style={styles.placeholder} />
        </View>
        <Text style={styles.subtitle}>
          Select sites to optimize route order
        </Text>
      </View>

      {/* Stats Cards */}
      {optimization && (
        <ScrollView horizontal style={styles.statsContainer} showsHorizontalScrollIndicator={false}>
          <View style={styles.statCard}>
            <Ionicons name="navigate" size={24} color="#3b82f6" />
            <Text style={styles.statValue}>{optimization.estimated_distance_km} km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#10b981" />
            <Text style={styles.statValue}>
              {Math.floor(optimization.estimated_time_minutes / 60)}h {optimization.estimated_time_minutes % 60}m
            </Text>
            <Text style={styles.statLabel}>Est. Time</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-down" size={24} color="#f59e0b" />
            <Text style={styles.statValue}>{optimization.savings_km.toFixed(1)} km</Text>
            <Text style={styles.statLabel}>Savings</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="stats-chart" size={24} color="#8b5cf6" />
            <Text style={styles.statValue}>{optimization.savings_percentage.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Improvement</Text>
          </View>
        </ScrollView>
      )}

      {/* Sites List */}
      <ScrollView style={styles.list}>
        {sites.map((site, index) => {
          const isSelected = selectedSites.includes(site.id);
          const optimizedPosition = optimization?.route_details.findIndex(
            detail => detail.site_id === site.id
          );
          
          return (
            <TouchableOpacity
              key={site.id}
              style={[
                styles.siteCard,
                isSelected && styles.siteCardSelected,
              ]}
              onPress={() => toggleSite(site.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                isSelected && styles.checkboxSelected,
              ]}>
                {isSelected && (
                  <Ionicons name="checkmark" size={18} color={Colors.white} />
                )}
              </View>

              <View style={styles.siteInfo}>
                <View style={styles.siteHeader}>
                  <Text style={styles.siteName} numberOfLines={1}>
                    {site.name}
                  </Text>
                  {optimizedPosition !== undefined && optimizedPosition !== -1 && (
                    <View style={styles.positionBadge}>
                      <Text style={styles.positionText}>
                        #{optimizedPosition + 1}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.siteAddress} numberOfLines={1}>
                  {site.address}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Optimize Button */}
      <View style={styles.footer}>
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionText}>
            {selectedSites.length} site{selectedSites.length !== 1 ? 's' : ''} selected
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.optimizeButton,
            (selectedSites.length < 2 || optimizing) && styles.optimizeButtonDisabled,
          ]}
          onPress={handleOptimize}
          disabled={selectedSites.length < 2 || optimizing}
        >
          {optimizing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Ionicons name="flash" size={24} color={Colors.white} />
          )}
          <Text style={styles.optimizeButtonText}>
            {optimizing ? 'Optimizing...' : 'Optimize Route'}
          </Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    paddingHorizontal: 16,
  },
  statsContainer: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  statCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    minWidth: 120,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  siteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  siteCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#dbeafe',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  siteInfo: {
    flex: 1,
  },
  siteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  positionBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  positionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.white,
  },
  siteAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  selectionInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  selectionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  optimizeButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  optimizeButtonDisabled: {
    backgroundColor: Colors.border,
  },
  optimizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessDeniedText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 16,
  },
});
