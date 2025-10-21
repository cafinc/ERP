import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import { useAuth } from '../../contexts/AuthContext';
import { FormTemplate, FormField } from '../../types';
import SuccessOverlay from '../../components/SuccessOverlay';

export default function FillFormScreen() {
  const { templateId, siteId, equipmentId, customerId, dispatchId } = useLocalSearchParams();
  const { currentUser } = useAuth();
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Signature modal state
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureFieldId, setSignatureFieldId] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [saveSignatureForFuture, setSaveSignatureForFuture] = useState(false);
  
  // Equipment selection state (for equipment forms)
  const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(equipmentId as string || '');

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  useEffect(() => {
    // Fetch equipment if this is an equipment form
    if (template?.form_type === 'equipment' && template?.equipment_type) {
      fetchEquipment(template.equipment_type);
    }
  }, [template]);

  const fetchTemplate = async () => {
    try {
      const response = await api.get(`/form-templates/${templateId}`);
      setTemplate(response.data);
    } catch (error) {
      console.error('Error fetching template:', error);
      Alert.alert('Error', 'Failed to load form template');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async (equipmentType: string) => {
    try {
      const response = await api.get('/equipment');
      // Filter equipment by type
      const filtered = response.data.filter((eq: any) => 
        eq.equipment_type === equipmentType && eq.status !== 'archived'
      );
      setAvailableEquipment(filtered);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const handleFieldChange = (fieldId: string, value: any, fieldType?: string) => {
    setResponses({
      ...responses,
      [fieldId]: value,
    });
    
    // Remove field from validation errors when user starts typing
    if (validationErrors.has(fieldId)) {
      const newErrors = new Set(validationErrors);
      newErrors.delete(fieldId);
      setValidationErrors(newErrors);
    }

    // If user selects "Fail" on pass/fail field, prompt for documentation
    if (fieldType === 'pass_fail' && value === 'Fail') {
      const message = 'Failed inspection requires documentation. Please add a comment explaining the issue and consider taking a photo.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Documentation Required', message, [{ text: 'OK' }]);
      }
    }
  };

  const handlePhoto = async (fieldId: string) => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        handleFieldChange(fieldId, `data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handleSignature = async (fieldId: string) => {
    setSignatureFieldId(fieldId);
    
    // Try to load saved signature
    try {
      const savedSignature = await AsyncStorage.getItem('user_signature');
      if (savedSignature) {
        setSignatureName(savedSignature);
        setSaveSignatureForFuture(true);
      } else {
        setSignatureName('');
        setSaveSignatureForFuture(false);
      }
    } catch (error) {
      console.error('Error loading saved signature:', error);
      setSignatureName('');
      setSaveSignatureForFuture(false);
    }
    
    setShowSignatureModal(true);
  };

  const saveSignature = async () => {
    if (signatureName.trim()) {
      const timestamp = new Date().toLocaleString();
      handleFieldChange(signatureFieldId, `${signatureName.trim()} - ${timestamp}`);
      
      // Save signature for future use if checkbox is checked
      if (saveSignatureForFuture) {
        try {
          await AsyncStorage.setItem('user_signature', signatureName.trim());
          console.log('Signature saved for future forms');
        } catch (error) {
          console.error('Error saving signature:', error);
        }
      }
      
      setShowSignatureModal(false);
      setSignatureName('');
    } else {
      if (Platform.OS === 'web') {
        alert('Please enter your name');
      } else {
        Alert.alert('Error', 'Please enter your name');
      }
    }
  };

  const validateForm = () => {
    if (!template) return false;

    const errors = new Set<string>();
    const missingFields: string[] = [];

    for (const field of template.fields) {
      const value = responses[field.field_id];
      const isEmpty = value === undefined || value === null || value === '' || 
                     (typeof value === 'string' && value.trim() === '');
      
      if (field.required && isEmpty) {
        errors.add(field.field_id);
        missingFields.push(field.label);
      }

      // If this is a pass/fail field and user selected "Fail", require comment
      if (field.field_type === 'pass_fail' && responses[field.field_id] === 'Fail') {
        const commentFieldId = `${field.field_id}_fail_comment`;
        const commentValue = responses[commentFieldId];
        const commentIsEmpty = !commentValue || commentValue.trim() === '';
        
        if (commentIsEmpty) {
          errors.add(commentFieldId);
          missingFields.push(`${field.label} - Failure Explanation`);
        }
      }
    }

    // Check equipment selection for equipment forms
    if (template.form_type === 'equipment' && availableEquipment.length > 0 && !selectedEquipmentId) {
      missingFields.push('Equipment Selection');
    }

    setValidationErrors(errors);

    if (errors.size > 0 || missingFields.length > 0) {
      const message = `Please fill in all required fields:\n\n${missingFields.map(f => `• ${f}`).join('\n')}`;
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Required Fields Missing', message, [{ text: 'OK' }]);
      }
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setAttemptedSubmit(true);
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        template_id: templateId,
        template_name: template?.name || 'Unknown Form',
        crew_id: currentUser?.id,
        crew_name: currentUser?.name || 'Unknown User',
        responses: responses,
      };

      // Add context IDs if provided
      if (siteId) payload.site_id = siteId;
      if (dispatchId) payload.dispatch_id = dispatchId;
      if (customerId) payload.customer_id = customerId;
      // Use selected equipment ID for equipment forms, fallback to URL param
      if (selectedEquipmentId) {
        payload.equipment_id = selectedEquipmentId;
      } else if (equipmentId) {
        payload.equipment_id = equipmentId;
      }

      await api.post('/form-responses', payload);

      // Show success state
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('❌ Error', 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if field should be shown based on conditional logic
  const shouldShowField = (field: FormField): boolean => {
    if (!field.conditional_logic) return true;
    
    const { depends_on_field, depends_on_value } = field.conditional_logic;
    const dependentFieldValue = responses[depends_on_field];
    
    return dependentFieldValue === depends_on_value;
  };

  // Group fields by sections and render with conditional logic
  const renderFormContent = () => {
    if (!template?.fields) return null;

    // Group fields by sections
    const sections = new Map<string, FormField[]>();
    const noSectionFields: FormField[] = [];

    template.fields.forEach(field => {
      if (field.field_type === 'section') {
        // Section headers don't go in the sections map, they're rendered inline
        return;
      }

      if (field.section) {
        if (!sections.has(field.section)) {
          sections.set(field.section, []);
        }
        sections.get(field.section)!.push(field);
      } else {
        noSectionFields.push(field);
      }
    });

    const content = [];

    // Render fields without sections first
    if (noSectionFields.length > 0) {
      noSectionFields.forEach(field => {
        if (shouldShowField(field)) {
          content.push(renderFieldContainer(field));
        }
      });
    }

    // Render sections with their fields
    template.fields.forEach(field => {
      if (field.field_type === 'section') {
        content.push(renderSectionHeader(field));
        
        // Render fields in this section
        const sectionFields = sections.get(field.label) || [];
        sectionFields.forEach(sectionField => {
          if (shouldShowField(sectionField)) {
            content.push(renderFieldContainer(sectionField));
          }
        });
      }
    });

    return content;
  };

  const renderSectionHeader = (field: FormField) => (
    <View key={field.field_id} style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{field.label}</Text>
      <View style={styles.sectionDivider} />
    </View>
  );

  const renderFieldContainer = (field: FormField) => (
    <View key={field.field_id} style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {field.label}
        {field.required && <Text style={styles.required}> *</Text>}
      </Text>
      {renderField(field)}
    </View>
  );

  const renderField = (field: FormField) => {
    const hasError = validationErrors.has(field.field_id);
    
    switch (field.field_type) {
      case 'text':
        return (
          <View>
            <TextInput
              style={[styles.input, hasError && styles.inputError]}
              value={responses[field.field_id] || ''}
              onChangeText={(value) => handleFieldChange(field.field_id, value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              placeholderTextColor={Colors.gray400}
            />
            {hasError && (
              <Text style={styles.errorText}>This field is required</Text>
            )}
          </View>
        );

      case 'number':
        return (
          <View>
            <TextInput
              style={[styles.input, hasError && styles.inputError]}
              value={responses[field.field_id] || ''}
              onChangeText={(value) => handleFieldChange(field.field_id, value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              placeholderTextColor={Colors.gray400}
              keyboardType="numeric"
            />
            {hasError && (
              <Text style={styles.errorText}>This field is required</Text>
            )}
          </View>
        );

      case 'checkbox':
        return (
          <View>
            <TouchableOpacity
              style={[styles.checkboxRow, hasError && styles.checkboxError]}
              onPress={() => handleFieldChange(field.field_id, !responses[field.field_id])}
            >
              <Ionicons
                name={responses[field.field_id] ? 'checkbox' : 'square-outline'}
                size={24}
                color={hasError ? Colors.error : (responses[field.field_id] ? Colors.primary : Colors.gray400)}
              />
              <Text style={styles.checkboxLabel}>Yes</Text>
            </TouchableOpacity>
            {hasError && (
              <Text style={styles.errorText}>This field is required</Text>
            )}
          </View>
        );

      case 'yes_no':
        return (
          <View>
            <View style={styles.yesNoContainer}>
              {['Yes', 'No'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.yesNoButton,
                    responses[field.field_id] === option && styles.yesNoButtonSelected,
                    hasError && !responses[field.field_id] && styles.yesNoButtonError,
                  ]}
                  onPress={() => handleFieldChange(field.field_id, option)}
                >
                  <Text
                    style={[
                      styles.yesNoText,
                      responses[field.field_id] === option && styles.yesNoTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {hasError && (
              <Text style={styles.errorText}>This field is required</Text>
            )}
          </View>
        );

      case 'pass_fail':
        const isFailed = responses[field.field_id] === 'Fail';
        const commentFieldId = `${field.field_id}_fail_comment`;
        
        return (
          <View>
            <View style={styles.yesNoContainer}>
              {['Pass', 'Fail'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.yesNoButton,
                    responses[field.field_id] === option && styles.yesNoButtonSelected,
                    hasError && !responses[field.field_id] && styles.yesNoButtonError,
                    option === 'Pass' && responses[field.field_id] === 'Pass' && { backgroundColor: '#10b981', borderColor: '#10b981' },
                    option === 'Fail' && responses[field.field_id] === 'Fail' && { backgroundColor: '#ef4444', borderColor: '#ef4444' },
                  ]}
                  onPress={() => handleFieldChange(field.field_id, option, 'pass_fail')}
                >
                  <Text
                    style={[
                      styles.yesNoText,
                      responses[field.field_id] === option && styles.yesNoTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Show comment field when Fail is selected */}
            {isFailed && (
              <View style={styles.failCommentContainer}>
                <Text style={styles.failCommentLabel}>
                  <Ionicons name="alert-circle" size={16} color="#ef4444" /> Explain the issue *
                </Text>
                <TextInput
                  style={[
                    styles.failCommentInput,
                    validationErrors.has(commentFieldId) && styles.failCommentInputError,
                  ]}
                  value={responses[commentFieldId] || ''}
                  onChangeText={(value) => handleFieldChange(commentFieldId, value)}
                  placeholder="Describe what failed and why..."
                  placeholderTextColor={Colors.gray400}
                  multiline
                  numberOfLines={3}
                />
                {validationErrors.has(commentFieldId) && (
                  <Text style={styles.errorText}>Please explain what failed</Text>
                )}
              </View>
            )}
            
            {hasError && (
              <Text style={styles.errorText}>This field is required</Text>
            )}
          </View>
        );

      case 'condition':
      case 'inspection_item':
        // Both use same dropdown-style rendering with their specific options
        const options = field.options || [];
        return (
          <View>
            <View style={styles.optionsContainer}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    responses[field.field_id] === option && styles.optionButtonSelected,
                    hasError && !responses[field.field_id] && styles.optionButtonError,
                  ]}
                  onPress={() => handleFieldChange(field.field_id, option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      responses[field.field_id] === option && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {hasError && (
              <Text style={styles.errorText}>Please select an option</Text>
            )}
          </View>
        );

      case 'select':
        return (
          <View>
            <View style={styles.optionsContainer}>
              {field.options?.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    responses[field.field_id] === option && styles.optionButtonSelected,
                    hasError && !responses[field.field_id] && styles.optionButtonError,
                  ]}
                  onPress={() => handleFieldChange(field.field_id, option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      responses[field.field_id] === option && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {hasError && (
              <Text style={styles.errorText}>Please select an option</Text>
            )}
          </View>
        );

      case 'signature':
        return (
          <View>
            <TouchableOpacity
              style={[styles.signatureButton, hasError && styles.signatureButtonError]}
              onPress={() => handleSignature(field.field_id)}
            >
              {responses[field.field_id] ? (
                <View style={styles.signaturePreview}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                  <Text style={styles.signaturePreviewText}>Signature captured</Text>
                </View>
              ) : (
                <View style={styles.signatureEmpty}>
                  <Ionicons name="create-outline" size={24} color={Colors.gray400} />
                  <Text style={styles.signaturePlaceholder}>Tap to sign</Text>
                </View>
              )}
            </TouchableOpacity>
            {hasError && (
              <Text style={styles.errorText}>Signature is required</Text>
            )}
          </View>
        );

      case 'photo':
        return (
          <View>
            <TouchableOpacity
              style={[styles.photoButton, hasError && styles.photoButtonError]}
              onPress={() => handlePhoto(field.field_id)}
            >
              {responses[field.field_id] ? (
                <View style={styles.photoPreview}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                  <Text style={styles.photoPreviewText}>Photo captured</Text>
                </View>
              ) : (
                <View style={styles.photoEmpty}>
                  <Ionicons name="camera-outline" size={24} color={Colors.gray400} />
                  <Text style={styles.photoPlaceholder}>Tap to take photo</Text>
                </View>
              )}
            </TouchableOpacity>
            {hasError && (
              <Text style={styles.errorText}>Photo is required</Text>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{template.name}</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {template.description && (
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{template.description}</Text>
            </View>
          )}

          {/* Equipment Selector for Equipment Forms */}
          {template.form_type === 'equipment' && availableEquipment.length > 0 && (
            <View style={styles.equipmentSelector}>
              <Text style={styles.equipmentSelectorLabel}>
                <Ionicons name="construct" size={16} color={Colors.primary} /> Select Equipment *
              </Text>
              <View style={styles.equipmentChipsContainer}>
                {availableEquipment.map((equipment) => (
                  <TouchableOpacity
                    key={equipment.id}
                    style={[
                      styles.equipmentChip,
                      selectedEquipmentId === equipment.id && styles.equipmentChipSelected,
                    ]}
                    onPress={() => setSelectedEquipmentId(equipment.id)}
                  >
                    <Text style={[
                      styles.equipmentChipText,
                      selectedEquipmentId === equipment.id && styles.equipmentChipTextSelected,
                    ]}>
                      {equipment.unit_number || equipment.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!selectedEquipmentId && attemptedSubmit && (
                <Text style={styles.errorText}>Please select equipment</Text>
              )}
            </View>
          )}

          {renderFormContent()}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton, 
              submitting && styles.submitButtonDisabled,
              submitSuccess && styles.submitButtonSuccess
            ]}
            onPress={handleSubmit}
            disabled={submitting || submitSuccess}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : submitSuccess ? (
              <>
                <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
                <Text style={styles.submitButtonText}>Form Submitted!</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                <Text style={styles.submitButtonText}>Submit Form</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <SuccessOverlay
        visible={submitSuccess}
        title="Form Submitted!"
        message="Your form has been submitted successfully"
        onClose={() => {
          setSubmitSuccess(false);
          router.back();
        }}
      />

      {/* Signature Modal */}
      <Modal
        visible={showSignatureModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSignatureModal(false)}
      >
        <View style={styles.signatureModalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.signatureModalContainer}
          >
            <View style={styles.signatureModalContent}>
              <Text style={styles.signatureModalTitle}>Add Signature</Text>
              <Text style={styles.signatureModalSubtitle}>Please enter your full name</Text>
              
              <TextInput
                style={styles.signatureModalInput}
                value={signatureName}
                onChangeText={setSignatureName}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.gray400}
                autoFocus
              />
              
              <TouchableOpacity
                style={styles.signatureSaveCheckbox}
                onPress={() => setSaveSignatureForFuture(!saveSignatureForFuture)}
              >
                <View style={[styles.checkbox, saveSignatureForFuture && styles.checkboxChecked]}>
                  {saveSignatureForFuture && (
                    <Ionicons name="checkmark" size={16} color={Colors.white} />
                  )}
                </View>
                <Text style={styles.signatureSaveText}>Save for future forms</Text>
              </TouchableOpacity>
              
              <View style={styles.signatureModalButtons}>
                <TouchableOpacity
                  style={[styles.signatureModalButton, styles.signatureModalButtonCancel]}
                  onPress={() => {
                    setShowSignatureModal(false);
                    setSignatureName('');
                  }}
                >
                  <Text style={styles.signatureModalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.signatureModalButton, styles.signatureModalButtonConfirm]}
                  onPress={saveSignature}
                >
                  <Text style={styles.signatureModalButtonTextConfirm}>Sign</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
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
    paddingBottom: 100,
  },
  descriptionCard: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  required: {
    color: Colors.error,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.white,
  },
  optionButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  optionText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  placeholderField: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.gray50,
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.gray500,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  submitButtonSuccess: {
    backgroundColor: Colors.success,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  checkboxError: {
    backgroundColor: Colors.error + '10',
    padding: 8,
    borderRadius: 8,
  },
  optionButtonError: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  // Section styles
  sectionHeader: {
    marginBottom: 16,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  sectionDivider: {
    height: 2,
    backgroundColor: Colors.primary + '20',
    borderRadius: 1,
  },
  // Yes/No field styles
  yesNoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  yesNoButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  yesNoButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  yesNoButtonError: {
    borderColor: Colors.error,
  },
  yesNoText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  yesNoTextSelected: {
    color: Colors.white,
  },
  // Signature field styles
  signatureButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    backgroundColor: Colors.white,
  },
  signatureButtonError: {
    borderColor: '#ef4444',
  },
  signaturePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signaturePreviewText: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '600',
  },
  signatureEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  signaturePlaceholder: {
    fontSize: 14,
    color: Colors.gray400,
  },
  // Photo field styles
  photoButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    backgroundColor: Colors.white,
  },
  photoButtonError: {
    borderColor: '#ef4444',
  },
  photoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoPreviewText: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '600',
  },
  photoEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  photoPlaceholder: {
    fontSize: 14,
    color: Colors.gray400,
  },
  // Signature modal styles
  signatureModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureModalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  signatureModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  signatureModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  signatureModalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  signatureModalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    marginBottom: 24,
  },
  signatureModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  signatureModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  signatureModalButtonCancel: {
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  signatureModalButtonConfirm: {
    backgroundColor: Colors.primary,
  },
  signatureModalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  signatureModalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  signatureSaveCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  signatureSaveText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  // Fail comment styles
  failCommentContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  failCommentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  failCommentInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  failCommentInputError: {
    borderColor: '#ef4444',
  },
  // Equipment selector styles
  equipmentSelector: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  equipmentSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  equipmentChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipmentChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  equipmentChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  equipmentChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  equipmentChipTextSelected: {
    color: Colors.white,
  },
  // Success overlay styles moved to reusable SuccessOverlay component
});
