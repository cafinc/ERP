import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../utils/api';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import { Site, Customer } from '../../types';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import WebAdminLayout from '../../components/WebAdminLayout';

function SitesContent() {
  const { sites, setSites, customers, setCustomers } = useStore();
  const { isCrew, isCustomer, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;
  
  // Form state
  const [name, setName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [siteType, setSiteType] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [address, setAddress] = useState('');
  const [areaSize, setAreaSize] = useState('');
  const [notes, setNotes] = useState('');

  const siteTypes = ['parking_lot', 'driveway', 'sidewalk', 'roadway', 'commercial_property'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sitesRes, customersRes] = await Promise.all([
        api.get('/sites'),
        api.get('/customers'),
      ]);
      setSites(sitesRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      console.error('Error fetching sites:', error);
      Alert.alert('Error', 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCustomerId('');
    setSiteType('');
    setLatitude('');
    setLongitude('');
    setAddress('');
    setAreaSize('');
    setNotes('');
    setEditingSite(null);
  };

  const handleSave = async () => {
    console.log('Attempting to save site with:', {
      name: name.trim(),
      customerId,
      siteType,
      latitude,
      longitude,
      address: address.trim(),
      areaSize
    });

    if (!name.trim() || !customerId || !siteType || !latitude || !longitude || !address.trim()) {
      const missing = [];
      if (!name.trim()) missing.push('Name');
      if (!customerId) missing.push('Customer');
      if (!siteType) missing.push('Site Type');
      if (!latitude) missing.push('Latitude');
      if (!longitude) missing.push('Longitude');
      if (!address.trim()) missing.push('Address');
      
      Alert.alert('Missing Fields', `Please fill in: ${missing.join(', ')}`);
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Error', 'Invalid coordinates');
      return;
    }

    try {
      const siteData = {
        name,
        customer_id: customerId,
        site_type: siteType,
        location: {
          latitude: lat,
          longitude: lng,
          address,
        },
        area_size: areaSize ? parseFloat(areaSize) : undefined,
        notes: notes || undefined,
      };

      if (editingSite) {
        const response = await api.put(`/sites/${editingSite.id}`, siteData);
        setSites(sites.map(s => s.id === editingSite.id ? response.data : s));
        Alert.alert('Success', 'Site updated successfully');
      } else {
        const response = await api.post('/sites', siteData);
        setSites([response.data, ...sites]);
        Alert.alert('Success', 'Site created successfully');
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving site:', error);
      Alert.alert('Error', 'Failed to save site');
    }
  };

  const handleEdit = (site: Site) => {
    setEditingSite(site);
    setName(site.name);
    setCustomerId(site.customer_id);
    setSiteType(site.site_type);
    setLatitude(site.location.latitude.toString());
    setLongitude(site.location.longitude.toString());
    setAddress(site.location.address);
    setAreaSize(site.area_size?.toString() || '');
    setNotes(site.notes || '');
    setShowModal(true);
  };

  const handleDelete = async (siteId: string) => {
    Alert.alert(
      'Delete Site',
      'Are you sure you want to delete this site?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/sites/${siteId}`);
              setSites(sites.filter(s => s.id !== siteId));
              Alert.alert('Success', 'Site deleted');
            } catch (error) {
              console.error('Error deleting site:', error);
              Alert.alert('Error', 'Failed to delete site');
            }
          },
        },
      ]
    );
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4682B4" />
      </View>
    );
  }

  // Filter sites for customers - only show their own sites
  const displaySites = isCustomer 
    ? sites.filter(site => site.customer_id === currentUser?.id)
    : sites;

  return (
    <View style={[styles.container, isDesktop && styles.desktopContainer]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sites ({displaySites.length})</Text>
        {!isCrew && !isCustomer && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Ionicons name="add-circle" size={28} color="#4682B4" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {displaySites.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateText}>
              {isCustomer ? 'No sites found' : 'No sites yet'}
            </Text>
            {!isCrew && !isCustomer && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowModal(true)}
              >
                <Text style={styles.emptyButtonText}>Add First Site</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          displaySites.map((site) => (
            <View key={site.id} style={styles.siteCard}>
              <TouchableOpacity 
                style={styles.siteHeader}
                onPress={() => router.push(`/sites/${site.id}`)}
              >
                <View style={styles.siteIcon}>
                  <Ionicons name="location" size={24} color="#4682B4" />
                </View>
                <View style={styles.siteInfo}>
                  <Text style={styles.siteName}>{site.name}</Text>
                  <Text style={styles.customerName}>{getCustomerName(site.customer_id)}</Text>
                  <View style={styles.siteDetailRow}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>
                        {site.site_type.replace('_', ' ')}
                      </Text>
                    </View>
                    {site.area_size && (
                      <Text style={styles.areaText}>{site.area_size} sq ft</Text>
                    )}
                  </View>
                  <Text style={styles.addressText} numberOfLines={2}>
                    {site.location.address}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>

              {!isCrew && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEdit(site)}
                  >
                    <Ionicons name="pencil" size={16} color="#4682B4" />
                    <Text style={[styles.actionButtonText, { color: '#4682B4' }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(site.id!)}
                  >
                    <Ionicons name="trash" size={16} color="#ef4444" />
                    <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowModal(false);
              resetForm();
            }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingSite ? 'Edit Site' : 'Add Site'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <View style={styles.formSection}>
              <Text style={styles.label}>Site Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Site name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Customer *</Text>
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {customers.map((customer) => (
                    <TouchableOpacity
                      key={customer.id}
                      style={[
                        styles.chip,
                        customerId === customer.id && styles.chipSelected,
                      ]}
                      onPress={() => setCustomerId(customer.id!)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          customerId === customer.id && styles.chipTextSelected,
                        ]}
                      >
                        {customer.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Site Type *</Text>
              <View style={styles.chipContainer}>
                {siteTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chip,
                      siteType === type && styles.chipSelected,
                    ]}
                    onPress={() => setSiteType(type)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        siteType === type && styles.chipTextSelected,
                      ]}
                    >
                      {type.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <AddressAutocomplete
                label="Address *"
                placeholder="Start typing address..."
                defaultValue={address}
                onSelectAddress={(addressData) => {
                  setAddress(addressData.fullAddress);
                  setLatitude(addressData.latitude.toString());
                  setLongitude(addressData.longitude.toString());
                }}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formSection, styles.formHalf]}>
                <Text style={styles.label}>Latitude *</Text>
                <TextInput
                  style={styles.input}
                  value={latitude}
                  onChangeText={setLatitude}
                  placeholder="40.7128"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formSection, styles.formHalf]}>
                <Text style={styles.label}>Longitude *</Text>
                <TextInput
                  style={styles.input}
                  value={longitude}
                  onChangeText={setLongitude}
                  placeholder="-74.0060"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Area Size (sq ft)</Text>
              <TextInput
                style={styles.input}
                value={areaSize}
                onChangeText={setAreaSize}
                placeholder="e.g. 5000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Additional notes"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

export default function SitesScreen() {
  const { isAdmin } = useAuth();
  const shouldUseAdminLayout = Platform.OS === 'web' && isAdmin;
  
  if (shouldUseAdminLayout) {
    return <WebAdminLayout><SitesContent /></WebAdminLayout>;
  }
  return <SitesContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  desktopContainer: {
    maxWidth: 1400,
    marginHorizontal: 'auto',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
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
  siteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  siteHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  siteIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f1f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  siteInfo: {
    flex: 1,
    gap: 4,
  },
  siteName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  customerName: {
    fontSize: 14,
    color: '#6b7280',
  },
  siteDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  typeBadge: {
    backgroundColor: '#d4e5f4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#3a6d94',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  areaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  addressText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  editButton: {
    borderColor: '#4682B4',
    backgroundColor: '#e8f1f8',
  },
  deleteButton: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: 24,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#ffffff',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  chipSelected: {
    backgroundColor: '#4682B4',
    borderColor: '#4682B4',
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
    textTransform: 'capitalize',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
});
