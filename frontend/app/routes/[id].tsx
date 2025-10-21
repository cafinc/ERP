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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import WebAdminLayout from '../../components/WebAdminLayout';

interface Site {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  customer_name?: string;
}

interface RouteDetail {
  id: string;
  name: string;
  sites: string[];
  assigned_crew: string[];
  estimated_duration?: number;
  is_template: boolean;
  active: boolean;
  notes?: string;
  created_at: string;
  site_details?: Site[];
  crew_details?: any[];
}

interface OptimizationResult {
  optimized_order: string[];
  estimated_distance_km: number;
  estimated_time_minutes: number;
  savings_percentage: number;
  message?: string;
}

export default function RouteDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const isWeb = Platform.OS === 'web';

  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [showOptimization, setShowOptimization] = useState(false);

  useEffect(() => {
    fetchRouteDetail();
  }, [id]);

  const fetchRouteDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/routes/${id}`);
      const routeData = response.data;

      // Fetch site details
      if (routeData.sites && routeData.sites.length > 0) {
        const sitesPromises = routeData.sites.map((siteId: string) =>
          api.get(`/sites/${siteId}`).catch(() => null)
        );
        const sitesResponses = await Promise.all(sitesPromises);
        routeData.site_details = sitesResponses
          .filter(res => res !== null)
          .map(res => res.data);
      }

      // Fetch crew details
      if (routeData.assigned_crew && routeData.assigned_crew.length > 0) {
        const crewPromises = routeData.assigned_crew.map((crewId: string) =>
          api.get(`/users/${crewId}`).catch(() => null)
        );
        const crewResponses = await Promise.all(crewPromises);
        routeData.crew_details = crewResponses
          .filter(res => res !== null)
          .map(res => res.data);
      }

      setRoute(routeData);
    } catch (error) {
      console.error('Error fetching route:', error);
      Alert.alert('Error', 'Failed to load route details');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeRoute = async () => {
    if (!route || !route.sites || route.sites.length < 2) {
      Alert.alert('Cannot Optimize', 'Route must have at least 2 sites to optimize');
      return;
    }

    try {
      setOptimizing(true);
      const response = await api.post('/routes/optimize', route.sites);
      setOptimization(response.data);
      setShowOptimization(true);
    } catch (error) {
      console.error('Error optimizing route:', error);
      Alert.alert('Error', 'Failed to optimize route');
    } finally {
      setOptimizing(false);
    }
  };

  const handleApplyOptimization = async () => {
    if (!optimization || !route) return;

    try {
      await api.put(`/routes/${route.id}`, {
        ...route,
        sites: optimization.optimized_order,
      });
      Alert.alert('Success', 'Route optimized successfully!');
      setShowOptimization(false);
      fetchRouteDetail();
    } catch (error) {
      console.error('Error applying optimization:', error);
      Alert.alert('Error', 'Failed to apply optimization');
    }
  };

  const getSiteIndex = (siteId: string) => {
    return route?.sites.indexOf(siteId) ?? -1;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!route) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Route Not Found</Text>
        </View>
      </View>
    );
  }

  const content = (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{route.name}</Text>
          <View style={[styles.statusBadge, !route.active && styles.statusBadgeInactive]}>
            <Text style={styles.statusText}>{route.active ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
        {isAdmin && (
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="location" size={24} color={Colors.primary} />
            <Text style={styles.statNumber}>{route.sites?.length || 0}</Text>
            <Text style={styles.statLabel}>Sites</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color={Colors.success} />
            <Text style={styles.statNumber}>{route.assigned_crew?.length || 0}</Text>
            <Text style={styles.statLabel}>Crew</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color={Colors.warning} />
            <Text style={styles.statNumber}>{route.estimated_duration || 0}</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </View>
        </View>

        {/* Optimization Section */}
        {isAdmin && route.sites && route.sites.length >= 2 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="git-branch" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Route Optimization</Text>
            </View>
            <TouchableOpacity
              style={styles.optimizeButton}
              onPress={handleOptimizeRoute}
              disabled={optimizing}
            >
              {optimizing ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="compass" size={18} color={Colors.white} />
                  <Text style={styles.optimizeButtonText}>Optimize Route Order</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.optimizeHint}>
              Reorder sites for shortest travel distance
            </Text>
          </View>
        )}

        {/* Optimization Results Modal */}
        {showOptimization && optimization && (
          <View style={styles.optimizationCard}>
            <View style={styles.optimizationHeader}>
              <Text style={styles.optimizationTitle}>🎯 Optimization Results</Text>
              <TouchableOpacity onPress={() => setShowOptimization(false)}>
                <Ionicons name="close" size={24} color={Colors.gray600} />
              </TouchableOpacity>
            </View>

            <View style={styles.optimizationStats}>
              <View style={styles.optimizationStat}>
                <Text style={styles.optimizationStatLabel}>Distance</Text>
                <Text style={styles.optimizationStatValue}>
                  {optimization.estimated_distance_km.toFixed(1)} km
                </Text>
              </View>
              <View style={styles.optimizationStat}>
                <Text style={styles.optimizationStatLabel}>Time</Text>
                <Text style={styles.optimizationStatValue}>
                  {optimization.estimated_time_minutes} min
                </Text>
              </View>
              <View style={styles.optimizationStat}>
                <Text style={styles.optimizationStatLabel}>Savings</Text>
                <Text style={[styles.optimizationStatValue, styles.savingsText]}>
                  {optimization.savings_percentage.toFixed(1)}%
                </Text>
              </View>
            </View>

            {optimization.message && (
              <Text style={styles.optimizationMessage}>{optimization.message}</Text>
            )}

            <View style={styles.optimizationActions}>
              <TouchableOpacity
                style={styles.optimizationButtonSecondary}
                onPress={() => setShowOptimization(false)}
              >
                <Text style={styles.optimizationButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.optimizationButtonPrimary}
                onPress={handleApplyOptimization}
              >
                <Text style={styles.optimizationButtonPrimaryText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Sites List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Sites ({route.sites?.length || 0})</Text>
          </View>

          {route.site_details && route.site_details.length > 0 ? (
            route.site_details
              .sort((a, b) => getSiteIndex(a.id) - getSiteIndex(b.id))
              .map((site, index) => (
                <View key={site.id} style={styles.siteCard}>
                  <View style={styles.siteNumberBadge}>
                    <Text style={styles.siteNumber}>{index + 1}</Text>
                  </View>
                  <View style={styles.siteInfo}>
                    <Text style={styles.siteName}>{site.name}</Text>
                    <Text style={styles.siteAddress}>{site.address}</Text>
                    {site.customer_name && (
                      <Text style={styles.siteCustomer}>👤 {site.customer_name}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
                </View>
              ))
          ) : (
            <Text style={styles.emptyText}>No sites assigned to this route</Text>
          )}
        </View>

        {/* Assigned Crew */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={20} color={Colors.success} />
            <Text style={styles.sectionTitle}>Assigned Crew ({route.assigned_crew?.length || 0})</Text>
          </View>

          {route.crew_details && route.crew_details.length > 0 ? (
            route.crew_details.map((crew) => (
              <View key={crew.id} style={styles.crewCard}>
                <View style={styles.crewAvatar}>
                  <Text style={styles.crewInitial}>
                    {crew.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.crewInfo}>
                  <Text style={styles.crewName}>{crew.name}</Text>
                  <Text style={styles.crewRole}>{crew.role}</Text>
                </View>
                {crew.phone && (
                  <TouchableOpacity>
                    <Ionicons name="call-outline" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No crew assigned to this route</Text>
          )}
        </View>

        {/* Notes */}
        {route.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color={Colors.gray600} />
              <Text style={styles.sectionTitle}>Notes</Text>
            </View>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{route.notes}</Text>
            </View>
          </View>
        )}

        {/* Metadata */}
        <View style={styles.metadataContainer}>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Created:</Text>
            <Text style={styles.metadataValue}>
              {new Date(route.created_at).toLocaleString()}
            </Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Type:</Text>
            <Text style={styles.metadataValue}>
              {route.is_template ? 'Template' : 'Active Route'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  if (isWeb && isAdmin) {
    return <WebAdminLayout>{content}</WebAdminLayout>;
  }

  return content;
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  editButton: {
    padding: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
  },
  statusBadgeInactive: {
    backgroundColor: Colors.gray200,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  optimizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  optimizeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  optimizeHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  optimizationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  optimizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  optimizationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  optimizationStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  optimizationStat: {
    alignItems: 'center',
  },
  optimizationStatLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  optimizationStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  savingsText: {
    color: Colors.success,
  },
  optimizationMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  optimizationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  optimizationButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  optimizationButtonSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  optimizationButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  optimizationButtonPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  siteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  siteNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  siteNumber: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  siteAddress: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  siteCustomer: {
    fontSize: 12,
    color: Colors.gray500,
  },
  crewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  crewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  crewInitial: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  crewInfo: {
    flex: 1,
  },
  crewName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  crewRole: {
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  notesCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  metadataContainer: {
    backgroundColor: Colors.gray50,
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  metadataLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  metadataValue: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
});
