import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Dispatch, Site, Route, User, Equipment } from '../../types';
import { Colors } from '../../utils/theme';
import WebAdminLayout from '../../components/WebAdminLayout';

export default function DispatchScreen() {
  const { dispatches, setDispatches, routes, setRoutes, sites, setSites, crews, setCrews, equipment, setEquipment } = useStore();
  const { isCrew, isCustomer, isAdmin, currentUser } = useAuth();
  const isWeb = Platform.OS === 'web';
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);

  // Form state
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedCrew, setSelectedCrew] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');

  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dispatchesRes, routesRes, sitesRes, crewsRes, equipmentRes] = await Promise.all([
        api.get('/dispatches'),
        api.get('/routes'),
        api.get('/sites'),
        api.get('/users?role=crew'),
        api.get('/equipment'),
      ]);

      setDispatches(dispatchesRes.data);
      setRoutes(routesRes.data);
      setSites(sitesRes.data);
      setCrews(crewsRes.data);
      setEquipment(equipmentRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispatch = async () => {
    if (!selectedSite && !selectedRoute) {
      Alert.alert('Error', 'Please select a site or route');
      return;
    }

    try {
      const dispatchData: any = {
        scheduled_date: scheduledDate || new Date().toISOString(),
        notes,
      };

      if (selectedSite) dispatchData.site_id = selectedSite;
      if (selectedRoute) dispatchData.route_id = selectedRoute;
      if (selectedCrew) dispatchData.crew_id = selectedCrew;
      if (selectedEquipment) dispatchData.equipment_id = selectedEquipment;

      const response = await api.post('/dispatches', dispatchData);
      setDispatches([response.data, ...dispatches]);
      Alert.alert('Success', 'Dispatch created successfully');
      setShowCreateModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating dispatch:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create dispatch');
    }
  };

  const resetForm = () => {
    setSelectedSite('');
    setSelectedRoute('');
    setSelectedCrew('');
    setSelectedEquipment('');
    setScheduledDate('');
    setNotes('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#3b82f6';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'calendar';
      case 'in_progress':
        return 'play-circle';
      case 'completed':
        return 'checkmark-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const displayDispatches = isCrew
    ? dispatches.filter(d => d.crew_id === currentUser?.id)
    : dispatches;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4682B4" />
      </View>
    );
  }

  const content = (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>📋 Dispatch</Text>
        {!isCrew && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add-circle" size={28} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {displayDispatches.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="send-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateText}>
              {isCrew ? 'No assigned dispatches' : 'No dispatches yet'}
            </Text>
            {!isCrew && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.emptyButtonText}>Create First Dispatch</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          displayDispatches.map((dispatch) => (
            <TouchableOpacity
              key={dispatch.id}
              style={styles.dispatchCard}
              onPress={() => router.push(`/dispatch/${dispatch.id}`)}
            >
              <View style={styles.dispatchHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(dispatch.status) }]}>
                  <Ionicons
                    name={getStatusIcon(dispatch.status) as any}
                    size={16}
                    color="#ffffff"
                  />
                  <Text style={styles.statusText}>
                    {dispatch.status.charAt(0).toUpperCase() + dispatch.status.slice(1).replace('_', ' ')}
                  </Text>
                </View>
                <Text style={styles.dispatchDate}>
                  {new Date(dispatch.scheduled_date).toLocaleDateString()}
                </Text>
              </View>

              {dispatch.site_name && (
                <View style={styles.dispatchDetail}>
                  <Ionicons name="location" size={18} color="#6b7280" />
                  <Text style={styles.detailText}>{dispatch.site_name}</Text>
                </View>
              )}

              {dispatch.route_name && (
                <View style={styles.dispatchDetail}>
                  <Ionicons name="map" size={18} color="#6b7280" />
                  <Text style={styles.detailText}>{dispatch.route_name}</Text>
                </View>
              )}

              {dispatch.crew_name && (
                <View style={styles.dispatchDetail}>
                  <Ionicons name="people" size={18} color="#6b7280" />
                  <Text style={styles.detailText}>{dispatch.crew_name}</Text>
                </View>
              )}

              {dispatch.equipment_name && (
                <View style={styles.dispatchDetail}>
                  <Ionicons name="construct" size={18} color="#6b7280" />
                  <Text style={styles.detailText}>{dispatch.equipment_name}</Text>
                </View>
              )}

              {dispatch.notes && (
                <Text style={styles.notesText} numberOfLines={2}>
                  {dispatch.notes}
                </Text>
              )}

              <View style={styles.cardFooter}>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowCreateModal(false);
              resetForm();
            }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Dispatch</Text>
            <TouchableOpacity onPress={handleCreateDispatch}>
              <Text style={styles.saveText}>Create</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <View style={styles.formSection}>
              <Text style={styles.label}>Site</Text>
              <View style={styles.pickerContainer}>
                <Ionicons name="location" size={20} color="#6b7280" style={styles.pickerIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Select a site"
                  value={sites.find(s => s.id === selectedSite)?.name || ''}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Route</Text>
              <View style={styles.pickerContainer}>
                <Ionicons name="map" size={20} color="#6b7280" style={styles.pickerIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Select a route"
                  value={routes.find(r => r.id === selectedRoute)?.name || ''}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Crew</Text>
              <View style={styles.pickerContainer}>
                <Ionicons name="people" size={20} color="#6b7280" style={styles.pickerIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Select crew"
                  value={crews.find(c => c.id === selectedCrew)?.name || ''}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Equipment</Text>
              <View style={styles.pickerContainer}>
                <Ionicons name="construct" size={20} color="#6b7280" style={styles.pickerIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Select equipment"
                  value={equipment.find(e => e.id === selectedEquipment)?.name || ''}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Scheduled Date</Text>
              <View style={styles.pickerContainer}>
                <Ionicons name="calendar" size={20} color="#6b7280" style={styles.pickerIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={scheduledDate}
                  onChangeText={setScheduledDate}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any notes..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );

  // Tab screens need sidebar but not duplicate header
  if (isWeb && isAdmin) {
    return <WebAdminLayout showHeader={false}>{content}</WebAdminLayout>;
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  emergencyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4682B4',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
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
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dispatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  dispatchDate: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  dispatchDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  notesText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  cancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  saveText: {
    fontSize: 16,
    color: '#4682B4',
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  pickerIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
});
