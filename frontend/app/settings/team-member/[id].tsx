import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import api from '../../../utils/api';
import { Colors } from '../../../utils/theme';
import { User } from '../../../types';
import { useSmartFill } from '../../../contexts/SmartFillContext';
import { useMessaging } from '../../../contexts/MessagingContext';
import SuccessOverlay from '../../../components/SuccessOverlay';
import AvatarPicker, { AVATAR_OPTIONS } from '../../../components/AvatarPicker';
import FormattedTextInput from '../../../components/FormattedTextInput';

export default function TeamMemberProfileScreen() {
  const { id } = useLocalSearchParams();
  const { recordUsage, getLastUsed } = useSmartFill();
  const [member, setMember] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('crew');
  const [avatar, setAvatar] = useState('male_light_1');
  const [photo, setPhoto] = useState('');
  const [active, setActive] = useState(true);
  const [isDriver, setIsDriver] = useState(false);
  const [driverLicensePhoto, setDriverLicensePhoto] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);

  const isNewMember = id === 'new';

  useEffect(() => {
    if (!isNewMember) {
      fetchMemberProfile();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchMemberProfile = async () => {
    try {
      const response = await api.get(`/users/${id}`);
      const userData = response.data;
      setMember(userData);
      setName(userData.name || '');
      setEmail(userData.email || '');
      setPhone(userData.phone || '');
      setRole(userData.role || 'crew');
      setAvatar(userData.avatar || 'male_light_1');
      setPhoto(userData.photo || '');
      setActive(userData.active !== false);
      setIsDriver(userData.is_driver || false);
      setDriverLicensePhoto(userData.driver_license_photo || '');
      setEmergencyContactName(userData.emergency_contact_name || '');
      setEmergencyContactPhone(userData.emergency_contact_phone || '');
      setEmergencyContactRelationship(userData.emergency_contact_relationship || '');
      setDocuments(userData.documents || []);
    } catch (error) {
      console.error('Error fetching member profile:', error);
      Alert.alert('Error', 'Failed to load team member profile');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getCurrentAvatarEmoji = () => {
    const avatarOption = AVATAR_OPTIONS.find(a => a.id === avatar);
    return avatarOption ? avatarOption.emoji : '👤';
  };
  
  const getCurrentAvatarImage = () => {
    const avatarOption = AVATAR_OPTIONS.find(a => a.id === avatar);
    return avatarOption?.type === 'image' ? avatarOption.imageUrl : null;
  };

  const handlePickLicense = async () => {
    // Admin cannot upload license - crew member must do it themselves
    Alert.alert(
      'License Upload',
      'The crew member must upload their own license. They will receive an email and SMS with upload instructions when you mark them as a driver.',
      [{ text: 'OK' }]
    );
  };

  const handleResendLicenseRequest = async () => {
    try {
      const user_id_str = member?.id || id;
      const upload_link = `https://task-hub-modern.preview.emergentagent.com/upload-license/${user_id_str}`;
      
      Alert.alert(
        'Resend Upload Request',
        `Send license upload request to ${name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send',
            onPress: async () => {
              try {
                // Send via email
                await api.post('/email/send', {
                  to_email: email,
                  subject: 'Driver License Upload Required',
                  body: `Hi ${name},\n\nPlease upload your driver's license photo by clicking the link below:\n${upload_link}\n\nThank you,\nF Property Services`
                });

                // Send via SMS
                await api.post('/sms/test', {
                  phone_number: phone,
                  message: `Hi ${name}, please upload your driver's license at: ${upload_link}`
                });

                Alert.alert('Success', 'Upload request sent via email and SMS');
              } catch (error) {
                console.error('Error sending request:', error);
                Alert.alert('Error', 'Failed to send upload request');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success' || (result.assets && result.assets.length > 0)) {
        const doc = result.assets ? result.assets[0] : result;
        
        // Read file as base64
        const base64 = await fetch(doc.uri)
          .then(res => res.blob())
          .then(blob => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          });

        const newDoc = {
          name: doc.name,
          size: doc.size,
          mimeType: doc.mimeType,
          content: base64, // Store base64 content
        };
        
        // Upload document to backend
        const response = await api.post(`/users/${id}/documents`, newDoc);
        if (response.data.success) {
          setDocuments([...documents, response.data.document]);
          Alert.alert('Success', 'Document uploaded successfully');
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to upload document');
    }
  };

  const handleViewDocument = async (doc: any) => {
    try {
      if (!doc.content) {
        Alert.alert('Error', 'Document content not available');
        return;
      }

      // For web, provide view and download options
      if (Platform.OS === 'web') {
        Alert.alert(
          doc.name,
          'Choose an option',
          [
            {
              text: 'View in New Tab',
              onPress: () => {
                // Open document in new tab
                const newWindow = window.open();
                if (newWindow) {
                  newWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>${doc.name}</title>
                        <style>
                          body { margin: 0; padding: 0; }
                          iframe { width: 100%; height: 100vh; border: none; }
                        </style>
                      </head>
                      <body>
                        <iframe src="${doc.content}"></iframe>
                      </body>
                    </html>
                  `);
                  newWindow.document.close();
                }
              },
            },
            {
              text: 'Download',
              onPress: () => {
                // Create a download link
                const link = document.createElement('a');
                link.href = doc.content;
                link.download = doc.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else {
        // For mobile, show info with option to share
        Alert.alert(
          doc.name,
          `File size: ${(doc.size / 1024).toFixed(1)} KB\nUploaded: ${new Date(doc.uploaded_at).toLocaleDateString()}`,
          [
            {
              text: 'OK',
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      Alert.alert('Error', 'Failed to open document');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/users/${id}/documents/${docId}`);
              setDocuments(documents.filter(d => d.id !== docId));
              Alert.alert('Success', 'Document deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    try {
      if (!name.trim() || !email.trim() || !phone.trim()) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      setSaving(true);

      const userData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        avatar,
        photo,
        active,
        is_driver: isDriver,
        emergency_contact_name: emergencyContactName || undefined,
        emergency_contact_phone: emergencyContactPhone || undefined,
        emergency_contact_relationship: emergencyContactRelationship || undefined,
        title: role === 'admin' ? 'Administrator' : role === 'crew' ? 'Crew Member' : 'Subcontractor',
        status: 'on_shift',
        messaging_enabled: true,
      };

      console.log('Saving user data:', { isNewMember, userData });

      if (isNewMember) {
        // Create new user
        const response = await api.post('/users', userData);
        console.log('User created successfully:', response.data);
        
        // Show success overlay
        setShowSuccessOverlay(true);
        
        // Auto-navigate back after showing success
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        // Update existing user
        const response = await api.put(`/users/${id}`, userData);
        console.log('User updated successfully:', response.data);
        setShowSuccessOverlay(true);
        await fetchMemberProfile(); // Refresh data
      }
      
    } catch (error: any) {
      console.error('Error saving profile:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.detail || error.message || `Failed to ${isNewMember ? 'create' : 'update'} profile`;
      Alert.alert('Error', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = () => {
    Alert.alert(
      active ? 'Deactivate Member' : 'Activate Member',
      `Are you sure you want to ${active ? 'deactivate' : 'activate'} this team member?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: active ? 'Deactivate' : 'Activate',
          style: active ? 'destructive' : 'default',
          onPress: () => setActive(!active),
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Member Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Picture Section */}
          <View style={styles.profilePictureSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => setShowAvatarPicker(true)}
            >
              {photo ? (
                <Image source={{ uri: photo }} style={styles.profileImage} />
              ) : getCurrentAvatarImage() ? (
                <Image source={{ uri: getCurrentAvatarImage()! }} style={styles.profileImage} />
              ) : (
                <Text style={styles.profileEmoji}>{getCurrentAvatarEmoji()}</Text>
              )}
              <View style={styles.editBadge}>
                <Ionicons name="camera" size={16} color={Colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Tap to change photo</Text>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              <FormattedTextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter name"
                placeholderTextColor={Colors.gray400}
                formatting="capitalize-words"
                fieldName="name"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address</Text>
              <FormattedTextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor={Colors.gray400}
                formatting="email"
                fieldName="email"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <FormattedTextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="(555) 123-4567"
                placeholderTextColor={Colors.gray400}
                formatting="phone"
                fieldName="phone"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleSelector}>
                {['crew', 'subcontractor', 'admin'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleOption,
                      role === r && styles.roleOptionSelected,
                    ]}
                    onPress={() => setRole(r)}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        role === r && styles.roleOptionTextSelected,
                      ]}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Driver Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Driver Information</Text>
            
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Is Driver</Text>
                <Text style={styles.switchSubtext}>
                  {isDriver ? 'Driver license required' : 'Not a driver'}
                </Text>
              </View>
              <Switch
                value={isDriver}
                onValueChange={setIsDriver}
                trackColor={{ false: Colors.gray300, true: Colors.primary + '40' }}
                thumbColor={isDriver ? Colors.primary : Colors.gray400}
              />
            </View>

            {isDriver && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Driver License Photo</Text>
                {driverLicensePhoto ? (
                  <View style={styles.licensePreview}>
                    <Image source={{ uri: driverLicensePhoto }} style={styles.licenseImage} />
                    <View style={styles.licenseStatus}>
                      <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                      <Text style={styles.licenseStatusText}>License Uploaded</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.licenseNotUploaded}>
                    <Ionicons name="alert-circle-outline" size={48} color={Colors.warning} />
                    <Text style={styles.licenseNotUploadedText}>License Not Uploaded</Text>
                    <Text style={styles.licenseNotUploadedSubtext}>
                      The crew member will receive an email and SMS with upload instructions
                    </Text>
                    <TouchableOpacity
                      style={styles.resendButton}
                      onPress={handleResendLicenseRequest}
                    >
                      <Ionicons name="mail-outline" size={18} color={Colors.primary} />
                      <Text style={styles.resendButtonText}>Resend Upload Request</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Emergency Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Contact Name</Text>
              <TextInput
                style={styles.input}
                value={emergencyContactName}
                onChangeText={setEmergencyContactName}
                placeholder="Enter emergency contact name"
                placeholderTextColor={Colors.gray400}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Contact Phone</Text>
              <TextInput
                style={styles.input}
                value={emergencyContactPhone}
                onChangeText={setEmergencyContactPhone}
                placeholder="+1234567890"
                placeholderTextColor={Colors.gray400}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Relationship</Text>
              <TextInput
                style={styles.input}
                value={emergencyContactRelationship}
                onChangeText={setEmergencyContactRelationship}
                placeholder="e.g., Spouse, Parent, Sibling"
                placeholderTextColor={Colors.gray400}
              />
            </View>
          </View>

          {/* Documents */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Documents</Text>
              <TouchableOpacity
                style={styles.addDocButton}
                onPress={handlePickDocument}
              >
                <Ionicons name="add-circle" size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            
            {documents.length === 0 ? (
              <View style={styles.emptyDocuments}>
                <Ionicons name="document-outline" size={48} color={Colors.gray400} />
                <Text style={styles.emptyDocumentsText}>No documents uploaded</Text>
                <Text style={styles.emptyDocumentsSubtext}>Tap + to upload PDF, Word, or Excel files</Text>
              </View>
            ) : (
              documents.map((doc, index) => (
                <View key={doc.id || index} style={styles.documentCard}>
                  <Ionicons name="document" size={24} color={Colors.primary} />
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName}>{doc.name}</Text>
                    <Text style={styles.documentMeta}>
                      {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                      {doc.uploaded_at && ` • ${new Date(doc.uploaded_at).toLocaleDateString()}`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => handleViewDocument(doc)}
                  >
                    <Ionicons name="eye-outline" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteDocument(doc.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Account Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Status</Text>
            
            <TouchableOpacity
              style={styles.statusToggle}
              onPress={handleToggleActive}
            >
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Account Status</Text>
                <Text style={styles.statusSubtext}>
                  {active ? 'Member can log in and access the system' : 'Member cannot access the system'}
                </Text>
              </View>
              <View style={[styles.statusBadge, active && styles.statusBadgeActive]}>
                <Ionicons
                  name={active ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={active ? Colors.success : Colors.error}
                />
                <Text style={[styles.statusBadgeText, active && styles.statusBadgeTextActive]}>
                  {active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member Since:</Text>
              <Text style={styles.infoValue}>
                {member?.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </View>

          {/* Save/Create Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleUpdateProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name={isNewMember ? "person-add" : "checkmark-circle"} size={20} color={Colors.white} />
                <Text style={styles.saveButtonText}>
                  {isNewMember ? "Create User" : "Save Changes"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessOverlay
        visible={showSuccessOverlay}
        title={isNewMember ? "User Created!" : "Profile Updated!"}
        message={isNewMember ? "Team member has been created successfully" : "Team member profile has been updated successfully"}
        onClose={() => {
          setShowSuccessOverlay(false);
        }}
      />

      <AvatarPicker
        visible={showAvatarPicker}
        currentAvatar={avatar}
        currentPhoto={photo}
        onClose={() => setShowAvatarPicker(false)}
        onSelectAvatar={(avatarId) => setAvatar(avatarId)}
        onSelectPhoto={(photoUri) => setPhoto(photoUri)}
      />
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
  placeholder: {
    width: 40,
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
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  roleOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  roleOptionTextSelected: {
    color: Colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.gray50,
    marginBottom: 16,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  switchSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.primary + '10',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  licensePreview: {
    position: 'relative',
  },
  licenseImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  licenseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.success + '20',
    borderRadius: 6,
  },
  licenseStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  licenseNotUploaded: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: Colors.warning + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  licenseNotUploadedText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  licenseNotUploadedSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  changeLicenseButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  changeLicenseText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  addDocButton: {
    padding: 4,
  },
  emptyDocuments: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyDocumentsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptyDocumentsSubtext: {
    fontSize: 12,
    color: Colors.gray500,
    marginTop: 4,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.gray50,
    marginBottom: 8,
    gap: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  documentMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  viewButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: Colors.primary + '10',
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.gray50,
    marginBottom: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.gray200,
    gap: 4,
  },
  statusBadgeActive: {
    backgroundColor: Colors.success + '20',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.error,
  },
  statusBadgeTextActive: {
    color: Colors.success,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
    borderWidth: 4,
    borderColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  profileEmoji: {
    fontSize: 60,
  },
  editBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  changePhotoText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});
