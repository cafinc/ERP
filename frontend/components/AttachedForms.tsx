import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../utils/api';
import { Colors } from '../utils/theme';
import { FormResponse, FormTemplate } from '../types';

interface AttachedFormsProps {
  entityType: 'site' | 'equipment' | 'customer' | 'dispatch';
  entityId: string;
  entityName: string;
  formType?: string; // Optional: filter by form type
  onAddForm?: () => void; // Custom add form handler
}

export default function AttachedForms({ 
  entityType, 
  entityId, 
  entityName,
  formType,
  onAddForm 
}: AttachedFormsProps) {
  const [forms, setForms] = useState<FormResponse[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForms();
  }, [entityId]);

  const fetchForms = async () => {
    try {
      const [responsesRes, templatesRes] = await Promise.all([
        api.get('/form-responses'),
        api.get('/form-templates'),
      ]);

      const allResponses: FormResponse[] = responsesRes.data;
      const allTemplates: FormTemplate[] = templatesRes.data;

      // Filter responses based on entity type
      let filteredResponses = allResponses.filter((response) => {
        switch (entityType) {
          case 'site':
            return response.site_id === entityId;
          case 'dispatch':
            return response.dispatch_id === entityId;
          case 'customer':
            return response.responses?._customer_id === entityId;
          case 'equipment':
            return response.responses?._equipment_id === entityId;
          default:
            return false;
        }
      });

      // Further filter by form type if specified
      if (formType) {
        const relevantTemplateIds = allTemplates
          .filter(t => t.form_type === formType)
          .map(t => t.id);
        filteredResponses = filteredResponses.filter(r => 
          relevantTemplateIds.includes(r.form_template_id)
        );
      }

      setForms(filteredResponses);
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddForm = () => {
    if (onAddForm) {
      onAddForm();
    } else {
      // Navigate to forms screen with context
      const params: any = {};
      if (entityType === 'site') params.siteId = entityId;
      if (entityType === 'dispatch') params.dispatchId = entityId;
      if (entityType === 'customer') params.customerId = entityId;
      if (entityType === 'equipment') params.equipmentId = entityId;
      
      router.push({
        pathname: '/(tabs)/forms',
        params,
      });
    }
  };

  const handleViewForm = (responseId: string) => {
    router.push({
      pathname: '/forms/view-response',
      params: { responseId },
    });
  };

  const getFormTemplate = (templateId: string) => {
    return templates.find(t => t.id === templateId);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Attached Forms</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddForm}>
          <Ionicons name="add-circle" size={20} color={Colors.primary} />
          <Text style={styles.addButtonText}>Add Form</Text>
        </TouchableOpacity>
      </View>

      {forms.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={32} color={Colors.gray400} />
          <Text style={styles.emptyText}>No forms attached yet</Text>
          <Text style={styles.emptySubtext}>Tap "Add Form" to attach a form to {entityName}</Text>
        </View>
      ) : (
        <View style={styles.formsList}>
          {forms.map((form) => {
            const template = getFormTemplate(form.form_template_id);
            return (
              <TouchableOpacity
                key={form.id}
                style={styles.formCard}
                onPress={() => handleViewForm(form.id!)}
              >
                <View style={styles.formIconContainer}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                </View>
                <View style={styles.formInfo}>
                  <Text style={styles.formName}>{template?.name || 'Form'}</Text>
                  <Text style={styles.formDate}>
                    {new Date(form.submitted_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyState: {
    backgroundColor: Colors.gray50,
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray600,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.gray500,
    marginTop: 4,
    textAlign: 'center',
  },
  formsList: {
    gap: 8,
  },
  formCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  formIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formInfo: {
    flex: 1,
  },
  formName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  formDate: {
    fontSize: 12,
    color: Colors.gray500,
  },
});
