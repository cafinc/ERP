import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

// Conditional imports for native components
let Camera: any, Location: any, ImageManipulator: any;

if (Platform.OS !== 'web') {
  try {
    Camera = require('expo-camera').Camera;
    Location = require('expo-location');
    ImageManipulator = require('expo-image-manipulator');
  } catch (error) {
    console.warn('Native modules not available:', error);
  }
}
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Colors } from '../utils/theme';
import SuccessOverlay from '../components/SuccessOverlay';

const { width: screenWidth } = Dimensions.get('window');

interface PhotoData {
  uri: string;
  base64: string;
  width: number;
  height: number;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export default function PhotoCaptureScreen() {
  const { dispatchId, siteId } = useLocalSearchParams<{
    dispatchId: string;
    siteId: string;
  }>();
  
  const { currentUser } = useAuth();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [photoType, setPhotoType] = useState<'before' | 'after'>('before');
  const [category, setCategory] = useState('plowing');
  const [notes, setNotes] = useState('');
  const [weatherConditions, setWeatherConditions] = useState('');
  const [temperature, setTemperature] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'web' || !Camera || !Location) {
      setHasCameraPermission(false);
      return;
    }

    try {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus === 'granted');
      
      // Request location permission for GPS metadata
      await Location.requestForegroundPermissionsAsync();
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setHasCameraPermission(false);
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      });

      // Get current location
      let locationData;
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      } catch (error) {
        console.warn('Could not get location:', error);
      }

      // Create thumbnail for better performance
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const photoData: PhotoData = {
        uri: photo.uri,
        base64: manipulatedImage.base64!,
        width: manipulatedImage.width,
        height: manipulatedImage.height,
        timestamp: new Date(),
        location: locationData,
      };

      setPhotos(prev => [...prev, photoData]);
      setShowCamera(false);
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async () => {
    if (photos.length === 0) {
      Alert.alert('No Photos', 'Please take at least one photo before uploading');
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = photos.map(async (photo, index) => {
        // Create thumbnail (if available)
        let thumbnailBase64 = photo.base64;
        if (ImageManipulator) {
          const thumbnailImage = await ImageManipulator.manipulateAsync(
            photo.uri,
            [{ resize: { width: 200 } }],
            { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );
          thumbnailBase64 = thumbnailImage.base64;
        }

        const photoData = {
          dispatch_id: dispatchId,
          site_id: siteId,
          crew_id: currentUser?.id,
          crew_name: currentUser?.name || 'Unknown User',
          photo_type: photoType,
          category: category,
          image_data: photo.base64,
          thumbnail_data: thumbnailBase64,
          location: photo.location,
          weather_conditions: weatherConditions || null,
          temperature: temperature ? parseFloat(temperature) : null,
          notes: notes || null,
          file_size: Math.round(photo.base64.length * 0.75), // Approximate size from base64
          image_width: photo.width,
          image_height: photo.height,
          device_info: `Mobile Camera - Photo ${index + 1}`,
          is_required: true,
        };

        return api.post('/photos', photoData);
      });

      await Promise.all(uploadPromises);
      
      setSuccessVisible(true);
      setPhotos([]);
      setNotes('');
      setWeatherConditions('');
      setTemperature('');
    } catch (error) {
      console.error('Error uploading photos:', error);
      Alert.alert('Error', 'Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (hasCameraPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasCameraPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color={Colors.gray400} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Please grant camera permission to take photos for work documentation.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showCamera) {
    // Web fallback for camera
    if (Platform.OS === 'web' || !Camera) {
      return (
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowCamera(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Camera Not Available</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <View style={styles.webCameraFallback}>
            <Ionicons name="camera-outline" size={80} color={Colors.gray400} />
            <Text style={styles.webCameraTitle}>Camera Not Available</Text>
            <Text style={styles.webCameraText}>
              Camera functionality is available on mobile devices only
            </Text>
            <TouchableOpacity 
              style={styles.webCameraButton}
              onPress={() => setShowCamera(false)}
            >
              <Text style={styles.webCameraButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <Camera 
          style={styles.camera} 
          ref={cameraRef}
          ratio="16:9"
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity 
                style={styles.cameraCloseButton}
                onPress={() => setShowCamera(false)}
              >
                <Ionicons name="close" size={32} color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>
                {photoType.toUpperCase()} - {category.toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.cameraFooter}>
              <View style={styles.cameraInfo}>
                <Text style={styles.cameraInfoText}>
                  {new Date().toLocaleTimeString()}
                </Text>
                <Text style={styles.cameraInfoText}>
                  Photos: {photos.length}
                </Text>
              </View>
              
              <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </Camera>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Capture</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Photo Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo Type</Text>
          <View style={styles.photoTypeContainer}>
            <TouchableOpacity
              style={[styles.photoTypeButton, photoType === 'before' && styles.photoTypeButtonActive]}
              onPress={() => setPhotoType('before')}
            >
              <Ionicons 
                name="camera-outline" 
                size={24} 
                color={photoType === 'before' ? Colors.white : Colors.primary} 
              />
              <Text style={[styles.photoTypeText, photoType === 'before' && styles.photoTypeTextActive]}>
                Before
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.photoTypeButton, photoType === 'after' && styles.photoTypeButtonActive]}
              onPress={() => setPhotoType('after')}
            >
              <Ionicons 
                name="checkmark-circle-outline" 
                size={24} 
                color={photoType === 'after' ? Colors.white : Colors.primary} 
              />
              <Text style={[styles.photoTypeText, photoType === 'after' && styles.photoTypeTextActive]}>
                After
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {['plowing', 'salting', 'shoveling', 'equipment', 'damage'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryButton, category === cat && styles.categoryButtonActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Current Photos */}
        {photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Captured Photos ({photos.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoPreview}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                  <TouchableOpacity 
                    style={styles.photoRemoveButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={Colors.error} />
                  </TouchableOpacity>
                  <View style={styles.photoTimestamp}>
                    <Text style={styles.photoTimestampText}>
                      {photo.timestamp.toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Weather Conditions</Text>
            <TextInput
              style={styles.input}
              value={weatherConditions}
              onChangeText={setWeatherConditions}
              placeholder="e.g., Light snow, Clear, Overcast"
              placeholderTextColor={Colors.gray400}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Temperature (°C)</Text>
            <TextInput
              style={styles.input}
              value={temperature}
              onChangeText={setTemperature}
              placeholder="e.g., -5"
              keyboardType="numeric"
              placeholderTextColor={Colors.gray400}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes about the work or conditions..."
              multiline
              numberOfLines={3}
              placeholderTextColor={Colors.gray400}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={() => setShowCamera(true)}
          >
            <Ionicons name="camera" size={24} color={Colors.white} />
            <Text style={styles.cameraButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.uploadButton, photos.length === 0 && styles.uploadButtonDisabled]}
            onPress={uploadPhotos}
            disabled={uploading || photos.length === 0}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="cloud-upload" size={24} color={Colors.white} />
            )}
            <Text style={styles.uploadButtonText}>
              {uploading ? 'Uploading...' : `Upload ${photos.length} Photos`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <SuccessOverlay
        visible={successVisible}
        title="Photos Uploaded!"
        message={`Successfully uploaded ${photos.length} ${photoType} photos for ${category} work`}
        onClose={() => {
          setSuccessVisible(false);
          router.back();
        }}
      />
    </ScrollView>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  photoTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  photoTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    gap: 8,
  },
  photoTypeButtonActive: {
    backgroundColor: Colors.primary,
  },
  photoTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  photoTypeTextActive: {
    color: Colors.white,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.white,
  },
  photosScroll: {
    flexDirection: 'row',
  },
  photoPreview: {
    marginRight: 12,
    position: 'relative',
  },
  photoImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  photoRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  photoTimestamp: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  photoTimestampText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 24,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  cameraButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  uploadButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cameraCloseButton: {
    padding: 8,
  },
  cameraTitle: {
    flex: 1,
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginRight: 48,
  },
  cameraFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cameraInfo: {
    alignItems: 'flex-start',
  },
  cameraInfoText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.white,
  },
});