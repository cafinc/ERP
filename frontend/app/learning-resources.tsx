import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from '../utils/api';
import { Colors } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';

interface Document {
  id: string;
  title: string;
  description: string;
  category: string;
  file_name: string;
  file_size?: number;
  featured: boolean;
  visible_to_roles: string[];
  view_count: number;
  created_at: string;
  has_file?: boolean;
}

const CATEGORIES = [
  { value: 'safety_guidelines', label: 'Safety Guidelines', icon: '⚠️', color: '#ef4444' },
  { value: 'service_info', label: 'Service Info', icon: '📋', color: '#3b82f6' },
  { value: 'faqs', label: 'FAQs', icon: '❓', color: '#8b5cf6' },
  { value: 'maintenance_tips', label: 'Maintenance Tips', icon: '🔧', color: '#10b981' },
  { value: 'general', label: 'General', icon: '📄', color: '#6b7280' },
];

export default function LearningResourcesScreen() {
  const { user, userRole } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [featuredDocs, setFeaturedDocs] = useState<Document[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory, searchQuery]);

  const fetchDocuments = async () => {
    try {
      const params: any = {
        role: userRole,
      };
      
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await api.get('/documents', { params });
      const docs = response.data;
      
      // Separate featured docs
      setFeaturedDocs(docs.filter((d: Document) => d.featured));
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (doc: Document) => {
    try {
      setDownloading(doc.id);
      
      // Increment view count
      await api.post(`/documents/${doc.id}/view`);
      
      // Fetch full document with file data
      const response = await api.get(`/documents/${doc.id}`);
      const fullDoc = response.data;
      
      if (!fullDoc.file_data) {
        Alert.alert('Error', 'Document file not found');
        setDownloading(null);
        return;
      }

      if (Platform.OS === 'web') {
        // Web: Open PDF in new tab
        const byteCharacters = atob(fullDoc.file_data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Clean up after a delay
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
      } else {
        // Native: Use WebBrowser to view
        const fileUri = FileSystem.cacheDirectory + doc.file_name;
        await fetch(fileUri, {
          method: 'PUT',
          body: atob(fullDoc.file_data),
        });
        
        // Open with system viewer
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        }
      }
    } catch (error: any) {
      console.error('Error viewing document:', error);
      Alert.alert('Error', 'Failed to open document');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      setDownloading(doc.id);
      
      // Increment view count
      await api.post(`/documents/${doc.id}/view`);
      
      // Fetch full document with file data
      const response = await api.get(`/documents/${doc.id}`);
      const fullDoc = response.data;
      
      if (!fullDoc.file_data) {
        Alert.alert('Error', 'Document file not found');
        return;
      }

      if (Platform.OS === 'web') {
        // Web: Download using browser
        const byteCharacters = atob(fullDoc.file_data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Native: Convert base64 to blob and share
        const byteCharacters = atob(fullDoc.file_data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Create a temporary file URL
        const fileUri = FileSystem.cacheDirectory + doc.file_name;
        const reader = new FileReader();
        
        await new Promise((resolve, reject) => {
          reader.onload = async () => {
            try {
              // Write the file
              const base64Data = (reader.result as string).split(',')[1];
              const fileContent = base64Data;
              
              // Use fetch to write the file (compatible with newer expo)
              await fetch(fileUri, {
                method: 'PUT',
                body: blob,
              });
              
              resolve(null);
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        // Share the file
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Success', 'Document downloaded successfully');
        }
      }
    } catch (error: any) {
      console.error('Error downloading document:', error);
      Alert.alert('Error', 'Failed to download document');
    } finally {
      setDownloading(null);
    }
  };

  const getCategoryInfo = (categoryValue: string) => {
    return CATEGORIES.find(c => c.value === categoryValue) || CATEGORIES[4];
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading resources...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learning Resources</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search documents..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.gray400}
          />
        </View>

        {/* Featured Documents */}
        {featuredDocs.length > 0 && !searchQuery && selectedCategory === 'all' && (
          <View style={styles.featuredSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={20} color="#f59e0b" />
              <Text style={styles.sectionTitle}>Featured Documents</Text>
            </View>
            {featuredDocs.map((doc) => {
              const catInfo = getCategoryInfo(doc.category);
              return (
                <TouchableOpacity
                  key={doc.id}
                  style={styles.featuredCard}
                  onPress={() => handleDownloadDocument(doc)}
                  disabled={downloading === doc.id}
                >
                  <View style={styles.featuredCardHeader}>
                    <Text style={styles.featuredIcon}>{catInfo.icon}</Text>
                    <View style={styles.featuredCardContent}>
                      <Text style={styles.featuredTitle}>{doc.title}</Text>
                      {doc.description && (
                        <Text style={styles.featuredDescription} numberOfLines={2}>
                          {doc.description}
                        </Text>
                      )}
                    </View>
                  </View>
                  {downloading === doc.id ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Ionicons name="download-outline" size={24} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[styles.categoryChip, selectedCategory === cat.value && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat.value)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[styles.categoryChipText, selectedCategory === cat.value && styles.categoryChipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Documents List */}
        <View style={styles.documentsContainer}>
          {documents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={64} color={Colors.gray300} />
              <Text style={styles.emptyStateText}>No documents found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery ? 'Try adjusting your search' : 'Check back later for new resources'}
              </Text>
            </View>
          ) : (
            documents.map((doc) => {
              const catInfo = getCategoryInfo(doc.category);
              return (
                <View
                  key={doc.id}
                  style={styles.documentCard}
                >
                  <View style={styles.documentHeader}>
                    <View style={[styles.categoryBadge, { backgroundColor: catInfo.color + '20' }]}>
                      <Text style={styles.categoryBadgeIcon}>{catInfo.icon}</Text>
                      <Text style={[styles.categoryBadgeText, { color: catInfo.color }]}>
                        {catInfo.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.documentTitle}>{doc.title}</Text>
                  {doc.description && (
                    <Text style={styles.documentDescription} numberOfLines={2}>
                      {doc.description}
                    </Text>
                  )}

                  <View style={styles.documentFooter}>
                    <View style={styles.documentMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="eye-outline" size={14} color={Colors.gray500} />
                        <Text style={styles.metaText}>{doc.view_count} views</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="document-outline" size={14} color={Colors.gray500} />
                        <Text style={styles.metaText}>{formatFileSize(doc.file_size)}</Text>
                      </View>
                    </View>

                    {downloading === doc.id ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity 
                          style={styles.viewButton}
                          onPress={() => handleViewDocument(doc)}
                        >
                          <Ionicons name="eye-outline" size={18} color={Colors.white} />
                          <Text style={styles.viewButtonText}>View</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.downloadButton}
                          onPress={() => handleDownloadDocument(doc)}
                        >
                          <Ionicons name="download-outline" size={18} color={Colors.primary} />
                          <Text style={styles.downloadButtonTextAlt}>Download</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
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
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: Colors.text,
  },
  featuredSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  featuredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  featuredCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  featuredIcon: {
    fontSize: 32,
  },
  featuredCardContent: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  featuredDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  documentsContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  documentCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  categoryBadgeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  documentDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  documentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.gray500,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 6,
  },
  downloadButtonTextAlt: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
