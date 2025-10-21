import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image, Modal, FlatList, TextInput, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useMessaging } from '../contexts/MessagingContext';
import { Colors } from '../utils/theme';
import NotificationBell from './NotificationBell';
import StatusIndicator from './StatusIndicator';
import EmailDetailView from './EmailDetailView';
import { GmailEmail } from '../types';
import api from '../utils/api';

export default function EnhancedHeader() {
  const { currentUser, isAdmin, isCrew, isCustomer } = useAuth();
  const { conversations, gmailEmails, messageableUsers, openChat, unreadCount } = useMessaging();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pendingMessages, setPendingMessages] = useState(0);
  const [showChatModal, setShowChatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'direct' | 'sms' | 'email'>('all');
  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);
  const [showEmailDetail, setShowEmailDetail] = useState(false);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Animate dropdown when modal opens/closes
  useEffect(() => {
    if (showChatModal) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showChatModal]);

  useEffect(() => {
    fetchPendingMessages();
    const interval = setInterval(fetchPendingMessages, 30000);
    return () => clearInterval(interval);
  }, [isAdmin, isCrew, currentUser]);

  const fetchPendingMessages = async () => {
    try {
      if (isAdmin) {
        const response = await api.get('/messages/pending-admin');
        setPendingMessages(response.data.length);
      } else if (isCrew && currentUser?.id) {
        const response = await api.get(`/messages/pending-crew/${currentUser.id}`);
        setPendingMessages(response.data.length);
      }
    } catch (error) {
      console.error('Error fetching pending messages:', error);
    }
  };

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    };
    return currentTime.toLocaleDateString('en-US', options);
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getInitials = () => {
    if (!currentUser?.name) return 'U';
    return currentUser.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getDashboardTitle = () => {
    if (isAdmin) return 'Snow Removal Management';
    if (isCrew) return 'Crew Dashboard';
    if (isCustomer) return 'Customer Portal';
    return 'Dashboard';
  };

  // Combine conversations, messageable users, and Gmail emails
  const allContacts: any[] = [
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
    })),
    ...gmailEmails.map(email => ({
      id: email.id,
      name: email.from.includes('<') ? email.from.split('<')[0].trim() : email.from,
      email: email.from.includes('<') ? email.from.split('<')[1].split('>')[0] : email.from,
      role: 'customer' as const,
      title: undefined,
      status: 'offline' as const,
      hasConversation: true,
      conversationType: 'email' as const,
      lastMessage: email.snippet,
      unreadCount: email.is_unread ? 1 : 0,
      gmailData: email
    }))
  ];

  const filteredContacts = allContacts.filter(contact => {
    // Filter by search query
    const matchesSearch = contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.title && contact.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by selected tab
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
      setShowChatModal(false);
    } else {
      // Regular chat flow
      setShowChatModal(false);
      setSearchQuery('');
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

  return (
    <View style={styles.headerContainer}>
      {/* Unified Header Row */}
      <View style={styles.unifiedHeader}>
        {/* Left: Logo, Company Name & Dashboard Type */}
        <View style={styles.leftSection}>
          <Image 
            source={require('../assets/logo-white.svg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.brandingInfo}>
            <Text style={styles.companyName}>CAF Property Services</Text>
            <Text style={styles.dashboardType}>{getDashboardTitle()}</Text>
          </View>
        </View>

        {/* Right: Date & Time, Actions & Profile */}
        <View style={styles.rightSection}>
          {/* Date & Time */}
          <View style={styles.dateTimeGroup}>
            <View style={styles.dateTimeContainer}>
              <Ionicons name="calendar-outline" size={16} color={Colors.white} />
              <Text style={styles.dateText}>{formatDate()}</Text>
            </View>
            <View style={styles.dateTimeContainer}>
              <Ionicons name="time-outline" size={16} color={Colors.white} />
              <Text style={styles.timeText}>{formatTime()}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Gmail Button */}
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/gmail')}
          >
            <Ionicons name="mail-outline" size={24} color={Colors.white} />
          </TouchableOpacity>

          {/* Messages Button */}
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setShowChatModal(true)}
          >
            <View style={{ position: 'relative' }}>
              <Ionicons name="chatbubbles-outline" size={24} color={Colors.white} />
              {(unreadCount > 0 || pendingMessages > 0) && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount + pendingMessages}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Notifications Bell */}
          <NotificationBell />

          {/* Settings Button */}
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.white} />
          </TouchableOpacity>

          {/* Profile Section */}
          <TouchableOpacity 
            style={styles.profileSection}
            onPress={() => router.push('/settings/profile')}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {currentUser?.name || 'User'}
              </Text>
              <Text style={styles.userRole}>
                {isAdmin ? 'Admin' : isCrew ? 'Crew' : 'Customer'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Communication Center Dropdown */}
      <Modal
        visible={showChatModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowChatModal(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowChatModal(false)}
        >
          <Animated.View 
            style={[
              styles.dropdownContent,
              {
                transform: [{ translateY: slideAnim }],
                opacity: fadeAnim,
              }
            ]} 
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                {/* Tabs inline - no title */}
                <View style={styles.tabContainerInline}>
                  <TouchableOpacity 
                    style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
                    onPress={() => setSelectedTab('all')}
                  >
                    <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
                      All ({allContacts.length})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.tab, selectedTab === 'direct' && styles.tabActive]}
                    onPress={() => setSelectedTab('direct')}
                  >
                    <Text style={[styles.tabText, selectedTab === 'direct' && styles.tabTextActive]}>
                      Direct Messages ({allContacts.filter(c => c.conversationType !== 'sms' && c.conversationType !== 'email').length})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.tab, selectedTab === 'sms' && styles.tabActive]}
                    onPress={() => setSelectedTab('sms')}
                  >
                    <Text style={[styles.tabText, selectedTab === 'sms' && styles.tabTextActive]}>
                      SMS ({allContacts.filter(c => c.conversationType === 'sms').length})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.tab, selectedTab === 'email' && styles.tabActive]}
                    onPress={() => setSelectedTab('email')}
                  >
                    <Text style={[styles.tabText, selectedTab === 'email' && styles.tabTextActive]}>
                      Email ({allContacts.filter(c => c.conversationType === 'email').length})
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  onPress={() => {
                    setShowChatModal(false);
                    router.push('/(tabs)/messages');
                  }}
                  style={styles.expandButton}
                >
                  <Ionicons name="expand-outline" size={22} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowChatModal(false)}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Search bar full width */}
            <View style={styles.searchContainerFull}>
              <Ionicons name="search" size={18} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search conversations..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userItem}
                  onPress={() => handleSelectContact(item)}
                >
                  <View style={styles.userItemLeft}>
                    <StatusIndicator status={item.status || 'offline'} size={12} />
                    <View style={styles.userItemContent}>
                      <View style={styles.userItemTop}>
                        <View style={styles.userNameSection}>
                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                            <Text style={styles.userItemName}>{item.name}</Text>
                            {item.conversationType === 'sms' && (
                              <View style={{
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                backgroundColor: '#d1fae5',
                                borderRadius: 4
                              }}>
                                <Text style={{fontSize: 10, color: '#10b981', fontWeight: '600'}}>SMS</Text>
                              </View>
                            )}
                            {item.conversationType === 'email' && (
                              <View style={{
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                backgroundColor: '#dbeafe',
                                borderRadius: 4
                              }}>
                                <Text style={{fontSize: 10, color: Colors.primary, fontWeight: '600'}}>EMAIL</Text>
                              </View>
                            )}
                          </View>
                          {item.title && (
                            <Text style={styles.userItemTitle}>{item.title}</Text>
                          )}
                          {item.email && !item.title && (
                            <Text style={styles.userItemTitle}>{item.email}</Text>
                          )}
                        </View>
                        {item.lastMessage && (
                          <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
                        )}
                      </View>
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
                  <Ionicons name="people-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </Text>
                </View>
              }
              style={styles.userList}
            />
          </Animated.View>
        </TouchableOpacity>
      </Modal>

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

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.primary,
  },
  unifiedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    ...Platform.select({
      web: {
        paddingTop: 16,
      },
      default: {
        paddingTop: 50,
      },
    }),
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  logo: {
    width: 60,
    height: 60,
    tintColor: Colors.white,
  },
  brandingInfo: {
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 2,
  },
  dashboardType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateTimeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginRight: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  profileInfo: {
    justifyContent: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    maxWidth: 120,
  },
  userRole: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  modalContent: {
    width: Platform.OS === 'web' ? '40%' : '100%',
    minWidth: Platform.OS === 'web' ? 450 : undefined,
    maxHeight: '52%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingTop: Platform.OS === 'web' ? 80 : 100, // Align with bottom of blue header
  },
  dropdownContent: {
    width: Platform.OS === 'web' ? 550 : '90%',
    maxWidth: 700,
    maxHeight: '65%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    alignSelf: 'flex-end',
    marginRight: Platform.OS === 'web' ? 20 : '5%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  tabContainerInline: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expandButton: {
    padding: 4,
  },
  searchContainerFull: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    height: 40,
  },
  tabContainerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  tabSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
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
    gap: 6,
    minWidth: 200,
    height: 36,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#111827',
  },
  userList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  userItemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  userItemContent: {
    flex: 1,
  },
  userItemTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  userNameSection: {
    flexShrink: 0,
  },
  userItemInfo: {
    flex: 1,
  },
  userItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  userItemTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  lastMessage: {
    fontSize: 11,
    color: '#9ca3af',
    flex: 1,
    marginTop: 2,
  },
  userItemRight: {
    marginLeft: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  roleBadge: {
    paddingHorizontal: 8,
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
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#9ca3af',
    marginTop: 12,
  },
});
