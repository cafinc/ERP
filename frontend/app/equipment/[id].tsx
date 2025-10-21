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
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import { Equipment, FormTemplate } from '../../types';
import AttachedForms from '../../components/AttachedForms';

export default function EquipmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);

  useEffect(() => {
    fetchEquipmentDetails();
  }, [id]);

  const fetchEquipmentDetails = async () => {
    try {
      const [equipmentRes, templatesRes] = await Promise.all([
        api.get(`/equipment/${id}`),
        api.get('/form-templates?form_type=safety_check'),
      ]);
      
      setEquipment(equipmentRes.data);
      setFormTemplates(templatesRes.data);
    } catch (error) {
      console.error('Error fetching equipment details:', error);
      Alert.alert('Error', 'Failed to load equipment details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddForm = () => {
    if (formTemplates.length === 0) {
      Alert.alert('No Forms Available', 'No equipment safety check forms have been created yet.');
      return;
    }

    const templateOptions = formTemplates.map(t => ({ 
      text: t.name, 
      onPress: () => navigateToForm(t.id!) 
    }));
    templateOptions.push({ text: 'Cancel', onPress: () => {}, style: 'cancel' } as any);

    Alert.alert('Select Safety Check Form', 'Choose an equipment safety check form', templateOptions as any);
  };

  const navigateToForm = (templateId: string) => {
    router.push({
      pathname: '/forms/fill-form',
      params: { 
        templateId, 
        equipmentId: id,
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return Colors.success;
      case 'in_use': return Colors.warning;
      case 'maintenance': return Colors.error;
      default: return Colors.gray500;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!equipment) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Equipment Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Equipment Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="construct" size={24} color={Colors.primary} />
            <Text style={styles.cardTitle}>{equipment.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(equipment.status) }]}>
              <Text style={styles.statusText}>{equipment.status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Type:</Text>
            <Text style={styles.value}>{equipment.equipment_type.replace('_', ' ')}</Text>
          </View>

          {equipment.vehicle_number && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Vehicle #:</Text>
              <Text style={styles.value}>{equipment.vehicle_number}</Text>
            </View>
          )}

          {equipment.maintenance_due && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Maintenance Due:</Text>
              <Text style={styles.value}>
                {new Date(equipment.maintenance_due).toLocaleDateString()}
              </Text>
            </View>
          )}

          {equipment.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Notes:</Text>
              <Text style={styles.value}>{equipment.notes}</Text>
            </View>
          )}
        </View>

        {/* Safety Check Forms */}
        <AttachedForms
          entityType="equipment"
          entityId={equipment.id!}
          entityName={equipment.name}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    width: 120,
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
});