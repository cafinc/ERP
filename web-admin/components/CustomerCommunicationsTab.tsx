'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  MessageSquare,
  MessageCircle,
  Search,
  ArrowUpDown,
  X,
  Send,
  Smartphone,
  PhoneCall,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import api from '@/lib/api';

interface CustomerCommunicationsTabProps {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  communications: any[];
  onRefresh: () => void;
}

export default function CustomerCommunicationsTab({
  customerId,
  customerName,
  customerEmail,
  customerPhone,
  communications,
  onRefresh,
}: CustomerCommunicationsTabProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedComm, setSelectedComm] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [sending, setSending] = useState(false);

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'inapp':
        return <MessageSquare className="w-5 h-5" />;
      case 'sms':
        return <Smartphone className="w-5 h-5" />;
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'phone':
        return <Phone className="w-5 h-5" />;
      default:
        return <MessageSquare className="w-5 h-5" />;
    }
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'inapp':
        return 'bg-orange-500';
      case 'sms':
        return 'bg-green-500';
      case 'email':
        return 'bg-blue-500';
      case 'phone':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Calculate stats
  const stats = {
    total: communications.length,
    inapp: communications.filter((c) => c.type === 'inapp').length,
    sms: communications.filter((c) => c.type === 'sms').length,
    email: communications.filter((c) => c.type === 'email').length,
    phone: communications.filter((c) => c.type === 'phone').length,
  };

  // Filter and sort communications
  let filteredComms = communications;

  // Filter by type
  if (activeFilter !== 'all') {
    filteredComms = filteredComms.filter((c) => c.type === activeFilter);
  }

  // Search filter
  if (searchQuery) {
    filteredComms = filteredComms.filter(
      (c) =>
        (c.content || c.message || c.body || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (c.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.from || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Sort by timestamp
  filteredComms = [...filteredComms].sort((a, b) => {
    const timeA = new Date(a.timestamp || a.created_at).getTime();
    const timeB = new Date(b.timestamp || b.created_at).getTime();
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  // Handle reply
  const handleReply = async () => {
    if (!replyText.trim() || !selectedComm) return;

    setSending(true);
    try {
      if (selectedComm.type === 'inapp') {
        await api.post('/messages/send', {
          customer_id: customerId,
          message: replyText,
          type: 'inapp',
        });
      } else if (selectedComm.type === 'sms') {
        await api.post('/integrations/ringcentral/sms', {
          to: customerPhone,
          message: replyText,
          customer_id: customerId,
        });
      } else if (selectedComm.type === 'email') {
        await api.post('/integrations/gmail/send', {
          to: customerEmail,
          subject: replySubject || `Re: ${selectedComm.subject}`,
          body: replyText,
          customer_id: customerId,
        });
      } else if (selectedComm.type === 'phone') {
        await api.post('/integrations/ringcentral/call-log', {
          phone: customerPhone,
          notes: replyText,
          customer_id: customerId,
        });
      }

      setReplyText('');
      setReplySubject('');
      setShowReplyModal(false);
      onRefresh();
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-600">Total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">{stats.inapp}</p>
          <p className="text-xs text-gray-600">In-App</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{stats.sms}</p>
          <p className="text-xs text-gray-600">SMS</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.email}</p>
          <p className="text-xs text-gray-600">Email</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.phone}</p>
          <p className="text-xs text-gray-600">Phone</p>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="p-4 border-b space-y-4">
        {/* Type Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeFilter === 'all'
                ? 'bg-gray-900 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setActiveFilter('inapp')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeFilter === 'inapp'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            In-App ({stats.inapp})
          </button>
          <button
            onClick={() => setActiveFilter('sms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeFilter === 'sms'
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            SMS ({stats.sms})
          </button>
          <button
            onClick={() => setActiveFilter('email')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeFilter === 'email'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <Mail className="w-4 h-4" />
            Email ({stats.email})
          </button>
          <button
            onClick={() => setActiveFilter('phone')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeFilter === 'phone'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <Phone className="w-4 h-4" />
            Phone ({stats.phone})
          </button>
        </div>

        {/* Search and Sort */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communications..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          </button>
        </div>
      </div>

      {/* Communications List */}
      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {filteredComms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">No communications found</p>
            <p className="text-sm">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Communications will appear here'}
            </p>
          </div>
        ) : (
          filteredComms.map((comm, index) => (
            <div
              key={index}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedComm(comm);
                setShowReplyModal(true);
                if (comm.type === 'email') {
                  setReplySubject(`Re: ${comm.subject || 'No subject'}`);
                }
              }}
            >
              <div className="flex items-start gap-4">
                {/* Type Icon */}
                <div className={`p-3 rounded-lg ${getTypeColor(comm.type)} text-white flex-shrink-0`}>
                  {getTypeIcon(comm.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {comm.subject || comm.title || 'No subject'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {comm.from || (comm.direction === 'outbound' ? 'You' : customerName)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {comm.direction && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            comm.direction === 'outbound'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {comm.direction === 'outbound' ? 'Sent' : 'Received'}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(comm.timestamp || comm.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {comm.content || comm.message || comm.body || 'No content'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedComm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className={`p-6 border-b border-gray-200 ${getTypeColor(selectedComm.type)} bg-opacity-10`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${getTypeColor(selectedComm.type)} text-white`}>
                    {getTypeIcon(selectedComm.type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedComm.subject || selectedComm.title || 'Communication'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedComm.from || (selectedComm.direction === 'outbound' ? 'You' : customerName)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Original Message */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Original Message</span>
                  <span className="text-xs text-gray-500">
                    {new Date(selectedComm.timestamp || selectedComm.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {selectedComm.content || selectedComm.message || selectedComm.body || 'No content'}
                </p>
              </div>

              {/* Reply Form */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Reply</h4>
                
                {selectedComm.type === 'email' && (
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    placeholder="Subject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}

                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    selectedComm.type === 'email'
                      ? 'Type your email reply...'
                      : selectedComm.type === 'sms'
                      ? 'Type your SMS message...'
                      : selectedComm.type === 'phone'
                      ? 'Enter call notes...'
                      : 'Type your message...'
                  }
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={() => setShowReplyModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || sending}
                className={`flex items-center gap-2 px-6 py-2 ${getTypeColor(
                  selectedComm.type
                )} text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
              >
                {sending ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>
                      {selectedComm.type === 'email' && 'Send Email'}
                      {selectedComm.type === 'sms' && 'Send SMS'}
                      {selectedComm.type === 'inapp' && 'Send Message'}
                      {selectedComm.type === 'phone' && 'Log Call'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
