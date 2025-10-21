import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../utils/theme';

// Equipment-specific avatars
export const EQUIPMENT_AVATAR_OPTIONS = [
  // Custom Equipment Images
  { id: 'front_end_loader', imageUrl: 'https://customer-assets.emergentagent.com/job_plowpal/artifacts/f5tx7b8j_image.png', name: 'Front End Loader', type: 'image' },
  { id: 'skid_steer', imageUrl: 'https://customer-assets.emergentagent.com/job_plowpal/artifacts/angrj4jy_image.png', name: 'Skid Steer', type: 'image' },
  
  // Snow Removal Equipment
  { id: 'snow_plow', emoji: '🛻', name: 'Pickup Plow', type: 'emoji' },
  { id: 'dump_truck', emoji: '🚚', name: 'Dump Truck', type: 'emoji' },
  { id: 'pickup_truck', emoji: '🚙', name: 'Pickup Truck', type: 'emoji' },
  { id: 'semi_truck', emoji: '🚛', name: 'Semi Truck', type: 'emoji' },
  { id: 'tractor', emoji: '🚜', name: 'Tractor', type: 'emoji' },
  { id: 'excavator', emoji: '🚧', name: 'Excavator', type: 'emoji' },
  
  // Tools & Equipment
  { id: 'shovel', emoji: '⛏️', name: 'Shovel', type: 'emoji' },
  { id: 'toolbox', emoji: '🧰', name: 'Toolbox', type: 'emoji' },
  { id: 'gear', emoji: '⚙️', name: 'Machinery', type: 'emoji' },
  { id: 'wrench', emoji: '🔧', name: 'Wrench', type: 'emoji' },
];

interface EquipmentAvatarPickerProps {
  visible: boolean;
  currentAvatar?: string;
  currentPhoto?: string;
  onClose: () => void;
  onSelectAvatar: (avatarId: string) => void;
  onSelectPhoto: (photoUri: string) => void;
}

export default function EquipmentAvatarPicker({
  visible,
  currentAvatar,
  currentPhoto,
  onClose,
  onSelectAvatar,
  onSelectPhoto,
}: EquipmentAvatarPickerProps) {
  const [selectedTab, setSelectedTab] = useState<'avatars' | 'photo'>('avatars');

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to upload a photo!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        onSelectPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Sorry, we need camera permissions to take a photo!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        onSelectPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      alert('Failed to take photo');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Equipment Picture</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'avatars' && styles.tabActive]}
              onPress={() => setSelectedTab('avatars')}
            >
              <Text style={[styles.tabText, selectedTab === 'avatars' && styles.tabTextActive]}>
                Equipment Avatars
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'photo' && styles.tabActive]}
              onPress={() => setSelectedTab('photo')}
            >
              <Text style={[styles.tabText, selectedTab === 'photo' && styles.tabTextActive]}>
                Custom Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollContent}>
            {selectedTab === 'avatars' ? (
              <View style={styles.avatarsGrid}>
                {EQUIPMENT_AVATAR_OPTIONS.map((avatar) => (
                  <TouchableOpacity
                    key={avatar.id}
                    style={[
                      styles.avatarOption,
                      currentAvatar === avatar.id && styles.avatarOptionSelected,
                    ]}
                    onPress={() => {
                      onSelectAvatar(avatar.id);
                      onClose();
                    }}
                  >
                    {avatar.type === 'image' ? (
                      <Image 
                        source={{ uri: avatar.imageUrl }} 
                        style={styles.avatarImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                    )}
                    <Text style={styles.avatarName}>{avatar.name}</Text>
                    {currentAvatar === avatar.id && (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.photoOptions}>
                {currentPhoto && (
                  <View style={styles.currentPhotoContainer}>
                    <Text style={styles.sectionTitle}>Current Photo</Text>
                    <Image source={{ uri: currentPhoto }} style={styles.currentPhoto} />
                  </View>
                )}
                
                <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
                  <Ionicons name="images" size={24} color={Colors.primary} />
                  <Text style={styles.photoButtonText}>Choose from Library</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                  <Ionicons name="camera" size={24} color={Colors.primary} />
                  <Text style={styles.photoButtonText}>Take Photo</Text>
                </TouchableOpacity>

                {currentPhoto && (
                  <TouchableOpacity
                    style={[styles.photoButton, styles.removeButton]}
                    onPress={() => {
                      onSelectPhoto('');
                      onClose();
                    }}
                  >
                    <Ionicons name="trash" size={24} color={Colors.error} />
                    <Text style={[styles.photoButtonText, styles.removeButtonText]}>
                      Remove Photo
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  scrollContent: {
    flex: 1,
  },
  avatarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  avatarOption: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  avatarOptionSelected: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + '10',
  },
  avatarEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  avatarImage: {
    width: 60,
    height: 60,
    marginBottom: 4,
  },
  avatarName: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  photoOptions: {
    padding: 20,
    gap: 16,
  },
  currentPhotoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  currentPhoto: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: Colors.gray200,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    gap: 12,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  removeButton: {
    backgroundColor: Colors.error + '10',
  },
  removeButtonText: {
    color: Colors.error,
  },
});
