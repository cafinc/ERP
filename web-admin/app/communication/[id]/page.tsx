'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import {
  ArrowLeft,
  Send,
  User,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
  is_own: boolean;
}

interface Conversation {
  id: string;
  other_user: {
    id: string;
    name: string;
    role: string;
    status?: string;
  };
  type: 'direct' | 'sms' | 'email';
  messages: Message[];
}

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const conversationId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchConversation();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const fetchConversation = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/direct-messages/conversation/${conversationId}`);
      setConversation(response.data);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;

    try {
      setSending(true);
      await api.post('/direct-messages', {
        to_user_id: conversation?.other_user?.id,
        content: messageText,
      });
      setMessageText('');
      await fetchConversation();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getTypeIcon = () => {
    switch (conversation?.type) {
      case 'sms': return <Phone className="w-5 h-5" />;
      case 'email': return <Mail className="w-5 h-5" />;
      default: return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getTypeBadge = () => {
    switch (conversation?.type) {
      case 'sms': return 'bg-green-100 text-green-700';
      case 'email': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <PageHeader
          title="Communication Details"
          subtitle="View and manage details"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Communication", href: "/communication" }, { label: "Details" }]}
        />
        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 animate-spin text-[#3f72af] mx-auto mb-4" />
              <p className="text-gray-600">Loading conversation...</p>
            </div></div></div></div>
    );
  }

  if (!conversation) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <PageHeader
          title="Communication Details"
          subtitle="Conversation not found"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Communication", href: "/communication" }, { label: "Details" }]}
        />
        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Conversation not found</p>
              <button
                onClick={() => router.push('/communication')}
                className="mt-4 px-6 py-2 bg-[#3f72af] hover:bg-[#2c5282] text-white rounded-lg font-medium transition-colors"
              >
                Back to Communication Center
              </button></div></div></div></div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/communication')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <User className="w-6 h-6 text-[#3f72af]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {conversation.other_user?.name || 'Unknown User'}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getTypeBadge()}`}>
                    {getTypeIcon()}
                    <span className="ml-1">{conversation.type.toUpperCase()}</span>
                  </span>
                  <span className="text-sm text-gray-500">
                    {conversation.other_user?.role?.charAt(0).toUpperCase() + conversation.other_user?.role?.slice(1)}
                  </span>
                </div></div></div></div>
          <button
            onClick={fetchConversation}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button></div></div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {conversation.messages && conversation.messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No messages yet</p>
                <p className="text-sm text-gray-400 mt-1">Start the conversation by sending a message below</p>
              </div>
            ) : (
              conversation.messages?.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_own ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-3 ${
                      message.is_own
                        ? 'bg-[#3f72af] text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">{message.sender_name}</p>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center justify-end mt-2 space-x-1">
                      <Clock className="w-3 h-3 opacity-70" />
                      <span className="text-xs opacity-70">
                        {new Date(message.created_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div></div></div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div></div>

        {/* Message Input */}
        <div className="bg-white shadow-sm border-t border-gray-200 px-6 py-4 hover:shadow-md transition-shadow">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-3">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={sending || !messageText.trim()}
                className="p-3 bg-[#3f72af] hover:bg-[#2c5282] disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {sending ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <Send className="w-6 h-6" />
                )}
              </button></div>
            <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
          </form></div></div>
  );
}
