import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import SuccessOverlay from '../../components/SuccessOverlay';
import AvatarPicker, { AVATAR_OPTIONS } from '../../components/AvatarPicker';

export default function ProfileScreen() {
  const { currentUser, setUser } = useAuth();
  
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || 'male_light_1');
  const [photo, setPhoto] = useState(currentUser?.photo || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  
  const getCurrentAvatarEmoji = () => {
    const avatarOption = AVATAR_OPTIONS.find(a => a.id === avatar);
    return avatarOption ? avatarOption.emoji : '👤';
  };
  
  const getCurrentAvatarImage = () => {
    const avatarOption = AVATAR_OPTIONS.find(a => a.id === avatar);
    return avatarOption?.type === 'image' ? avatarOption.imageUrl : null;
  };
  
  const handleUpdateProfile = async () => {
    try {
      // Validation
      if (!name.trim() || !email.trim() || !phone.trim()) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      
      // If changing email or phone, require current password
      const emailChanged = email !== currentUser?.email;
      const phoneChanged = phone !== currentUser?.phone;
      
      if ((emailChanged || phoneChanged) && !currentPassword) {
        Alert.alert('Error', 'Please enter your current password to change email or phone');
        return;
      }
      
      // If setting new password, validate
      if (newPassword) {
        if (newPassword.length < 6) {
          Alert.alert('Error', 'New password must be at least 6 characters');
          return;
        }
        
        if (newPassword !== confirmPassword) {
          Alert.alert('Error', 'Passwords do not match');
          return;
        }
        
        if (!currentPassword) {
          Alert.alert('Error', 'Please enter your current password to change password');
          return;
        }
      }
      
      setLoading(true);
      
      const updateData: any = {
        name,
        email,
        phone,
        avatar,
        photo,
      };
      
      if (currentPassword) {
        updateData.current_password = currentPassword;
      }
      
      if (newPassword) {
        updateData.new_password = newPassword;
      }
      
      const response = await api.put(`/users/${currentUser?.id}/profile`, updateData);
      
      if (response.data.success) {
        // Update context with new user data
        setUser(response.data.user);
        
        // Show success
        setShowSuccessOverlay(true);
        
        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
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
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={Colors.gray400}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={Colors.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.helpText}>
                Used for account recovery and notifications
              </Text>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+1234567890"
                placeholderTextColor={Colors.gray400}
                keyboardType="phone-pad"
              />
              <Text style={styles.helpText}>
                Used for SMS notifications and passwordless login
              </Text>
            </View>
          </View>

          {/* Change Password */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Change Password</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={Colors.gray400}
                secureTextEntry
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password (optional)"
                placeholderTextColor={Colors.gray400}
                secureTextEntry
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={Colors.gray400}
                secureTextEntry
              />
            </View>
            
            <Text style={styles.helpText}>
              Leave password fields empty if you don't want to change it
            </Text>
          </View>

          {/* Account Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role:</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{currentUser?.role.toUpperCase()}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Status:</Text>
              <View style={[styles.statusBadge, currentUser?.active && styles.statusBadgeActive]}>
                <Text style={styles.statusText}>
                  {currentUser?.active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessOverlay
        visible={showSuccessOverlay}
        title="Profile Updated!"
        message="Your profile has been updated successfully"
        onClose={() => {
          setShowSuccessOverlay(false);
          router.back();
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
  helpText: {
    fontSize: 12,
    color: Colors.gray500,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  roleBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  statusBadge: {
    backgroundColor: Colors.gray300,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: Colors.success + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
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
