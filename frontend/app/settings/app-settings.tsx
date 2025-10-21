import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import { useStore } from '../../store/useStore';

interface AppSettings {
  complaint_form_id?: string;
  google_review_url?: string;
}

export default function AppSettingsScreen() {
  const { formTemplates, setFormTemplates } = useStore();
  const [loading, setLoading] = useState(true);
  const [appSettings, setAppSettings] = useState<AppSettings>({});
  const [showFormSelector, setShowFormSelector] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [templatesRes] = await Promise.all([
        api.get('/form-templates'),
        // Note: We'll implement app-settings API later, for now using local state
      ]);
      setFormTemplates(templatesRes.data);

      // Load saved settings from local storage or use defaults
      setAppSettings({
        complaint_form_id: undefined,
        google_review_url: 'https://www.google.com/search?q=caf+property+services+reviews',
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load app settings');
    } finally {
      setLoading(false);
    }
  };

  const handleComplaintFormSelection = (formId: string) => {
    setAppSettings(prev => ({ ...prev, complaint_form_id: formId }));
    setShowFormSelector(false);
    Alert.alert('Success', 'Complaint form designation updated successfully');
  };

  const getComplaintFormName = () => {
    if (!appSettings.complaint_form_id) return 'None selected';
    const form = formTemplates.find(f => f.id === appSettings.complaint_form_id);
    return form?.name || 'Form not found';
  };

  const settingSections = [
    {
      title: 'Communication Settings',
      items: [
        {
          icon: 'notifications',
          title: 'Notification Center',
          subtitle: 'Manage email & SMS alert preferences',
          onPress: () => router.push('/settings/notifications'),
          color: '#8b5cf6',
          bgColor: '#ede9fe',
        },
        {
          icon: 'chatbubble-ellipses',
          title: 'SMS Configuration',
          subtitle: 'Twilio SMS settings & testing',
          onPress: () => router.push('/settings/sms-config'),
          color: '#f59e0b',
          bgColor: '#fef3c7',
        },
        {
          icon: 'mail',
          title: 'Email Configuration',
          subtitle: 'SMTP settings & notifications',
          onPress: () => router.push('/settings/email-config'),
          color: '#3b82f6',
          bgColor: '#dbeafe',
        },
      ],
    },
    {
      title: 'Customer Features',
      items: [
        {
          icon: 'warning',
          title: 'Complaint Form',
          subtitle: `Current: ${getComplaintFormName()}`,
          onPress: () => setShowFormSelector(true),
          color: '#f59e0b',
          bgColor: '#fef3c7',
        },
        {
          icon: 'star',
          title: 'Google Reviews',
          subtitle: 'Manage review redirect URL',
          onPress: () => Alert.alert('Coming Soon', 'Google review URL configuration will be available soon'),
          color: '#10b981',
          bgColor: '#d1fae5',
        },
      ],
    },
    {
      title: 'Document Management',
      items: [
        {
          icon: 'folder',
          title: 'Learning Documents',
          subtitle: 'Manage customer resource documents',
          onPress: () => router.push('/settings/learning-documents'),
          color: '#6366f1',
          bgColor: '#e0e7ff',
        },
        {
          icon: 'document-text',
          title: 'PDF Generation',
          subtitle: 'Configure PDF export settings',
          onPress: () => Alert.alert('Coming Soon', 'PDF generation settings will be available soon'),
          color: '#ef4444',
          bgColor: '#fef2f2',
        },
      ],
    },
    {
      title: 'Equipment Management',
      items: [
        {
          icon: 'speedometer',
          title: 'Equipment Inspections',
          subtitle: 'Track inspection status & schedule',
          onPress: () => router.push('/equipment/inspections'),
          color: '#3b82f6',
          bgColor: '#dbeafe',
        },
        {
          icon: 'clipboard',
          title: 'Available Equipment Forms',
          subtitle: 'Inspection & maintenance checklists',
          onPress: () => router.push('/settings/equipment-forms'),
          color: '#f59e0b',
          bgColor: '#fef3c7',
        },
      ],
    },
  ];

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
        <Text style={styles.headerTitle}>App Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[styles.settingCard, { backgroundColor: item.bgColor }]}
                onPress={item.onPress}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.gray400} />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Complaint Form Selector Modal */}
      <Modal
        visible={showFormSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFormSelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFormSelector(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Complaint Form</Text>
            <View style={{ width: 60 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Choose which form customers will see when they click "Submit a Complaint" on their dashboard.
            </Text>
            
            {formTemplates.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyStateText}>No forms available</Text>
                <Text style={styles.emptyStateSubtext}>Create a form template first</Text>
              </View>
            ) : (
              formTemplates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.formOption,
                    appSettings.complaint_form_id === template.id && styles.formOptionSelected,
                  ]}
                  onPress={() => handleComplaintFormSelection(template.id!)}
                >
                  <View style={styles.formOptionHeader}>
                    <View style={styles.formOptionIcon}>
                      <Ionicons name="document-text" size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.formOptionInfo}>
                      <Text style={styles.formOptionTitle}>{template.name}</Text>
                      {template.description && (
                        <Text style={styles.formOptionDescription} numberOfLines={2}>
                          {template.description}
                        </Text>
                      )}
                      <Text style={styles.formOptionMeta}>
                        {template.form_type.replace('_', ' ')} • {template.fields.length} fields
                      </Text>
                    </View>
                    {appSettings.complaint_form_id === template.id && (
                      <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))
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
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.gray600,
  },
  // Modal Styles
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
  modalCancelText: {
    fontSize: 16,
    color: Colors.gray600,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.gray600,
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray600,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.gray400,
    marginTop: 8,
  },
  formOption: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  formOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  formOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  formOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  formOptionInfo: {
    flex: 1,
  },
  formOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  formOptionDescription: {
    fontSize: 14,
    color: Colors.gray600,
    marginBottom: 8,
  },
  formOptionMeta: {
    fontSize: 12,
    color: Colors.gray500,
    textTransform: 'capitalize',
  },
});