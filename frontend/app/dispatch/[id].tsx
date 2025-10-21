import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import { Dispatch, User, Site, Equipment, FormTemplate } from '../../types';
import AttachedForms from '../../components/AttachedForms';

export default function DispatchDetailScreen() {
  const { id } = useLocalSearchParams();
  const [dispatch, setDispatch] = useState<Dispatch | null>(null);
  const [crews, setCrews] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);

  useEffect(() => {
    fetchDispatchDetails();
  }, [id]);

  const fetchDispatchDetails = async () => {
    if (!id || typeof id !== 'string') {
      console.error('Invalid dispatch ID:', id);
      Alert.alert('Error', 'Invalid dispatch ID');
      router.back();
      return;
    }

    try {
      const [dispatchRes, templatesRes] = await Promise.all([
        api.get(`/dispatches/${id}`),
        api.get('/form-templates?form_type=safety_check'),
      ]);
      
      const dispatchData: Dispatch = dispatchRes.data;
      setDispatch(dispatchData);
      setFormTemplates(templatesRes.data);

      // Fetch crews
      const crewPromises = dispatchData.crew_ids.map(crewId => api.get(`/users/${crewId}`));
      const crewResults = await Promise.all(crewPromises);
      setCrews(crewResults.map(r => r.data));

      // Fetch sites
      const sitePromises = dispatchData.site_ids.map(siteId => api.get(`/sites/${siteId}`));
      const siteResults = await Promise.all(sitePromises);
      setSites(siteResults.map(r => r.data));

      // Fetch equipment
      const equipmentPromises = dispatchData.equipment_ids.map(eqId => api.get(`/equipment/${eqId}`));
      const equipmentResults = await Promise.all(equipmentPromises);
      setEquipment(equipmentResults.map(r => r.data));
    } catch (error) {
      console.error('Error fetching dispatch details:', error);
      Alert.alert('Error', 'Failed to load dispatch details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddForm = () => {
    if (formTemplates.length === 0) {
      Alert.alert('No Forms Available', 'No pre-shift inspection forms have been created yet.');
      return;
    }

    // Show form template picker
    const templateOptions = formTemplates.map(t => ({ 
      text: t.name, 
      onPress: () => navigateToForm(t.id!) 
    }));
    templateOptions.push({ text: 'Cancel', onPress: () => {}, style: 'cancel' } as any);

    Alert.alert('Select Inspection Form', 'Choose a pre-shift inspection form', templateOptions as any);
  };

  const navigateToForm = (templateId: string) => {
    router.push({
      pathname: '/forms/fill-form',
      params: { 
        templateId, 
        dispatchId: id,
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return Colors.primary;
      case 'in_progress': return Colors.warning;
      case 'completed': return Colors.success;
      case 'cancelled': return Colors.error;
      default: return Colors.gray500;
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const response = await api.put(`/dispatches/${id}`, { status: newStatus });
      setDispatch(response.data);
      Alert.alert('Success', 'Dispatch status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update dispatch status');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!dispatch) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dispatch Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Dispatch Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Ionicons name="send" size={24} color={Colors.primary} />
              <Text style={styles.cardTitle}>{dispatch.route_name}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(dispatch.status) }]}>
              <Text style={styles.statusText}>{dispatch.status.replace('_', ' ').toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Date & Time:</Text>
            <Text style={styles.value}>
              {format(new Date(dispatch.scheduled_date), 'MMM d, yyyy')} at {dispatch.scheduled_time}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Services:</Text>
            <Text style={styles.value}>
              {dispatch.services.map(s => s.replace('_', ' ')).join(', ')}
            </Text>
          </View>

          {dispatch.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Notes:</Text>
              <Text style={styles.value}>{dispatch.notes}</Text>
            </View>
          )}

          {/* Status Action Buttons */}
          {dispatch.status === 'scheduled' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.warning }]}
              onPress={() => handleUpdateStatus('in_progress')}
            >
              <Ionicons name="play-circle" size={20} color={Colors.white} />
              <Text style={styles.actionButtonText}>Start Dispatch</Text>
            </TouchableOpacity>
          )}
          {dispatch.status === 'in_progress' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.success }]}
              onPress={() => handleUpdateStatus('completed')}
            >
              <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
              <Text style={styles.actionButtonText}>Complete Dispatch</Text>
            </TouchableOpacity>
          )}
          
          {/* Photo Action Buttons */}
          {(dispatch.status === 'in_progress' || dispatch.status === 'completed') && (
            <View style={styles.photoButtonsContainer}>
              <TouchableOpacity
                style={[styles.photoButton, { backgroundColor: Colors.primary }]}
                onPress={() => router.push({
                  pathname: '/photo-capture',
                  params: { dispatchId: dispatch.id, siteId: sites[0]?.id || '' }
                })}
              >
                <Ionicons name="camera" size={20} color={Colors.white} />
                <Text style={styles.photoButtonText}>Take Photos</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.photoButton, { backgroundColor: Colors.success }]}
                onPress={() => router.push({
                  pathname: '/photo-gallery',
                  params: { dispatchId: dispatch.id }
                })}
              >
                <Ionicons name="images" size={20} color={Colors.white} />
                <Text style={styles.photoButtonText}>View Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Crew Members */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>👥 Crew Members ({crews.length})</Text>
          {crews.map(crew => (
            <View key={crew.id} style={styles.listItem}>
              <Ionicons name="person" size={20} color={Colors.primary} />
              <Text style={styles.listItemText}>{crew.name}</Text>
            </View>
          ))}
        </View>

        {/* Sites */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📍 Sites ({sites.length})</Text>
          {sites.map(site => (
            <View key={site.id} style={styles.listItem}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemText}>{site.name}</Text>
                <Text style={styles.listItemSubtext}>{site.location.address}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Equipment */}
        {equipment.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🚜 Equipment ({equipment.length})</Text>
            {equipment.map(eq => (
              <View key={eq.id} style={styles.listItem}>
                <Ionicons name="construct" size={20} color={Colors.primary} />
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemText}>{eq.name}</Text>
                  <Text style={styles.listItemSubtext}>{eq.equipment_type.replace('_', ' ')}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Pre-Shift Inspection Forms */}
        <AttachedForms
          entityType="dispatch"
          entityId={dispatch.id!}
          entityName={dispatch.route_name}
          formType="safety_check"
          onAddForm={handleAddForm}
        />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray600,
    width: 110,
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  photoButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  listItemSubtext: {
    fontSize: 12,
    color: Colors.gray500,
    marginTop: 2,
  },
});
