import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import { FormField } from '../../types';
import SuccessOverlay from '../../components/SuccessOverlay';

const FIELD_TYPES = [
  // Basic Fields
  { value: 'text', label: 'Text Input', icon: 'text', category: 'basic' },
  { value: 'number', label: 'Number', icon: 'calculator', category: 'basic' },
  { value: 'checkbox', label: 'Checkbox', icon: 'checkbox', category: 'basic' },
  { value: 'select', label: 'Dropdown', icon: 'list', category: 'basic' },
  
  // Inspection Fields
  { value: 'pass_fail', label: 'Pass/Fail', icon: 'checkmark-done-circle', category: 'inspection' },
  { value: 'condition', label: 'Condition Rating', icon: 'star', category: 'inspection' },
  { value: 'yes_no', label: 'Yes/No', icon: 'help-circle', category: 'inspection' },
  { value: 'inspection_item', label: 'Inspection Checklist', icon: 'clipboard', category: 'inspection' },
  
  // Media & Documentation
  { value: 'photo', label: 'Photo', icon: 'camera', category: 'media' },
  { value: 'signature', label: 'Signature', icon: 'create', category: 'media' },
  
  // Layout
  { value: 'section', label: 'Section Header', icon: 'list-outline', category: 'layout' },
];

const FORM_TYPES = [
  { value: 'service_tracking', label: 'Service Tracking', icon: 'document-text', color: '#3b82f6' },
  { value: 'safety_check', label: 'Safety Check', icon: 'shield-checkmark', color: '#10b981' },
  { value: 'equipment', label: 'Equipment Form', icon: 'construct', color: '#f59e0b' },
  { value: 'custom', label: 'Custom Form', icon: 'create', color: '#8b5cf6' },
  { value: 'customer', label: 'Customer Form', icon: 'people', color: '#ec4899' },
];

const EQUIPMENT_TYPES = [
  { value: 'plow_truck', label: 'Plow Truck' },
  { value: 'truck', label: 'Truck' },
  { value: 'loader', label: 'Loader' },
  { value: 'skid_steer', label: 'Skid Steer' },
  { value: 'sanding_truck', label: 'Sanding Truck' },
  { value: 'brine_truck', label: 'Brine Truck' },
  { value: 'cab_sweeper', label: 'Cab Sweeper' },
  { value: 'single_stage_thrower', label: 'Single Stage Thrower' },
  { value: 'gravely_sweeper', label: 'Gravely Sweeper' },
];

export default function FormBuilderScreen() {
  const params = useLocalSearchParams();
  
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState('custom');
  const [equipmentType, setEquipmentType] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  
  // Field form state
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldOptions, setFieldOptions] = useState('');
  const [fieldSection, setFieldSection] = useState('');
  const [isConditional, setIsConditional] = useState(false);
  const [conditionalDependsOn, setConditionalDependsOn] = useState('');
  const [conditionalValue, setConditionalValue] = useState('');
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Read URL parameters and pre-populate form type and equipment type
  useEffect(() => {
    if (params.equipment_type) {
      setFormType('equipment');
      setEquipmentType(params.equipment_type as string);
    }
    
    // Load existing template if template_id is provided
    if (params.template_id) {
      loadTemplate(params.template_id as string);
    }
  }, [params.equipment_type, params.template_id]);

  const loadTemplate = async (templateId: string) => {
    try {
      const response = await api.get(`/form-templates/${templateId}`);
      const template = response.data;
      
      setFormName(template.name);
      setFormDescription(template.description || '');
      setFormType(template.form_type);
      setEquipmentType(template.equipment_type || '');
      setFields(template.fields || []);
    } catch (error) {
      console.error('Error loading template:', error);
      if (Platform.OS === 'web') {
        alert('Failed to load template');
      } else {
        Alert.alert('Error', 'Failed to load template');
      }
    }
  };

  const resetFieldForm = () => {
    setFieldLabel('');
    setFieldType('text');
    setFieldRequired(false);
    setFieldOptions('');
    setFieldSection('');
    setIsConditional(false);
    setConditionalDependsOn('');
    setConditionalValue('');
    setEditingFieldIndex(null);
  };

  const handleAddField = () => {
    if (!fieldLabel.trim()) {
      Alert.alert('Error', 'Please enter a field label');
      return;
    }

    // Set options based on field type
    let options = undefined;
    if (fieldType === 'select') {
      options = fieldOptions.split('\n').filter(o => o.trim());
    } else if (fieldType === 'yes_no') {
      options = ['Yes', 'No'];
    } else if (fieldType === 'pass_fail') {
      options = ['Pass', 'Fail'];
    } else if (fieldType === 'condition') {
      options = ['Excellent', 'Good', 'Fair', 'Poor', 'Needs Replacement'];
    } else if (fieldType === 'inspection_item') {
      options = ['OK', 'Defect', 'N/A'];
    }

    const newField: FormField = {
      field_id: `field_${Date.now()}`,
      field_type: fieldType,
      label: fieldLabel,
      required: fieldRequired,
      options: options,
      section: fieldSection.trim() || undefined,
      conditional_logic: isConditional && conditionalDependsOn && conditionalValue ? {
        depends_on_field: conditionalDependsOn,
        depends_on_value: conditionalValue,
      } : undefined,
    };

    if (editingFieldIndex !== null) {
      const updatedFields = [...fields];
      updatedFields[editingFieldIndex] = newField;
      setFields(updatedFields);
    } else {
      setFields([...fields, newField]);
    }

    setShowFieldModal(false);
    resetFieldForm();
  };

  const handleEditField = (index: number) => {
    const field = fields[index];
    setFieldLabel(field.label);
    setFieldType(field.field_type);
    setFieldRequired(field.required);
    setFieldOptions(field.options?.join('\n') || '');
    setEditingFieldIndex(index);
    setShowFieldModal(true);
  };

  const handleDeleteField = (index: number) => {
    Alert.alert('Delete Field', 'Are you sure you want to delete this field?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setFields(fields.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  const handleSaveTemplate = async () => {
    try {
      setErrorMessage(''); // Clear previous errors
      
      if (!formName.trim()) {
        setErrorMessage('Please enter a form name');
        return;
      }
      if (fields.length === 0) {
        setErrorMessage('Please add at least one field');
        return;
      }
      if (formType === 'equipment' && !equipmentType) {
        setErrorMessage('Please select an equipment type');
        return;
      }

      setSaving(true);
      setSaveSuccess(false);

      // Debug: Log actual fields before transformation
      console.log('Raw fields:', JSON.stringify(fields, null, 2));

      // Transform fields to match backend expectations - force field_type
      const transformedFields = fields.map((field, index) => ({
        field_id: field.field_id || `field_${index + 1}`,
        field_type: field.field_type || field.type || fieldType || 'text',
        label: field.label || 'Untitled Field',
        required: Boolean(field.required),
        options: Array.isArray(field.options) ? field.options : []
      }));

      const payload = {
        name: formName.trim(),
        description: formDescription?.trim() || null,
        form_type: formType,
        equipment_type: formType === 'equipment' ? equipmentType : null,
        fields: transformedFields,
      };

      if (params.template_id) {
        // Update existing template
        await api.put(`/form-templates/${params.template_id}`, payload);
      } else {
        // Create new template
        await api.post('/form-templates', payload);
      }
      
      setSaveSuccess(true);
      setShowSuccessOverlay(true);
      setSaving(false);
      
    } catch (error: any) {
      setSaving(false);
      setSaveSuccess(false);
      
      // Show error message in UI
      const errorDetails = error.response?.data?.detail || error.message || 'Unknown validation error';
      setErrorMessage(`Save failed: ${JSON.stringify(errorDetails)}`);
    }
  };

  const getFieldIcon = (type: string) => {
    return FIELD_TYPES.find(ft => ft.value === type)?.icon || 'document';
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Form Builder {saveSuccess ? 'Saved!' : ''}
        </Text>
        <TouchableOpacity 
          onPress={handleSaveTemplate}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : saveSuccess ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={[styles.saveText, { color: Colors.success, marginLeft: 4 }]}>Saved!</Text>
            </View>
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Error Message Display */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Form Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Form Details</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Form Name *</Text>
              <TextInput
                style={styles.input}
                value={formName}
                onChangeText={setFormName}
                placeholder="Enter form name"
                placeholderTextColor={Colors.gray400}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formDescription}
                onChangeText={setFormDescription}
                placeholder="Enter form description"
                placeholderTextColor={Colors.gray400}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Form Type *</Text>
              <View style={styles.chipContainer}>
                {FORM_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.chip, 
                      formType === type.value && [styles.chipSelected, { backgroundColor: type.color, borderColor: type.color }]
                    ]}
                    onPress={() => setFormType(type.value)}
                  >
                    <Ionicons 
                      name={type.icon as any} 
                      size={16} 
                      color={formType === type.value ? '#fff' : type.color}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.chipText, formType === type.value && styles.chipTextSelected]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Equipment Type Selector - Only show for Equipment forms */}
            {formType === 'equipment' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Equipment Type *</Text>
                <View style={styles.chipContainer}>
                  {EQUIPMENT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[styles.chip, equipmentType === type.value && styles.chipSelected]}
                      onPress={() => setEquipmentType(type.value)}
                    >
                      <Text style={[styles.chipText, equipmentType === type.value && styles.chipTextSelected]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Fields Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Form Fields</Text>
              <TouchableOpacity
                style={styles.addFieldButton}
                onPress={() => setShowFieldModal(true)}
              >
                <Ionicons name="add-circle" size={20} color={Colors.primary} />
                <Text style={styles.addFieldButtonText}>Add Field</Text>
              </TouchableOpacity>
            </View>

            {fields.length === 0 ? (
              <View style={styles.emptyFields}>
                <Ionicons name="layers-outline" size={48} color={Colors.gray300} />
                <Text style={styles.emptyFieldsText}>No fields added yet</Text>
              </View>
            ) : (
              fields.map((field, index) => (
                <View key={field.field_id} style={styles.fieldCard}>
                  <View style={styles.fieldCardHeader}>
                    <Ionicons name={getFieldIcon(field.field_type) as any} size={24} color={Colors.primary} />
                    <View style={styles.fieldCardInfo}>
                      <Text style={styles.fieldLabel}>{field.label}</Text>
                      <View style={styles.fieldMeta}>
                        <Text style={styles.fieldType}>{field.field_type}</Text>
                        {field.required && (
                          <View style={styles.requiredBadge}>
                            <Text style={styles.requiredText}>Required</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleEditField(index)} style={styles.iconButton}>
                      <Ionicons name="create-outline" size={20} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteField(index)} style={styles.iconButton}>
                      <Ionicons name="trash-outline" size={20} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add/Edit Field Modal */}
      <Modal
        visible={showFieldModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowFieldModal(false);
          resetFieldForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowFieldModal(false);
                resetFieldForm();
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingFieldIndex !== null ? 'Edit Field' : 'Add Field'}
            </Text>
            <TouchableOpacity onPress={handleAddField}>
              <Text style={styles.saveText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Field Label *</Text>
              <TextInput
                style={styles.input}
                value={fieldLabel}
                onChangeText={setFieldLabel}
                placeholder="e.g., Service Duration"
                placeholderTextColor={Colors.gray400}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Field Type *</Text>
              <View style={styles.fieldTypeGrid}>
                {FIELD_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.fieldTypeCard,
                      fieldType === type.value && styles.fieldTypeCardSelected,
                    ]}
                    onPress={() => setFieldType(type.value)}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={24}
                      color={fieldType === type.value ? Colors.primary : Colors.gray500}
                    />
                    <Text
                      style={[
                        styles.fieldTypeLabel,
                        fieldType === type.value && styles.fieldTypeLabelSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {fieldType === 'select' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Options (one per line)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={fieldOptions}
                  onChangeText={setFieldOptions}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                  placeholderTextColor={Colors.gray400}
                  multiline
                  numberOfLines={5}
                />
              </View>
            )}

            {/* Section Name Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Section (Optional)</Text>
              <TextInput
                style={styles.input}
                value={fieldSection}
                onChangeText={setFieldSection}
                placeholder="e.g., Pre-Service Inspection"
                placeholderTextColor={Colors.gray400}
              />
              <Text style={styles.helpText}>Group related fields into sections</Text>
            </View>

            {/* Conditional Logic */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsConditional(!isConditional)}
            >
              <Ionicons
                name={isConditional ? 'checkbox' : 'square-outline'}
                size={24}
                color={isConditional ? Colors.primary : Colors.gray400}
              />
              <Text style={styles.checkboxLabel}>Show conditionally</Text>
            </TouchableOpacity>

            {isConditional && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Depends on Field</Text>
                  <View style={styles.selectWrapper}>
                    <TouchableOpacity 
                      style={styles.selectInput}
                      onPress={() => setShowFieldPicker(true)}
                    >
                      <Text style={[
                        styles.selectText,
                        !conditionalDependsOn && { color: Colors.gray400 }
                      ]}>
                        {conditionalDependsOn ? 
                          fields.find(f => f.field_id === conditionalDependsOn)?.label || 'Field not found' :
                          'Select a field...'
                        }
                      </Text>
                      <Ionicons name="chevron-down" size={20} color={Colors.gray400} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.helpText}>This field will only show based on another field's value</Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Show when value is</Text>
                  <TextInput
                    style={styles.input}
                    value={conditionalValue}
                    onChangeText={setConditionalValue}
                    placeholder="e.g., Yes, Damaged, etc."
                    placeholderTextColor={Colors.gray400}
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setFieldRequired(!fieldRequired)}
            >
              <Ionicons
                name={fieldRequired ? 'checkbox' : 'square-outline'}
                size={24}
                color={fieldRequired ? Colors.primary : Colors.gray400}
              />
              <Text style={styles.checkboxLabel}>Required field</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <SuccessOverlay
        visible={showSuccessOverlay}
        title="Form Template Created!"
        message="Your form template has been saved successfully"
        onClose={() => {
          setShowSuccessOverlay(false);
          router.back();
        }}
      />

      {/* Field Picker Modal */}
      <Modal
        visible={showFieldPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFieldPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Field</Text>
              <TouchableOpacity 
                onPress={() => setShowFieldPicker(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.pickerContent}>
              {fields
                .filter(field => field.field_type === 'yes_no' || field.field_type === 'select' || field.field_type === 'checkbox')
                .map((field) => (
                <TouchableOpacity
                  key={field.field_id}
                  style={[
                    styles.pickerItem,
                    conditionalDependsOn === field.field_id && styles.pickerItemSelected
                  ]}
                  onPress={() => {
                    setConditionalDependsOn(field.field_id);
                    setShowFieldPicker(false);
                  }}
                >
                  <View style={styles.pickerItemContent}>
                    <Text style={styles.pickerItemTitle}>{field.label}</Text>
                    <Text style={styles.pickerItemType}>
                      {field.field_type === 'yes_no' ? 'Yes/No' : 
                       field.field_type === 'select' ? 'Dropdown' : 'Checkbox'}
                    </Text>
                  </View>
                  {conditionalDependsOn === field.field_id && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              
              {fields.filter(field => field.field_type === 'yes_no' || field.field_type === 'select' || field.field_type === 'checkbox').length === 0 && (
                <View style={styles.emptyPicker}>
                  <Ionicons name="help-circle-outline" size={40} color={Colors.gray400} />
                  <Text style={styles.emptyPickerText}>No suitable fields found</Text>
                  <Text style={styles.emptyPickerSubtext}>
                    Add Yes/No, Dropdown, or Checkbox fields first
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
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
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
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
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  addFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addFieldButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyFields: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyFieldsText: {
    fontSize: 14,
    color: Colors.gray400,
    marginTop: 8,
  },
  fieldCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  fieldCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fieldCardInfo: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  fieldMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldType: {
    fontSize: 12,
    color: Colors.gray500,
    textTransform: 'capitalize',
  },
  requiredBadge: {
    backgroundColor: Colors.error + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.error,
  },
  iconButton: {
    padding: 4,
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
    color: Colors.gray600,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  fieldTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fieldTypeCard: {
    width: '30%',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  fieldTypeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  fieldTypeLabel: {
    fontSize: 12,
    color: Colors.gray600,
    marginTop: 8,
    textAlign: 'center',
  },
  fieldTypeLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  checkboxLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  errorContainer: {
    backgroundColor: Colors.error + '10',
    borderWidth: 1,
    borderColor: Colors.error + '30',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    marginBottom: 0,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    color: Colors.gray500,
    marginTop: 4,
  },
  selectWrapper: {
    position: 'relative',
  },
  selectInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  pickerContent: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerItemSelected: {
    backgroundColor: Colors.primary + '10',
  },
  pickerItemContent: {
    flex: 1,
  },
  pickerItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  pickerItemType: {
    fontSize: 12,
    color: Colors.gray500,
  },
  emptyPicker: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyPickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray600,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyPickerSubtext: {
    fontSize: 14,
    color: Colors.gray500,
    marginTop: 4,
    textAlign: 'center',
  },
});