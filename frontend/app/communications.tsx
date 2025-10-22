import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function CommunicationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const customerId = params.customerId as string || 'test-customer-1';
  
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'inapp' | 'sms' | 'email' | 'phone'>('inapp');
  const [wsConnected, setWsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/communications?customer_id=${customerId}&type=${activeTab}`
      );
      const data = await response.json();
      setMessages(data.sort((a: any, b: any) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ));
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize WebSocket (mock for now - replace with actual token)
  const connectWebSocket = () => {
    try {
      const wsUrl = BACKEND_URL.replace('http', 'ws');
      const ws = new WebSocket(`${wsUrl}/api/ws/mock-user-id`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        
        if (data.type === 'new_message' && data.customer_id === customerId) {
          fetchMessages(); // Refresh messages
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
    // connectWebSocket(); // Enable when ready
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [activeTab]);

  // File upload
  const uploadFile = async (file: any) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType || 'application/octet-stream',
        name: file.name,
      } as any);
      formData.append('customer_id', customerId);

      const response = await fetch(`${BACKEND_URL}/api/communications/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      return data.file;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // Pick document
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFiles([...selectedFiles, result.assets[0]]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  // Pick image
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFiles([...selectedFiles, result.assets[0]]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!messageText.trim() && selectedFiles.length === 0) {
      Alert.alert('Error', 'Please enter a message or attach a file');
      return;
    }

    setSending(true);
    try {
      // Upload files first
      const uploadedFiles = [];
      for (const file of selectedFiles) {
        const uploaded = await uploadFile(file);
        uploadedFiles.push(uploaded.file_id);
      }

      // Send message
      const response = await fetch(`${BACKEND_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          message: messageText,
          type: activeTab,
          attachments: uploadedFiles,
        }),
      });

      if (response.ok) {
        setMessageText('');
        setSelectedFiles([]);
        fetchMessages();
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Render message item
  const renderMessage = ({ item }: { item: any }) => {
    const isOutbound = item.direction === 'outbound';
    const hasAttachments = item.attachments && item.attachments.length > 0;

    return (
      <View style={[
        styles.messageBubble,
        isOutbound ? styles.messageBubbleOutbound : styles.messageBubbleInbound
      ]}>
        <Text style={[
          styles.messageText,
          isOutbound ? styles.messageTextOutbound : styles.messageTextInbound
        ]}>
          {item.message || item.content}
        </Text>
        
        {hasAttachments && (
          <View style={styles.attachmentContainer}>
            {item.attachments.map((att: any, idx: number) => (
              <View key={idx} style={styles.attachmentItem}>
                <Ionicons name="document-attach" size={16} color={isOutbound ? '#fff' : '#666'} />
                <Text style={[
                  styles.attachmentText,
                  isOutbound ? styles.messageTextOutbound : styles.messageTextInbound
                ]}>
                  {att.filename}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.messageFooter}>
          <Text style={[
            styles.messageTime,
            isOutbound ? styles.messageTextOutbound : styles.messageTextInbound
          ]}>
            {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
          {isOutbound && (
            <Ionicons 
              name={item.read ? "checkmark-done" : "checkmark"} 
              size={16} 
              color={item.read ? "#4CAF50" : "#fff"} 
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Communications</Text>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: wsConnected ? '#4CAF50' : '#999' }]} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['inapp', 'sms', 'email', 'phone'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Ionicons 
              name={
                tab === 'inapp' ? 'chatbubbles' :
                tab === 'sms' ? 'chatbox' :
                tab === 'email' ? 'mail' : 'call'
              } 
              size={20} 
              color={activeTab === tab ? '#007AFF' : '#666'}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start a conversation</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <ScrollView horizontal style={styles.selectedFilesContainer}>
            {selectedFiles.map((file, idx) => (
              <View key={idx} style={styles.selectedFile}>
                {file.mimeType?.startsWith('image/') ? (
                  <Image source={{ uri: file.uri }} style={styles.selectedImage} />
                ) : (
                  <View style={styles.selectedDoc}>
                    <Ionicons name="document" size={32} color="#007AFF" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeFileButton}
                  onPress={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} onPress={pickDocument}>
            <Ionicons name="attach" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
            <Ionicons name="image" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            multiline
            maxLength={1000}
          />
          <TouchableOpacity 
            style={[styles.sendButton, sending && styles.sendButtonDisabled]} 
            onPress={sendMessage}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#007AFF',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  messageList: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  messageBubbleOutbound: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  messageBubbleInbound: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTextOutbound: {
    color: '#fff',
  },
  messageTextInbound: {
    color: '#000',
  },
  attachmentContainer: {
    marginTop: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  attachmentText: {
    fontSize: 14,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.7,
  },
  selectedFilesContainer: {
    maxHeight: 100,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  selectedFile: {
    position: 'relative',
    marginRight: 8,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  selectedDoc: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeFileButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
