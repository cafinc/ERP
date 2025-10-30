'use client';

import PageHeader from '@/components/PageHeader';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  MessageCircle,
  Send,
  RefreshCw,
  Users,
  Clock,
} from 'lucide-react';

export default function TeamMessagingPage() {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/ringcentral/team-messages');
      setChats(response.data.records || []);
    } catch (error: any) {
      console.error('Error fetching chats:', error);
      if (error.response?.status === 403) {
        setError('Team Messaging is not enabled for your RingCentral account. Please contact your RingCentral administrator to enable this feature.');
      } else {
        setError('Failed to load team messages. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const response = await api.get('/ringcentral/team-messages', {
        params: { chat_id: chatId },
      });
      setMessages(response.data.records || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || !selectedChat) return;

    try {
      setSending(true);
      await api.post(`/ringcentral/team-messages/${selectedChat.id}`, {
        text: messageText,
      });
      setMessageText('');
      fetchMessages(selectedChat.id);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Messaging"
        subtitle="Manage messaging"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Ringcentral", href: "/ringcentral" }, { label: "Messaging" }]}
      />
      <div className="flex-1 overflow-auto p-6">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Messaging</h1>
          <p className="text-gray-600">Internal team communication</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow" style={{ height: 'calc(100vh - 250px)' }}>
          <div className="grid grid-cols-12 h-full">
            {/* Chat List */}
            <div className="col-span-4 border-r border-gray-200 overflow-y-auto">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Conversations</span>
                  </h3>
                  <button
                    onClick={fetchChats}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button></div></div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#3f72af]" />
                </div>
              ) : error ? (
                <div className="text-center py-12 px-4">
                  <MessageCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
                  <p className="text-red-600 font-semibold mb-2">Feature Not Available</p>
                  <p className="text-gray-600 text-sm">{error}</p>
                  <button
                    onClick={fetchChats}
                    className="mt-4 px-4 py-2 bg-[#3f72af] hover:bg-[#2c5282] text-white rounded-lg text-sm transition-colors"
                  >
                    Retry
                  </button></div>
              ) : chats.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No conversations found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChat(chat)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedChat?.id === chat.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <MessageCircle className="w-5 h-5 text-[#3f72af]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {chat.name || `Chat ${chat.id}`}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {chat.description || 'Team conversation'}
                          </p>
                        </div></div></div>
                  ))}
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div className="col-span-8 flex flex-col">
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">
                      {selectedChat.name || `Chat ${selectedChat.id}`}
                    </h3>
                    {selectedChat.description && (
                      <p className="text-sm text-gray-500">{selectedChat.description}</p>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No messages yet</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div key={message.id} className="flex items-start space-x-3">
                          <div className="p-2 bg-gray-200 rounded-full">
                            <Users className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline space-x-2">
                              <p className="font-medium text-gray-900 text-sm">
                                {message.creatorId}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(message.creationTime)}
                              </p>
                            </div>
                            <p className="text-gray-700 mt-1">{message.text}</p>
                          </div></div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="submit"
                        disabled={sending || !messageText.trim()}
                        className="flex items-center space-x-2 px-6 py-2 bg-[#3f72af] hover:bg-[#2c5282] disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                      >
                        {sending ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                        <span>{sending ? 'Sending...' : 'Send'}</span>
                      </button></form></div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Select a conversation</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Choose a conversation from the list to start messaging
                    </p>
                  </div></div>
              )}
            </div></div></div></div></div></div>);
}
