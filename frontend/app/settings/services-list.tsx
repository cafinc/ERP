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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';

interface ServiceItem {
  id?: string;
  name: string;
  service_type: string;
  description?: string;
  pricing?: { [key: string]: any };  // Can be number or object with equipment_rates
  active: boolean;
}

interface EquipmentType {
  value: string;
  label: string;
}

export default function ServicesListScreen() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  
  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [pricing, setPricing] = useState<{ [key: string]: string }>({});
  
  // Equipment pricing states
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [hourlyEquipmentRates, setHourlyEquipmentRates] = useState<{ [key: string]: string }>({});
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [selectedEquipmentType, setSelectedEquipmentType] = useState('');
  const [equipmentPrice, setEquipmentPrice] = useState('');
  
  // View mode state
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingItem, setViewingItem] = useState<ServiceItem | null>(null);
  
  // Consumable states
  const [consumables, setConsumables] = useState<any[]>([]);
  const [selectedConsumableId, setSelectedConsumableId] = useState('');
  
  // Per-yard consumable pricing states
  const [perYardConsumableRates, setPerYardConsumableRates] = useState<{ [key: string]: string }>({});
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [selectedMaterialType, setSelectedMaterialType] = useState('');
  const [materialPrice, setMaterialPrice] = useState('');

  const serviceTypes = [
    { value: 'site_checks', label: 'Site Checks' },
    { value: 'sidewalk_clear', label: 'Sidewalk Clear' },
    { value: 'second_sidewalk_clear', label: '2nd Sidewalk Clear' },
    { value: 'call_back', label: 'Call Back' },
    { value: 'plowing', label: 'Plowing' },
    { value: 'sanding', label: 'Sanding' },
    { value: 'brining', label: 'Brining' },
    { value: 'hauling', label: 'Hauling' },
  ];
  
  // Dynamic pricing options based on service type
  const pricingUnitOptions = serviceType === 'sanding' 
    ? [
        { value: 'per_yard', label: 'Per Yard' },
        { value: 'per_occurrence', label: 'Per Occurrence' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'no_charge', label: 'No Charge', isNoCharge: true },
      ]
    : [
        { value: 'hourly', label: 'Hourly' },
        { value: 'per_occurrence', label: 'Per Occurrence' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'no_charge', label: 'No Charge', isNoCharge: true },
      ];

  useEffect(() => {
    fetchServices();
    fetchEquipmentTypes();
    fetchConsumables();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipmentTypes = async () => {
    try {
      const response = await api.get('/equipment-types');
      setEquipmentTypes(response.data);
    } catch (error) {
      console.error('Error fetching equipment types:', error);
    }
  };

  const fetchConsumables = async () => {
    try {
      const response = await api.get('/consumables');
      setConsumables(response.data.filter((c: any) => c.active));
    } catch (error) {
      console.error('Error fetching consumables:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setServiceType('');
    setDescription('');
    setPricing({});
    setHourlyEquipmentRates({});
    setPerYardConsumableRates({});
    setSelectedConsumableId('');
    setEditingItem(null);
  };

  const handleSave = async () => {
    if (!name.trim() || !serviceType) {
      if (Platform.OS === 'web') {
        alert('Please fill in all required fields');
      } else {
        Alert.alert('Error', 'Please fill in all required fields');
      }
      return;
    }

    // Convert pricing strings to numbers or equipment/material-specific object
    const pricingData: { [key: string]: any } = {};
    Object.keys(pricing).forEach(key => {
      const value = parseFloat(pricing[key]);
      
      // For hourly pricing with equipment rates
      if (key === 'hourly' && Object.keys(hourlyEquipmentRates).length > 0) {
        const equipmentRatesData: { [key: string]: number } = {};
        Object.keys(hourlyEquipmentRates).forEach(eqType => {
          const eqValue = parseFloat(hourlyEquipmentRates[eqType]);
          if (!isNaN(eqValue) && eqValue >= 0) {
            equipmentRatesData[eqType] = eqValue;
          }
        });
        // Use value if valid, otherwise use 0 as default (since we're using equipment rates)
        pricingData[key] = {
          default: !isNaN(value) && value >= 0 ? value : 0,
          equipment_rates: equipmentRatesData
        };
      } 
      // For sanding services with consumable rates (per_yard, per_occurrence, monthly)
      else if ((key === 'per_yard' || key === 'per_occurrence' || key === 'monthly') && 
               serviceType === 'sanding' && 
               Object.keys(perYardConsumableRates).length > 0) {
        const consumableRatesData: { [key: string]: number } = {};
        Object.keys(perYardConsumableRates).forEach(consumableId => {
          const consumableValue = parseFloat(perYardConsumableRates[consumableId]);
          if (!isNaN(consumableValue) && consumableValue >= 0) {
            consumableRatesData[consumableId] = consumableValue;
          }
        });
        // Use value if valid, otherwise use 0 as default (since we're using consumable rates)
        pricingData[key] = {
          default: !isNaN(value) && value >= 0 ? value : 0,
          consumable_rates: consumableRatesData
        };
      } else {
        // Allow 0 for "No Charge", but skip NaN or negative values
        if (!isNaN(value) && value >= 0) {
          pricingData[key] = value;
        }
      }
    });

    try {
      const serviceData = {
        name,
        service_type: serviceType,
        description: description || undefined,
        pricing: pricingData,
        consumable_id: selectedConsumableId || undefined,
      };

      console.log('Saving service:', serviceData);

      if (editingItem) {
        const response = await api.put(`/services/${editingItem.id}`, serviceData);
        setServices(services.map(s => s.id === editingItem.id ? response.data : s));
        if (Platform.OS === 'web') {
          alert('Service updated successfully');
        } else {
          Alert.alert('Success', 'Service updated');
        }
      } else {
        const response = await api.post('/services', serviceData);
        setServices([response.data, ...services]);
        if (Platform.OS === 'web') {
          alert('Service added successfully');
        } else {
          Alert.alert('Success', 'Service added');
        }
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving service:', error);
      if (Platform.OS === 'web') {
        alert('Failed to save service: ' + (error as any).message);
      } else {
        Alert.alert('Error', 'Failed to save service');
      }
    }
  };

  const handleView = (item: ServiceItem) => {
    setViewingItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item: ServiceItem) => {
    setEditingItem(item);
    setName(item.name);
    setServiceType(item.service_type);
    setDescription(item.description || '');
    setSelectedConsumableId((item as any).consumable_id || '');
    
    // Convert pricing to strings for input fields
    const pricingStrings: { [key: string]: string } = {};
    const equipmentRatesStrings: { [key: string]: string } = {};
    const consumableRatesStrings: { [key: string]: string } = {};
    
    if (item.pricing) {
      Object.keys(item.pricing).forEach(key => {
        const value = item.pricing![key];
        // Check if this is equipment/consumable-specific pricing (object with default and rates)
        if (typeof value === 'object' && value.default !== undefined) {
          pricingStrings[key] = value.default.toString();
          // Load equipment rates (for hourly)
          if (value.equipment_rates) {
            Object.keys(value.equipment_rates).forEach(eqType => {
              equipmentRatesStrings[eqType] = value.equipment_rates[eqType].toString();
            });
          }
          // Load consumable rates (for per_yard)
          if (value.consumable_rates) {
            Object.keys(value.consumable_rates).forEach(consumableId => {
              consumableRatesStrings[consumableId] = value.consumable_rates[consumableId].toString();
            });
          }
        } else {
          // Simple number pricing
          pricingStrings[key] = value.toString();
        }
      });
    }
    setPricing(pricingStrings);
    setHourlyEquipmentRates(equipmentRatesStrings);
    setPerYardConsumableRates(consumableRatesStrings);
    setShowModal(true);
  };
  
  const updatePricing = (unit: string, value: string) => {
    setPricing({ ...pricing, [unit]: value });
  };
  
  const removePricing = (unit: string) => {
    const newPricing = { ...pricing };
    delete newPricing[unit];
    setPricing(newPricing);
    // Also clear equipment rates if removing hourly
    if (unit === 'hourly') {
      setHourlyEquipmentRates({});
    }
    // Also clear consumable rates if removing per_yard, per_occurrence, or monthly for sanding
    if (serviceType === 'sanding' && (unit === 'per_yard' || unit === 'per_occurrence' || unit === 'monthly')) {
      setPerYardConsumableRates({});
    }
  };

  const handleAddEquipmentPrice = () => {
    setSelectedEquipmentType('');
    setEquipmentPrice('');
    setShowEquipmentModal(true);
  };

  const handleSaveEquipmentPrice = () => {
    if (!selectedEquipmentType || !equipmentPrice) {
      Alert.alert('Error', 'Please select equipment type and enter price');
      return;
    }
    
    const price = parseFloat(equipmentPrice);
    if (isNaN(price) || price < 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setHourlyEquipmentRates({
      ...hourlyEquipmentRates,
      [selectedEquipmentType]: equipmentPrice
    });
    setShowEquipmentModal(false);
  };

  const removeEquipmentRate = (equipmentType: string) => {
    const newRates = { ...hourlyEquipmentRates };
    delete newRates[equipmentType];
    setHourlyEquipmentRates(newRates);
  };

  const handleAddMaterialPrice = () => {
    setSelectedMaterialType('');
    setMaterialPrice('');
    setShowMaterialModal(true);
  };

  const handleSaveMaterialPrice = () => {
    if (!selectedMaterialType || !materialPrice) {
      if (Platform.OS === 'web') {
        alert('Please select material type and enter price');
      } else {
        Alert.alert('Error', 'Please select material type and enter price');
      }
      return;
    }
    
    const price = parseFloat(materialPrice);
    if (isNaN(price) || price < 0) {
      if (Platform.OS === 'web') {
        alert('Please enter a valid price');
      } else {
        Alert.alert('Error', 'Please enter a valid price');
      }
      return;
    }

    setPerYardConsumableRates({
      ...perYardConsumableRates,
      [selectedMaterialType]: materialPrice
    });
    setShowMaterialModal(false);
  };

  const removeConsumableRate = (consumableId: string) => {
    const newRates = { ...perYardConsumableRates };
    delete newRates[consumableId];
    setPerYardConsumableRates(newRates);
  };

  const handleDelete = async (serviceId: string) => {
    // Web-compatible confirmation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this service?');
      if (!confirmed) return;
      
      try {
        await api.delete(`/services/${serviceId}`);
        setServices(services.filter(s => s.id !== serviceId));
        alert('Service deleted successfully');
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Failed to delete service');
      }
    } else {
      // Native Alert for iOS/Android
      Alert.alert(
        'Delete Service',
        'Are you sure you want to delete this service?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await api.delete(`/services/${serviceId}`);
                setServices(services.filter(s => s.id !== serviceId));
                Alert.alert('Success', 'Service deleted');
              } catch (error) {
                console.error('Error deleting service:', error);
                Alert.alert('Error', 'Failed to delete service');
              }
            },
          },
        ]
      );
    }
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>❄️ Services</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Ionicons name="add-circle" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {services.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>❄️</Text>
            <Text style={styles.emptyStateText}>No services yet</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowModal(true)}
            >
              <Text style={styles.emptyButtonText}>Add First Service</Text>
            </TouchableOpacity>
          </View>
        ) : (
          services.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.itemCard}
              onPress={() => handleView(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.icon, { backgroundColor: '#cffafe' }]}>
                  <Ionicons name="snow" size={28} color="#06b6d4" />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{item.service_type.replace('_', ' ')}</Text>
                  </View>
                  {item.description && (
                    <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                  )}
                  <View style={styles.priceRow}>
                    {item.base_price && (
                      <Text style={styles.priceText}>${item.base_price.toFixed(2)}</Text>
                    )}
                    {item.price_per_unit && (
                      <Text style={styles.priceText}>
                        ${item.price_per_unit.toFixed(2)}/{item.unit_type?.replace('_', ' ')}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEdit(item);
                  }}
                >
                  <Ionicons name="pencil" size={16} color={Colors.primary} />
                  <Text style={[styles.actionButtonText, { color: Colors.primary }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id!);
                  }}
                >
                  <Ionicons name="trash" size={16} color="#ef4444" />
                  <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
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
              {editingItem ? 'Edit Service' : 'Add Service'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <View style={styles.formSection}>
              <Text style={styles.label}>Service Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Parking Lot Plowing"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Type *</Text>
              <View style={styles.chipContainer}>
                {serviceTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.chip,
                      serviceType === type.value && styles.chipSelected,
                    ]}
                    onPress={() => setServiceType(type.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        serviceType === type.value && styles.chipTextSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Service description"
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Pricing Units & Default Prices</Text>
              <Text style={styles.helperText}>Add pricing for each billing method</Text>
              
              {pricingUnitOptions.map((option) => {
                const hasPrice = option.value in pricing;
                const isNoCharge = (option as any).isNoCharge;
                const isHourly = option.value === 'hourly';
                const isPerYard = option.value === 'per_yard';
                const isPerOccurrence = option.value === 'per_occurrence';
                const isMonthly = option.value === 'monthly';
                
                // For sanding services, allow material pricing on per_yard, per_occurrence, and monthly
                const allowMaterialPricing = serviceType === 'sanding' && (isPerYard || isPerOccurrence || isMonthly);
                const hasMaterialRates = allowMaterialPricing && Object.keys(perYardConsumableRates).length > 0;
                
                return (
                  <View key={option.value}>
                    <View style={styles.pricingRow}>
                      <TouchableOpacity
                        style={[styles.pricingCheckbox, hasPrice && styles.pricingCheckboxActive]}
                        onPress={() => {
                          if (hasPrice) {
                            removePricing(option.value);
                          } else {
                            // For "No Charge", automatically set to '0'
                            updatePricing(option.value, isNoCharge ? '0' : '');
                          }
                        }}
                      >
                        {hasPrice && <Ionicons name="checkmark" size={16} color={Colors.white} />}
                      </TouchableOpacity>
                      <Text style={styles.pricingLabel}>{option.label}</Text>
                      {hasPrice && (
                        <TextInput
                          style={[
                            styles.pricingInput, 
                            (isNoCharge || 
                             (isHourly && Object.keys(hourlyEquipmentRates).length > 0) ||
                             hasMaterialRates) && styles.pricingInputDisabled
                          ]}
                          value={pricing[option.value] || ''}
                          onChangeText={(value) => updatePricing(option.value, value)}
                          placeholder={
                            (isHourly && Object.keys(hourlyEquipmentRates).length > 0) ? 'Using equipment rates' :
                            hasMaterialRates ? 'Using material rates' :
                            '0.00'
                          }
                          placeholderTextColor={Colors.textTertiary}
                          keyboardType="numeric"
                          editable={!isNoCharge && 
                                   !(isHourly && Object.keys(hourlyEquipmentRates).length > 0) &&
                                   !hasMaterialRates}
                        />
                      )}
                      {isHourly && hasPrice && (
                        <TouchableOpacity
                          style={styles.addEquipmentButton}
                          onPress={handleAddEquipmentPrice}
                        >
                          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                          <Text style={styles.addEquipmentText}>Equipment</Text>
                        </TouchableOpacity>
                      )}
                      {allowMaterialPricing && hasPrice && (
                        <TouchableOpacity
                          style={styles.addEquipmentButton}
                          onPress={handleAddMaterialPrice}
                        >
                          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                          <Text style={styles.addEquipmentText}>Material</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {/* Display equipment-specific prices for hourly */}
                    {isHourly && hasPrice && Object.keys(hourlyEquipmentRates).length > 0 && (
                      <View style={styles.equipmentRatesContainer}>
                        {Object.keys(hourlyEquipmentRates).map((eqType) => {
                          const equipmentLabel = equipmentTypes.find(et => et.value === eqType)?.label || eqType;
                          return (
                            <View key={eqType} style={styles.equipmentRateRow}>
                              <Text style={styles.equipmentRateLabel}>{equipmentLabel}</Text>
                              <Text style={styles.equipmentRatePrice}>${hourlyEquipmentRates[eqType]}/hr</Text>
                              <TouchableOpacity
                                onPress={() => removeEquipmentRate(eqType)}
                                style={styles.removeEquipmentButton}
                              >
                                <Ionicons name="close-circle" size={20} color="#ef4444" />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    )}
                    
                    {/* Display material-specific prices for sanding services */}
                    {allowMaterialPricing && hasPrice && Object.keys(perYardConsumableRates).length > 0 && (
                      <View style={styles.equipmentRatesContainer}>
                        {Object.keys(perYardConsumableRates).map((consumableId) => {
                          const consumable = consumables.find(c => c.id === consumableId);
                          const consumableLabel = consumable ? `${consumable.name} (${consumable.consumable_type})` : consumableId;
                          const unitLabel = isPerYard ? '/yard' : isPerOccurrence ? '/occurrence' : '/month';
                          return (
                            <View key={consumableId} style={styles.equipmentRateRow}>
                              <Text style={styles.equipmentRateLabel}>{consumableLabel}</Text>
                              <Text style={styles.equipmentRatePrice}>${perYardConsumableRates[consumableId]}{unitLabel}</Text>
                              <TouchableOpacity
                                onPress={() => removeConsumableRate(consumableId)}
                                style={styles.removeEquipmentButton}
                              >
                                <Ionicons name="close-circle" size={20} color="#ef4444" />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Equipment Pricing Modal */}
      <Modal
        visible={showEquipmentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent
        onRequestClose={() => setShowEquipmentModal(false)}
      >
        <View style={styles.equipmentModalOverlay}>
          <View style={styles.equipmentModalContent}>
            <View style={styles.equipmentModalHeader}>
              <Text style={styles.equipmentModalTitle}>Add Equipment Price</Text>
              <TouchableOpacity onPress={() => setShowEquipmentModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.equipmentModalBody}>
              <Text style={styles.label}>Equipment Type *</Text>
              <View style={styles.chipContainer}>
                {equipmentTypes
                  .filter(et => !(et.value in hourlyEquipmentRates))
                  .map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.chip,
                        selectedEquipmentType === type.value && styles.chipSelected,
                      ]}
                      onPress={() => setSelectedEquipmentType(type.value)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedEquipmentType === type.value && styles.chipTextSelected,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>

              <Text style={[styles.label, { marginTop: 24 }]}>Hourly Rate *</Text>
              <TextInput
                style={styles.input}
                value={equipmentPrice}
                onChangeText={setEquipmentPrice}
                placeholder="0.00"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={styles.equipmentModalButton}
                onPress={handleSaveEquipmentPrice}
              >
                <Text style={styles.equipmentModalButtonText}>Add Price</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Material Pricing Modal */}
      <Modal
        visible={showMaterialModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent
        onRequestClose={() => setShowMaterialModal(false)}
      >
        <View style={styles.equipmentModalOverlay}>
          <View style={styles.equipmentModalContent}>
            <View style={styles.equipmentModalHeader}>
              <Text style={styles.equipmentModalTitle}>Add Material Price</Text>
              <TouchableOpacity onPress={() => setShowMaterialModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.equipmentModalBody}>
              <Text style={styles.label}>Material Type *</Text>
              <View style={styles.chipContainer}>
                {consumables
                  .filter(c => !(c.id in perYardConsumableRates))
                  .map((consumable) => (
                    <TouchableOpacity
                      key={consumable.id}
                      style={[
                        styles.chip,
                        selectedMaterialType === consumable.id && styles.chipSelected,
                      ]}
                      onPress={() => setSelectedMaterialType(consumable.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedMaterialType === consumable.id && styles.chipTextSelected,
                        ]}
                      >
                        {consumable.name} ({consumable.consumable_type})
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>

              <Text style={[styles.label, { marginTop: 24 }]}>Price *</Text>
              <TextInput
                style={styles.input}
                value={materialPrice}
                onChangeText={setMaterialPrice}
                placeholder="0.00"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={styles.equipmentModalButton}
                onPress={handleSaveMaterialPrice}
              >
                <Text style={styles.equipmentModalButtonText}>Add Price</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* View-Only Modal */}
      <Modal
        visible={showViewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowViewModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowViewModal(false)}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Service Details</Text>
            <TouchableOpacity onPress={() => {
              setShowViewModal(false);
              if (viewingItem) {
                handleEdit(viewingItem);
              }
            }}>
              <Text style={styles.saveText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            {viewingItem && (
              <>
                <View style={styles.viewSection}>
                  <Text style={styles.viewLabel}>Service Name</Text>
                  <Text style={styles.viewValue}>{viewingItem.name}</Text>
                </View>

                <View style={styles.viewSection}>
                  <Text style={styles.viewLabel}>Type</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {viewingItem.service_type.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                {viewingItem.description && (
                  <View style={styles.viewSection}>
                    <Text style={styles.viewLabel}>Description</Text>
                    <Text style={styles.viewValue}>{viewingItem.description}</Text>
                  </View>
                )}

                <View style={styles.viewSection}>
                  <Text style={styles.viewLabel}>Pricing</Text>
                  {viewingItem.pricing && Object.keys(viewingItem.pricing).length > 0 ? (
                    <View style={styles.pricingViewContainer}>
                      {Object.keys(viewingItem.pricing).map(unit => {
                        const value = viewingItem.pricing![unit];
                        const unitLabel = pricingUnitOptions.find(u => u.value === unit)?.label || unit;
                        
                        // Check if it's equipment-specific pricing
                        if (typeof value === 'object' && value.default !== undefined) {
                          return (
                            <View key={unit} style={styles.pricingViewItem}>
                              <Text style={styles.pricingViewUnit}>{unitLabel}</Text>
                              <Text style={styles.pricingViewPrice}>Default: ${value.default}/hr</Text>
                              {value.equipment_rates && Object.keys(value.equipment_rates).length > 0 && (
                                <View style={styles.equipmentRatesViewContainer}>
                                  {Object.keys(value.equipment_rates).map(eqType => {
                                    const eqLabel = equipmentTypes.find(et => et.value === eqType)?.label || eqType;
                                    return (
                                      <Text key={eqType} style={styles.equipmentRateViewText}>
                                        • {eqLabel}: ${value.equipment_rates[eqType]}/hr
                                      </Text>
                                    );
                                  })}
                                </View>
                              )}
                            </View>
                          );
                        } else {
                          return (
                            <View key={unit} style={styles.pricingViewItem}>
                              <Text style={styles.pricingViewUnit}>{unitLabel}</Text>
                              <Text style={styles.pricingViewPrice}>
                                ${typeof value === 'number' ? value.toFixed(2) : value}
                              </Text>
                            </View>
                          );
                        }
                      })}
                    </View>
                  ) : (
                    <Text style={styles.viewValue}>No pricing set</Text>
                  )}
                </View>
              </>
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    marginLeft: 12,
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
  emptyIcon: {
    fontSize: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
    gap: 6,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#cffafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#155e75',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
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
    borderColor: Colors.primary,
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
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  saveText: {
    fontSize: 16,
    color: Colors.primary,
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
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
    borderColor: Colors.borderDark,
    backgroundColor: Colors.white,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  chipTextSelected: {
    color: Colors.white,
  },
  checkboxContainer: {
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  pricingCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricingCheckboxActive: {
    backgroundColor: Colors.primary,
  },
  pricingLabel: {
    fontSize: 16,
    color: Colors.text,
    width: 140,
  },
  pricingInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
  },
  pricingInputDisabled: {
    backgroundColor: Colors.gray100,
    color: Colors.gray500,
  },
  helperText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  addEquipmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  addEquipmentText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  equipmentRatesContainer: {
    marginLeft: 36,
    marginTop: 8,
    backgroundColor: Colors.gray50,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  equipmentRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  equipmentRateLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  equipmentRatePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 8,
  },
  removeEquipmentButton: {
    padding: 4,
  },
  equipmentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  equipmentModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  equipmentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  equipmentModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  equipmentModalBody: {
    padding: 20,
  },
  equipmentModalButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  equipmentModalButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  viewSection: {
    marginBottom: 24,
  },
  viewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  pricingViewContainer: {
    gap: 16,
  },
  pricingViewItem: {
    backgroundColor: Colors.gray50,
    padding: 16,
    borderRadius: 8,
    gap: 4,
  },
  pricingViewUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  pricingViewPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  equipmentRatesViewContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 4,
  },
  equipmentRateViewText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
});
