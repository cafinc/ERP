import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../utils/api';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import { useSmartFill } from '../../contexts/SmartFillContext';
import { SiteService } from '../../types';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import FormattedTextInput from '../../components/FormattedTextInput';
import { Colors } from '../../utils/theme';

export default function CreateSiteScreen() {
  const { sites, setSites, customers, setCustomers } = useStore();
  const { isAdmin } = useAuth();
  const { recordUsage, getLastUsed } = useSmartFill();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<any[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [siteReference, setSiteReference] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [siteType, setSiteType] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [areaSize, setAreaSize] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [crewNotes, setCrewNotes] = useState('');
  const [siteServices, setSiteServices] = useState<SiteService[]>([]);
  const [showManualCoordinates, setShowManualCoordinates] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  
  // Access & Security fields
  const [hasGateCode, setHasGateCode] = useState(false);
  const [gateCode, setGateCode] = useState('');
  const [hasLockBox, setHasLockBox] = useState(false);
  const [lockBoxDetails, setLockBoxDetails] = useState('');
  const [hasSecurityOnsite, setHasSecurityOnsite] = useState(false);
  const [securityPhone, setSecurityPhone] = useState('');
  const [customAccessFields, setCustomAccessFields] = useState<Array<{name: string, value: string}>>([]);

  const siteTypes = [
    { value: 'residential', label: 'Residential', icon: 'home' },
    { value: 'commercial', label: 'Commercial', icon: 'business' },
    { value: 'industrial', label: 'Industrial', icon: 'construct' },
    { value: 'retail', label: 'Retail', icon: 'storefront' },
    { value: 'emergency_services', label: 'Emergency Services', icon: 'medical' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [customersRes, servicesRes] = await Promise.all([
        api.get('/customers'),
        api.get('/services'),
      ]);
      setCustomers(customersRes.data);
      setServices(servicesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : '';
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a site name');
      return false;
    }
    if (!customerId) {
      Alert.alert('Required Field', 'Please select a customer');
      return false;
    }
    if (!siteType) {
      Alert.alert('Required Field', 'Please select a site type');
      return false;
    }
    if (!address.trim() && (!latitude || !longitude)) {
      Alert.alert('Required Field', 'Please provide an address or coordinates');
      return false;
    }
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (isNaN(lat) || isNaN(lng)) {
        Alert.alert('Invalid Input', 'Please enter valid coordinates');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    try {
      // Build access fields array
      const accessFields: any[] = [];
      if (hasGateCode && gateCode) {
        accessFields.push({ field_name: 'Gate Code', field_value: gateCode, field_type: 'code' });
      }
      if (hasLockBox && lockBoxDetails) {
        accessFields.push({ field_name: 'Lock Box', field_value: lockBoxDetails, field_type: 'text' });
      }
      if (hasSecurityOnsite && securityPhone) {
        accessFields.push({ field_name: 'Security Phone', field_value: securityPhone, field_type: 'phone' });
      }
      // Add custom fields
      customAccessFields.forEach(field => {
        if (field.name && field.value) {
          accessFields.push({ field_name: field.name, field_value: field.value, field_type: 'text' });
        }
      });

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
        access_fields: accessFields,
      };

      const response = await api.post('/sites', siteData);
      setSites([response.data, ...sites]);
      
      // Record usage for smart fill
      if (address) await recordUsage('addresses', address, 'site');
      siteServices.forEach(async (service) => {
        await recordUsage('services', service.name, 'site');
      });
      
      Alert.alert('Success', 'Site created successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error creating site:', error);
      Alert.alert('Error', 'Failed to create site');
    } finally {
      setSaving(false);
    }
  };

  const getTriggerOptions = (serviceType: string) => {
    const type = serviceType.toLowerCase();
    if (type.includes('plow')) {
      return ['1 inch', '2 inch', 'Custom'];
    } else if (type.includes('sidewalk') || type.includes('walk')) {
      return ['Trace', '1 cm', '2 cm', 'Custom'];
    }
    return [];
  };

  const handleAddService = (service: any) => {
    const exists = siteServices.find(s => s.service_id === service.id);
    if (exists) {
      Alert.alert('Already Added', 'This service is already configured');
      return;
    }

    const newService: SiteService = {
      service_id: service.id,
      service_name: service.name,
      service_type: service.service_type,
      unit_type: 'per_occurrence',
      cost: 0,
      notes: '',
      trigger_type: undefined,
      trigger_value: undefined,
    };
    
    setSiteServices([...siteServices, newService]);
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
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Create New Site</Text>
          <Text style={styles.headerSubtitle}>Fill in the site information below</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '25%' }]} />
          </View>
          <Text style={styles.progressText}>Step 1 of 4</Text>
        </View>

        {/* Section 1: Basic Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="information-circle" size={24} color="#4682B4" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <Text style={styles.sectionSubtitle}>Site identification details</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Site Name <Text style={styles.required}>*</Text>
            </Text>
            <FormattedTextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Main Office Parking Lot"
              placeholderTextColor="#9ca3af"
              formatting="capitalize-words"
              fieldName="name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Site Reference/Code</Text>
            <Text style={styles.helpText}>Optional internal reference number</Text>
            <TextInput
              style={styles.input}
              value={siteReference}
              onChangeText={setSiteReference}
              placeholder="e.g., LOT-001, SITE-A"
              placeholderTextColor="#9ca3af"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Customer <Text style={styles.required}>*</Text>
            </Text>
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

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Site Type <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.typeGrid}>
              {siteTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeCard,
                    siteType === type.value && styles.typeCardSelected,
                  ]}
                  onPress={() => setSiteType(type.value)}
                >
                  <View style={[
                    styles.typeIconContainer,
                    siteType === type.value && styles.typeIconContainerSelected,
                  ]}>
                    <Ionicons 
                      name={type.icon as any} 
                      size={24} 
                      color={siteType === type.value ? '#ffffff' : '#4682B4'} 
                    />
                  </View>
                  <Text style={[
                    styles.typeLabel,
                    siteType === type.value && styles.typeLabelSelected,
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Section 2: Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="location" size={24} color="#4682B4" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Location Details</Text>
              <Text style={styles.sectionSubtitle}>Site address and coordinates</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.addressHeaderRow}>
              <Text style={styles.label}>
                Site Address <Text style={styles.required}>*</Text>
              </Text>
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
              <>
                <AddressAutocomplete
                  label=""
                  placeholder="Start typing address..."
                  defaultValue={address}
                  onSelectAddress={(addressData) => {
                    setAddress(addressData.fullAddress);
                    setCity(addressData.city);
                    setProvince(addressData.province);
                    setPostalCode(addressData.postalCode);
                    setLatitude(addressData.latitude.toString());
                    setLongitude(addressData.longitude.toString());
                  }}
                />
                
                {/* Auto-filled address components */}
                <View style={styles.addressFieldsRow}>
                  <View style={styles.addressFieldThird}>
                    <Text style={styles.label}>City</Text>
                    <TextInput
                      style={styles.input}
                      value={city}
                      onChangeText={setCity}
                      placeholder="City"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  
                  <View style={styles.addressFieldThird}>
                    <Text style={styles.label}>Province</Text>
                    <TextInput
                      style={styles.input}
                      value={province}
                      onChangeText={setProvince}
                      placeholder="Province"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  
                  <View style={styles.addressFieldThird}>
                    <Text style={styles.label}>Postal Code</Text>
                    <TextInput
                      style={styles.input}
                      value={postalCode}
                      onChangeText={setPostalCode}
                      placeholder="Postal Code"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>
              </>
            ) : (
              <View>
                <Text style={styles.helpText}>Enter coordinates if address lookup fails</Text>
                <View style={styles.coordinatesRow}>
                  <View style={styles.coordinateField}>
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

                  <View style={styles.coordinateField}>
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

          <View style={styles.formGroup}>
            <Text style={styles.label}>Area Size (sq ft)</Text>
            <Text style={styles.helpText}>Total site area in square feet</Text>
            <TextInput
              style={styles.input}
              value={areaSize}
              onChangeText={setAreaSize}
              placeholder="e.g., 5000"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Section 2.5: Access & Security */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="key" size={24} color="#4682B4" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Site Access & Security</Text>
              <Text style={styles.sectionSubtitle}>Configure access codes and security details</Text>
            </View>
          </View>

          {/* Gate Code Toggle */}
          <View style={styles.toggleField}>
            <View style={styles.toggleHeader}>
              <View style={styles.toggleIconContainer}>
                <Ionicons name="keypad" size={20} color="#4682B4" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Gate Code</Text>
                <Text style={styles.toggleSubtext}>Site requires gate access code</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, hasGateCode && styles.toggleActive]}
                onPress={() => {
                  setHasGateCode(!hasGateCode);
                  if (hasGateCode) setGateCode('');
                }}
              >
                <View style={[styles.toggleThumb, hasGateCode && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
            
            {hasGateCode && (
              <View style={styles.toggleContent}>
                <TextInput
                  style={styles.input}
                  value={gateCode}
                  onChangeText={setGateCode}
                  placeholder="Enter gate code (e.g., #1234)"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            )}
          </View>

          {/* Lock Box Toggle */}
          <View style={styles.toggleField}>
            <View style={styles.toggleHeader}>
              <View style={styles.toggleIconContainer}>
                <Ionicons name="lock-closed" size={20} color="#4682B4" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Lock Box</Text>
                <Text style={styles.toggleSubtext}>Key lock box available on site</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, hasLockBox && styles.toggleActive]}
                onPress={() => {
                  setHasLockBox(!hasLockBox);
                  if (hasLockBox) setLockBoxDetails('');
                }}
              >
                <View style={[styles.toggleThumb, hasLockBox && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
            
            {hasLockBox && (
              <View style={styles.toggleContent}>
                <TextInput
                  style={styles.input}
                  value={lockBoxDetails}
                  onChangeText={setLockBoxDetails}
                  placeholder="Enter lock box details (location, code, etc.)"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            )}
          </View>

          {/* Security Onsite Toggle */}
          <View style={styles.toggleField}>
            <View style={styles.toggleHeader}>
              <View style={styles.toggleIconContainer}>
                <Ionicons name="shield-checkmark" size={20} color="#4682B4" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Security On-site</Text>
                <Text style={styles.toggleSubtext}>Security personnel present</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, hasSecurityOnsite && styles.toggleActive]}
                onPress={() => {
                  setHasSecurityOnsite(!hasSecurityOnsite);
                  if (hasSecurityOnsite) setSecurityPhone('');
                }}
              >
                <View style={[styles.toggleThumb, hasSecurityOnsite && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
            
            {hasSecurityOnsite && (
              <View style={styles.toggleContent}>
                <TextInput
                  style={styles.input}
                  value={securityPhone}
                  onChangeText={setSecurityPhone}
                  placeholder="Enter security phone number"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                />
              </View>
            )}
          </View>

          {/* Custom Fields */}
          <View style={styles.customFieldsSection}>
            <View style={styles.customFieldsHeader}>
              <Text style={styles.customFieldsTitle}>Custom Access Fields</Text>
              <TouchableOpacity
                style={styles.addCustomFieldButton}
                onPress={() => setCustomAccessFields([...customAccessFields, { name: '', value: '' }])}
              >
                <Ionicons name="add" size={18} color="#10b981" />
                <Text style={styles.addCustomFieldText}>Add Field</Text>
              </TouchableOpacity>
            </View>

            {customAccessFields.length > 0 && (
              <View style={styles.customFieldsList}>
                {customAccessFields.map((field, index) => (
                  <View key={index} style={styles.customFieldItem}>
                    <View style={styles.customFieldInputs}>
                      <TextInput
                        style={[styles.input, styles.customFieldName]}
                        value={field.name}
                        onChangeText={(text) => {
                          const updated = [...customAccessFields];
                          updated[index].name = text;
                          setCustomAccessFields(updated);
                        }}
                        placeholder="Field name"
                        placeholderTextColor="#9ca3af"
                      />
                      <TextInput
                        style={[styles.input, styles.customFieldValue]}
                        value={field.value}
                        onChangeText={(text) => {
                          const updated = [...customAccessFields];
                          updated[index].value = text;
                          setCustomAccessFields(updated);
                        }}
                        placeholder="Field value"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setCustomAccessFields(customAccessFields.filter((_, i) => i !== index));
                      }}
                      style={styles.removeFieldButton}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Section 3: Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="document-text" size={24} color="#4682B4" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Notes & Instructions</Text>
              <Text style={styles.sectionSubtitle}>Important information for the team</Text>
            </View>
          </View>

          {isAdmin && (
            <View style={styles.formGroup}>
              <View style={styles.noteHeader}>
                <Text style={styles.label}>Internal Notes</Text>
                <View style={styles.badge}>
                  <Ionicons name="lock-closed" size={12} color="#6b7280" />
                  <Text style={styles.badgeText}>Admin Only</Text>
                </View>
              </View>
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

          <View style={styles.formGroup}>
            <View style={styles.noteHeader}>
              <Text style={styles.label}>Crew Notes</Text>
              <View style={[styles.badge, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="people" size={12} color="#1e40af" />
                <Text style={[styles.badgeText, { color: '#1e40af' }]}>Crew & Customer</Text>
              </View>
            </View>
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
        </View>

        {/* Section 4: Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="construct" size={24} color="#4682B4" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Site Services</Text>
              <Text style={styles.sectionSubtitle}>Configure services for this site</Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowServicesModal(true)}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {siteServices.length === 0 ? (
            <View style={styles.emptyServices}>
              <Ionicons name="construct-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyServicesText}>No services added yet</Text>
              <TouchableOpacity 
                style={styles.emptyServicesButton}
                onPress={() => setShowServicesModal(true)}
              >
                <Text style={styles.emptyServicesButtonText}>Add First Service</Text>
              </TouchableOpacity>
            </View>
          ) : (
            siteServices.map((service) => (
              <View key={service.service_id} style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceName}>{service.service_name}</Text>
                  <TouchableOpacity onPress={() => handleRemoveService(service.service_id)}>
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.serviceBody}>
                  <View style={styles.serviceField}>
                    <Text style={styles.serviceLabel}>Unit Type</Text>
                    <View style={styles.unitTypeRow}>
                      {['hourly', 'per_occurrence', 'monthly', 'per_yard'].map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          style={[
                            styles.unitButton,
                            service.unit_type === unit && styles.unitButtonSelected,
                          ]}
                          onPress={() => handleServiceUpdate(service.service_id, 'unit_type', unit)}
                        >
                          <Text
                            style={[
                              styles.unitButtonText,
                              service.unit_type === unit && styles.unitButtonTextSelected,
                            ]}
                          >
                            {unit.replace('_', ' ')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Trigger Type Selection */}
                  {getTriggerOptions(service.service_type).length > 0 && (
                    <View style={styles.serviceField}>
                      <Text style={styles.serviceLabel}>Trigger Type</Text>
                      <View style={styles.unitTypeRow}>
                        {getTriggerOptions(service.service_type).map((trigger) => (
                          <TouchableOpacity
                            key={trigger}
                            style={[
                              styles.unitButton,
                              service.trigger_type === trigger && styles.unitButtonSelected,
                            ]}
                            onPress={() => {
                              handleServiceUpdate(service.service_id, 'trigger_type', trigger);
                              if (trigger !== 'Custom') {
                                handleServiceUpdate(service.service_id, 'trigger_value', undefined);
                              }
                            }}
                          >
                            <Text
                              style={[
                                styles.unitButtonText,
                                service.trigger_type === trigger && styles.unitButtonTextSelected,
                              ]}
                            >
                              {trigger}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      {/* Custom Trigger Input */}
                      {service.trigger_type === 'Custom' && (
                        <TextInput
                          style={[styles.serviceInput, { marginTop: 8 }]}
                          value={service.trigger_value || ''}
                          onChangeText={(text) => handleServiceUpdate(service.service_id, 'trigger_value', text)}
                          placeholder="Enter custom trigger (e.g., 3 inches, 5 cm)"
                          placeholderTextColor="#9ca3af"
                        />
                      )}
                    </View>
                  )}

                  <View style={styles.serviceRow}>
                    <View style={styles.serviceFieldHalf}>
                      <Text style={styles.serviceLabel}>Cost ($)</Text>
                      <TextInput
                        style={styles.serviceInput}
                        value={service.cost.toString()}
                        onChangeText={(text) => handleServiceUpdate(service.service_id, 'cost', parseFloat(text) || 0)}
                        placeholder="0.00"
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.serviceFieldHalf}>
                      <Text style={styles.serviceLabel}>Notes</Text>
                      <TextInput
                        style={styles.serviceInput}
                        value={service.notes || ''}
                        onChangeText={(text) => handleServiceUpdate(service.service_id, 'notes', text)}
                        placeholder="Optional..."
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
              <Text style={styles.submitButtonText}>Create Site</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Service Selection Modal */}
      {showServicesModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.serviceModal}>
            <View style={styles.serviceModalHeader}>
              <Text style={styles.serviceModalTitle}>Select Service</Text>
              <TouchableOpacity onPress={() => setShowServicesModal(false)}>
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {services.filter(s => s.active).map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceOption}
                  onPress={() => {
                    handleAddService(service);
                    setShowServicesModal(false);
                  }}
                >
                  <View style={styles.serviceOptionIcon}>
                    <Ionicons name="construct" size={24} color="#4682B4" />
                  </View>
                  <View style={styles.serviceOptionContent}>
                    <Text style={styles.serviceOptionName}>{service.name}</Text>
                    <Text style={styles.serviceOptionType}>{service.service_type}</Text>
                  </View>
                  <Ionicons name="add-circle" size={28} color="#10b981" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4682B4',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f1f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 20,
    position: 'relative',
    zIndex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  required: {
    color: '#ef4444',
  },
  useLastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e8f1f8',
    borderRadius: 6,
  },
  useLastText: {
    fontSize: 12,
    color: '#4682B4',
    fontWeight: '500',
  },
  helpText: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  textArea: {
    minHeight: 100,
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '48%',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  typeCardSelected: {
    borderColor: '#4682B4',
    backgroundColor: '#f0f7ff',
  },
  typeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e8f1f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIconContainerSelected: {
    backgroundColor: '#4682B4',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: '#4682B4',
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
    fontSize: 13,
    color: '#4682B4',
    fontWeight: '600',
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateField: {
    flex: 1,
  },
  addressFieldsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  addressFieldThird: {
    flex: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyServices: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyServicesText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyServicesButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyServicesButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  serviceCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  serviceBody: {
    padding: 16,
  },
  serviceField: {
    marginBottom: 16,
  },
  serviceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  unitTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  unitButtonSelected: {
    backgroundColor: '#4682B4',
    borderColor: '#4682B4',
  },
  unitButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  unitButtonTextSelected: {
    color: '#ffffff',
  },
  serviceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceFieldHalf: {
    flex: 1,
  },
  serviceInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4682B4',
    padding: 18,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#4682B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  serviceModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  serviceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  serviceModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  serviceOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f1f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceOptionContent: {
    flex: 1,
  },
  serviceOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  serviceOptionType: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  toggleField: {
    marginBottom: 20,
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f1f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  toggleSubtext: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d1d5db',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#10b981',
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  toggleContent: {
    marginTop: 12,
    marginLeft: 52,
  },
  customFieldsSection: {
    marginTop: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  customFieldsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customFieldsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  addCustomFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  addCustomFieldText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  customFieldsList: {
    gap: 12,
  },
  customFieldItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  customFieldInputs: {
    flex: 1,
    gap: 8,
  },
  customFieldName: {
    flex: 1,
  },
  customFieldValue: {
    flex: 1,
  },
  removeFieldButton: {
    padding: 4,
    marginTop: 8,
  },
});
