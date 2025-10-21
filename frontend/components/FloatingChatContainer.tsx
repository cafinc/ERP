import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  FlatList,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMessaging } from '../contexts/MessagingContext';
import { useAuth } from '../contexts/AuthContext';
import ChatWindow from './ChatWindow';
import StatusIndicator from './StatusIndicator';
import { Colors } from '../utils/theme';
import { User } from '../types';

export const FloatingChatContainer: React.FC = () => {
  const { currentUser } = useAuth();
  const { openChats, closeChat, minimizeChat, maximizeChat, messageableUsers, unreadCount, openChat, conversations } = useMessaging();
  const [showUserList, setShowUserList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Don't render if user is not logged in
  if (!currentUser) {
    return null;
  }
  // Combine conversations and messageable users for display
  const allContacts = [
    // Existing conversations (both DM and SMS)
    ...conversations.map(conv => ({
      ...conv.other_user,
      id: conv.other_user?.id || conv.id,
      hasConversation: true,
      conversationType: conv.type,
      customerId: conv.customer_id,
      lastMessage: conv.last_message,
      unreadCount: typeof conv.unread_count === 'number' ? conv.unread_count : 0
    })),
    // Add messageable users who don't have conversations yet
    ...messageableUsers.filter(user => 
      !conversations.some(conv => conv.other_user?.id === user.id)
    ).map(user => ({
      ...user,
      hasConversation: false
    }))
  ];

  const filteredContacts = allContacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.title && contact.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectContact = async (contact: any) => {
    setShowUserList(false);
    setSearchQuery('');
    await openChat(contact);
  };

  return (
    <>
      {/* Chat Windows - Facebook Messenger style (bottom right) */}
      <View style={[styles.container, Platform.OS === 'web' && styles.containerWeb]}>
        {/* Minimized/Open chat windows in a row */}
        <View style={styles.chatRow}>
          {openChats.map((chat, index) => {
            const conversationType = chat.conversation.type || 'direct_message';
            const customerId = chat.conversation.customer_id;
            
            return (
              <View key={chat.conversation.id} style={styles.chatWindowWrapper}>
                <ChatWindow
                  conversationId={chat.conversation.conversation_id || chat.conversation.id}
                  otherUser={chat.conversation.other_user || chat.otherUser}
                  minimized={chat.minimized}
                  onClose={() => closeChat(chat.conversation.id)}
                  onMinimize={() => minimizeChat(chat.conversation.id)}
                  onMaximize={() => maximizeChat(chat.conversation.id)}
                  conversationType={conversationType}
                  customerId={customerId}
                />
              </View>
            );
          })}
        </View>
      </View>
    </>
  );
};

const getRoleBadgeStyle = (role: string) => {
  switch (role) {
    case 'admin':
      return { backgroundColor: '#eff6ff', borderColor: '#3b82f6' };
    case 'crew':
      return { backgroundColor: '#f0fdf4', borderColor: '#10b981' };
    case 'customer':
      return { backgroundColor: '#fef3c7', borderColor: '#f59e0b' };
    default:
      return { backgroundColor: '#f3f4f6', borderColor: '#9ca3af' };
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    zIndex: 1000,
    gap: 8,
  },
  containerWeb: {
    // Web-specific styles if needed
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  chatWindowWrapper: {
    // Wrapper for each chat window
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 80,
    marginLeft: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  modalContent: {
    width: Platform.OS === 'web' ? '20%' : '100%',
    minWidth: Platform.OS === 'web' ? 350 : undefined,
    maxHeight: '70%',
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
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
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userItemInfo: {
    flex: 1,
  },
  userItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  userItemTitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  lastMessage: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
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

export default FloatingChatContainer;
