import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Colors } from '../utils/theme';

interface Photo {
  id: string;
  dispatch_id: string;
  site_id: string;
  crew_id: string;
  crew_name: string;
  photo_type: string;
  category: string;
  image_data: string;
  thumbnail_data?: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  weather_conditions?: string;
  temperature?: number;
  notes?: string;
  file_size?: number;
  image_width?: number;
  image_height?: number;
  device_info?: string;
  is_required: boolean;
  is_verified: boolean;
}

interface PhotoSummary {
  total_photos: number;
  verified_photos: number;
  by_type: Record<string, number>;
  by_category: Record<string, number>;
  completion_status: {
    has_before_photos: boolean;
    has_after_photos: boolean;
    is_complete: boolean;
    missing_photos: string[];
  };
}

export default function PhotoGalleryScreen() {
  const { dispatchId, siteId } = useLocalSearchParams<{
    dispatchId?: string;
    siteId?: string;
  }>();
  
  const { currentUser, isAdmin } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoSummary, setPhotoSummary] = useState<PhotoSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'before' | 'after' | 'verified' | 'unverified'>('all');

  useEffect(() => {
    fetchPhotos();
    if (dispatchId) {
      fetchPhotoSummary();
    }
  }, [filter]);

  const fetchPhotos = async () => {
    try {
      const params = new URLSearchParams();
      if (dispatchId) params.append('dispatch_id', dispatchId);
      if (siteId) params.append('site_id', siteId);
      
      if (filter === 'before' || filter === 'after') {
        params.append('photo_type', filter);
      } else if (filter === 'verified') {
        params.append('is_verified', 'true');
      } else if (filter === 'unverified') {
        params.append('is_verified', 'false');
      }
      
      const response = await api.get(`/photos?${params.toString()}`);
      setPhotos(response.data);
    } catch (error) {
      console.error('Error fetching photos:', error);
      Alert.alert('Error', 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotoSummary = async () => {
    if (!dispatchId) return;
    
    try {
      const response = await api.get(`/photos/dispatch/${dispatchId}/summary`);
      setPhotoSummary(response.data);
    } catch (error) {
      console.error('Error fetching photo summary:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPhotos();
    if (dispatchId) {
      await fetchPhotoSummary();
    }
    setRefreshing(false);
  };

  const togglePhotoVerification = async (photo: Photo) => {
    if (!isAdmin) return;
    
    try {
      await api.put(`/photos/${photo.id}`, {
        is_verified: !photo.is_verified
      });
      
      // Update local state
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { ...p, is_verified: !p.is_verified } : p
      ));
      
      if (selectedPhoto && selectedPhoto.id === photo.id) {
        setSelectedPhoto({ ...selectedPhoto, is_verified: !selectedPhoto.is_verified });
      }
      
      await fetchPhotoSummary();
    } catch (error) {
      console.error('Error updating photo verification:', error);
      Alert.alert('Error', 'Failed to update photo verification');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  };

  const renderPhotoCard = (photo: Photo) => {
    const { date, time } = formatTimestamp(photo.timestamp);
    const imageSource = photo.thumbnail_data 
      ? `data:image/jpeg;base64,${photo.thumbnail_data}`
      : `data:image/jpeg;base64,${photo.image_data}`;

    return (
      <TouchableOpacity 
        key={photo.id} 
        style={styles.photoCard}
        onPress={() => {
          setSelectedPhoto(photo);
          setShowModal(true);
        }}
      >
        <Image source={{ uri: imageSource }} style={styles.photoThumbnail} />
        
        <View style={styles.photoInfo}>
          <View style={styles.photoHeader}>
            <View style={[
              styles.typeBadge, 
              photo.photo_type === 'before' ? styles.beforeBadge : styles.afterBadge
            ]}>
              <Text style={styles.typeBadgeText}>{photo.photo_type.toUpperCase()}</Text>
            </View>
            
            {photo.is_verified && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            )}
          </View>
          
          <Text style={styles.categoryText}>{photo.category.toUpperCase()}</Text>
          <Text style={styles.crewText}>By: {photo.crew_name}</Text>
          <Text style={styles.timestampText}>{date} • {time}</Text>
          
          {photo.weather_conditions && (
            <Text style={styles.weatherText}>{photo.weather_conditions}</Text>
          )}
          
          {photo.temperature !== undefined && (
            <Text style={styles.temperatureText}>{photo.temperature}°C</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderPhotoModal = () => {
    if (!selectedPhoto) return null;
    
    const { date, time } = formatTimestamp(selectedPhoto.timestamp);
    const imageSource = `data:image/jpeg;base64,${selectedPhoto.image_data}`;

    return (
      <Modal visible={showModal} animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>
            
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>
                {selectedPhoto.photo_type.toUpperCase()} - {selectedPhoto.category.toUpperCase()}
              </Text>
              <Text style={styles.modalSubtitle}>{date} • {time}</Text>
            </View>
            
            {isAdmin && (
              <TouchableOpacity 
                onPress={() => togglePhotoVerification(selectedPhoto)}
                style={styles.verifyButton}
              >
                <Ionicons 
                  name={selectedPhoto.is_verified ? "checkmark-circle" : "checkmark-circle-outline"} 
                  size={28} 
                  color={selectedPhoto.is_verified ? Colors.success : Colors.white} 
                />
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
            <Image source={{ uri: imageSource }} style={styles.modalImage} resizeMode="contain" />
            
            <View style={styles.modalDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Crew:</Text>
                <Text style={styles.detailValue}>{selectedPhoto.crew_name}</Text>
              </View>
              
              {selectedPhoto.location && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text style={styles.detailValue}>
                    {selectedPhoto.location.latitude.toFixed(6)}, {selectedPhoto.location.longitude.toFixed(6)}
                  </Text>
                </View>
              )}
              
              {selectedPhoto.weather_conditions && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Weather:</Text>
                  <Text style={styles.detailValue}>{selectedPhoto.weather_conditions}</Text>
                </View>
              )}
              
              {selectedPhoto.temperature !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Temperature:</Text>
                  <Text style={styles.detailValue}>{selectedPhoto.temperature}°C</Text>
                </View>
              )}
              
              {selectedPhoto.notes && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Notes:</Text>
                  <Text style={styles.detailValue}>{selectedPhoto.notes}</Text>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={[
                  styles.detailValue, 
                  selectedPhoto.is_verified ? styles.verifiedText : styles.unverifiedText
                ]}>
                  {selectedPhoto.is_verified ? 'VERIFIED' : 'UNVERIFIED'}
                </Text>
              </View>
              
              {selectedPhoto.device_info && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Device:</Text>
                  <Text style={styles.detailValue}>{selectedPhoto.device_info}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Gallery</Text>
        <TouchableOpacity onPress={() => router.push('/photo-capture')} style={styles.addButton}>
          <Ionicons name="camera" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Photo Summary */}
      {photoSummary && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Photo Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{photoSummary.total_photos}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{photoSummary.verified_photos}</Text>
              <Text style={styles.statLabel}>Verified</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{photoSummary.by_type.before || 0}</Text>
              <Text style={styles.statLabel}>Before</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{photoSummary.by_type.after || 0}</Text>
              <Text style={styles.statLabel}>After</Text>
            </View>
          </View>
          
          <View style={[
            styles.completionStatus,
            photoSummary.completion_status.is_complete ? styles.completeStatus : styles.incompleteStatus
          ]}>
            <Ionicons 
              name={photoSummary.completion_status.is_complete ? "checkmark-circle" : "warning"} 
              size={20} 
              color={photoSummary.completion_status.is_complete ? Colors.success : Colors.warning} 
            />
            <Text style={[
              styles.completionText,
              photoSummary.completion_status.is_complete ? styles.completeText : styles.incompleteText
            ]}>
              {photoSummary.completion_status.is_complete 
                ? 'Documentation Complete' 
                : `Missing: ${photoSummary.completion_status.missing_photos.join(', ')} photos`
              }
            </Text>
          </View>
        </View>
      )}

      {/* Filter Buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['all', 'before', 'after', 'verified', 'unverified'].map((filterOption) => (
          <TouchableOpacity
            key={filterOption}
            style={[styles.filterButton, filter === filterOption && styles.filterButtonActive]}
            onPress={() => setFilter(filterOption as any)}
          >
            <Text style={[
              styles.filterText, 
              filter === filterOption && styles.filterTextActive
            ]}>
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Photos Grid */}
      <ScrollView
        style={styles.photosContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {photos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="camera-outline" size={60} color={Colors.gray400} />
            <Text style={styles.emptyTitle}>No Photos Found</Text>
            <Text style={styles.emptyText}>
              {filter === 'all' 
                ? 'No photos have been uploaded for this job yet.'
                : `No ${filter} photos found.`
              }
            </Text>
          </View>
        ) : (
          <View style={styles.photosGrid}>
            {photos.map(renderPhotoCard)}
          </View>
        )}
      </ScrollView>

      {renderPhotoModal()}
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
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
  addButton: {
    padding: 8,
  },
  summaryContainer: {
    backgroundColor: Colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  completionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  completeStatus: {
    backgroundColor: Colors.successLight,
  },
  incompleteStatus: {
    backgroundColor: Colors.warningLight,
  },
  completionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  completeText: {
    color: Colors.success,
  },
  incompleteText: {
    color: Colors.warning,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  photosContainer: {
    flex: 1,
  },
  photosGrid: {
    padding: 16,
  },
  photoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.gray100,
  },
  photoInfo: {
    padding: 16,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  beforeBadge: {
    backgroundColor: Colors.warning,
  },
  afterBadge: {
    backgroundColor: Colors.success,
  },
  typeBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  crewText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  timestampText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  weatherText: {
    fontSize: 12,
    color: Colors.primary,
    fontStyle: 'italic',
  },
  temperatureText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: Colors.white,
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  verifyButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    paddingBottom: 32,
  },
  modalImage: {
    width: '100%',
    height: 400,
    marginBottom: 24,
  },
  modalDetails: {
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  verifiedText: {
    color: Colors.success,
    fontWeight: '600',
  },
  unverifiedText: {
    color: Colors.warning,
    fontWeight: '600',
  },
});