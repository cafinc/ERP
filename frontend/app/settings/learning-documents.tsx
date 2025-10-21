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
  Modal,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import api from '../../utils/api';
import { Colors } from '../../utils/theme';
import { useAuth } from '../../contexts/AuthContext';
import SuccessOverlay from '../../components/SuccessOverlay';

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

export default function LearningDocumentsScreen() {
  const { isAdmin } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [featured, setFeatured] = useState(false);
  const [visibleToAdmin, setVisibleToAdmin] = useState(true);
  const [visibleToCrew, setVisibleToCrew] = useState(true);
  const [visibleToCustomer, setVisibleToCustomer] = useState(true);
  const [sendNotification, setSendNotification] = useState(true);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory, searchQuery]);

  const fetchDocuments = async () => {
    try {
      const params: any = {};
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await api.get('/documents', { params });
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web-specific file picking
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        input.onchange = (e: any) => {
          const file = e.target.files[0];
          if (file) {
            setSelectedFile({
              name: file.name,
              size: file.size,
              uri: URL.createObjectURL(file),
              file: file, // Store the actual File object for web
            });
          }
        };
        input.click();
      } else {
        // Native file picking
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/pdf',
          copyToCacheDirectory: true,
        });

        if (result.assets && result.assets.length > 0) {
          const file = result.assets[0];
          setSelectedFile(file);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleSubmit = async () => {
    console.log('=== UPLOAD STARTED ===');
    console.log('Title:', title);
    console.log('Category:', category);
    console.log('Selected file:', selectedFile);
    
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title');
      return;
    }

    if (!selectedFile && !editingDoc) {
      Alert.alert('Validation Error', 'Please select a PDF file');
      return;
    }

    setUploading(true);

    try {
      const visibleRoles = [];
      if (visibleToAdmin) visibleRoles.push('admin');
      if (visibleToCrew) visibleRoles.push('crew');
      if (visibleToCustomer) visibleRoles.push('customer');

      console.log('Visible roles:', visibleRoles);

      let fileData = '';
      let fileName = editingDoc?.file_name || '';
      let fileSize = editingDoc?.file_size || 0;

      if (selectedFile) {
        console.log('Reading file from:', selectedFile.uri);
        
        if (Platform.OS === 'web' && selectedFile.file) {
          // Web-specific file reading using FileReader
          const reader = new FileReader();
          fileData = await new Promise((resolve, reject) => {
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1]; // Remove data:application/pdf;base64, prefix
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile.file);
          });
          fileName = selectedFile.name;
          fileSize = selectedFile.size || 0;
        } else {
          // Native file reading using FileReader (works cross-platform)
          const response = await fetch(selectedFile.uri);
          const blob = await response.blob();
          fileData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          fileName = selectedFile.name;
          fileSize = selectedFile.size || 0;
        }
        
        console.log('File read successfully. Size:', fileSize, 'Name:', fileName);
        console.log('Base64 length:', fileData.length);
      }

      if (editingDoc) {
        // Update existing document
        console.log('Updating document:', editingDoc.id);
        const updateData: any = {
          title: title.trim(),
          description: description.trim(),
          category,
          featured,
          visible_to_roles: visibleRoles,
        };

        await api.put(`/documents/${editingDoc.id}`, updateData);
        console.log('Document updated successfully');
        setSuccessMessage('Document updated successfully! 📄');
      } else {
        // Create new document
        console.log('Creating new document...');
        const documentData = {
          title: title.trim(),
          description: description.trim(),
          category,
          file_name: fileName,
          file_data: fileData,
          file_size: fileSize,
          featured,
          visible_to_roles: visibleRoles,
        };

        console.log('Posting document data (file_data length):', fileData.length);
        const response = await api.post('/documents', documentData);
        console.log('Document created successfully:', response.data);
        
        // Send notifications if enabled
        if (sendNotification) {
          console.log('Sending notifications to selected roles:', visibleRoles);
          try {
            // Get all users in the selected roles
            const usersResponse = await api.get('/users');
            const allUsers = usersResponse.data;
            
            // Filter users by selected roles
            const targetUsers = allUsers.filter((user: any) => 
              visibleRoles.includes(user.role)
            );
            
            console.log(`Found ${targetUsers.length} users to notify`);
            
            // Send notification to each user
            for (const user of targetUsers) {
              await api.post('/notifications', null, {
                params: {
                  user_id: user.id,
                  title: 'New Learning Document Available',
                  message: `"${title.trim()}" has been added to Learning Resources`,
                  notification_type: 'document',
                  action_url: '/learning-resources'
                }
              });
            }
            
            console.log('Notifications sent successfully');
          } catch (notifError) {
            console.error('Error sending notifications:', notifError);
            // Don't fail the whole operation if notifications fail
          }
        }
        
        setSuccessMessage('Document uploaded successfully! 📄');
      }

      console.log('Resetting form and showing success');
      resetForm();
      setShowModal(false);
      setShowSuccessOverlay(true);
      
      // Auto-hide after 2 seconds and refresh
      setTimeout(() => {
        setShowSuccessOverlay(false);
        fetchDocuments();
      }, 2000);
    } catch (error: any) {
      console.error('=== ERROR SAVING DOCUMENT ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      Alert.alert('Error', error.response?.data?.detail || error.message || 'Failed to save document');
    } finally {
      setUploading(false);
      console.log('=== UPLOAD FINISHED ===');
    }
  };

  const handleEdit = (doc: Document) => {
    setEditingDoc(doc);
    setTitle(doc.title);
    setDescription(doc.description || '');
    setCategory(doc.category);
    setFeatured(doc.featured);
    setVisibleToAdmin(doc.visible_to_roles.includes('admin'));
    setVisibleToCrew(doc.visible_to_roles.includes('crew'));
    setVisibleToCustomer(doc.visible_to_roles.includes('customer'));
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleDelete = async (doc: Document) => {
    console.log('=== DELETE CLICKED ===');
    console.log('Platform:', Platform.OS);
    console.log('Document to delete:', doc);
    console.log('Is Admin:', isAdmin);
    
    // Use platform-specific confirmation
    let confirmed = false;
    
    if (Platform.OS === 'web') {
      // Web: Use window.confirm
      confirmed = window.confirm(`Are you sure you want to delete "${doc.title}"?`);
    } else {
      // Native: Use Alert.alert with promise wrapper
      confirmed = await new Promise((resolve) => {
        Alert.alert(
          'Delete Document',
          `Are you sure you want to delete "${doc.title}"?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      });
    }
    
    if (!confirmed) {
      console.log('Delete cancelled by user');
      return;
    }
    
    // Proceed with deletion
    try {
      console.log('=== DELETE CONFIRMED ===');
      console.log('Deleting document ID:', doc.id);
      console.log('API URL:', `/documents/${doc.id}`);
      
      const response = await api.delete(`/documents/${doc.id}`);
      console.log('Delete response status:', response.status);
      console.log('Delete response data:', response.data);
      
      setSuccessMessage('Document deleted successfully! 🗑️');
      setShowSuccessOverlay(true);
      
      // Auto-hide after 2 seconds and refresh
      setTimeout(() => {
        setShowSuccessOverlay(false);
        fetchDocuments();
      }, 2000);
    } catch (error: any) {
      console.error('=== DELETE ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      Alert.alert('Error', error.response?.data?.detail || error.message || 'Failed to delete document');
    }
  };

  const resetForm = () => {
    setEditingDoc(null);
    setTitle('');
    setDescription('');
    setCategory('general');
    setFeatured(false);
    setVisibleToAdmin(true);
    setVisibleToCrew(true);
    setVisibleToCustomer(true);
    setSendNotification(true);
    setSelectedFile(null);
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

  const filteredDocuments = documents;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading documents...</Text>
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
        <Text style={styles.headerTitle}>Learning Documents</Text>
        <TouchableOpacity
          onPress={() => {
            resetForm();
            setShowModal(true);
          }}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
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
          {filteredDocuments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={64} color={Colors.gray300} />
              <Text style={styles.emptyStateText}>No documents found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery ? 'Try adjusting your search' : 'Add your first document to get started'}
              </Text>
            </View>
          ) : (
            filteredDocuments.map((doc) => {
              const catInfo = getCategoryInfo(doc.category);
              return (
                <View key={doc.id} style={styles.documentCard}>
                  <View style={styles.documentHeader}>
                    <View style={[styles.categoryBadge, { backgroundColor: catInfo.color + '20' }]}>
                      <Text style={styles.categoryBadgeIcon}>{catInfo.icon}</Text>
                      <Text style={[styles.categoryBadgeText, { color: catInfo.color }]}>
                        {catInfo.label}
                      </Text>
                    </View>
                    {doc.featured && (
                      <View style={styles.featuredBadge}>
                        <Ionicons name="star" size={12} color="#f59e0b" />
                        <Text style={styles.featuredText}>Featured</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.documentTitle}>{doc.title}</Text>
                  {doc.description && (
                    <Text style={styles.documentDescription} numberOfLines={2}>
                      {doc.description}
                    </Text>
                  )}

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

                  <View style={styles.rolesContainer}>
                    {doc.visible_to_roles.map((role) => (
                      <View key={role} style={styles.roleChip}>
                        <Text style={styles.roleChipText}>{role}</Text>
                      </View>
                    ))}
                  </View>

                  {isAdmin && (
                    <View style={styles.documentActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEdit(doc)}
                      >
                        <Ionicons name="create-outline" size={18} color={Colors.primary} />
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDelete(doc)}
                      >
                        <Ionicons name="trash-outline" size={18} color={Colors.error} />
                        <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Upload/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={Colors.gray700} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingDoc ? 'Edit Document' : 'Upload Document'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter document title"
              placeholderTextColor={Colors.gray400}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter document description"
              placeholderTextColor={Colors.gray400}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryOption,
                    category === cat.value && styles.categoryOptionActive,
                  ]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Text style={styles.categoryOptionIcon}>{cat.icon}</Text>
                  <Text style={styles.categoryOptionText}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {!editingDoc && (
              <>
                <Text style={styles.label}>PDF File *</Text>
                <TouchableOpacity style={styles.filePickerButton} onPress={pickDocument}>
                  <Ionicons name="document-attach" size={24} color={Colors.primary} />
                  <Text style={styles.filePickerText}>
                    {selectedFile ? selectedFile.name : 'Choose PDF file'}
                  </Text>
                </TouchableOpacity>
                {selectedFile && (
                  <Text style={styles.fileInfo}>
                    Size: {formatFileSize(selectedFile.size)}
                  </Text>
                )}
              </>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.label}>Featured</Text>
              <Switch
                value={featured}
                onValueChange={setFeatured}
                trackColor={{ false: Colors.gray300, true: Colors.primary }}
              />
            </View>

            <Text style={styles.label}>Visible to Roles</Text>
            <View style={styles.rolesToggle}>
              <View style={styles.roleToggleRow}>
                <Text style={styles.roleLabel}>👔 Admin</Text>
                <Switch
                  value={visibleToAdmin}
                  onValueChange={setVisibleToAdmin}
                  trackColor={{ false: Colors.gray300, true: Colors.primary }}
                />
              </View>
              <View style={styles.roleToggleRow}>
                <Text style={styles.roleLabel}>👷 Crew</Text>
                <Switch
                  value={visibleToCrew}
                  onValueChange={setVisibleToCrew}
                  trackColor={{ false: Colors.gray300, true: Colors.primary }}
                />
              </View>
              <View style={styles.roleToggleRow}>
                <Text style={styles.roleLabel}>👤 Customer</Text>
                <Switch
                  value={visibleToCustomer}
                  onValueChange={setVisibleToCustomer}
                  trackColor={{ false: Colors.gray300, true: Colors.primary }}
                />
              </View>
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.label}>Send Notification</Text>
                <Text style={styles.helperText}>Notify selected roles about this new document</Text>
              </View>
              <Switch
                value={sendNotification}
                onValueChange={setSendNotification}
                trackColor={{ false: Colors.gray300, true: Colors.primary }}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editingDoc ? 'Update Document' : 'Upload Document'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Success Overlay */}
      <SuccessOverlay
        visible={showSuccessOverlay}
        message={successMessage}
        onClose={() => setShowSuccessOverlay(false)}
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
    paddingTop: 48,
    paddingBottom: 16,
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
  addButton: {
    padding: 8,
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
    marginRight: 8,
  },
  categoryBadgeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
  },
  featuredText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: 4,
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
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: Colors.gray500,
    marginLeft: 4,
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  roleChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: Colors.primary + '20',
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
    gap: 4,
  },
  deleteButton: {
    backgroundColor: Colors.error + '10',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  deleteButtonText: {
    color: Colors.error,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  helperText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryOptionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 20,
    gap: 8,
  },
  filePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  fileInfo: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  rolesToggle: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  roleToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  roleLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
