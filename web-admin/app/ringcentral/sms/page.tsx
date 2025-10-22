'use client';

import { useState, useEffect } from 'react';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import api from '@/lib/api';
import {
  MessageSquare,
  Send,
  RefreshCw,
  Search,
  Filter,
  Phone,
  Clock,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function SMSPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [toNumber, setToNumber] = useState('');
  const [messageText, setMessageText] = useState('');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMessages();
  }, [currentPage, filterDirection]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params: any = {
        per_page: 50,
        page: currentPage,
      };
      
      if (filterDirection !== 'all') {
        params.direction = filterDirection;
      }

      const response = await api.get('/ringcentral/sms/messages', { params });
      setMessages(response.data.records || []);
      
      const paging = response.data.paging || {};
      setTotalPages(Math.ceil((paging.totalElements || 0) / (paging.perPage || 50)));
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!toNumber || !messageText) {
      alert('Please enter both phone number and message');
      return;
    }

    try {
      setSendingMessage(true);
      await api.post('/ringcentral/sms/send', {
        to: toNumber,
        text: messageText,
      });

      alert('Message sent successfully!');
      setToNumber('');
      setMessageText('');
      setShowCompose(false);
      fetchMessages();
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(error.response?.data?.detail || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      msg.subject?.toLowerCase().includes(query) ||
      msg.from?.phoneNumber?.includes(query) ||
      msg.to?.some((t: any) => t.phoneNumber?.includes(query))
    );
  });

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <HybridNavigationTopBar>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SMS Messages</h1>
            <p className="text-gray-600">Send and manage SMS messages</p>
          </div>
          <button
            onClick={() => setShowCompose(!showCompose)}
            className="flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#2c5282] text-white rounded-lg font-medium transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Compose SMS</span>
          </button>
        </div>

        {/* Compose Panel */}
        {showCompose && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Message</h3>
            <form onSubmit={handleSendMessage}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To (Phone Number)
                  </label>
                  <input
                    type="tel"
                    value={toNumber}
                    onChange={(e) => setToNumber(e.target.value)}
                    placeholder="+1234567890"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    rows={4}
                    maxLength={1000}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">{messageText.length}/1000 characters</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="submit"
                    disabled={sendingMessage}
                    className="flex items-center space-x-2 px-6 py-2 bg-[#3f72af] hover:bg-[#2c5282] disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {sendingMessage ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{sendingMessage ? 'Sending...' : 'Send Message'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCompose(false)}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={filterDirection}
              onChange={(e) => setFilterDirection(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Messages</option>
              <option value="Inbound">Received</option>
              <option value="Outbound">Sent</option>
            </select>
            <button
              onClick={fetchMessages}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No messages found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          message.direction === 'Inbound' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          <Phone className={`w-4 h-4 ${
                            message.direction === 'Inbound' ? 'text-green-600' : 'text-[#3f72af]'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {message.direction === 'Inbound' ? 'From' : 'To'}:{' '}
                            {formatPhoneNumber(
                              message.direction === 'Inbound'
                                ? message.from?.phoneNumber
                                : message.to?.[0]?.phoneNumber
                            )}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center space-x-2">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(message.creationTime)}</span>
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 ml-12">{message.subject}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {message.readStatus === 'Read' && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        message.messageStatus === 'Sent' || message.messageStatus === 'Received'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {message.messageStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </HybridNavigationTopBar>
  );
}
