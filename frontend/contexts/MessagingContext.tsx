import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Conversation, DirectMessage, User, GmailEmail } from '../types';
import api from '../utils/api';

interface OpenChat {
  conversation: Conversation;
  otherUser: User;
  minimized: boolean;
}

interface MessagingContextType {
  conversations: Conversation[];
  gmailEmails: GmailEmail[];
  openChats: OpenChat[];
  unreadCount: number;
  messageableUsers: User[];
  loading: boolean;
  openChat: (user: User) => Promise<void>;
  closeChat: (conversationId: string) => void;
  minimizeChat: (conversationId: string) => void;
  maximizeChat: (conversationId: string) => void;
  sendMessage: (receiverId: string, message: string) => Promise<void>;
  getMessages: (conversationId: string) => Promise<DirectMessage[]>;
  refreshConversations: () => Promise<void>;
  refreshGmailEmails: () => Promise<void>;
  updateUserStatus: (status: string) => Promise<void>;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const MessagingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [gmailEmails, setGmailEmails] = useState<GmailEmail[]>([]);
  const [openChats, setOpenChats] = useState<OpenChat[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageableUsers, setMessageableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Delay initialization to ensure authentication is ready
  useEffect(() => {
    const initTimeout = setTimeout(() => {
      console.log('Initializing messaging context...');
      refreshConversations();
      refreshGmailEmails();
      fetchMessageableUsers();
      setIsInitialized(true);
      
      // Poll for new messages every 10 seconds
      const interval = setInterval(() => {
        refreshConversations();
        refreshGmailEmails();
        fetchUnreadCount();
      }, 10000);
      
      return () => clearInterval(interval);
    }, 1000); // Wait 1 second for auth to be ready
    
    return () => clearTimeout(initTimeout);
  }, []);

  const refreshConversations = async () => {
    try {
      const response = await api.get('/unified-conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const refreshGmailEmails = async () => {
    try {
      const response = await api.get('/gmail/emails');
      setGmailEmails(response.data || []);
    } catch (error) {
      console.error('Error fetching Gmail emails:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/direct-messages/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchMessageableUsers = async () => {
    try {
      console.log('Fetching messageable users...');
      const response = await api.get('/users/messageable');
      console.log('Messageable users response:', response.data.length, 'users');
      setMessageableUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const openChat = async (user: User) => {
    try {
      setLoading(true);
      
      // Check if chat already open
      const existingChat = openChats.find(chat => 
        chat.otherUser.id === user.id
      );
      
      if (existingChat) {
        // Maximize if minimized
        maximizeChat(existingChat.conversation.id);
        return;
      }

      // Find or create conversation
      let conversation = conversations.find(conv => 
        conv.participant_ids.includes(user.id)
      );

      if (!conversation) {
        // Conversation doesn't exist yet, create placeholder
        conversation = {
          id: `temp_${user.id}`,
          participant_ids: [user.id],
          participant_names: [user.name],
          participant_titles: [user.title || ''],
          unread_count: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      // Limit to 3 open chats
      const newChats = [...openChats];
      if (newChats.length >= 3) {
        newChats.shift(); // Remove oldest
      }

      newChats.push({
        conversation,
        otherUser: user,
        minimized: false
      });

      setOpenChats(newChats);
    } catch (error) {
      console.error('Error opening chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const closeChat = (conversationId: string) => {
    setOpenChats(openChats.filter(chat => chat.conversation.id !== conversationId));
  };

  const minimizeChat = (conversationId: string) => {
    setOpenChats(openChats.map(chat => 
      chat.conversation.id === conversationId 
        ? { ...chat, minimized: true }
        : chat
    ));
  };

  const maximizeChat = (conversationId: string) => {
    setOpenChats(openChats.map(chat => 
      chat.conversation.id === conversationId 
        ? { ...chat, minimized: false }
        : chat
    ));
  };

  const sendMessage = async (receiverId: string, message: string) => {
    try {
      await api.post('/direct-messages', {
        receiver_id: receiverId,
        message
      });
      
      // Refresh conversations to update last message
      await refreshConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const getMessages = async (conversationId: string): Promise<DirectMessage[]> => {
    try {
      const response = await api.get(`/direct-messages/conversation/${conversationId}`);
      
      // Refresh conversations to reset unread count
      await refreshConversations();
      await fetchUnreadCount();
      
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  };

  const updateUserStatus = async (status: string) => {
    try {
      // Get current user ID from auth context or storage
      // For now, we'll need to pass it when calling
      await api.patch('/users/me/status', { status });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <MessagingContext.Provider
      value={{
        conversations,
        gmailEmails,
        openChats,
        unreadCount,
        messageableUsers,
        loading,
        openChat,
        closeChat,
        minimizeChat,
        maximizeChat,
        sendMessage,
        getMessages,
        refreshConversations,
        refreshGmailEmails,
        updateUserStatus,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};
