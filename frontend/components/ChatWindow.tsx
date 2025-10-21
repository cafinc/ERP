import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DirectMessage, User } from '../types';
import { useMessaging } from '../contexts/MessagingContext';
import StatusIndicator from './StatusIndicator';
import { Colors } from '../utils/theme';
import { api } from '../utils/api';

interface ChatWindowProps {
  conversationId: string;
  otherUser: User;
  minimized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  conversationType?: 'direct_message' | 'sms';
  customerId?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  otherUser,
  minimized,
  onClose,
  onMinimize,
  onMaximize,
  conversationType = 'direct_message',
  customerId,
}) => {
  const { sendMessage, getMessages } = useMessaging();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const isSMS = conversationType === 'sms';

  useEffect(() => {
    if (!minimized && !conversationId.startsWith('temp_')) {
      loadMessages();
    }
  }, [conversationId, minimized]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      let msgs;
      
      if (isSMS && customerId) {
        // Fetch SMS messages
        const response = await api.get(`/sms-conversation/${customerId}`);
        msgs = response.data;
      } else if (!conversationId.startsWith('temp_')) {
        // Fetch direct messages
        msgs = await getMessages(conversationId);
      } else {
        msgs = [];
      }
      
      setMessages(msgs);
      
      // Scroll to bottom after messages load
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    try {
      if (isSMS && customerId) {
        // Send SMS
        await api.post('/sms-message', {
          customer_id: customerId,
          message: inputText.trim(),
        });
      } else {
        // Send direct message
        await sendMessage(conversationId, inputText.trim(), otherUser.id);
      }
      
      setInputText('');
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  if (minimized) {
    return (
      <TouchableOpacity 
        style={styles.minimizedContainer}
        onPress={onMaximize}
      >
        <View style={styles.minimizedHeader}>
          <View style={styles.minimizedUserInfo}>
            <StatusIndicator status={otherUser.status || 'offline'} size={10} />
            <Text style={styles.minimizedName} numberOfLines={1}>
              {otherUser.name}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={18} color="#6b7280" />
          </TouchableOpacity>
        </View>
        {messages.length > 0 && (
          <Text style={styles.minimizedPreview} numberOfLines={1}>
            {messages[messages.length - 1]?.message}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <StatusIndicator status={otherUser.status || 'offline'} size={12} />
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{otherUser.name}</Text>
              {isSMS && (
                <View style={styles.smsBadge}>
                  <Ionicons name="chatbox-outline" size={12} color="#10b981" />
                  <Text style={styles.smsBadgeText}>SMS</Text>
                </View>
              )}
            </View>
            {otherUser.title && (
              <Text style={styles.userTitle}>{otherUser.title}</Text>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onMinimize} style={styles.actionButton}>
            <Ionicons name="remove" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.actionButton}>
            <Ionicons name="close" size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {loading ? (
          <Text style={styles.loadingText}>Loading messages...</Text>
        ) : messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start the conversation!</Text>
          </View>
        ) : (
          messages.map((msg, index) => {
            const isMyMessage = msg.sender_id !== otherUser.id;
            const showTime = index === messages.length - 1 || 
              (index < messages.length - 1 && 
               messages[index + 1].sender_id !== msg.sender_id);

            return (
              <View
                key={msg.id || index}
                style={[
                  styles.messageBubble,
                  isMyMessage ? styles.myMessage : styles.theirMessage
                ]}
              >
                <Text style={[
                  styles.messageText,
                  isMyMessage ? styles.myMessageText : styles.theirMessageText
                ]}>
                  {msg.message}
                </Text>
                {showTime && (
                  <Text style={[
                    styles.messageTime,
                    isMyMessage ? styles.myMessageTime : styles.theirMessageTime
                  ]}>
                    {formatTime(msg.created_at)}
                  </Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor="#9ca3af"
          multiline={false}
          maxLength={500}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity 
          onPress={handleSend}
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          disabled={!inputText.trim()}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={inputText.trim() ? Colors.primary : '#d1d5db'} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 450,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  minimizedContainer: {
    width: 250,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    padding: 12,
  },
  minimizedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  minimizedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  minimizedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  minimizedPreview: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  smsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  smsBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10b981',
  },
  userTitle: {
    fontSize: 12,
    color: '#e0e7ff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  messagesContent: {
    padding: 12,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  loadingText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    paddingVertical: 20,
  },
  messageBubble: {
    maxWidth: '75%',
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#ffffff',
  },
  theirMessageText: {
    color: '#111827',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: '#e0e7ff',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: '#6b7280',
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatWindow;
