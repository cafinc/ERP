import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GmailEmail } from '../types';
import { Colors } from '../utils/theme';
import api from '../utils/api';

interface EmailDetailViewProps {
  email: GmailEmail;
  visible: boolean;
  onClose: () => void;
  onReply?: (email: GmailEmail) => void;
}

export default function EmailDetailView({ email, visible, onClose }: EmailDetailViewProps) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyMode, setReplyMode] = useState<'reply' | 'reply-all' | 'forward'>('reply');
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;

  // Automatically mark as read when email is opened
  useEffect(() => {
    if (visible && email.is_unread) {
      markAsReadAutomatically();
    }
  }, [visible, email.message_id]);

  const markAsReadAutomatically = async () => {
    try {
      await api.post(`/gmail/mark-read/${email.message_id}`);
    } catch (error) {
      console.error('Error auto-marking as read:', error);
    }
  };

  if (!visible) return null;

  const handleReply = async () => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a reply message');
      return;
    }

    try {
      setSending(true);
      
      const response = await api.post('/gmail/send', {
        to: extractEmailAddress(email.from),
        subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
        body: replyText,
        message_id: email.message_id
      });
      
      if (response.data.success) {
        Alert.alert('Success', 'Reply sent successfully!');
        setShowReplyBox(false);
        setReplyText('');
        onClose();
      }
    } catch (error: any) {
      console.error('Error sending reply:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsRead = async () => {
    try {
      await api.post(`/gmail/mark-read/${email.message_id}`);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleArchive = async () => {
    try {
      await api.post(`/gmail/archive/${email.message_id}`);
      Alert.alert('Success', 'Email archived');
      onClose();
    } catch (error) {
      console.error('Error archiving:', error);
      Alert.alert('Error', 'Failed to archive email');
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Email',
      'Are you sure you want to move this email to trash?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/gmail/delete/${email.message_id}`);
              Alert.alert('Success', 'Email moved to trash');
              onClose();
            } catch (error) {
              console.error('Error deleting:', error);
              Alert.alert('Error', 'Failed to delete email');
            }
          }
        }
      ]
    );
  };

  const extractEmailAddress = (emailString: string): string => {
    const match = emailString.match(/<(.+?)>/);
    return match ? match[1] : emailString;
  };

  const extractDisplayName = (emailString: string): string => {
    if (emailString.includes('<')) {
      return emailString.split('<')[0].trim();
    }
    return emailString.split('@')[0];
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
      });
    } catch (error) {
      return dateString;
    }
  };

  const getInitials = (name: string): string => {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = extractDisplayName(email.from);
  const emailAddress = extractEmailAddress(email.from);

  return (
    <View style={[styles.overlay, isDesktop && styles.overlayDesktop]}>
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        {/* Gmail-style Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#5f6368" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={handleArchive}>
              <Ionicons name="archive-outline" size={20} color="#5f6368" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#5f6368" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleMarkAsRead}>
              <Ionicons name="mail-outline" size={20} color="#5f6368" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="time-outline" size={20} color="#5f6368" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="ellipsis-vertical" size={20} color="#5f6368" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Email Subject */}
          <View style={styles.subjectContainer}>
            <Text style={styles.subject}>{email.subject}</Text>
            {email.is_unread && (
              <View style={styles.unreadDot} />
            )}
          </View>

          {/* Sender Info Card */}
          <View style={styles.senderCard}>
            <View style={styles.senderRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
              </View>
              
              <View style={styles.senderInfo}>
                <View style={styles.senderNameRow}>
                  <Text style={styles.senderName}>{displayName}</Text>
                  {email.is_unread && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>Unread</Text>
                    </View>
                  )}
                </View>
                <View style={styles.emailRow}>
                  <Text style={styles.senderEmail}>{'<'}{emailAddress}{'>'}</Text>
                </View>
                <View style={styles.toRow}>
                  <Text style={styles.toLabel}>to </Text>
                  <Text style={styles.toValue}>me</Text>
                </View>
              </View>

              <Text style={styles.timestamp}>{formatDate(email.date)}</Text>
            </View>
          </View>

          {/* Email Body */}
          <View style={styles.bodyContainer}>
            <Text style={styles.bodyText}>{email.body || email.snippet}</Text>
          </View>

          {/* Reply Box */}
          {showReplyBox && (
            <View style={styles.replyContainer}>
              <View style={styles.replyHeader}>
                <Text style={styles.replyHeaderText}>
                  {replyMode === 'reply' ? 'Reply' : replyMode === 'reply-all' ? 'Reply All' : 'Forward'}
                </Text>
                <TouchableOpacity onPress={() => setShowReplyBox(false)}>
                  <Ionicons name="close" size={24} color="#5f6368" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.replyInput}
                placeholder="Type your reply..."
                placeholderTextColor="#9ca3af"
                value={replyText}
                onChangeText={setReplyText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <View style={styles.replyActions}>
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleReply}
                  disabled={sending}
                >
                  {sending ? (
                    <Text style={styles.sendButtonText}>Sending...</Text>
                  ) : (
                    <Text style={styles.sendButtonText}>Send</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachButton}>
                  <Ionicons name="attach-outline" size={20} color="#5f6368" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Gmail-style Action Bar */}
        {!showReplyBox && (
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.replyButton}
              onPress={() => {
                setReplyMode('reply');
                setShowReplyBox(true);
              }}
            >
              <Ionicons name="arrow-undo-outline" size={18} color="#5f6368" />
              <Text style={styles.actionButtonText}>Reply</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                setReplyMode('reply-all');
                setShowReplyBox(true);
              }}
            >
              <Ionicons name="arrow-undo-outline" size={18} color="#5f6368" />
              <Text style={styles.actionButtonText}>Reply All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                setReplyMode('forward');
                setShowReplyBox(true);
              }}
            >
              <Ionicons name="arrow-redo-outline" size={18} color="#5f6368" />
              <Text style={styles.actionButtonText}>Forward</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
  },
  overlayDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDesktop: {
    width: '90%',
    maxWidth: 1000,
    height: '90%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  subjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  subject: {
    fontSize: 22,
    fontWeight: '400',
    color: '#202124',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1a73e8',
    marginLeft: 8,
  },
  senderCard: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  senderInfo: {
    flex: 1,
  },
  senderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#202124',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unreadBadgeText: {
    fontSize: 11,
    color: '#1a73e8',
    fontWeight: '500',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderEmail: {
    fontSize: 12,
    color: '#5f6368',
  },
  toRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  toLabel: {
    fontSize: 12,
    color: '#5f6368',
  },
  toValue: {
    fontSize: 12,
    color: '#202124',
  },
  timestamp: {
    fontSize: 12,
    color: '#5f6368',
    marginLeft: 8,
  },
  bodyContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#202124',
  },
  replyContainer: {
    marginHorizontal: 24,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e8eaed',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },
  replyHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#202124',
  },
  replyInput: {
    padding: 16,
    fontSize: 14,
    color: '#202124',
    minHeight: 120,
    maxHeight: 240,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e8eaed',
    gap: 12,
  },
  sendButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 18,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  attachButton: {
    padding: 8,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e8eaed',
    backgroundColor: '#ffffff',
    gap: 16,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dadce0',
    backgroundColor: '#ffffff',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dadce0',
    backgroundColor: '#ffffff',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#5f6368',
    fontWeight: '500',
  },
});
