import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../utils/theme';
import { Customer, Site, FormTemplate, Communication, CommunicationType } from '../../types';
import AttachedForms from '../../components/AttachedForms';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams();
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  
  // Communication Center state
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [commTypeFilter, setCommTypeFilter] = useState<string | null>(null);
  const [commReadFilter, setCommReadFilter] = useState<boolean | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendingComm, setSendingComm] = useState(false);
  const [newCommType, setNewCommType] = useState<CommunicationType>('email');
  const [newCommSubject, setNewCommSubject] = useState('');
  const [newCommContent, setNewCommContent] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      const [customerRes, sitesRes, templatesRes, communicationsRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/sites?customer_id=${id}`),
        api.get('/form-templates?form_type=custom'),
        api.get(`/customers/${id}/communications`),
      ]);
      
      setCustomer(customerRes.data);
      setSites(sitesRes.data);
      setFormTemplates(templatesRes.data);
      setCommunications(communicationsRes.data);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      Alert.alert('Error', 'Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddForm = () => {
    if (formTemplates.length === 0) {
      Alert.alert('No Forms Available', 'No customer forms have been created yet.');
      return;
    }

    const templateOptions = formTemplates.map(t => ({ 
      text: t.name, 
      onPress: () => navigateToForm(t.id!) 
    }));
    templateOptions.push({ text: 'Cancel', onPress: () => {}, style: 'cancel' } as any);

    Alert.alert('Select Form', 'Choose a customer form to fill out', templateOptions as any);
  };

  const navigateToForm = (templateId: string) => {
    router.push({
      pathname: '/forms/fill-form',
      params: { 
        templateId, 
        customerId: id,
      },
    });
  };

  const handleEdit = () => {
    setShowActionsMenu(false);
    // Navigate to edit page (we can create this or use a modal)
    router.push({
      pathname: '/customers/create',
      params: { 
        editId: id,
        ...customer,
      },
    });
  };

  const handleArchive = async () => {
    setShowActionsMenu(false);
    Alert.alert(
      'Archive Customer',
      `Are you sure you want to archive ${customer?.name}? This will hide them from the main list but keep their data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'default',
          onPress: async () => {
            try {
              await api.patch(`/customers/${id}`, { archived: true });
              Alert.alert('Success', 'Customer archived successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Error archiving customer:', error);
              Alert.alert('Error', 'Failed to archive customer');
            }
          },
        },
      ]
    );
  };

  const handleUnarchive = async () => {
    setShowActionsMenu(false);
    try {
      await api.patch(`/customers/${id}`, { archived: false });
      Alert.alert('Success', 'Customer restored successfully');
      fetchCustomerDetails(); // Refresh data
    } catch (error) {
      console.error('Error unarchiving customer:', error);
      Alert.alert('Error', 'Failed to restore customer');
    }
  };

  const handleDuplicate = async () => {
    setShowActionsMenu(false);
    Alert.alert(
      'Duplicate Customer',
      `Create a copy of ${customer?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Duplicate',
          onPress: async () => {
            try {
              const duplicateData = {
                ...customer,
                name: `${customer?.name} (Copy)`,
                id: undefined,
                _id: undefined,
                created_at: undefined,
                updated_at: undefined,
              };
              const response = await api.post('/customers', duplicateData);
              Alert.alert('Success', 'Customer duplicated successfully', [
                { 
                  text: 'View Copy', 
                  onPress: () => router.replace(`/customers/${response.data.id || response.data._id}`)
                },
                { text: 'Stay Here', style: 'cancel' }
              ]);
            } catch (error) {
              console.error('Error duplicating customer:', error);
              Alert.alert('Error', 'Failed to duplicate customer');
            }
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    setShowActionsMenu(false);
    try {
      // Create exportable data
      const exportData = {
        customer: customer,
        sites: sites,
        communications: communications,
        exportDate: new Date().toISOString(),
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `customer_${customer?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      
      // For web, download as file
      if (Platform.OS === 'web') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Customer data exported successfully');
      } else {
        // For mobile, we'll show the data in a modal or share it
        Alert.alert(
          'Export Data',
          'Customer data has been prepared. In a production app, this would use the Share API.',
          [{ text: 'OK' }]
        );
        console.log('Export data:', jsonString);
      }
    } catch (error) {
      console.error('Error exporting customer:', error);
      Alert.alert('Error', 'Failed to export customer data');
    }
  };

  const handleDelete = async () => {
    setShowActionsMenu(false);
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to permanently delete ${customer?.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/customers/${id}`);
              Alert.alert('Success', 'Customer deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Error deleting customer:', error);
              Alert.alert('Error', 'Failed to delete customer');
            }
          },
        },
      ]
    );
  };

  const handleSendCommunication = async () => {
    if (!newCommContent.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    if (newCommType === 'email' && !newCommSubject.trim()) {
      Alert.alert('Error', 'Please enter a subject for the email');
      return;
    }

    try {
      setSendingComm(true);
      const payload = {
        customer_id: id,
        type: newCommType,
        subject: newCommType === 'email' ? newCommSubject : undefined,
        content: newCommContent,
      };

      await api.post(`/customers/${id}/communications`, payload);
      Alert.alert('Success', 'Message sent successfully');
      setShowSendModal(false);
      setNewCommType('email');
      setNewCommSubject('');
      setNewCommContent('');
      
      // Refresh communications
      const commRes = await api.get(`/customers/${id}/communications`);
      setCommunications(commRes.data);
    } catch (error) {
      console.error('Error sending communication:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSendingComm(false);
    }
  };

  const handleToggleRead = async (commId: string, currentReadStatus: boolean) => {
    try {
      await api.patch(`/communications/${commId}/read`, null, {
        params: { read: !currentReadStatus },
      });
      
      // Update local state
      setCommunications(communications.map(c =>
        c.id === commId ? { ...c, read: !currentReadStatus } : c
      ));
    } catch (error) {
      console.error('Error toggling read status:', error);
      Alert.alert('Error', 'Failed to update read status');
    }
  };

  // Privacy handler functions
  const handleTogglePrivacy = async (commId: string, currentPrivate: boolean) => {
    if (!isAdmin || !currentUser?.id) return;

    try {
      await api.patch(`/communications/${commId}/privacy`, null, {
        params: {
          is_private: !currentPrivate,
          current_user_id: currentUser.id,
        },
      });

      // Refresh communications
      const commRes = await api.get(`/customers/${id}/communications?current_user_id=${currentUser.id}`);
      setCommunications(commRes.data);

      Alert.alert('Success', `Communication marked as ${!currentPrivate ? 'private' : 'public'}`);
    } catch (error) {
      console.error('Error toggling privacy:', error);
      Alert.alert('Error', 'Failed to update privacy setting');
    }
  };

  const handleRequestAccess = async (commId: string) => {
    if (!isAdmin || !currentUser?.id || !currentUser?.name) return;

    try {
      await api.post(`/communications/${commId}/request-access`, null, {
        params: {
          requester_id: currentUser.id,
          requester_name: currentUser.name,
        },
      });

      Alert.alert('Request Sent', 'Your access request has been sent to the owner');
    } catch (error) {
      console.error('Error requesting access:', error);
      Alert.alert('Error', 'Failed to request access');
    }
  };

  const handleLinkToMessages = async (commId: string) => {
    if (!isAdmin || !currentUser?.id) return;

    try {
      const response = await api.post(`/communications/${commId}/link-to-message`, null, {
        params: {
          customer_id: id,
          current_user_id: currentUser.id,
        },
      });

      if (response.data.already_linked) {
        Alert.alert('Already Linked', 'This communication is already linked to the message board');
      } else {
        Alert.alert('Success', 'Communication linked to message board', [
          { text: 'View Message', onPress: () => router.push('/messages') },
          { text: 'OK' },
        ]);
        
        // Refresh to show linked status
        const commRes = await api.get(`/customers/${id}/communications?current_user_id=${currentUser.id}`);
        setCommunications(commRes.data);
      }
    } catch (error) {
      console.error('Error linking to messages:', error);
      Alert.alert('Error', 'Failed to link to message board');
    }
  };


  const getFilteredCommunications = () => {
    return communications.filter(comm => {
      if (commTypeFilter && comm.type !== commTypeFilter) return false;
      if (commReadFilter !== null && comm.read !== commReadFilter) return false;
      return true;
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Details</Text>
        <TouchableOpacity 
          onPress={() => setShowActionsMenu(true)} 
          style={styles.menuButton}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Actions Menu Modal */}
      <Modal
        visible={showActionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionsMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowActionsMenu(false)}
        >
          <View style={styles.actionsMenu}>
            <TouchableOpacity style={styles.actionItem} onPress={handleEdit}>
              <Ionicons name="create-outline" size={22} color={Colors.primary} />
              <Text style={styles.actionText}>Edit Customer</Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionItem} onPress={handleDuplicate}>
              <Ionicons name="copy-outline" size={22} color={Colors.primary} />
              <Text style={styles.actionText}>Duplicate Customer</Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionItem} onPress={handleExport}>
              <Ionicons name="download-outline" size={22} color={Colors.primary} />
              <Text style={styles.actionText}>Export Data</Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            {customer?.archived ? (
              <TouchableOpacity style={styles.actionItem} onPress={handleUnarchive}>
                <Ionicons name="archive-outline" size={22} color="#10b981" />
                <Text style={[styles.actionText, { color: '#10b981' }]}>Restore Customer</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.actionItem} onPress={handleArchive}>
                <Ionicons name="archive-outline" size={22} color="#f59e0b" />
                <Text style={[styles.actionText, { color: '#f59e0b' }]}>Archive Customer</Text>
              </TouchableOpacity>
            )}

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
              <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete Customer</Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity 
              style={styles.actionItem} 
              onPress={() => setShowActionsMenu(false)}
            >
              <Ionicons name="close-outline" size={22} color={Colors.gray500} />
              <Text style={[styles.actionText, { color: Colors.gray500 }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Customer Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={24} color={Colors.primary} />
            <Text style={styles.cardTitle}>{customer.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail" size={16} color={Colors.gray500} />
            <Text style={styles.contactText}>{customer.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call" size={16} color={Colors.gray500} />
            <Text style={styles.contactText}>{customer.phone}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="home" size={16} color={Colors.gray500} />
            <Text style={styles.contactText}>{customer.address}</Text>
          </View>

          {customer.notes && (
            <View style={[styles.infoRow, { marginTop: 8 }]}>
              <Ionicons name="document-text" size={16} color={Colors.gray500} />
              <Text style={styles.contactText}>{customer.notes}</Text>
            </View>
          )}
        </View>

        {/* Sites */}
        {sites.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📍 Sites ({sites.length})</Text>
            {sites.map(site => (
              <TouchableOpacity
                key={site.id}
                style={styles.listItem}
                onPress={() => router.push(`/sites/${site.id}`)}
              >
                <Ionicons name="location" size={20} color={Colors.primary} />
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemText}>{site.name}</Text>
                  <Text style={styles.listItemSubtext}>{site.location.address}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Customer Forms */}
        <AttachedForms
          entityType="customer"
          entityId={customer.id!}
          entityName={customer.name}
          formType="custom"
          onAddForm={handleAddForm}
        />

        {/* Communication Center */}
        <View style={styles.card}>
          <View style={styles.commHeader}>
            <Text style={styles.sectionTitle}>💬 Communication Center</Text>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => setShowSendModal(true)}
            >
              <Ionicons name="send" size={20} color={Colors.white} />
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterChip, !commTypeFilter && styles.filterChipActive]}
              onPress={() => setCommTypeFilter(null)}
            >
              <Text style={[styles.filterChipText, !commTypeFilter && styles.filterChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                commTypeFilter === 'email' && [styles.filterChipActive, { backgroundColor: '#3b82f6', borderColor: '#3b82f6' }]
              ]}
              onPress={() => setCommTypeFilter('email')}
            >
              <Ionicons
                name="mail"
                size={14}
                color={commTypeFilter === 'email' ? Colors.white : '#3b82f6'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.filterChipText, commTypeFilter === 'email' && styles.filterChipTextActive]}>
                Emails
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                commTypeFilter === 'sms' && [styles.filterChipActive, { backgroundColor: '#10b981', borderColor: '#10b981' }]
              ]}
              onPress={() => setCommTypeFilter('sms')}
            >
              <Ionicons
                name="chatbubble"
                size={14}
                color={commTypeFilter === 'sms' ? Colors.white : '#10b981'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.filterChipText, commTypeFilter === 'sms' && styles.filterChipTextActive]}>
                SMS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                commTypeFilter === 'app_message' && [styles.filterChipActive, { backgroundColor: '#f59e0b', borderColor: '#f59e0b' }]
              ]}
              onPress={() => setCommTypeFilter('app_message')}
            >
              <Ionicons
                name="apps"
                size={14}
                color={commTypeFilter === 'app_message' ? Colors.white : '#f59e0b'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.filterChipText, commTypeFilter === 'app_message' && styles.filterChipTextActive]}>
                App
              </Text>
            </TouchableOpacity>
          </View>

          {/* Read/Unread Filter */}
          <View style={[styles.filterContainer, { marginTop: 8 }]}>
            <TouchableOpacity
              style={[styles.filterChip, commReadFilter === null && styles.filterChipActive]}
              onPress={() => setCommReadFilter(null)}
            >
              <Text style={[styles.filterChipText, commReadFilter === null && styles.filterChipTextActive]}>
                All Messages
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, commReadFilter === false && styles.filterChipActive]}
              onPress={() => setCommReadFilter(false)}
            >
              <Ionicons
                name="mail-unread"
                size={14}
                color={commReadFilter === false ? Colors.white : Colors.primary}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.filterChipText, commReadFilter === false && styles.filterChipTextActive]}>
                Unread
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, commReadFilter === true && styles.filterChipActive]}
              onPress={() => setCommReadFilter(true)}
            >
              <Ionicons
                name="checkmark-done"
                size={14}
                color={commReadFilter === true ? Colors.white : Colors.primary}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.filterChipText, commReadFilter === true && styles.filterChipTextActive]}>
                Read
              </Text>
            </TouchableOpacity>
          </View>

          {/* Communications List */}
          <View style={styles.commList}>
            {getFilteredCommunications().length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color={Colors.gray300} />
                <Text style={styles.emptyStateText}>No communications yet</Text>
              </View>
            ) : (
              getFilteredCommunications().map((comm) => {
                const isOwner = isAdmin && comm.private_owner_id === currentUser?.id;
                const hasAccess = isAdmin && comm.access_granted_to?.includes(currentUser?.id || '');
                const canView = !comm.is_private || isOwner || hasAccess;
                
                return (
                <View key={comm.id} style={[
                  styles.commItem,
                  !comm.read && styles.commItemUnread,
                  comm.is_blurred && styles.commItemBlurred
                ]}>
                  <View style={styles.commItemHeader}>
                    <View style={styles.commTypeIndicator}>
                      {comm.is_private && (
                        <Ionicons
                          name="lock-closed"
                          size={14}
                          color="#ef4444"
                          style={styles.lockIcon}
                        />
                      )}
                      {comm.linked_message_id && (
                        <Ionicons
                          name="link"
                          size={14}
                          color="#8b5cf6"
                          style={styles.lockIcon}
                        />
                      )}
                      <Ionicons
                        name={
                          comm.type === 'email' ? 'mail' :
                          comm.type === 'sms' ? 'chatbubble' : 'apps'
                        }
                        size={16}
                        color={
                          comm.type === 'email' ? '#3b82f6' :
                          comm.type === 'sms' ? '#10b981' : '#f59e0b'
                        }
                      />
                      <Text style={styles.commType}>
                        {comm.type === 'email' ? 'Email' :
                         comm.type === 'sms' ? 'SMS' : 'App Message'}
                      </Text>
                      <Text style={styles.commDirection}>
                        {comm.direction === 'sent' ? '→' : '←'}
                      </Text>
                    </View>
                    <View style={styles.commActions}>
                      {isAdmin && (
                        <TouchableOpacity onPress={() => handleTogglePrivacy(comm.id, comm.is_private || false)}>
                          <Ionicons
                            name={comm.is_private ? 'lock-closed' : 'lock-open'}
                            size={20}
                            color={comm.is_private ? '#ef4444' : Colors.gray400}
                          />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => handleToggleRead(comm.id, comm.read)}>
                        <Ionicons
                          name={comm.read ? 'mail-open' : 'mail-unread'}
                          size={20}
                          color={comm.read ? Colors.gray400 : Colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {comm.subject && (
                    <Text style={[styles.commSubject, comm.is_blurred && styles.blurredText]}>
                      {comm.subject}
                    </Text>
                  )}

                  <Text
                    style={[
                      styles.commContent,
                      !comm.read && styles.commContentUnread,
                      comm.is_blurred && styles.blurredText
                    ]}
                    numberOfLines={3}
                  >
                    {comm.content}
                  </Text>

                  {comm.is_blurred && isAdmin && !hasAccess && !isOwner && (
                    <TouchableOpacity
                      style={styles.requestAccessButton}
                      onPress={() => handleRequestAccess(comm.id)}
                    >
                      <Ionicons name="key" size={16} color={Colors.white} />
                      <Text style={styles.requestAccessText}>Request Access</Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.commFooter}>
                    <Text style={styles.commDate}>
                      {new Date(comm.created_at).toLocaleDateString()} {new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {comm.sent_by_name && (
                      <Text style={styles.commSender}>By: {comm.sent_by_name}</Text>
                    )}
                  </View>

                  {isAdmin && canView && !comm.linked_message_id && (
                    <TouchableOpacity
                      style={styles.linkButton}
                      onPress={() => handleLinkToMessages(comm.id)}
                    >
                      <Ionicons name="link" size={16} color="#8b5cf6" />
                      <Text style={styles.linkButtonText}>Link to Messages</Text>
                    </TouchableOpacity>
                  )}

                  {comm.linked_message_id && (
                    <View style={styles.linkedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                      <Text style={styles.linkedText}>Linked to Messages</Text>
                    </View>
                  )}
                </View>
              )})
            )}
          </View>
        </View>

        {/* Send Message Modal */}
        <Modal
          visible={showSendModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSendModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Send Message</Text>
                <TouchableOpacity onPress={() => setShowSendModal(false)}>
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Message Type */}
                <Text style={styles.inputLabel}>Message Type</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[styles.typeOption, newCommType === 'email' && styles.typeOptionActive]}
                    onPress={() => setNewCommType('email')}
                  >
                    <Ionicons name="mail" size={20} color={newCommType === 'email' ? Colors.white : '#3b82f6'} />
                    <Text style={[styles.typeOptionText, newCommType === 'email' && styles.typeOptionTextActive]}>
                      Email
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typeOption, newCommType === 'sms' && styles.typeOptionActive]}
                    onPress={() => setNewCommType('sms')}
                  >
                    <Ionicons name="chatbubble" size={20} color={newCommType === 'sms' ? Colors.white : '#10b981'} />
                    <Text style={[styles.typeOptionText, newCommType === 'sms' && styles.typeOptionTextActive]}>
                      SMS
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typeOption, newCommType === 'app_message' && styles.typeOptionActive]}
                    onPress={() => setNewCommType('app_message')}
                  >
                    <Ionicons name="apps" size={20} color={newCommType === 'app_message' ? Colors.white : '#f59e0b'} />
                    <Text style={[styles.typeOptionText, newCommType === 'app_message' && styles.typeOptionTextActive]}>
                      App Message
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Subject (for email) */}
                {newCommType === 'email' && (
                  <>
                    <Text style={styles.inputLabel}>Subject</Text>
                    <TextInput
                      style={styles.input}
                      value={newCommSubject}
                      onChangeText={setNewCommSubject}
                      placeholder="Enter subject"
                      placeholderTextColor={Colors.gray400}
                    />
                  </>
                )}

                {/* Message Content */}
                <Text style={styles.inputLabel}>Message</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newCommContent}
                  onChangeText={setNewCommContent}
                  placeholder="Enter your message"
                  placeholderTextColor={Colors.gray400}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowSendModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitButton, sendingComm && styles.submitButtonDisabled]}
                  onPress={handleSendCommunication}
                  disabled={sendingComm}
                >
                  {sendingComm ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="send" size={20} color={Colors.white} />
                      <Text style={styles.submitButtonText}>Send</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
  menuButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsMenu: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    width: '80%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  actionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  listItemSubtext: {
    fontSize: 12,
    color: Colors.gray500,
    marginTop: 2,
  },
  // Communication Center styles
  commHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  commItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  commList: {
    marginTop: 8,
  },
  commItem: {
    padding: 12,
    backgroundColor: Colors.gray50,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gray300,
  },
  commItemUnread: {
    backgroundColor: '#e0f2fe',
    borderLeftColor: Colors.primary,
  },
  commTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commType: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  commDirection: {
    fontSize: 16,
    color: Colors.gray500,
    marginLeft: 4,
  },
  commSubject: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  commContent: {
    fontSize: 14,
    color: Colors.gray600,
    marginTop: 4,
    lineHeight: 20,
  },
  commContentUnread: {
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  commFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  commDate: {
    fontSize: 11,
    color: Colors.gray500,
  },
  commSender: {
    fontSize: 11,
    color: Colors.gray500,
    fontStyle: 'italic',
  },
  commItemBlurred: {
    opacity: 0.6,
  },
  commActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lockIcon: {
    marginRight: 4,
  },
  blurredText: {
    filter: 'blur(4px)',
  },
  requestAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  requestAccessText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3e8ff',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  linkButtonText: {
    color: '#8b5cf6',
    fontSize: 12,
    fontWeight: '600',
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    padding: 4,
    backgroundColor: '#f0fdf4',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  linkedText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.gray400,
    marginTop: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  typeOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  typeOptionTextActive: {
    color: Colors.white,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});