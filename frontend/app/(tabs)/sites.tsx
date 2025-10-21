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
import { Site, Customer, SiteService } from '../../types';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import WebAdminLayout from '../../components/WebAdminLayout';

function SitesContent() {
  const { sites, setSites, customers, setCustomers } = useStore();
  const { isCrew, isCustomer, isAdmin, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;
  
  // Form state
  const [name, setName] = useState('');
  const [siteReference, setSiteReference] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [siteType, setSiteType] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [address, setAddress] = useState('');
  const [areaSize, setAreaSize] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [crewNotes, setCrewNotes] = useState('');
  const [siteServices, setSiteServices] = useState<SiteService[]>([]);
  const [showManualCoordinates, setShowManualCoordinates] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const siteTypes = ['residential', 'commercial', 'industrial', 'retail', 'emergency_services'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sitesRes, customersRes, servicesRes] = await Promise.all([
        api.get('/sites'),
        api.get('/customers'),
        api.get('/services'),
      ]);
      setSites(sitesRes.data);
      setCustomers(customersRes.data);
      setServices(servicesRes.data);
    } catch (error) {
      console.error('Error fetching sites:', error);
      Alert.alert('Error', 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setSiteReference('');
    setCustomerId('');
    setSiteType('');
    setLatitude('');
    setLongitude('');
    setAddress('');
    setAreaSize('');
    setInternalNotes('');
    setCrewNotes('');
    setSiteServices([]);
    setShowManualCoordinates(false);
    setCustomerSearch('');
    setShowCustomerDropdown(false);
    setEditingSite(null);
  };

  const handleSave = async () => {
    if (!name.trim() || !customerId || !siteType) {
      Alert.alert('Missing Fields', 'Please fill in Name, Customer, and Site Type');
      return;
    }

    // If address is not set but manual coordinates are provided
    if (!address.trim() && (latitude && longitude)) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (isNaN(lat) || isNaN(lng)) {
        Alert.alert('Error', 'Invalid coordinates');
        return;
      }
    }

    // If address is set, latitude and longitude should be set
    if (address.trim() && (!latitude || !longitude)) {
      Alert.alert('Error', 'Please select an address from autocomplete or provide manual coordinates');
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    try {
      const siteData = {
        name,
        site_reference: siteReference || undefined,
        customer_id: customerId,
        site_type: siteType,
        location: {
          latitude: lat,
          longitude: lng,
          address: address || `${lat}, ${lng}`,
        },
        area_size: areaSize ? parseFloat(areaSize) : undefined,
        internal_notes: internalNotes || undefined,
        crew_notes: crewNotes || undefined,
        services: siteServices,
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
    setSiteReference(site.site_reference || '');
    setCustomerId(site.customer_id);
    setSiteType(site.site_type);
    setLatitude(site.location.latitude.toString());
    setLongitude(site.location.longitude.toString());
    setAddress(site.location.address);
    setAreaSize(site.area_size?.toString() || '');
    setInternalNotes(site.internal_notes || '');
    setCrewNotes(site.crew_notes || '');
    setSiteServices(site.services || []);
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

  const handleCustomerClick = (customerId: string) => {
    router.push(`/customers/${customerId}`);
  };

  const handleAddService = () => {
    setShowServicesModal(true);
  };

  const handleServiceSelect = (service: any) => {
    const exists = siteServices.find(s => s.service_id === service.id);
    if (exists) {
      Alert.alert('Already Added', 'This service is already added to the site');
      return;
    }

    const newService: SiteService = {
      service_id: service.id,
      service_name: service.name,
      service_type: service.service_type,
      unit_type: 'per_occurrence', // Default
      cost: 0,
      notes: '',
    };
    
    setSiteServices([...siteServices, newService]);
    setShowServicesModal(false);
  };

  const handleRemoveService = (serviceId: string) => {
    setSiteServices(siteServices.filter(s => s.service_id !== serviceId));
  };

  const handleServiceUpdate = (serviceId: string, field: string, value: any) => {
    setSiteServices(siteServices.map(s => 
      s.service_id === serviceId ? { ...s, [field]: value } : s
    ));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4682B4" />
      </View>
    );
  }

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
            onPress={() => router.push('/sites/create')}
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
                onPress={() => router.push('/sites/create')}
              >
                <Text style={styles.emptyButtonText}>Add First Site</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {displaySites.map((site) => (
              <TouchableOpacity
                key={site.id}
                style={styles.siteCardCompact}
                onPress={() => router.push(`/sites/${site.id}`)}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name="location" size={32} color="#4682B4" />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{site.name}</Text>
                    {site.site_reference && (
                      <View style={styles.cardRefBadge}>
                        <Text style={styles.cardRefText}>#{site.site_reference}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardCustomer} numberOfLines={1}>
                    {getCustomerName(site.customer_id)}
                  </Text>
                  <View style={styles.cardTypeBadge}>
                    <Text style={styles.cardTypeText}>
                      {site.site_type.replace('_', ' ')}
                    </Text>
                  </View>
                  {site.services && site.services.length > 0 && (
                    <View style={styles.cardServicesRow}>
                      <Ionicons name="construct" size={12} color="#10b981" />
                      <Text style={styles.cardServicesText}>{site.services.length} services</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" style={styles.chevron} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Main Site Modal */}
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
            {/* Site Name */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Site Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Main Office Parking Lot"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Site Reference */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Site Reference/Code</Text>
              <TextInput
                style={styles.input}
                value={siteReference}
                onChangeText={setSiteReference}
                placeholder="e.g., LOT-001, SITE-A"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Customer Dropdown */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Customer *</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowCustomerDropdown(!showCustomerDropdown)}
              >
                <Text style={[styles.dropdownButtonText, !customerId && styles.placeholderText]}>
                  {customerId ? getCustomerName(customerId) : 'Select a customer'}
                </Text>
                <Ionicons 
                  name={showCustomerDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6b7280" 
                />
              </TouchableOpacity>

              {showCustomerDropdown && (
                <View style={styles.dropdown}>
                  <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color="#9ca3af" />
                    <TextInput
                      style={styles.searchInput}
                      value={customerSearch}
                      onChangeText={setCustomerSearch}
                      placeholder="Search customers..."
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                    {customers
                      .filter(c => 
                        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                        c.email.toLowerCase().includes(customerSearch.toLowerCase())
                      )
                      .map((customer) => (
                        <TouchableOpacity
                          key={customer.id}
                          style={[
                            styles.dropdownItem,
                            customerId === customer.id && styles.dropdownItemSelected,
                          ]}
                          onPress={() => {
                            setCustomerId(customer.id!);
                            setShowCustomerDropdown(false);
                            setCustomerSearch('');
                          }}
                        >
                          <View style={styles.dropdownItemContent}>
                            <Text style={styles.dropdownItemName}>{customer.name}</Text>
                            <Text style={styles.dropdownItemEmail}>{customer.email}</Text>
                          </View>
                          {customerId === customer.id && (
                            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                          )}
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Site Type */}
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

            {/* Address with Autocomplete */}
            <View style={styles.formSection}>
              <View style={styles.addressHeaderRow}>
                <Text style={styles.label}>Site Address</Text>
                <TouchableOpacity 
                  onPress={() => setShowManualCoordinates(!showManualCoordinates)}
                  style={styles.manualToggle}
                >
                  <Ionicons 
                    name={showManualCoordinates ? "location" : "create"} 
                    size={16} 
                    color="#4682B4" 
                  />
                  <Text style={styles.manualToggleText}>
                    {showManualCoordinates ? 'Use Address' : 'Manual Coordinates'}
                  </Text>
                </TouchableOpacity>
              </View>

              {!showManualCoordinates ? (
                <AddressAutocomplete
                  label=""
                  placeholder="Start typing address..."
                  defaultValue={address}
                  onSelectAddress={(addressData) => {
                    setAddress(addressData.fullAddress);
                    setLatitude(addressData.latitude.toString());
                    setLongitude(addressData.longitude.toString());
                  }}
                />
              ) : (
                <View>
                  <Text style={styles.helpText}>Enter coordinates manually if address lookup fails</Text>
                  <View style={styles.formRow}>
                    <View style={[styles.formSection, styles.formHalf]}>
                      <Text style={styles.label}>Latitude *</Text>
                      <TextInput
                        style={styles.input}
                        value={latitude}
                        onChangeText={setLatitude}
                        placeholder="43.6532"
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
                        placeholder="-79.3832"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Area Size */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Area Size (sq ft)</Text>
              <TextInput
                style={styles.input}
                value={areaSize}
                onChangeText={setAreaSize}
                placeholder="e.g., 5000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>

            {/* Internal Notes (Admin Only) */}
            {isAdmin && (
              <View style={styles.formSection}>
                <Text style={styles.label}>Internal Notes (Admin Only)</Text>
                <Text style={styles.helpText}>Only visible to administrators</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={internalNotes}
                  onChangeText={setInternalNotes}
                  placeholder="Private notes for admin team..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            {/* Crew Notes */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Crew Notes</Text>
              <Text style={styles.helpText}>Visible to crew and customer</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={crewNotes}
                onChangeText={setCrewNotes}
                placeholder="Special instructions, access codes, etc..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Site Services */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Site Services</Text>
                <TouchableOpacity 
                  style={styles.addServiceButton}
                  onPress={handleAddService}
                >
                  <Ionicons name="add-circle" size={18} color="#ffffff" />
                  <Text style={styles.addServiceText}>Add Service</Text>
                </TouchableOpacity>
              </View>
              
              {siteServices.length === 0 ? (
                <Text style={styles.helpText}>No services configured yet</Text>
              ) : (
                siteServices.map((service, index) => (
                  <View key={service.service_id} style={styles.serviceCard}>
                    <View style={styles.serviceHeader}>
                      <Text style={styles.serviceName}>{service.service_name}</Text>
                      <TouchableOpacity onPress={() => handleRemoveService(service.service_id)}>
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.serviceRow}>
                      <View style={styles.serviceField}>
                        <Text style={styles.serviceLabel}>Unit Type</Text>
                        <View style={styles.unitTypeContainer}>
                          {['hourly', 'per_occurrence', 'monthly', 'per_yard'].map((unit) => (
                            <TouchableOpacity
                              key={unit}
                              style={[
                                styles.unitChip,
                                service.unit_type === unit && styles.unitChipSelected,
                              ]}
                              onPress={() => handleServiceUpdate(service.service_id, 'unit_type', unit)}
                            >
                              <Text
                                style={[
                                  styles.unitChipText,
                                  service.unit_type === unit && styles.unitChipTextSelected,
                                ]}
                              >
                                {unit.replace('_', ' ')}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>

                    <View style={styles.serviceRow}>
                      <View style={styles.serviceField}>
                        <Text style={styles.serviceLabel}>Cost ($)</Text>
                        <TextInput
                          style={styles.serviceInput}
                          value={service.cost.toString()}
                          onChangeText={(text) => handleServiceUpdate(service.service_id, 'cost', parseFloat(text) || 0)}
                          placeholder="0.00"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <View style={styles.serviceRow}>
                      <View style={styles.serviceField}>
                        <Text style={styles.serviceLabel}>Notes</Text>
                        <TextInput
                          style={styles.serviceInput}
                          value={service.notes || ''}
                          onChangeText={(text) => handleServiceUpdate(service.service_id, 'notes', text)}
                          placeholder="Optional notes..."
                        />
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Services Selection Modal */}
      <Modal
        visible={showServicesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowServicesModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowServicesModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Service</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalScroll}>
            {services.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No services available</Text>
                <Text style={styles.helpText}>Create services first in Settings</Text>
              </View>
            ) : (
              services.filter(s => s.active).map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceSelectCard}
                  onPress={() => handleServiceSelect(service)}
                >
                  <View style={styles.serviceSelectInfo}>
                    <Text style={styles.serviceSelectName}>{service.name}</Text>
                    <Text style={styles.serviceSelectType}>{service.service_type}</Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color="#10b981" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

export default function SitesScreen() {
  const { isAdmin } = useAuth();
  // Tab screens need sidebar but not duplicate header
  if (Platform.OS === 'web' && isAdmin) {
    return <WebAdminLayout showHeader={false}><SitesContent /></WebAdminLayout>;
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  siteCardCompact: {
    width: 'calc(50% - 6px)',
    minWidth: 160,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e8f1f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  cardRefBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardRefText: {
    fontSize: 10,
    color: '#1e40af',
    fontWeight: '600',
  },
  cardCustomer: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  cardTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#d4e5f4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  cardTypeText: {
    fontSize: 11,
    color: '#3a6d94',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardServicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardServicesText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  chevron: {
    position: 'absolute',
    top: 16,
    right: 16,
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
  siteNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  siteName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  refBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  refBadgeText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
  },
  customerNameLink: {
    fontSize: 14,
    color: '#4682B4',
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  notesPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: '#f3f4f6',
    padding: 6,
    borderRadius: 6,
  },
  notesPreviewText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  servicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  servicesText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  editButton: {
    backgroundColor: '#4682B4',
    borderWidth: 0,
  },
  deleteButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  cancelText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saveText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    backgroundColor: '#4682B4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    overflow: 'hidden',
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
  helpText: {
    fontSize: 12,
    color: '#9ca3af',
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
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#ffffff',
    minHeight: 52,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    color: '#9ca3af',
  },
  dropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    maxHeight: 300,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  dropdownList: {
    maxHeight: 240,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0f9ff',
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  dropdownItemEmail: {
    fontSize: 13,
    color: '#6b7280',
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
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  manualToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  manualToggleText: {
    fontSize: 12,
    color: '#4682B4',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addServiceText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  serviceCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  serviceRow: {
    marginBottom: 8,
  },
  serviceField: {
    flex: 1,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  serviceInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  unitTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  unitChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  unitChipSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  unitChipText: {
    fontSize: 11,
    color: '#374151',
    textTransform: 'capitalize',
  },
  unitChipTextSelected: {
    color: '#ffffff',
  },
  serviceSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  serviceSelectInfo: {
    flex: 1,
  },
  serviceSelectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  serviceSelectType: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
});
