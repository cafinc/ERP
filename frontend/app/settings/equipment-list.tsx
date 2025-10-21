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
  Image,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../utils/api';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import { Equipment } from '../../types';
import { Colors } from '../../utils/theme';
import EquipmentAvatarPicker, { EQUIPMENT_AVATAR_OPTIONS } from '../../components/EquipmentAvatarPicker';
import WebAdminLayout from '../../components/WebAdminLayout';

export default function EquipmentListScreen() {
  const router = useRouter();
  const { equipment, setEquipment } = useStore();
  const { isAdmin, isCrew, currentUser } = useAuth();
  const isWeb = Platform.OS === 'web';
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [assignedEquipmentIds, setAssignedEquipmentIds] = useState<string[]>([]);
  
  const [name, setName] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [licenseRequired, setLicenseRequired] = useState(false);
  const [notes, setNotes] = useState('');
  const [avatar, setAvatar] = useState('dump_truck');
  const [photo, setPhoto] = useState('');

  const equipmentTypes = [
    { value: 'plow_truck', label: 'Plow Truck', needsPlate: true },
    { value: 'truck', label: 'Truck', needsPlate: true },
    { value: 'loader', label: 'Loader', needsPlate: false },
    { value: 'skid_steer', label: 'Skid Steer', needsPlate: false },
    { value: 'sanding_truck', label: 'Sanding Truck', needsPlate: true },
    { value: 'brine_truck', label: 'Brine Truck', needsPlate: true },
    { value: 'cab_sweeper', label: 'Cab Sweeper', needsPlate: false },
    { value: 'single_stage_thrower', label: 'Single Stage Thrower', needsPlate: false },
    { value: 'gravely_sweeper', label: 'Gravely Sweeper', needsPlate: false },
  ];
  
  const selectedTypeNeedsPlate = equipmentTypes.find(t => t.value === equipmentType)?.needsPlate || false;

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await api.get('/equipment');
      let equipmentList = response.data;

      // If crew member, fetch their dispatches and filter equipment
      if (isCrew && currentUser?.id) {
        const dispatchesResponse = await api.get(`/dispatches?crew_id=${currentUser.id}`);
        const myDispatches = dispatchesResponse.data;
        
        // Collect all equipment IDs from their dispatches
        const equipmentIds = new Set<string>();
        myDispatches.forEach((dispatch: any) => {
          dispatch.equipment_ids.forEach((id: string) => equipmentIds.add(id));
        });
        
        setAssignedEquipmentIds(Array.from(equipmentIds));
        
        // Filter to only show assigned equipment
        equipmentList = equipmentList.filter((eq: Equipment) => 
          equipmentIds.has(eq.id!)
        );
      }

      setEquipment(equipmentList);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      Alert.alert('Error', 'Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEquipmentType('');
    setUnitNumber('');
    setLicensePlate('');
    setLicenseRequired(false);
    setNotes('');
    setAvatar('dump_truck');
    setPhoto('');
    setEditingItem(null);
  };
  
  const getCurrentAvatarDisplay = () => {
    if (photo) return null; // Will show photo
    const avatarOption = EQUIPMENT_AVATAR_OPTIONS.find(a => a.id === avatar);
    if (avatarOption?.type === 'image') {
      return { type: 'image', url: avatarOption.imageUrl };
    }
    return { type: 'emoji', emoji: avatarOption?.emoji || '🚛' };
  };

  const handleSave = async () => {
    if (!name.trim() || !equipmentType) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const equipmentData = {
        name,
        equipment_type: equipmentType,
        unit_number: unitNumber || undefined,
        license_plate: licensePlate || undefined,
        license_required: licenseRequired,
        notes: notes || undefined,
        avatar,
        photo: photo || undefined,
      };

      if (editingItem) {
        const response = await api.put(`/equipment/${editingItem.id}`, equipmentData);
        setEquipment(equipment.map(e => e.id === editingItem.id ? response.data : e));
        Alert.alert('Success', 'Equipment updated');
      } else {
        const response = await api.post('/equipment', equipmentData);
        setEquipment([response.data, ...equipment]);
        Alert.alert('Success', 'Equipment added');
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving equipment:', error);
      Alert.alert('Error', 'Failed to save equipment');
    }
  };

  const handleEdit = (item: Equipment) => {
    setEditingItem(item);
    setName(item.name);
    setEquipmentType(item.equipment_type);
    setUnitNumber(item.unit_number || '');
    setLicensePlate(item.license_plate || '');
    setLicenseRequired(item.license_required || false);
    setNotes(item.notes || '');
    setAvatar(item.avatar || 'dump_truck');
    setPhoto(item.photo || '');
    setShowModal(true);
  };

  const handleDelete = async (equipmentId: string) => {
    Alert.alert(
      'Delete Equipment',
      'Are you sure you want to delete this equipment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/equipment/${equipmentId}`);
              setEquipment(equipment.filter(e => e.id !== equipmentId));
              Alert.alert('Success', 'Equipment deleted');
            } catch (error) {
              console.error('Error deleting equipment:', error);
              Alert.alert('Error', 'Failed to delete equipment');
            }
          },
        },
      ]
    );
  };

  const handleArchive = async (item: Equipment) => {
    const isArchiving = item.active;
    Alert.alert(
      isArchiving ? 'Archive Equipment' : 'Unarchive Equipment',
      isArchiving 
        ? 'Are you sure you want to archive this equipment? It will be hidden from active lists but can be restored later.'
        : 'Are you sure you want to restore this equipment to active status?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isArchiving ? 'Archive' : 'Restore',
          style: isArchiving ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const response = await api.put(`/equipment/${item.id}`, { active: !isArchiving });
              setEquipment(equipment.map(e => e.id === item.id ? response.data : e));
              Alert.alert('Success', isArchiving ? 'Equipment archived' : 'Equipment restored');
            } catch (error) {
              console.error('Error archiving equipment:', error);
              Alert.alert('Error', 'Failed to update equipment');
            }
          },
        },
      ]
    );
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
      {/* Header - Simple, always visible */}
      <View style={styles.header}>
        {!(isWeb && isAdmin) && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>🚜 Equipment</Text>
        {isAdmin && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Ionicons name="add-circle" size={28} color={Colors.primary} />
          </TouchableOpacity>
        )}
        {!isAdmin && <View style={styles.addButton} />}
      </View>

      {/* Filter Toggle */}
      {isAdmin && (
        <View style={styles.filterSection}>
          <TouchableOpacity
            style={[styles.filterButton, showArchived && styles.filterButtonActive]}
            onPress={() => setShowArchived(!showArchived)}
          >
            <Ionicons 
              name={showArchived ? "archive" : "archive-outline"} 
              size={18} 
              color={showArchived ? Colors.white : Colors.textSecondary} 
            />
            <Text style={[styles.filterButtonText, showArchived && styles.filterButtonTextActive]}>
              {showArchived ? 'Archived' : 'Active'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.filterCount}>
            {equipment.filter(e => showArchived ? !e.active : e.active).length} items
          </Text>
        </View>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {equipment.filter(e => showArchived ? !e.active : e.active).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🚜</Text>
            <Text style={styles.emptyStateText}>
              {isCrew ? 'No equipment assigned' : 'No equipment yet'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {isCrew 
                ? 'Equipment will appear here when you are assigned to a dispatch' 
                : 'Add equipment to get started'}
            </Text>
            {isAdmin && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowModal(true)}
              >
                <Text style={styles.emptyButtonText}>Add First Equipment</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          equipment.filter(e => showArchived ? !e.active : e.active).map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <TouchableOpacity 
                style={styles.cardHeader}
                onPress={() => router.push(`/equipment/${item.id}`)}
              >
                <View style={[styles.icon, { backgroundColor: '#fef3c7' }]}>
                  {(() => {
                    const avatarOption = EQUIPMENT_AVATAR_OPTIONS.find(a => a.id === item.avatar);
                    if (item.photo) {
                      return <Image source={{ uri: item.photo }} style={styles.iconImage} />;
                    } else if (avatarOption?.type === 'image') {
                      return <Image source={{ uri: avatarOption.imageUrl }} style={styles.iconImage} />;
                    } else {
                      return <Text style={styles.iconEmoji}>{avatarOption?.emoji || '🚛'}</Text>;
                    }
                  })()}
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{item.equipment_type.replace('_', ' ')}</Text>
                  </View>
                  {item.vehicle_number && (
                    <View style={styles.infoRow}>
                      <Ionicons name="car" size={14} color={Colors.textSecondary} />
                      <Text style={styles.infoText}>#{item.vehicle_number}</Text>
                    </View>
                  )}
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="ellipse"
                      size={8}
                      color={item.status === 'available' ? '#10b981' : '#f59e0b'}
                    />
                    <Text style={styles.infoText}>{item.status}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
              {isAdmin && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.historyButton]}
                    onPress={() => router.push(`/equipment/history?equipmentId=${item.id}`)}
                  >
                    <Ionicons name="time" size={16} color="#8b5cf6" />
                    <Text style={[styles.actionButtonText, { color: '#8b5cf6' }]}>History</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEdit(item)}
                  >
                    <Ionicons name="pencil" size={16} color={Colors.primary} />
                    <Text style={[styles.actionButtonText, { color: Colors.primary }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, item.active ? styles.deleteButton : styles.restoreButton]}
                    onPress={() => item.active ? handleArchive(item) : handleDelete(item.id!)}
                  >
                    <Ionicons 
                      name={item.active ? "archive-outline" : "trash-outline"} 
                      size={16} 
                      color={item.active ? '#ef4444' : '#10b981'} 
                    />
                    <Text style={[styles.actionButtonText, { color: item.active ? '#ef4444' : '#10b981' }]}>
                      {item.active ? 'Archive' : 'Delete'}
                    </Text>
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
              {editingItem ? 'Edit Equipment' : 'Add Equipment'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <View style={styles.formSection}>
              <Text style={styles.label}>Equipment Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Truck #1"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Type *</Text>
              <View style={styles.chipContainer}>
                {equipmentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.chip,
                      equipmentType === type.value && styles.chipSelected,
                    ]}
                    onPress={() => setEquipmentType(type.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        equipmentType === type.value && styles.chipTextSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Unit #</Text>
              <TextInput
                style={styles.input}
                value={unitNumber}
                onChangeText={setUnitNumber}
                placeholder="123"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            {selectedTypeNeedsPlate && (
              <View style={styles.formSection}>
                <Text style={styles.label}>License Plate</Text>
                <TextInput
                  style={styles.input}
                  value={licensePlate}
                  onChangeText={setLicensePlate}
                  placeholder="ABC-1234"
                  placeholderTextColor={Colors.textTertiary}
                  autoCapitalize="characters"
                />
              </View>
            )}

            <View style={styles.formSection}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Text style={styles.label}>License Required to Operate</Text>
                  <Text style={styles.helperText}>
                    Only crew members with uploaded driver's license can be assigned
                  </Text>
                </View>
                <Switch
                  value={licenseRequired}
                  onValueChange={setLicenseRequired}
                  trackColor={{ false: Colors.gray300, true: Colors.primary }}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Equipment Picture</Text>
              <TouchableOpacity 
                style={styles.avatarSection}
                onPress={() => setShowAvatarPicker(true)}
              >
                <View style={styles.avatarPreview}>
                  {photo ? (
                    <Image source={{ uri: photo }} style={styles.avatarImage} />
                  ) : getCurrentAvatarDisplay()?.type === 'image' ? (
                    <Image source={{ uri: getCurrentAvatarDisplay()!.url! }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarEmoji}>{getCurrentAvatarDisplay()?.emoji}</Text>
                  )}
                </View>
                <View style={styles.avatarTextContainer}>
                  <Text style={styles.avatarLabel}>Tap to change picture</Text>
                  <Text style={styles.avatarHint}>Choose from avatars or upload custom photo</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
              </TouchableOpacity>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Additional notes"
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <EquipmentAvatarPicker
        visible={showAvatarPicker}
        currentAvatar={avatar}
        currentPhoto={photo}
        onClose={() => setShowAvatarPicker(false)}
        onSelectAvatar={(avatarId) => setAvatar(avatarId)}
        onSelectPhoto={(photoUri) => setPhoto(photoUri)}
      />
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
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
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
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  iconImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  iconEmoji: {
    fontSize: 28,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
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
  historyButton: {
    borderColor: '#8b5cf6',
    backgroundColor: '#f3e8ff',
  },
  deleteButton: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  archiveButton: {
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
  },
  restoreButton: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
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
    minHeight: 100,
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
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    gap: 12,
  },
  avatarPreview: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  avatarTextContainer: {
    flex: 1,
  },
  avatarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  avatarHint: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  filterCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  archiveButton: {
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
  },
  restoreButton: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
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
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
