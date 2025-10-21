import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';

interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  form_type: string;
  equipment_type?: string;
  fields: any[];
  active: boolean;
}

export default function EquipmentFormsScreen() {
  const router = useRouter();
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const equipmentTypes = [
    { value: 'plow_truck', label: 'Plow Truck', icon: '🚛' },
    { value: 'truck', label: 'Truck', icon: '🚚' },
    { value: 'loader', label: 'Loader', icon: '🏗️' },
    { value: 'skid_steer', label: 'Skid Steer', icon: '🚜' },
    { value: 'sanding_truck', label: 'Sanding Truck', icon: '🚛' },
    { value: 'brine_truck', label: 'Brine Truck', icon: '🚚' },
    { value: 'cab_sweeper', label: 'Cab Sweeper', icon: '🧹' },
    { value: 'single_stage_thrower', label: 'Single Stage Thrower', icon: '❄️' },
    { value: 'gravely_sweeper', label: 'Gravely Sweeper', icon: '🧹' },
  ];

  useEffect(() => {
    fetchEquipmentForms();
  }, []);

  const fetchEquipmentForms = async () => {
    try {
      const response = await api.get('/form-templates');
      // Filter for equipment forms only
      const equipmentForms = response.data.filter((f: FormTemplate) => f.form_type === 'equipment');
      setForms(equipmentForms);
    } catch (error) {
      console.error('Error fetching equipment forms:', error);
      if (Platform.OS === 'web') {
        alert('Failed to load equipment forms');
      }
    } finally {
      setLoading(false);
    }
  };

  const getEquipmentTypeLabel = (type?: string) => {
    if (!type) return 'All Equipment';
    const found = equipmentTypes.find(t => t.value === type);
    return found ? `${found.icon} ${found.label}` : type.replace('_', ' ');
  };

  const handleCreateForm = (equipmentType: string) => {
    router.push(`/forms/form-builder?equipment_type=${equipmentType}`);
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
        <Text style={styles.headerTitle}>Equipment Forms</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Inspection & Maintenance Checklists</Text>
        <Text style={styles.subtitle}>Create forms for equipment inspections, maintenance, and safety checks</Text>

        {/* Equipment Types Grid */}
        <View style={styles.grid}>
          {equipmentTypes.map((type) => {
            const formsForType = forms.filter(f => f.equipment_type === type.value);
            return (
              <TouchableOpacity
                key={type.value}
                style={styles.equipmentCard}
                onPress={() => handleCreateForm(type.value)}
              >
                <Text style={styles.equipmentIcon}>{type.icon}</Text>
                <Text style={styles.equipmentLabel}>{type.label}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{formsForType.length} forms</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Existing Equipment Forms */}
        {forms.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Your Equipment Forms</Text>
            {forms.map((form) => (
              <TouchableOpacity
                key={form.id}
                style={styles.formCard}
                onPress={() => router.push(`/forms/form-builder?template_id=${form.id}`)}
              >
                <View style={styles.formInfo}>
                  <Text style={styles.formName}>{form.name}</Text>
                  {form.description && (
                    <Text style={styles.formDescription}>{form.description}</Text>
                  )}
                  <Text style={styles.formType}>{getEquipmentTypeLabel(form.equipment_type)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {forms.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={64} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>No Equipment Forms Yet</Text>
            <Text style={styles.emptyText}>
              Create inspection and maintenance checklists for your equipment
            </Text>
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  equipmentCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  equipmentIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  equipmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formInfo: {
    flex: 1,
    marginRight: 12,
  },
  formName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  formDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  formType: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
});
