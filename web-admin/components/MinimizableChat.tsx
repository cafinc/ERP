'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import {
  MessageSquare,
  X,
  Minus,
  Send,
  Paperclip,
  Maximize2,
} from 'lucide-react';

interface MinimizableChatProps {
  conversationId: string;
  title: string;
  onClose: () => void;
  onExpand?: () => void;
  position: number; // 0, 1, 2 for multiple chats
}

export default function MinimizableChat({
  conversationId,
  title,
  onClose,
  onExpand,
  position,
}: MinimizableChatProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadMessages();
    
    // Poll for new messages every 5 seconds
    pollIntervalRef.current = setInterval(() => {
      if (!isMinimized) {
        loadMessages(true); // Silent reload
      }
    }, 5000);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [conversationId, isMinimized]);

  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
    }
  }, [messages, isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get(`/messages/conversations/${conversationId}/messages?limit=50`);
      setMessages(res.data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      await api.post('/messages', {
        conversation_id: conversationId,
        content: newMessage,
        attachments: [],
        mentions: [],
      });

      setNewMessage('');
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Position from right: 0 = 320px, 1 = 660px, 2 = 1000px
  const rightPosition = 20 + (position * 340);

  return (
    <div
      className="fixed bottom-0 bg-white rounded-t-lg shadow-2xl border border-gray-200 flex flex-col transition-all duration-300 z-40"
      style={{
        right: `${rightPosition}px`,
        width: '320px',
        height: isMinimized ? '48px' : '480px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-[#3f72af] text-white rounded-t-lg cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <MessageSquare className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium text-sm truncate">{title}</span>
        </div>
        <div className="flex items-center space-x-1">
          {onExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Expand to full view"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Content - Only visible when not minimized */}
      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {loading ? (
              <div className="text-center text-gray-600 text-sm py-4">Loading...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-600 text-sm py-4">No messages yet</div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.sender_role !== 'customer'; // Simplified
                
                return (
                  <div
                    key={message._id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%]`}>
                      {!isOwnMessage && (
                        <p className="text-xs text-gray-600 mb-1">{message.sender_name}</p>
                      )}
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          isOwnMessage
                            ? 'bg-[#3f72af] text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        <p className={`text-xs mt-1 ${isOwnMessage ? 'text-white/70' : 'text-gray-500'}`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-2 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <button
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4 text-gray-600" />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || !newMessage.trim()}
                className="p-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#3f72af]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
