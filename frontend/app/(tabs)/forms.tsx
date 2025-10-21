import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import api from '../../utils/api';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../utils/theme';
import { FormTemplate } from '../../types';
import WebAdminLayout from '../../components/WebAdminLayout';

function FormsContent() {
  const { formTemplates, setFormTemplates, formResponses, setFormResponses, sites } = useStore();
  const { isAdmin, isCustomer, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'available' | 'my_submissions'>('available');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);
  const [formTypeFilter, setFormTypeFilter] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      const [templatesRes, responsesRes] = await Promise.all([
        api.get('/form-templates'),
        api.get(`/form-responses?crew_id=${currentUser?.id || ''}`),
      ]);
      setFormTemplates(templatesRes.data);
      setFormResponses(responsesRes.data);
    } catch (error) {
      console.error('Error fetching forms:', error);
      Alert.alert('Error', 'Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  const navigateToFormBuilder = () => {
    router.push('/forms/form-builder');
  };

  const navigateToFillForm = (template: any, context?: any) => {
    const params: any = { 
      templateId: template.id, 
      templateName: template.name,
      formType: template.form_type 
    };
    
    if (context?.siteId) params.siteId = context.siteId;
    if (context?.equipmentId) params.equipmentId = context.equipmentId;
    if (context?.customerId) params.customerId = context.customerId;
    if (context?.dispatchId) params.dispatchId = context.dispatchId;

    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    router.push(`/forms/fill-form?${queryString}`);
  };

  const navigateToViewResponse = (responseId: string) => {
    router.push({
      pathname: '/forms/view-response',
      params: { responseId },
    });
  };

  const handleDeleteForm = (template: any) => {
    setTemplateToDelete(template);
    setShowDeleteModal(true);
  };

  const archiveFormTemplate = async (template: any) => {
    try {
      await api.delete(`/form-templates/${template.id}`);
      setFormTemplates(formTemplates.filter(t => t.id !== template.id));
      Alert.alert('Success', 'Form archived successfully');
    } catch (error) {
      console.error('Error archiving form template:', error);
      Alert.alert('Error', 'Failed to archive form template');
    }
  };

  const getFormIcon = (formType: string) => {
    switch (formType) {
      case 'service_tracking':
        return 'snow';
      case 'safety_check':
        return 'shield-checkmark';
      case 'custom':
        return 'document-text';
      case 'customer':
        return 'person-circle';
      default:
        return 'document';
    }
  };

  const getFormColor = (formType: string) => {
    switch (formType) {
      case 'service_tracking':
        return Colors.primary;
      case 'safety_check':
        return Colors.warning;
      case 'custom':
        return Colors.success;
      case 'customer':
        return '#8b5cf6';
      default:
        return Colors.gray500;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const displayFormTemplates = formTemplates.filter(template => {
    let passesRoleFilter = false;
    if (isCustomer) {
      passesRoleFilter = template.form_type === 'customer';
    } else {
      passesRoleFilter = isAdmin || template.form_type !== 'customer';
    }
    
    if (!passesRoleFilter) return false;
    if (formTypeFilter && template.form_type !== formTypeFilter) return false;
    
    return true;
  });

  const displayFormResponses = isCustomer
    ? formResponses.filter(response => 
        !response.site_id || sites.some(site => site.id === response.site_id && site.customer_id === currentUser?.id)
      )
    : formResponses;

  return (
    <View style={[styles.container, isDesktop && styles.desktopContainer]}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>📝 Forms</Text>
        {isAdmin && (
          <TouchableOpacity style={styles.createButton} onPress={navigateToFormBuilder}>
            <Ionicons name="add-circle" size={24} color="#ffffff" />
            <Text style={styles.createButtonText}>Create Form Template</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'available' && styles.tabActive]}
          onPress={() => setSelectedTab('available')}
        >
          <Text style={[styles.tabText, selectedTab === 'available' && styles.tabTextActive]}>
            Available Forms
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'my_submissions' && styles.tabActive]}
          onPress={() => setSelectedTab('my_submissions')}
        >
          <Text style={[styles.tabText, selectedTab === 'my_submissions' && styles.tabTextActive]}>
            My Submissions
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'available' && !isCustomer && (
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterChip, !formTypeFilter && styles.filterChipActive]}
            onPress={() => setFormTypeFilter(null)}
          >
            <Text style={[styles.filterChipText, !formTypeFilter && styles.filterChipTextActive]}>
              All Forms
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterChip, 
              formTypeFilter === 'service_tracking' && [styles.filterChipActive, { backgroundColor: '#3b82f6', borderColor: '#3b82f6' }]
            ]}
            onPress={() => setFormTypeFilter('service_tracking')}
          >
            <Ionicons 
              name="document-text" 
              size={14} 
              color={formTypeFilter === 'service_tracking' ? Colors.white : '#3b82f6'} 
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.filterChipText, formTypeFilter === 'service_tracking' && styles.filterChipTextActive]}>
              Service
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterChip, 
              formTypeFilter === 'safety_check' && [styles.filterChipActive, { backgroundColor: '#10b981', borderColor: '#10b981' }]
            ]}
            onPress={() => setFormTypeFilter('safety_check')}
          >
            <Ionicons 
              name="shield-checkmark" 
              size={14} 
              color={formTypeFilter === 'safety_check' ? Colors.white : '#10b981'} 
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.filterChipText, formTypeFilter === 'safety_check' && styles.filterChipTextActive]}>
              Safety
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterChip, 
              formTypeFilter === 'equipment' && [styles.filterChipActive, { backgroundColor: '#f59e0b', borderColor: '#f59e0b' }]
            ]}
            onPress={() => setFormTypeFilter('equipment')}
          >
            <Ionicons 
              name="construct" 
              size={14} 
              color={formTypeFilter === 'equipment' ? Colors.white : '#f59e0b'} 
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.filterChipText, formTypeFilter === 'equipment' && styles.filterChipTextActive]}>
              Equipment
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterChip, 
              formTypeFilter === 'custom' && [styles.filterChipActive, { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }]
            ]}
            onPress={() => setFormTypeFilter('custom')}
          >
            <Ionicons 
              name="create" 
              size={14} 
              color={formTypeFilter === 'custom' ? Colors.white : '#8b5cf6'} 
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.filterChipText, formTypeFilter === 'custom' && styles.filterChipTextActive]}>
              Custom
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterChip, 
              formTypeFilter === 'customer' && [styles.filterChipActive, { backgroundColor: '#ec4899', borderColor: '#ec4899' }]
            ]}
            onPress={() => setFormTypeFilter('customer')}
          >
            <Ionicons 
              name="people" 
              size={14} 
              color={formTypeFilter === 'customer' ? Colors.white : '#ec4899'} 
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.filterChipText, formTypeFilter === 'customer' && styles.filterChipTextActive]}>
              Customer
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopContent]}
      >
        {selectedTab === 'available' ? (
          <>
            {displayFormTemplates.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyStateText}>No forms available</Text>
                <Text style={styles.emptyStateSubtext}>
                  {isAdmin
                    ? 'Create your first form template to get started'
                    : 'No forms have been created yet'}
                </Text>
              </View>
            ) : (
              <View style={[isDesktop && styles.desktopGrid]}>
                {displayFormTemplates.map((template) => (
                  <View key={template.id} style={[styles.formCard, isDesktop && styles.desktopCard]}>
                    <TouchableOpacity
                      style={styles.formCardTouchable}
                      onPress={() => navigateToFillForm(template)}
                    >
                      <View style={styles.formCardHeader}>
                        <View
                          style={[
                            styles.formIconContainer,
                            { backgroundColor: `${getFormColor(template.form_type)}20` },
                          ]}
                        >
                          <Ionicons
                            name={getFormIcon(template.form_type) as any}
                            size={28}
                            color={getFormColor(template.form_type)}
                          />
                        </View>
                        <View style={styles.formCardInfo}>
                          <Text style={styles.formTitle}>{template.name}</Text>
                          {template.description && (
                            <Text style={styles.formDescription} numberOfLines={2}>
                              {template.description}
                            </Text>
                          )}
                          <View style={styles.formMeta}>
                            <View style={[styles.badge, { backgroundColor: `${getFormColor(template.form_type)}20` }]}>
                              <Text style={[styles.badgeText, { color: getFormColor(template.form_type) }]}>
                                {template.form_type.replace('_', ' ')}
                              </Text>
                            </View>
                            <Text style={styles.fieldCount}>{template.fields.length} fields</Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={Colors.gray400} />
                      </View>
                    </TouchableOpacity>
                    
                    {isAdmin && (
                      <View style={styles.formActions}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.editButton]}
                          onPress={() => router.push(`/forms/form-builder?template_id=${template.id}`)}
                        >
                          <Ionicons name="pencil-outline" size={16} color={Colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => handleDeleteForm(template)}
                        >
                          <Ionicons name="trash-outline" size={16} color={Colors.white} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {displayFormResponses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyStateText}>No submissions yet</Text>
                <Text style={styles.emptyStateSubtext}>Fill out a form to see it here</Text>
              </View>
            ) : (
              <View style={[isDesktop && styles.desktopGrid]}>
                {displayFormResponses.map((response) => {
                  const template = formTemplates.find((t) => t.id === response.form_template_id);
                  return (
                    <TouchableOpacity
                      key={response.id}
                      style={[styles.formCard, isDesktop && styles.desktopCard]}
                      onPress={() => navigateToViewResponse(response.id!)}
                    >
                      <View style={styles.formCardHeader}>
                        <View
                          style={[
                            styles.formIconContainer,
                            { backgroundColor: `${Colors.success}20` },
                          ]}
                        >
                          <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
                        </View>
                        <View style={styles.formCardInfo}>
                          <Text style={styles.formTitle}>{template?.name || 'Unknown Form'}</Text>
                          <Text style={styles.submittedAt}>
                            Submitted {new Date(response.submitted_at).toLocaleDateString()}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={Colors.gray400} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={32} color="#f59e0b" />
              <Text style={styles.modalTitle}>Archive Form Template</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Are you sure you want to archive "{templateToDelete?.name}"?
              {'\n\n'}
              This form will be moved to archive and automatically deleted after 14 days if not restored.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  if (templateToDelete) {
                    archiveFormTemplate(templateToDelete);
                  }
                }}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function FormsScreen() {
  const auth = useAuth();
  const isWeb = Platform.OS === 'web';
  
  // Tab screens need sidebar but not duplicate header
  if (isWeb && auth?.isAdmin) {
    return <WebAdminLayout showHeader={false}><FormsContent /></WebAdminLayout>;
  }
  
  return <FormsContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
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
    backgroundColor: Colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray500,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  desktopContent: {
    padding: 24,
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  desktopCard: {
    width: 'calc(33.333% - 11px)',
    minWidth: 320,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  formCardTouchable: {
    padding: 16,
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  formIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCardInfo: {
    flex: 1,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  formDescription: {
    fontSize: 14,
    color: Colors.gray600,
    marginBottom: 8,
  },
  formMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  fieldCount: {
    fontSize: 12,
    color: Colors.gray500,
  },
  submittedAt: {
    fontSize: 13,
    color: Colors.gray500,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalMessage: {
    fontSize: 16,
    color: Colors.gray600,
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.gray100,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray600,
  },
  confirmButton: {
    backgroundColor: '#f59e0b',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
});