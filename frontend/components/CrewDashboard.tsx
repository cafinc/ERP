import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../utils/api';
import { Colors } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';

export default function CrewDashboard() {
  const { currentUser } = useAuth();
  const [clockedIn, setClockedIn] = useState(false);
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [onRoute, setOnRoute] = useState(false);
  const [currentDispatch, setCurrentDispatch] = useState<any>(null);
  const [showRoutesModal, setShowRoutesModal] = useState(false);
  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCrewStatus();
  }, []);

  const fetchCrewStatus = async () => {
    try {
      // Check if clocked in
      const shiftsRes = await api.get(`/shifts?user_id=${currentUser?.id}`);
      const activeShift = shiftsRes.data.find((s: any) => s.status === 'active');
      if (activeShift) {
        setClockedIn(true);
        setCurrentShift(activeShift);
      }

      // Check if on a route
      const dispatchesRes = await api.get('/dispatches');
      const activeDispatch = dispatchesRes.data.find(
        (d: any) => d.status === 'in_progress' && d.crew_ids.includes(currentUser?.id)
      );
      if (activeDispatch) {
        setOnRoute(true);
        setCurrentDispatch(activeDispatch);
      }

      // Get available routes
      const routesRes = await api.get('/routes');
      setAvailableRoutes(routesRes.data);
    } catch (error) {
      console.error('Error fetching crew status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockInOut = async () => {
    try {
      if (clockedIn && currentShift) {
        // Clock out
        await api.put(`/shifts/${currentShift.id}`, { status: 'completed' });
        setClockedIn(false);
        setCurrentShift(null);
        Alert.alert('Clocked Out', 'You have been clocked out successfully');
      } else {
        // Clock in
        const response = await api.post('/shifts', {
          user_id: currentUser?.id,
          shift_date: new Date().toISOString().split('T')[0],
          start_time: new Date().toISOString(),
        });
        setClockedIn(true);
        setCurrentShift(response.data);
        Alert.alert('Clocked In', 'You have been clocked in successfully');
      }
    } catch (error) {
      console.error('Error clocking in/out:', error);
      Alert.alert('Error', 'Failed to clock in/out. Please try again.');
    }
  };

  const handleStartEndRoute = async () => {
    try {
      if (onRoute && currentDispatch) {
        // End route
        await api.put(`/dispatches/${currentDispatch.id}`, { status: 'completed' });
        setOnRoute(false);
        setCurrentDispatch(null);
        Alert.alert('Route Completed', 'Route has been marked as completed');
      } else {
        // Check dispatches assigned to this crew
        const dispatchesRes = await api.get('/dispatches');
        const assignedDispatches = dispatchesRes.data.filter(
          (d: any) => d.status === 'scheduled' && d.crew_ids.includes(currentUser?.id)
        );

        if (assignedDispatches.length > 0) {
          // Start the first assigned dispatch
          await api.put(`/dispatches/${assignedDispatches[0].id}`, { status: 'in_progress' });
          setOnRoute(true);
          setCurrentDispatch(assignedDispatches[0]);
          Alert.alert('Route Started', `Started route: ${assignedDispatches[0].route_name}`);
        } else {
          Alert.alert('No Routes', 'You have no assigned routes to start');
        }
      }
    } catch (error) {
      console.error('Error starting/ending route:', error);
      Alert.alert('Error', 'Failed to start/end route. Please try again.');
    }
  };

  const handleStartPreconfiguredRoute = async (route: any) => {
    try {
      // Create a new dispatch from the route
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
      setCurrentDispatch(response.data);
      setShowRoutesModal(false);
      Alert.alert('Route Started', `Started preconfigured route: ${route.name}`);
    } catch (error) {
      console.error('Error starting preconfigured route:', error);
      Alert.alert('Error', 'Failed to start route. Please try again.');
    }
  };

  const getClockInDuration = () => {
    if (!currentShift || !currentShift.start_time) return '0h 0m';
    const startTime = new Date(currentShift.start_time);
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crew Dashboard</Text>
      
      <View style={styles.buttonsGrid}>
        {/* Top Left: Clock In/Out */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.topLeft,
            clockedIn ? styles.clockedIn : styles.clockedOut,
          ]}
          onPress={handleClockInOut}
        >
          <Ionicons
            name={clockedIn ? 'time' : 'time-outline'}
            size={48}
            color={Colors.white}
          />
          <Text style={styles.buttonTitle}>
            {clockedIn ? 'Clock Out' : 'Clock In'}
          </Text>
          {clockedIn && (
            <Text style={styles.buttonSubtitle}>{getClockInDuration()}</Text>
          )}
        </TouchableOpacity>

        {/* Top Right: Start/End Route */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.topRight,
            onRoute ? styles.onRoute : styles.notOnRoute,
          ]}
          onPress={handleStartEndRoute}
        >
          <Ionicons
            name={onRoute ? 'stop-circle' : 'play-circle'}
            size={48}
            color={Colors.white}
          />
          <Text style={styles.buttonTitle}>
            {onRoute ? 'End Route' : 'Start Route'}
          </Text>
          {onRoute && currentDispatch && (
            <Text style={styles.buttonSubtitle} numberOfLines={1}>
              {currentDispatch.route_name}
            </Text>
          )}
        </TouchableOpacity>

        {/* Bottom Left: Preconfigured Routes */}
        <TouchableOpacity
          style={[styles.actionButton, styles.bottomLeft, styles.routesButton]}
          onPress={() => setShowRoutesModal(true)}
        >
          <Ionicons name="map" size={48} color={Colors.white} />
          <Text style={styles.buttonTitle}>Routes</Text>
          <Text style={styles.buttonSubtitle}>{availableRoutes.length} available</Text>
        </TouchableOpacity>

        {/* Bottom Right: Forms */}
        <TouchableOpacity
          style={[styles.actionButton, styles.bottomRight, styles.formsButton]}
          onPress={() => router.push('/(tabs)/forms')}
        >
          <Ionicons name="document-text" size={48} color={Colors.white} />
          <Text style={styles.buttonTitle}>Forms</Text>
          <Text style={styles.buttonSubtitle}>View & Fill</Text>
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
              <Ionicons name="close-circle" size={32} color={Colors.gray400} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {availableRoutes.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="map-outline" size={64} color={Colors.gray300} />
                <Text style={styles.emptyText}>No routes available</Text>
              </View>
            ) : (
              availableRoutes.map((route) => (
                <TouchableOpacity
                  key={route.id}
                  style={styles.routeCard}
                  onPress={() => handleStartPreconfiguredRoute(route)}
                >
                  <View style={styles.routeIconContainer}>
                    <Ionicons name="navigate" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeName}>{route.name}</Text>
                    {route.description && (
                      <Text style={styles.routeDescription}>{route.description}</Text>
                    )}
                    <Text style={styles.routeSites}>{route.site_ids?.length || 0} sites</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={Colors.gray400} />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  weatherSection: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 24,
  },
  buttonsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionButton: {
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
  topLeft: {},
  topRight: {},
  bottomLeft: {},
  bottomRight: {},
  clockedOut: {
    backgroundColor: Colors.gray500,
  },
  clockedIn: {
    backgroundColor: Colors.success,
  },
  notOnRoute: {
    backgroundColor: Colors.primary,
  },
  onRoute: {
    backgroundColor: Colors.warning,
  },
  routesButton: {
    backgroundColor: '#8b5cf6',
  },
  formsButton: {
    backgroundColor: '#ec4899',
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 12,
    textAlign: 'center',
  },
  buttonSubtitle: {
    fontSize: 14,
    color: Colors.white,
    marginTop: 4,
    opacity: 0.9,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray500,
    marginTop: 16,
  },
  routeCard: {
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
  routeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    color: Colors.gray600,
    marginBottom: 4,
  },
  routeSites: {
    fontSize: 12,
    color: Colors.gray500,
  },
});
