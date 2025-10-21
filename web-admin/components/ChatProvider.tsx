'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import MinimizableChat from './MinimizableChat';

interface ChatWindow {
  conversationId: string;
  title: string;
}

interface ChatContextType {
  openChat: (conversationId: string, title: string) => void;
  closeChat: (conversationId: string) => void;
  minimizedChats: ChatWindow[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChatManager() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatManager must be used within ChatProvider');
  }
  return context;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [minimizedChats, setMinimizedChats] = useState<ChatWindow[]>([]);

  const openChat = (conversationId: string, title: string) => {
    // Check if chat is already open
    const exists = minimizedChats.find(c => c.conversationId === conversationId);
    if (exists) return;

    // Limit to 3 chats max
    if (minimizedChats.length >= 3) {
      // Remove the oldest chat
      setMinimizedChats(prev => [...prev.slice(1), { conversationId, title }]);
    } else {
      setMinimizedChats(prev => [...prev, { conversationId, title }]);
    }
  };

  const closeChat = (conversationId: string) => {
    setMinimizedChats(prev => prev.filter(c => c.conversationId !== conversationId));
  };

  return (
    <ChatContext.Provider value={{ openChat, closeChat, minimizedChats }}>
      {children}
      
      {/* Render Minimizable Chats */}
      {minimizedChats.map((chat, index) => (
        <MinimizableChat
          key={chat.conversationId}
          conversationId={chat.conversationId}
          title={chat.title}
          position={index}
          onClose={() => closeChat(chat.conversationId)}
          onExpand={() => {
            router.push('/messages');
            closeChat(chat.conversationId);
          }}
        />
      ))}
    </ChatContext.Provider>
  );
}
