import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Colors } from '../utils/theme';
import WebAdminLayout from '../components/WebAdminLayout';

interface Route {
  id: string;
  name: string;
  sites: string[];
  assigned_crew: string[];
  active: boolean;
  notes?: string;
  created_at: string;
}

export default function RoutesScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const isWeb = Platform.OS === 'web';
  
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/routes');
      setRoutes(response.data || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const content = (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Routes</Text>
        {isAdmin && (
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => {
              // TODO: Navigate to create route screen
              console.log('Create route - to be implemented');
            }}
          >
            <Ionicons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {routes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={64} color={Colors.gray300} />
            <Text style={styles.emptyStateText}>No routes yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Routes help organize sites into efficient service paths
            </Text>
          </View>
        ) : (
          routes.map((route) => (
            <TouchableOpacity
              key={route.id}
              style={styles.routeCard}
              onPress={() => {
                router.push(`/routes/${route.id}`);
              }}
            >
              <View style={styles.routeHeader}>
                <Text style={styles.routeName}>{route.name}</Text>
                <View style={[styles.statusBadge, !route.active && styles.statusBadgeInactive]}>
                  <Text style={styles.statusText}>
                    {route.active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <View style={styles.routeInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={16} color={Colors.gray500} />
                  <Text style={styles.infoText}>
                    {route.sites?.length || 0} sites
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="people" size={16} color={Colors.gray500} />
                  <Text style={styles.infoText}>
                    {route.assigned_crew?.length || 0} crew members
                  </Text>
                </View>
              </View>

              {route.notes && (
                <Text style={styles.routeNotes} numberOfLines={2}>
                  {route.notes}
                </Text>
              )}

              <View style={styles.routeFooter}>
                <Text style={styles.createdDate}>
                  Created {new Date(route.created_at).toLocaleDateString()}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );

  // Wrap with WebAdminLayout for web admin users
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
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 8,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray500,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.gray400,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  routeCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
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
  routeInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: Colors.gray600,
  },
  routeNotes: {
    fontSize: 14,
    color: Colors.gray500,
    marginTop: 8,
    lineHeight: 20,
  },
  routeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  createdDate: {
    fontSize: 12,
    color: Colors.gray400,
  },
});
