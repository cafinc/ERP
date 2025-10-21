import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  useWindowDimensions,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useMessaging } from '../../contexts/MessagingContext';
import { Colors } from '../../utils/theme';
import WebAdminLayout from '../../components/WebAdminLayout';
import StatusIndicator from '../../components/StatusIndicator';
import EmailDetailView from '../../components/EmailDetailView';
import api from '../../utils/api';

// Separate component for message board content
function MessageBoardContent() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages');
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (filterStatus === 'all') return true;
    return msg.status === filterStatus;
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'pending': return { backgroundColor: '#fef3c7', color: '#f59e0b' };
      case 'in_progress': return { backgroundColor: '#dbeafe', color: '#3b82f6' };
      case 'resolved': return { backgroundColor: '#dcfce7', color: '#22c55e' };
      default: return { backgroundColor: '#f3f4f6', color: '#6b7280' };
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'alert-circle';
      case 'high': return 'arrow-up-circle';
      case 'medium': return 'remove-circle';
      case 'low': return 'arrow-down-circle';
      default: return 'help-circle';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading feedback messages...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Filter tabs */}
      <View style={styles.boardFilterSection}>
        <View style={styles.boardTabContainer}>
          <TouchableOpacity 
            style={[styles.boardTab, filterStatus === 'all' && styles.boardTabActive]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[styles.boardTabText, filterStatus === 'all' && styles.boardTabTextActive]}>
              All ({messages.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.boardTab, filterStatus === 'pending' && styles.boardTabActive]}
            onPress={() => setFilterStatus('pending')}
          >
            <Text style={[styles.boardTabText, filterStatus === 'pending' && styles.boardTabTextActive]}>
              Pending ({messages.filter(m => m.status === 'pending').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.boardTab, filterStatus === 'in_progress' && styles.boardTabActive]}
            onPress={() => setFilterStatus('in_progress')}
          >
            <Text style={[styles.boardTabText, filterStatus === 'in_progress' && styles.boardTabTextActive]}>
              In Progress ({messages.filter(m => m.status === 'in_progress').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.boardTab, filterStatus === 'resolved' && styles.boardTabActive]}
            onPress={() => setFilterStatus('resolved')}
          >
            <Text style={[styles.boardTabText, filterStatus === 'resolved' && styles.boardTabTextActive]}>
              Resolved ({messages.filter(m => m.status === 'resolved').length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages list */}
      <FlatList
        data={filteredMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.messageCard}>
            <View style={styles.messageHeader}>
              <View style={styles.messageHeaderLeft}>
                <Ionicons 
                  name={getPriorityIcon(item.priority)} 
                  size={20} 
                  color={item.priority === 'urgent' ? '#ef4444' : item.priority === 'high' ? '#f59e0b' : '#6b7280'} 
                />
                <Text style={styles.messageTitle}>{item.title}</Text>
              </View>
              <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
                <Text style={[styles.statusBadgeText, { color: getStatusBadgeStyle(item.status).color }]}>
                  {item.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.messageContent} numberOfLines={2}>{item.content}</Text>
            <View style={styles.messageFooter}>
              <Text style={styles.messageFrom}>From: {item.from_user_name || 'Unknown'}</Text>
              <Text style={styles.messageDate}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbox-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No feedback messages</Text>
          </View>
        }
        contentContainerStyle={filteredMessages.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
}

function MessagesContent() {
  const { isAdmin, isCrew, isCustomer } = useAuth();
  const { conversations, gmailEmails, messageableUsers, openChat } = useMessaging();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;
  
  const [selectedTab, setSelectedTab] = useState<'all' | 'direct' | 'sms' | 'email' | 'feedback'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [showEmailDetail, setShowEmailDetail] = useState(false);

  // Combine conversations, messageable users, and Gmail emails
  const allContacts = [
    ...conversations.map(conv => ({
      ...conv.other_user,
      id: conv.other_user?.id || conv.id,
      name: conv.other_user?.name || '',
      role: conv.other_user?.role || 'customer',
      title: conv.other_user?.title,
      status: conv.other_user?.status,
      hasConversation: true,
      conversationType: conv.type,
      customerId: conv.customer_id,
      lastMessage: conv.last_message,
      unreadCount: typeof conv.unread_count === 'number' ? conv.unread_count : 0
    })),
    ...messageableUsers.filter(user => 
      !conversations.some(conv => conv.other_user?.id === user.id)
    ).map(user => ({
      ...user,
      hasConversation: false,
      conversationType: undefined,
      lastMessage: undefined,
      unreadCount: 0
    }))
    // Gmail emails removed - use dedicated Gmail page instead
  ];

  const filteredContacts = allContacts.filter(contact => {
    const matchesSearch = contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.title && contact.title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesTab = true;
    if (selectedTab === 'direct') {
      matchesTab = contact.conversationType !== 'sms' && contact.conversationType !== 'email';
    } else if (selectedTab === 'sms') {
      matchesTab = contact.conversationType === 'sms';
    } else if (selectedTab === 'email') {
      matchesTab = contact.conversationType === 'email';
    }
    
    return matchesSearch && matchesTab;
  });

  const handleSelectContact = async (contact: any) => {
    // If it's an email, show email detail view
    if (contact.conversationType === 'email' && contact.gmailData) {
      setSelectedEmail(contact.gmailData);
      setShowEmailDetail(true);
    } else {
      // Regular chat flow
      await openChat(contact);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin': return { backgroundColor: '#dbeafe', borderColor: '#3b82f6' };
      case 'crew': return { backgroundColor: '#dcfce7', borderColor: '#22c55e' };
      case 'customer': return { backgroundColor: '#fef3c7', borderColor: '#f59e0b' };
      default: return { backgroundColor: '#f3f4f6', borderColor: '#9ca3af' };
    }
  };

  // Don't replace the entire view for feedback, just change what's rendered below
  const renderContent = () => {
    if (selectedTab === 'feedback') {
      return <MessageBoardContent />;
    }

    // Show conversation list
    return (
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => handleSelectContact(item)}
          >
            <View style={styles.userItemLeft}>
              <StatusIndicator status={item.status || 'offline'} size={14} />
              <View style={styles.userItemInfo}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <Text style={styles.userItemName}>{item.name}</Text>
                  {item.conversationType === 'sms' && (
                    <View style={styles.smsBadge}>
                      <Text style={styles.smsBadgeText}>SMS</Text>
                    </View>
                  )}
                  {item.conversationType === 'email' && (
                    <View style={styles.emailBadge}>
                      <Text style={styles.emailBadgeText}>EMAIL</Text>
                    </View>
                  )}
                </View>
                {item.title && (
                  <Text style={styles.userItemTitle}>{item.title}</Text>
                )}
                {item.lastMessage && (
                  <Text style={styles.lastMessage} numberOfLines={2}>{item.lastMessage}</Text>
                )}
              </View>
            </View>
            <View style={styles.userItemRight}>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                </View>
              )}
              <View style={[styles.roleBadge, getRoleBadgeStyle(item.role)]}>
                <Text style={styles.roleBadgeText}>
                  {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              Start a conversation by clicking on a contact above
            </Text>
          </View>
        }
        contentContainerStyle={filteredContacts.length === 0 ? styles.emptyList : undefined}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.pageTitle}>Communication Center</Text>
      </View>

      {/* Tabs and Search */}
      <View style={styles.filterSection}>
        {/* Tabs for filtering */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
            onPress={() => setSelectedTab('all')}
          >
            <Ionicons name="apps" size={16} color={selectedTab === 'all' ? '#ffffff' : '#6b7280'} />
            <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
              All ({allContacts.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'direct' && styles.tabActive]}
            onPress={() => setSelectedTab('direct')}
          >
            <Ionicons name="chatbubbles" size={16} color={selectedTab === 'direct' ? '#ffffff' : '#3b82f6'} />
            <Text style={[styles.tabText, selectedTab === 'direct' && styles.tabTextActive]}>
              Direct Messages ({allContacts.filter(c => c.conversationType !== 'sms' && c.conversationType !== 'email').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'sms' && styles.tabActive]}
            onPress={() => setSelectedTab('sms')}
          >
            <Ionicons name="chatbox-ellipses" size={16} color={selectedTab === 'sms' ? '#ffffff' : '#10b981'} />
            <Text style={[styles.tabText, selectedTab === 'sms' && styles.tabTextActive]}>
              SMS ({allContacts.filter(c => c.conversationType === 'sms').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'email' && styles.tabActive]}
            onPress={() => setSelectedTab('email')}
          >
            <Ionicons name="mail" size={16} color={selectedTab === 'email' ? '#ffffff' : '#f59e0b'} />
            <Text style={[styles.tabText, selectedTab === 'email' && styles.tabTextActive]}>
              Email ({allContacts.filter(c => c.conversationType === 'email').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'feedback' && styles.tabActive]}
            onPress={() => setSelectedTab('feedback')}
          >
            <Ionicons name="megaphone" size={16} color={selectedTab === 'feedback' ? '#ffffff' : '#8b5cf6'} />
            <Text style={[styles.tabText, selectedTab === 'feedback' && styles.tabTextActive]}>
              Feedback
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search bar - only show for non-feedback tabs */}
        {selectedTab !== 'feedback' && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search conversations..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}
      </View>

      {/* Render content based on selected tab */}
      {renderContent()}

      {/* Email Detail View */}
      {selectedEmail && (
        <EmailDetailView
          email={selectedEmail}
          visible={showEmailDetail}
          onClose={() => {
            setShowEmailDetail(false);
            setSelectedEmail(null);
          }}
        />
      )}
    </View>
  );
}

export default function Messages() {
  const { isAdmin, isCrew } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;

  if (isDesktop && (isAdmin || isCrew)) {
    return (
      <WebAdminLayout showHeader={false}>
        <MessagesContent />
      </WebAdminLayout>
    );
  }

  return <MessagesContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  titleSection: {
    padding: 20,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  boardFilterSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  boardTabContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  boardTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  boardTabActive: {
    backgroundColor: Colors.primary,
  },
  boardTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  boardTabTextActive: {
    color: '#ffffff',
  },
  messageCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  messageContent: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageFrom: {
    fontSize: 12,
    color: '#9ca3af',
  },
  messageDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterSection: {
    padding: 20,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#111827',
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  userItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userItemInfo: {
    flex: 1,
  },
  userItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userItemTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  lastMessage: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  smsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#d1fae5',
    borderRadius: 4,
  },
  smsBadgeText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
  },
  emailBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#dbeafe',
    borderRadius: 4,
  },
  emailBadgeText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  userItemRight: {
    marginLeft: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
});
