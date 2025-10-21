import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Modal,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import api from '../../utils/api';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import { Dispatch } from '../../types';
import { Colors } from '../../utils/theme';
import AnalyticsWidget from '../../components/AnalyticsWidget';
import WebAdminLayout from '../../components/WebAdminLayout';
import WeatherWidget from '../../components/WeatherWidget';
// import GoogleMapsStatus from '../../components/GoogleMapsStatus';

export default function DashboardScreen() {
  const router = useRouter();
  const { dispatches, setDispatches, sites, setSites } = useStore();
  const { isCrew, isCustomer, currentUser, isAdmin } = useAuth();
  const isWeb = Platform.OS === 'web';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [onRoute, setOnRoute] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<any>(null);
  const [showRoutesModal, setShowRoutesModal] = useState(false);
  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [stats, setStats] = useState({
    activeDispatches: 0,
    scheduledToday: 0,
    completed: 0,
    totalSites: 0,
  });

  const fetchData = async () => {
    try {
      const [dispatchesRes, sitesRes, routesRes] = await Promise.all([
        api.get('/dispatches'),
        api.get('/sites'),
        api.get('/routes'),
      ]);

      const allDispatches = dispatchesRes.data;
      setDispatches(allDispatches);
      setSites(sitesRes.data);
      setAvailableRoutes(routesRes.data);

      const today = format(new Date(), 'yyyy-MM-dd');
      const activeDispatches = allDispatches.filter(
        (d: Dispatch) => d.status === 'in_progress'
      ).length;
      const scheduledToday = allDispatches.filter(
        (d: Dispatch) =>
          d.scheduled_date.startsWith(today) && d.status === 'scheduled'
      ).length;
      const completed = allDispatches.filter(
        (d: Dispatch) => d.status === 'completed'
      ).length;

      setStats({
        activeDispatches,
        scheduledToday,
        completed,
        totalSites: sitesRes.data.length,
      });

      // Check if crew is clocked in (check active shift)
      if (isCrew && currentUser) {
        try {
          const shiftsRes = await api.get(`/shifts?user_id=${currentUser.id}`);
          const activeShift = shiftsRes.data.find((s: any) => s.status === 'active');
          if (activeShift) {
            setClockedIn(true);
            setCurrentShift(activeShift);
          }
        } catch (error) {
          console.log('No active shift');
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleComplaintForm = () => {
    Alert.alert(
      'Submit Complaint',
      'Please select the appropriate complaint form from the Forms section.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go to Forms',
          onPress: () => router.push('/(tabs)/forms'),
        },
      ]
    );
  };

  const activeDispatchesList = dispatches.filter(
    (d) => d.status === 'in_progress' || d.status === 'scheduled'
  ).slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#4682B4';
      case 'in_progress':
        return '#f59e0b';
      case 'completed':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4682B4" />
      </View>
    );
  }

  // Show crew-specific dashboard for crew members
  if (isCrew) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header moved to EnhancedHeader component */}

        <View style={styles.crewButtonsGrid}>
          {/* Top Left: Clock In/Out */}
          <TouchableOpacity
            style={[
              styles.crewButton,
              clockedIn ? styles.clockedIn : styles.clockedOut,
            ]}
            onPress={async () => {
              try {
                console.log('Clock in/out pressed', { clockedIn, currentShift, currentUser });
                if (clockedIn && currentShift) {
                  // Clock out
                  console.log('Attempting to clock out, shift ID:', currentShift.id);
                  await api.put(`/shifts/${currentShift.id}`, { status: 'completed' });
                  setClockedIn(false);
                  setCurrentShift(null);
                  Alert.alert('✅ Clocked Out', 'You have been clocked out successfully');
                } else {
                  // Clock in
                  console.log('Attempting to clock in for user:', currentUser?.id);
                  const response = await api.post('/shifts', {
                    user_id: currentUser?.id,
                    shift_date: new Date().toISOString().split('T')[0],
                    start_time: new Date().toISOString(),
                  });
                  console.log('Clock in response:', response.data);
                  setClockedIn(true);
                  setCurrentShift(response.data);
                  Alert.alert('✅ Clocked In', 'You have been clocked in successfully');
                }
                await fetchData();
              } catch (error: any) {
                console.error('Clock in/out error:', error);
                Alert.alert('❌ Error', `Failed to clock in/out: ${error.message || 'Unknown error'}`);
              }
            }}
          >
            <Ionicons name={clockedIn ? 'time' : 'time-outline'} size={48} color="#ffffff" />
            <Text style={styles.crewButtonTitle}>{clockedIn ? 'Clock Out' : 'Clock In'}</Text>
            {clockedIn && <Text style={styles.crewButtonSubtitle}>Active</Text>}
          </TouchableOpacity>

          {/* Top Right: Start/End Route */}
          <TouchableOpacity
            style={[
              styles.crewButton,
              onRoute ? styles.onRoute : styles.notOnRoute,
            ]}
            onPress={async () => {
              try {
                console.log('Start/End route pressed', { onRoute, currentRoute });
                if (onRoute && currentRoute) {
                  // End route
                  console.log('Ending route:', currentRoute.id);
                  await api.put(`/dispatches/${currentRoute.id}`, { status: 'completed' });
                  setOnRoute(false);
                  setCurrentRoute(null);
                  Alert.alert('✅ Route Completed', 'Route has been marked as completed');
                } else {
                  // Start route - check for assigned dispatches
                  console.log('Checking for assigned dispatches...');
                  const assignedDispatches = dispatches.filter(
                    (d) => d.status === 'scheduled' && d.crew_ids.includes(currentUser?.id)
                  );
                  console.log('Found assigned dispatches:', assignedDispatches.length);
                  
                  if (assignedDispatches.length > 0) {
                    console.log('Starting dispatch:', assignedDispatches[0].id);
                    await api.put(`/dispatches/${assignedDispatches[0].id}`, { status: 'in_progress' });
                    setOnRoute(true);
                    setCurrentRoute(assignedDispatches[0]);
                    Alert.alert('✅ Route Started', `Started route: ${assignedDispatches[0].route_name}`);
                  } else {
                    Alert.alert(
                      '⚠️ No Assigned Routes', 
                      'You do not have any assigned routes at this time. Please contact dispatch or use the "Routes" button to start a preconfigured route.',
                      [{ text: 'OK' }]
                    );
                  }
                }
                await fetchData();
              } catch (error: any) {
                console.error('Start/End route error:', error);
                Alert.alert('❌ Error', `Failed to start/end route: ${error.message || 'Unknown error'}`);
              }
            }}
          >
            <Ionicons name={onRoute ? 'stop-circle' : 'play-circle'} size={48} color="#ffffff" />
            <Text style={styles.crewButtonTitle}>{onRoute ? 'End Route' : 'Start Route'}</Text>
            {onRoute && currentRoute && (
              <Text style={styles.crewButtonSubtitle} numberOfLines={1}>{currentRoute.route_name}</Text>
            )}
          </TouchableOpacity>

          {/* Bottom Left: Preconfigured Routes */}
          <TouchableOpacity
            style={[styles.crewButton, styles.routesButton]}
            onPress={() => setShowRoutesModal(true)}
          >
            <Ionicons name="map" size={48} color="#ffffff" />
            <Text style={styles.crewButtonTitle}>Routes</Text>
            <Text style={styles.crewButtonSubtitle}>{availableRoutes.length} available</Text>
          </TouchableOpacity>

          {/* Bottom Right: Forms */}
          <TouchableOpacity
            style={[styles.crewButton, styles.formsButton]}
            onPress={() => router.push('/(tabs)/forms')}
          >
            <Ionicons name="document-text" size={48} color="#ffffff" />
            <Text style={styles.crewButtonTitle}>Forms</Text>
            <Text style={styles.crewButtonSubtitle}>View & Fill</Text>
          </TouchableOpacity>
        </View>

        {/* Learning Resources Card */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.learningResourcesCard}
            onPress={() => router.push('/learning-resources')}
          >
            <View style={styles.learningResourcesHeader}>
              <View style={styles.learningResourcesIconContainer}>
                <Ionicons name="book" size={28} color={Colors.white} />
              </View>
              <View style={styles.learningResourcesContent}>
                <Text style={styles.learningResourcesTitle}>Learning Resources</Text>
                <Text style={styles.learningResourcesSubtitle}>
                  Access guides, safety info, FAQs, and helpful documents
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#8b5cf6" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Preconfigured Routes Modal */}
        <Modal
          visible={showRoutesModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowRoutesModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Preconfigured Routes</Text>
              <TouchableOpacity onPress={() => setShowRoutesModal(false)}>
                <Ionicons name="close-circle" size={32} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {availableRoutes.length === 0 ? (
                <View style={styles.emptyModal}>
                  <Ionicons name="map-outline" size={64} color="#d1d5db" />
                  <Text style={styles.emptyModalText}>No routes available</Text>
                </View>
              ) : (
                availableRoutes.map((route) => (
                  <TouchableOpacity
                    key={route.id}
                    style={styles.routeCard}
                    onPress={async () => {
                      try {
                        const newDispatch = {
                          route_name: route.name,
                          scheduled_date: new Date().toISOString().split('T')[0],
                          scheduled_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                          services: route.services || [],
                          crew_ids: [currentUser?.id],
                          site_ids: route.site_ids || [],
                          equipment_ids: [],
                          status: 'in_progress',
                        };
                        const response = await api.post('/dispatches', newDispatch);
                        setOnRoute(true);
                        setCurrentRoute(response.data);
                        setShowRoutesModal(false);
                        Alert.alert('Route Started', `Started: ${route.name}`);
                        fetchData();
                      } catch (error) {
                        Alert.alert('Error', 'Failed to start route');
                      }
                    }}
                  >
                    <Ionicons name="navigate" size={24} color="#4682B4" />
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeName}>{route.name}</Text>
                      {route.description && (
                        <Text style={styles.routeDescription}>{route.description}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Modal removed - using navigation instead */}
      </ScrollView>
    );
  }

  // Customer dashboard - simplified view showing only their sites and active dispatches
  if (isCustomer) {
    // Filter sites belonging to this customer
    const customerSites = sites.filter(site => site.customer_id === currentUser?.id);
    
    // Filter dispatches that are active and relate to customer's sites
    const customerDispatches = dispatches.filter(dispatch => 
      (dispatch.status === 'in_progress' || dispatch.status === 'scheduled') &&
      dispatch.site_ids.some(siteId => customerSites.some(site => site.id === siteId))
    );

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header moved to EnhancedHeader component */}

        {/* Customer Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#e8f1f8' }]}>
            <Ionicons name="location" size={32} color="#4682B4" />
            <Text style={styles.statValue}>{customerSites.length}</Text>
            <Text style={styles.statLabel}>My Sites</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="sync" size={32} color="#f59e0b" />
            <Text style={styles.statValue}>{customerDispatches.length}</Text>
            <Text style={styles.statLabel}>Active Services</Text>
          </View>
        </View>

        {/* Active Dispatches */}
        {customerDispatches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Service Calls</Text>
            </View>
            {customerDispatches.map((dispatch) => (
              <TouchableOpacity
                key={dispatch.id}
                style={styles.dispatchCard}
                onPress={() => router.push(`/dispatch/${dispatch.id}`)}
              >
                <View style={styles.dispatchInfo}>
                  <Text style={styles.dispatchTitle}>{dispatch.route_name}</Text>
                  <Text style={styles.dispatchDate}>
                    {format(new Date(dispatch.scheduled_date), 'MMM d, yyyy')} at {dispatch.scheduled_time}
                  </Text>
                  <View style={styles.servicesRow}>
                    {dispatch.services.slice(0, 2).map((service, idx) => (
                      <View key={idx} style={styles.serviceBadge}>
                        <Text style={styles.serviceBadgeText}>{service.replace('_', ' ')}</Text>
                      </View>
                    ))}
                    {dispatch.services.length > 2 && (
                      <Text style={styles.moreServices}>+{dispatch.services.length - 2} more</Text>
                    )}
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(dispatch.status) }]}>
                  <Text style={styles.statusText}>{dispatch.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Learning Resources - Prominent Section */}
        {(isCustomer || currentUser?.role === 'crew') && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.learningResourcesCard}
              onPress={() => router.push('/learning-resources')}
            >
              <View style={styles.learningResourcesHeader}>
                <View style={styles.learningResourcesIconContainer}>
                  <Ionicons name="book" size={28} color={Colors.white} />
                </View>
                <View style={styles.learningResourcesContent}>
                  <Text style={styles.learningResourcesTitle}>Learning Resources</Text>
                  <Text style={styles.learningResourcesSubtitle}>
                    Access guides, safety info, FAQs, and helpful documents
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#8b5cf6" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Customer Action Buttons */}
        {(isCustomer || currentUser?.role === 'crew') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Need Help?</Text>
            <View style={styles.customerActionsGrid}>
              <TouchableOpacity
                style={[styles.customerActionCard, { backgroundColor: '#fef3c7' }]}
                onPress={() => router.push('/(tabs)/forms')}
              >
                <Ionicons name="warning" size={32} color="#f59e0b" />
                <Text style={styles.customerActionText}>Submit a Complaint</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.customerActionCard, { backgroundColor: '#d1fae5' }]}
                onPress={() => router.push('/feedback-form?rating=3')}
              >
                <Ionicons name="thumbs-up" size={32} color="#10b981" />
                <Text style={styles.customerActionText}>Tell Us How We Did</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.customerActionCard, { backgroundColor: '#e0e7ff' }]}
                onPress={() => router.push('/learn-about-us')}
              >
                <Ionicons name="information-circle" size={32} color="#6366f1" />
                <Text style={styles.customerActionText}>Learn About What We Do</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* My Sites */}
        {customerSites.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Sites</Text>
            </View>
            {customerSites.map((site) => (
              <TouchableOpacity
                key={site.id}
                style={styles.siteCard}
                onPress={() => router.push(`/sites/${site.id}`)}
              >
                <View style={styles.siteIconContainer}>
                  <Ionicons name="location" size={24} color="#4682B4" />
                </View>
                <View style={styles.siteInfo}>
                  <Text style={styles.siteName}>{site.name}</Text>
                  <Text style={styles.siteAddress}>{site.location.address}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  // Admin dashboard
  const dashboardContent = (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header moved to EnhancedHeader component */}

      {/* Role debugging components removed to clean up interface */}

      {/* Google Maps Status - Temporarily disabled for web compatibility */}
      {/* <GoogleMapsStatus /> */}

      {/* Weather Widget */}
      <WeatherWidget />

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
          <Ionicons name="snow" size={32} color="#f59e0b" />
          <Text style={styles.statValue}>{stats.activeDispatches}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#d4e5f4' }]}>
          <Ionicons name="calendar" size={32} color="#4682B4" />
          <Text style={styles.statValue}>{stats.scheduledToday}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#d1fae5' }]}>
          <Ionicons name="checkmark-circle" size={32} color="#10b981" />
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#e0e7ff' }]}>
          <Ionicons name="location" size={32} color="#6366f1" />
          <Text style={styles.statValue}>{stats.totalSites}</Text>
          <Text style={styles.statLabel}>Sites</Text>
        </View>
      </View>

      {/* Analytics Widgets */}
      <View style={styles.analyticsContainer}>
        <View style={styles.analyticsWidget}>
          <AnalyticsWidget type="consumables" />
        </View>
        <View style={styles.analyticsWidget}>
          <AnalyticsWidget type="equipment" />
        </View>
      </View>

      {/* Quick Actions Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/emergency-alert')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="warning" size={32} color="#ef4444" />
            </View>
            <Text style={styles.quickActionLabel}>Emergency Alert</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/dispatch')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="add-circle" size={32} color="#3b82f6" />
            </View>
            <Text style={styles.quickActionLabel}>Create Dispatch</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/settings/equipment-list')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="construct" size={32} color="#f59e0b" />
            </View>
            <Text style={styles.quickActionLabel}>Equipment</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/settings/team-members')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#f3e8ff' }]}>
              <Ionicons name="people" size={32} color="#8b5cf6" />
            </View>
            <Text style={styles.quickActionLabel}>Crew</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/sites')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="location" size={32} color="#10b981" />
            </View>
            <Text style={styles.quickActionLabel}>Sites</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/settings/consumables-list')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#fce7f3' }]}>
              <Ionicons name="cube" size={32} color="#ec4899" />
            </View>
            <Text style={styles.quickActionLabel}>Consumables</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/forms')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="document-text" size={32} color="#0ea5e9" />
            </View>
            <Text style={styles.quickActionLabel}>Forms</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/settings/consumables-analytics')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="stats-chart" size={32} color="#ef4444" />
            </View>
            <Text style={styles.quickActionLabel}>Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/messages')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="chatbubbles" size={32} color="#2563eb" />
            </View>
            <Text style={styles.quickActionLabel}>Messages</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Dispatches</Text>
          <TouchableOpacity onPress={() => router.push('/dispatch')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {activeDispatchesList.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No active dispatches</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/dispatch')}
            >
              <Ionicons name="add-circle" size={20} color="#ffffff" />
              <Text style={styles.createButtonText}>Create Dispatch</Text>
            </TouchableOpacity>
          </View>
        ) : (
          activeDispatchesList.map((dispatch) => (
            <View key={dispatch.id} style={styles.dispatchCard}>
              <View style={styles.dispatchHeader}>
                <Text style={styles.dispatchName}>{dispatch.route_name}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(dispatch.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {dispatch.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.dispatchDetails}>
                <View style={styles.dispatchDetailRow}>
                  <Ionicons name="time-outline" size={16} color="#6b7280" />
                  <Text style={styles.dispatchDetailText}>
                    {format(new Date(dispatch.scheduled_date), 'MMM d, yyyy')} at{' '}
                    {dispatch.scheduled_time}
                  </Text>
                </View>
                <View style={styles.dispatchDetailRow}>
                  <Ionicons name="people-outline" size={16} color="#6b7280" />
                  <Text style={styles.dispatchDetailText}>
                    {dispatch.crew_ids.length} crew members
                  </Text>
                </View>
                <View style={styles.dispatchDetailRow}>
                  <Ionicons name="location-outline" size={16} color="#6b7280" />
                  <Text style={styles.dispatchDetailText}>
                    {dispatch.site_ids.length} sites
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/dispatch')}
          >
            <Ionicons name="send" size={32} color="#4682B4" />
            <Text style={styles.quickActionText}>New Dispatch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/customers')}
          >
            <Ionicons name="person-add" size={32} color="#4682B4" />
            <Text style={styles.quickActionText}>Add Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/sites')}
          >
            <Ionicons name="map" size={32} color="#4682B4" />
            <Text style={styles.quickActionText}>View Map</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/resources')}
          >
            <Ionicons name="settings" size={32} color="#4682B4" />
            <Text style={styles.quickActionText}>Manage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/crew-tracking')}
          >
            <Ionicons name="people" size={32} color="#4682B4" />
            <Text style={styles.quickActionText}>Live Tracking</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  // Tab screens need sidebar but not duplicate header
  if (isWeb && isAdmin) {
    return <WebAdminLayout showHeader={false}>{dashboardContent}</WebAdminLayout>;
  }

  return dashboardContent;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 16,
  },
  weatherSection: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: Colors.primary,
    padding: 20,
    borderRadius: 0,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4682B4',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4682B4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dispatchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dispatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dispatchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  dispatchDetails: {
    gap: 8,
  },
  dispatchDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dispatchDetailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  quickActions: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginTop: 8,
  },
  // Crew Dashboard Styles
  crewButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 24,
  },
  crewButton: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  clockedOut: {
    backgroundColor: '#6b7280',
  },
  clockedIn: {
    backgroundColor: '#10b981',
  },
  notOnRoute: {
    backgroundColor: '#4682B4',
  },
  onRoute: {
    backgroundColor: '#f59e0b',
  },
  routesButton: {
    backgroundColor: '#8b5cf6',
  },
  formsButton: {
    backgroundColor: '#ec4899',
  },
  crewButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 12,
    textAlign: 'center',
  },
  crewButtonSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 4,
    opacity: 0.9,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  emptyModal: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyModalText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  routeDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  // Customer Dashboard Styles
  dispatchInfo: {
    flex: 1,
  },
  dispatchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  dispatchDate: {
    fontSize: 14,
    color: Colors.gray600,
    marginBottom: 8,
  },
  servicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  serviceBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  serviceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  moreServices: {
    fontSize: 12,
    color: Colors.gray500,
  },
  siteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  siteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  siteAddress: {
    fontSize: 14,
    color: Colors.gray600,
  },
  // Learning Resources Card Styles
  learningResourcesCard: {
    backgroundColor: '#ede9fe',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: '#8b5cf6',
    marginTop: 16,
    marginBottom: 0,
  },
  learningResourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  learningResourcesIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  learningResourcesContent: {
    flex: 1,
  },
  learningResourcesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: 2,
  },
  learningResourcesSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  // Customer Action Styles
  customerActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  customerActionCard: {
    flex: 1,
    minWidth: '30%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
  },
  customerActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 8,
  },
  // Feedback Modal Styles
  feedbackContainer: {
    padding: 24,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  feedbackSubtext: {
    fontSize: 14,
    color: Colors.gray600,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  feedbackButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  feedbackButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Stats Grid for Customer Dashboard
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  // Star Rating Styles
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 32,
  },
  star: {
    padding: 8,
  },
  ratingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 14,
    color: Colors.gray500,
    fontWeight: '600',
  },
  feedbackNote: {
    fontSize: 12,
    color: Colors.gray500,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  // Customer Action Buttons
  customerActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  customerActionCard: {
    flex: 1,
    minWidth: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customerActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 8,
  },
  // Analytics Widgets
  analyticsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  analyticsWidget: {
    flex: 1,
  },
  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  quickActionCard: {
    width: '22%', // 4 columns
    minWidth: 120,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 120,
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});