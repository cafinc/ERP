import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../utils/api';
import { Colors } from '../utils/theme';

interface Document {
  id?: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: string; // 'pdf', 'image', 'video'
  category: string;
  created_at: string;
}

export default function LearnAboutUsScreen() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      // For now, we'll use mock data until we implement the backend
      const mockDocuments: Document[] = [
        {
          id: '1',
          title: 'Snow Removal Services Overview',
          description: 'Learn about our comprehensive snow removal services',
          file_url: 'https://example.com/snow-services.pdf',
          file_type: 'pdf',
          category: 'Services',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Winter Safety Guidelines',
          description: 'Important safety information for winter weather',
          file_url: 'https://example.com/winter-safety.pdf',
          file_type: 'pdf',
          category: 'Safety',
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'CAF Property Services Brochure',
          description: 'Our company overview and service offerings',
          file_url: 'https://example.com/brochure.pdf',
          file_type: 'pdf',
          category: 'Company',
          created_at: new Date().toISOString(),
        },
      ];

      setDocuments(mockDocuments);
      setCategories(['all', ...new Set(mockDocuments.map(doc => doc.category))]);
    } catch (error) {
      console.error('Error fetching documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return 'document-text';
      case 'image':
        return 'image';
      case 'video':
        return 'videocam';
      default:
        return 'document';
    }
  };

  const getDocumentColor = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return Colors.error;
      case 'image':
        return Colors.success;
      case 'video':
        return Colors.primary;
      default:
        return Colors.gray500;
    }
  };

  const handleDocumentPress = (document: Document) => {
    Alert.alert(
      document.title,
      `${document.description}\n\nDocument viewing will be available soon.`,
      [{ text: 'OK' }]
    );
  };

  const filteredDocuments = selectedCategory === 'all' 
    ? documents 
    : documents.filter(doc => doc.category === selectedCategory);

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
        <Text style={styles.headerTitle}>Learn About What We Do</Text>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextSelected,
                ]}
              >
                {category === 'all' ? 'All Documents' : category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {filteredDocuments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No documents available</Text>
            <Text style={styles.emptyStateSubtext}>
              Documents will appear here when they are added by the administrator
            </Text>
          </View>
        ) : (
          filteredDocuments.map((document) => (
            <TouchableOpacity
              key={document.id}
              style={styles.documentCard}
              onPress={() => handleDocumentPress(document)}
            >
              <View style={styles.documentHeader}>
                <View
                  style={[
                    styles.documentIconContainer,
                    { backgroundColor: `${getDocumentColor(document.file_type)}20` },
                  ]}
                >
                  <Ionicons
                    name={getDocumentIcon(document.file_type) as any}
                    size={28}
                    color={getDocumentColor(document.file_type)}
                  />
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentTitle}>{document.title}</Text>
                  {document.description && (
                    <Text style={styles.documentDescription} numberOfLines={2}>
                      {document.description}
                    </Text>
                  )}
                  <View style={styles.documentMeta}>
                    <View style={[styles.categoryBadge, { backgroundColor: `${Colors.primary}20` }]}>
                      <Text style={[styles.categoryBadgeText, { color: Colors.primary }]}>
                        {document.category}
                      </Text>
                    </View>
                    <Text style={styles.fileType}>{document.file_type.toUpperCase()}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.gray400} />
              </View>
            </TouchableOpacity>
          ))
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  categoryContainer: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginRight: 12,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
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
    color: Colors.gray600,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.gray400,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  documentCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  documentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: 14,
    color: Colors.gray600,
    marginBottom: 8,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  fileType: {
    fontSize: 12,
    color: Colors.gray500,
    fontWeight: '600',
  },
});