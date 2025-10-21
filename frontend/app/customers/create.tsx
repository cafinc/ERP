import React, { useState } from 'react';
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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../utils/api';
import { useStore } from '../../store/useStore';
import { useSmartFill } from '../../contexts/SmartFillContext';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import FormattedTextInput from '../../components/FormattedTextInput';
import { Colors } from '../../utils/theme';

interface Contact {
  name: string;
  title: string;
  phone: string;
  email: string;
  communication_preference: string;
}

export default function CreateCustomerScreen() {
  const { customers, setCustomers } = useStore();
  const { recordUsage, getLastUsed } = useSmartFill();
  const [saving, setSaving] = useState(false);
  
  // Customer Type Selection
  const [showTypeModal, setShowTypeModal] = useState(true);
  const [customerType, setCustomerType] = useState<'residential' | 'commercial' | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingProvince, setBillingProvince] = useState('');
  const [billingPostalCode, setBillingPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [showManualCoordinates, setShowManualCoordinates] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a customer name');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Required Field', 'Please enter an email address');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Required Field', 'Please enter a phone number');
      return false;
    }
    if (!address.trim() && (!latitude || !longitude)) {
      Alert.alert('Required Field', 'Please provide an address or coordinates');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    const lat = parseFloat(latitude) || 0;
    const lng = parseFloat(longitude) || 0;

    try {
      const customerData = {
        name,
        email,
        phone,
        company_name: companyName || undefined,
        address: address || `${lat}, ${lng}`,
        city: city || undefined,
        province: province || undefined,
        postal_code: postalCode || undefined,
        latitude: lat,
        longitude: lng,
        billing_address: useSameAddress ? address : billingAddress || undefined,
        billing_city: useSameAddress ? city : billingCity || undefined,
        billing_province: useSameAddress ? province : billingProvince || undefined,
        billing_postal_code: useSameAddress ? postalCode : billingPostalCode || undefined,
        notes: notes || undefined,
        emergency_contact_name: emergencyContact || undefined,
        emergency_contact_phone: emergencyPhone || undefined,
        role: 'customer',
        password: 'defaultPassword123', // You may want to handle this differently
      };

      const response = await api.post('/customers', customerData);
      setCustomers([response.data, ...customers]);
      
      // Record usage for smart fill
      if (email) await recordUsage('contacts', email, 'customer');
      if (phone) await recordUsage('contacts', phone, 'customer');
      if (address) await recordUsage('addresses', address, 'customer');
      
      Alert.alert('Success', 'Customer created successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error creating customer:', error);
      Alert.alert('Error', 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = () => {
    setContacts([...contacts, {
      name: '',
      title: '',
      phone: '',
      email: '',
      communication_preference: 'email'
    }]);
  };

  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleContactUpdate = (index: number, field: keyof Contact, value: string) => {
    const updated = [...contacts];
    updated[index][field] = value;
    setContacts(updated);
  };

  const handleTypeSelection = (type: 'residential' | 'commercial') => {
    setCustomerType(type);
    setShowTypeModal(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Customer Type Selection Modal */}
      <Modal
        visible={showTypeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {}}
      >
        <View style={styles.typeModalOverlay}>
          <View style={styles.typeModalContent}>
            <Text style={styles.typeModalTitle}>Select Customer Type</Text>
            <Text style={styles.typeModalSubtitle}>Choose the type of customer you're adding</Text>
            
            <TouchableOpacity
              style={styles.typeOption}
              onPress={() => handleTypeSelection('residential')}
            >
              <View style={styles.typeIconContainer}>
                <Ionicons name="home" size={32} color="#4682B4" />
              </View>
              <View style={styles.typeOptionContent}>
                <Text style={styles.typeOptionTitle}>Residential Customer</Text>
                <Text style={styles.typeOptionDescription}>Individual homeowners and residents</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.typeOption}
              onPress={() => handleTypeSelection('commercial')}
            >
              <View style={styles.typeIconContainer}>
                <Ionicons name="business" size={32} color="#10b981" />
              </View>
              <View style={styles.typeOptionContent}>
                <Text style={styles.typeOptionTitle}>Commercial Customer</Text>
                <Text style={styles.typeOptionDescription}>Businesses with multiple contacts</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Create New Customer</Text>
          <Text style={styles.headerSubtitle}>Fill in the customer information below</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '33%' }]} />
          </View>
          <Text style={styles.progressText}>Step 1 of 3</Text>
        </View>

        {/* Section 1: Basic Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="person" size={24} color="#4682B4" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <Text style={styles.sectionSubtitle}>Customer identification details</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Customer Name <Text style={styles.required}>*</Text>
            </Text>
            <FormattedTextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., John Smith"
              placeholderTextColor="#9ca3af"
              formatting="capitalize-words"
              fieldName="name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Company Name</Text>
            <Text style={styles.helpText}>Optional</Text>
            <FormattedTextInput
              style={styles.input}
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="e.g., Acme Corporation"
              placeholderTextColor="#9ca3af"
              formatting="capitalize-words"
              fieldName="organization"
            />
          </View>

          <View style={styles.formRow}>
            <View style={styles.formHalf}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  Email <Text style={styles.required}>*</Text>
                </Text>
                {getLastUsed('contacts') && (
                  <TouchableOpacity 
                    onPress={() => setEmail(getLastUsed('contacts')?.value || '')}
                    style={styles.useLastButton}
                  >
                    <Ionicons name="time-outline" size={14} color="#4682B4" />
                    <Text style={styles.useLastText}>Use Last</Text>
                  </TouchableOpacity>
                )}
              </View>
              <FormattedTextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="customer@example.com"
                placeholderTextColor="#9ca3af"
                formatting="email"
                fieldName="email"
              />
            </View>

            <View style={styles.formHalf}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  Phone <Text style={styles.required}>*</Text>
                </Text>
                {getLastUsed('contacts') && (
                  <TouchableOpacity 
                    onPress={() => {
                      const lastPhone = getLastUsed('contacts')?.value;
                      if (lastPhone && lastPhone.match(/\d/)) {
                        setPhone(lastPhone);
                      }
                    }}
                    style={styles.useLastButton}
                  >
                    <Ionicons name="time-outline" size={14} color="#4682B4" />
                    <Text style={styles.useLastText}>Use Last</Text>
                  </TouchableOpacity>
                )}
              </View>
              <FormattedTextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="(555) 123-4567"
                placeholderTextColor="#9ca3af"
                formatting="phone"
                fieldName="phone"
              />
            </View>
          </View>
        </View>

        {/* Section 2: Primary Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="location" size={24} color="#4682B4" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Primary Address</Text>
              <Text style={styles.sectionSubtitle}>Service location details</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.addressHeaderRow}>
              <Text style={styles.label}>
                Street Address <Text style={styles.required}>*</Text>
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
        </View>

        {/* Section 3: Billing Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="card" size={24} color="#4682B4" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Billing Address</Text>
              <Text style={styles.sectionSubtitle}>Invoice and payment details</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setUseSameAddress(!useSameAddress)}
          >
            <View style={[styles.checkbox, useSameAddress && styles.checkboxChecked]}>
              {useSameAddress && <Ionicons name="checkmark" size={18} color="#ffffff" />}
            </View>
            <Text style={styles.checkboxLabel}>Same as primary address</Text>
          </TouchableOpacity>

          {!useSameAddress && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Billing Street Address</Text>
                <TextInput
                  style={styles.input}
                  value={billingAddress}
                  onChangeText={setBillingAddress}
                  placeholder="Enter billing address..."
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.addressFieldsRow}>
                <View style={styles.addressFieldThird}>
                  <Text style={styles.label}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={billingCity}
                    onChangeText={setBillingCity}
                    placeholder="City"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                
                <View style={styles.addressFieldThird}>
                  <Text style={styles.label}>Province</Text>
                  <TextInput
                    style={styles.input}
                    value={billingProvince}
                    onChangeText={setBillingProvince}
                    placeholder="Province"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                
                <View style={styles.addressFieldThird}>
                  <Text style={styles.label}>Postal Code</Text>
                  <TextInput
                    style={styles.input}
                    value={billingPostalCode}
                    onChangeText={setBillingPostalCode}
                    placeholder="Postal Code"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
            </>
          )}
        </View>

        {/* Section 4: Emergency Contact & Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="shield-checkmark" size={24} color="#4682B4" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Additional Information</Text>
              <Text style={styles.sectionSubtitle}>Emergency contact and notes</Text>
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formHalf}>
              <Text style={styles.label}>Emergency Contact Name</Text>
              <TextInput
                style={styles.input}
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                placeholder="Contact person name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formHalf}>
              <Text style={styles.label}>Emergency Phone</Text>
              <TextInput
                style={styles.input}
                value={emergencyPhone}
                onChangeText={setEmergencyPhone}
                placeholder="(555) 123-4567"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.helpText}>Special instructions or important information</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any relevant notes..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Section 5: Contacts (Commercial Only) */}
        {customerType === 'commercial' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="people" size={24} color="#4682B4" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Contacts</Text>
                <Text style={styles.sectionSubtitle}>Manage multiple contacts for this business</Text>
              </View>
              <TouchableOpacity
                style={styles.addContactButton}
                onPress={handleAddContact}
              >
                <Ionicons name="add" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {contacts.length === 0 ? (
              <View style={styles.emptyContacts}>
                <Ionicons name="person-add-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyContactsText}>No contacts added yet</Text>
                <TouchableOpacity
                  style={styles.emptyContactsButton}
                  onPress={handleAddContact}
                >
                  <Text style={styles.emptyContactsButtonText}>Add First Contact</Text>
                </TouchableOpacity>
              </View>
            ) : (
              contacts.map((contact, index) => (
                <View key={index} style={styles.contactCard}>
                  <View style={styles.contactCardHeader}>
                    <Text style={styles.contactCardTitle}>Contact {index + 1}</Text>
                    <TouchableOpacity onPress={() => handleRemoveContact(index)}>
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.contactCardBody}>
                    <View style={styles.formRow}>
                      <View style={styles.formHalf}>
                        <Text style={styles.label}>Contact Name</Text>
                        <TextInput
                          style={styles.input}
                          value={contact.name}
                          onChangeText={(text) => handleContactUpdate(index, 'name', text)}
                          placeholder="John Doe"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>

                      <View style={styles.formHalf}>
                        <Text style={styles.label}>Title/Position</Text>
                        <TextInput
                          style={styles.input}
                          value={contact.title}
                          onChangeText={(text) => handleContactUpdate(index, 'title', text)}
                          placeholder="Manager"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                    </View>

                    <View style={styles.formRow}>
                      <View style={styles.formHalf}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                          style={styles.input}
                          value={contact.phone}
                          onChangeText={(text) => handleContactUpdate(index, 'phone', text)}
                          placeholder="(555) 123-4567"
                          placeholderTextColor="#9ca3af"
                          keyboardType="phone-pad"
                        />
                      </View>

                      <View style={styles.formHalf}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                          style={styles.input}
                          value={contact.email}
                          onChangeText={(text) => handleContactUpdate(index, 'email', text)}
                          placeholder="contact@company.com"
                          placeholderTextColor="#9ca3af"
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Communication Preference</Text>
                      <View style={styles.preferenceRow}>
                        {['email', 'phone', 'text'].map((pref) => (
                          <TouchableOpacity
                            key={pref}
                            style={[
                              styles.preferenceButton,
                              contact.communication_preference === pref && styles.preferenceButtonSelected,
                            ]}
                            onPress={() => handleContactUpdate(index, 'communication_preference', pref)}
                          >
                            <Ionicons
                              name={pref === 'email' ? 'mail' : pref === 'phone' ? 'call' : 'chatbubble'}
                              size={16}
                              color={contact.communication_preference === pref ? '#ffffff' : '#6b7280'}
                            />
                            <Text
                              style={[
                                styles.preferenceButtonText,
                                contact.communication_preference === pref && styles.preferenceButtonTextSelected,
                              ]}
                            >
                              {pref.charAt(0).toUpperCase() + pref.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

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
              <Text style={styles.submitButtonText}>Create Customer</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  formHalf: {
    flex: 1,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4682B4',
    borderColor: '#4682B4',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
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
  typeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  typeModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  typeModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  typeModalSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  typeOptionContent: {
    flex: 1,
  },
  typeOptionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  typeOptionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  addContactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContacts: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyContactsText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyContactsButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyContactsButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  contactCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  contactCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  contactCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  contactCardBody: {
    padding: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  preferenceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    gap: 6,
  },
  preferenceButtonSelected: {
    backgroundColor: '#4682B4',
    borderColor: '#4682B4',
  },
  preferenceButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  preferenceButtonTextSelected: {
    color: '#ffffff',
  },
});
