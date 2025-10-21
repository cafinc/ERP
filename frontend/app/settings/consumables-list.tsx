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
import { useStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import { Consumable } from '../../types';
import { Colors } from '../../utils/theme';
import WebAdminLayout from '../../components/WebAdminLayout';

export default function ConsumablesListScreen() {
  const router = useRouter();
  const { consumables, setConsumables } = useStore();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const isWeb = Platform.OS === 'web';
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Consumable | null>(null);
  
  const [name, setName] = useState('');
  const [consumableType, setConsumableType] = useState('');
  const [unit, setUnit] = useState('');
  const [quantityAvailable, setQuantityAvailable] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [perYard, setPerYard] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchConsumables();
  }, []);

  const fetchConsumables = async () => {
    try {
      const response = await api.get('/consumables');
      setConsumables(response.data);
    } catch (error) {
      console.error('Error fetching consumables:', error);
      Alert.alert('Error', 'Failed to load consumables');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setConsumableType('');
    setUnit('');
    setQuantityAvailable('');
    setReorderLevel('');
    setCostPerUnit('');
    setPerYard('');
    setNotes('');
    setEditingItem(null);
  };

  const handleSave = async () => {
    if (!name.trim() || !consumableType.trim() || !unit.trim() || !quantityAvailable || !reorderLevel || !costPerUnit) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const consumableData = {
        name: name.trim(),
        consumable_type: consumableType.trim(),
        unit: unit.trim(),
        quantity_available: parseFloat(quantityAvailable),
        reorder_level: parseFloat(reorderLevel),
        cost_per_unit: parseFloat(costPerUnit),
        per_yard: perYard ? parseFloat(perYard) : null,
        notes: notes.trim() || null,
      };

      if (editingItem) {
        const response = await api.put(`/consumables/${editingItem.id}`, consumableData);
        setConsumables(consumables.map(c => c.id === editingItem.id ? response.data : c));
        Alert.alert('Success', 'Consumable updated');
      } else {
        const response = await api.post('/consumables', consumableData);
        setConsumables([response.data, ...consumables]);
        Alert.alert('Success', 'Consumable added');
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving consumable:', error);
      Alert.alert('Error', 'Failed to save consumable');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setName(item.name);
    setConsumableType(item.consumable_type);
    setUnit(item.unit);
    setQuantityAvailable(item.quantity_available.toString());
    setReorderLevel(item.reorder_level.toString());
    setCostPerUnit(item.cost_per_unit?.toString() || '');
    setPerYard(item.per_yard?.toString() || '');
    setNotes(item.notes || '');
    setShowModal(true);
  };

  const handleDelete = async (consumableId: string) => {
    Alert.alert(
      'Delete Consumable',
      'Are you sure you want to delete this consumable?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/consumables/${consumableId}`);
              setConsumables(consumables.filter(c => c.id !== consumableId));
              Alert.alert('Success', 'Consumable deleted');
            } catch (error) {
              console.error('Error deleting consumable:', error);
              Alert.alert('Error', 'Failed to delete consumable');
            }
          },
        },
      ]
    );
  };

  const getStockIcon = (item: any) => {
    if (item.quantity_available <= 0) return { icon: 'close-circle', color: '#ef4444' };
    if (item.quantity_available <= item.reorder_level) return { icon: 'warning', color: '#f59e0b' };
    return { icon: 'checkmark-circle', color: '#10b981' };
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📦 Consumables</Text>
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
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {(!consumables || consumables.length === 0) ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyStateText}>No consumables yet</Text>
            {isAdmin && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowModal(true)}
              >
                <Text style={styles.emptyButtonText}>Add First Consumable</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          (consumables || []).map((item) => {
            const stockInfo = getStockIcon(item);
            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={stockInfo.icon as any}
                      size={32}
                      color={stockInfo.color}
                    />
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.typeText}>Type: {item.consumable_type}</Text>
                    <View style={styles.quantityRow}>
                      <Text style={styles.quantityText}>
                        {item.quantity_available} {item.unit}
                      </Text>
                      {item.quantity_available <= item.reorder_level && (
                        <View style={styles.lowStockBadge}>
                          <Text style={styles.lowStockText}>Low Stock</Text>
                        </View>
                      )}
                    </View>
                    {item.cost_per_unit && (
                      <Text style={styles.costText}>
                        ${item.cost_per_unit.toFixed(2)} per {item.unit}
                      </Text>
                    )}
                    <Text style={styles.reorderText}>
                      Reorder at: {item.reorder_level} {item.unit}
                    </Text>
                  </View>
                </View>

                {isAdmin && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleEdit(item)}
                    >
                      <Ionicons name="pencil" size={16} color={Colors.primary} />
                      <Text style={[styles.actionButtonText, { color: Colors.primary }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDelete(item.id!)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
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
              {editingItem ? 'Edit Consumable' : 'Add Consumable'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <View style={styles.formSection}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Rock Salt, Ice Melter"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Type *</Text>
              <TextInput
                style={styles.input}
                value={consumableType}
                onChangeText={setConsumableType}
                placeholder="e.g. salt, ice_melt, sand"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Unit *</Text>
              <TextInput
                style={styles.input}
                value={unit}
                onChangeText={setUnit}
                placeholder="e.g. bags, kg, liters"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Quantity Available *</Text>
              <TextInput
                style={styles.input}
                value={quantityAvailable}
                onChangeText={setQuantityAvailable}
                placeholder="0"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Reorder Level *</Text>
              <TextInput
                style={styles.input}
                value={reorderLevel}
                onChangeText={setReorderLevel}
                placeholder="Minimum quantity before reorder"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Cost per Unit *</Text>
              <TextInput
                style={styles.input}
                value={costPerUnit}
                onChangeText={setCostPerUnit}
                placeholder="0.00"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Per Yard (optional)</Text>
              <TextInput
                style={styles.input}
                value={perYard}
                onChangeText={setPerYard}
                placeholder="Amount used per yard"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Notes (optional)</Text>
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
    padding: 8,
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
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  typeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  lowStockBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lowStockText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400e',
  },
  costText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  reorderText: {
    fontSize: 13,
    color: Colors.textTertiary,
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
