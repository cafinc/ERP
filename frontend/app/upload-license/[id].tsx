import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import SuccessOverlay from '../../components/SuccessOverlay';

export default function UploadLicenseScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState('');
  const [licensePhoto, setLicensePhoto] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchUserInfo();
  }, [id]);

  const fetchUserInfo = async () => {
    try {
      const response = await api.get(`/users/${id}`);
      setUserName(response.data.name);
      setLicensePhoto(response.data.driver_license_photo || '');
    } catch (error) {
      console.error('Error fetching user:', error);
      Alert.alert('Error', 'Failed to load user information');
    } finally {
      setLoading(false);
    }
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take a photo of your license');
      return;
    }

    Alert.alert(
      'Upload License Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              setLicensePhoto(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              setLicensePhoto(result.assets[0].uri);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!licensePhoto) {
      Alert.alert('Error', `Please upload a photo of your driver's license`);
      return;
    }

    try {
      setSaving(true);
      
      await api.put(`/users/${id}`, {
        driver_license_photo: licensePhoto,
      });

      setShowSuccess(true);
    } catch (error: any) {
      console.error('Error uploading license:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to upload license photo');
    } finally {
      setSaving(false);
    }
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
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="card" size={64} color={Colors.primary} />
          <Text style={styles.title}>Upload Driver's License</Text>
          <Text style={styles.subtitle}>Hi {userName}, please upload a photo of your driver's license</Text>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Instructions:</Text>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.instructionText}>Ensure the license is clear and readable</Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.instructionText}>Make sure all corners are visible</Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.instructionText}>Avoid glare and shadows</Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.instructionText}>Take the photo in good lighting</Text>
          </View>
        </View>

        {licensePhoto ? (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>License Preview:</Text>
            <Image source={{ uri: licensePhoto }} style={styles.previewImage} />
            <TouchableOpacity style={styles.changeButton} onPress={handlePickPhoto}>
              <Ionicons name="camera" size={20} color={Colors.white} />
              <Text style={styles.changeButtonText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadButton} onPress={handlePickPhoto}>
            <Ionicons name="camera-outline" size={48} color={Colors.primary} />
            <Text style={styles.uploadButtonText}>Take Photo of License</Text>
            <Text style={styles.uploadButtonSubtext}>or choose from library</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.submitButton, (!licensePhoto || saving) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!licensePhoto || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
              <Text style={styles.submitButtonText}>Submit License</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.privacyNote}>
          🔒 Your license information is stored securely and will only be used for verification purposes.
        </Text>
      </ScrollView>

      <SuccessOverlay
        visible={showSuccess}
        title="License Uploaded!"
        message="Your driver's license has been successfully uploaded. Thank you!"
        onClose={() => {
          setShowSuccess(false);
          // Close the screen or navigate away
          if (router.canGoBack()) {
            router.back();
          }
        }}
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
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  instructions: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  uploadButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  uploadButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 16,
  },
  uploadButtonSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  previewContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    resizeMode: 'contain',
    backgroundColor: Colors.gray100,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  changeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray400,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  privacyNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
