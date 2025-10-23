'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Smartphone,
  Search,
  Filter,
  User,
  Calendar,
  Download,
  RefreshCw,
  X,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  Paperclip as PaperClipIcon,
  Send as PaperAirplaneIcon,
  Smile
} from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface Communication {
  _id: string;
  type: 'inapp' | 'sms' | 'email' | 'phone';
  direction: 'inbound' | 'outbound';
  customer_id?: string;
  customer_name?: string;
  content?: string;
  message?: string;
  subject?: string;
  body?: string;
  from?: string;
  to?: string;
  phone?: string;
  timestamp: string;
  created_at?: string;
  read: boolean;
  status?: string;
  attachments?: any[];
}

export default function UnifiedCommunicationsCenter() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as 'inapp' | 'sms' | 'email' | 'phone' | null;
  const [activeTab, setActiveTab] = useState<'all' | 'inapp' | 'sms' | 'email' | 'phone'>(tabParam || 'all');
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [filteredComms, setFilteredComms] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDirection, setFilterDirection] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Communication[]>([]);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [sending, setSending] = useState(false);
  const [quickComposeText, setQuickComposeText] = useState('');
  const [quickComposeType, setQuickComposeType] = useState<'inapp' | 'sms' | 'email' | 'phone'>('inapp');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  
  const [stats, setStats] = useState({
    total: 0,
    inapp: 0,
    sms: 0,
    email: 0,
    phone: 0,
    unread: 0
  });

  useEffect(() => {
    fetchAllCommunications();
  }, []);

  useEffect(() => {
    filterCommunications();
  }, [activeTab, searchQuery, filterDirection, communications]);

  const fetchAllCommunications = async () => {
    setLoading(true);
    try {
      console.log('Fetching from:', `${BACKEND_URL}/communications/list-all`);
      const response = await fetch(`${BACKEND_URL}/communications/list-all`);
      console.log('Response status:', response.status, response.ok);
      if (response.ok) {
        const data = await response.json();
        console.log('Received data:', data.length, 'communications');
        setCommunications(data);
        calculateStats(data);
      } else {
        console.error('Response not OK:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error fetching communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Communication[]) => {
    setStats({
      total: data.length,
      inapp: data.filter(c => c.type === 'inapp').length,
      sms: data.filter(c => c.type === 'sms').length,
      email: data.filter(c => c.type === 'email').length,
      phone: data.filter(c => c.type === 'phone').length,
      unread: data.filter(c => !c.read).length
    });
  };

  const filterCommunications = () => {
    let filtered = [...communications];

    // Filter by type
    if (activeTab !== 'all') {
      filtered = filtered.filter(c => c.type === activeTab);
    }

    // Filter by direction
    if (filterDirection !== 'all') {
      filtered = filtered.filter(c => c.direction === filterDirection);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.customer_name?.toLowerCase().includes(query) ||
        c.content?.toLowerCase().includes(query) ||
        c.message?.toLowerCase().includes(query) ||
        c.subject?.toLowerCase().includes(query) ||
        c.body?.toLowerCase().includes(query) ||
        c.from?.toLowerCase().includes(query) ||
        c.to?.toLowerCase().includes(query)
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => 
      new Date(b.timestamp || b.created_at || 0).getTime() - 
      new Date(a.timestamp || a.created_at || 0).getTime()
    );

    setFilteredComms(filtered);
  };

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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  const getMessagePreview = (comm: Communication) => {
    if (comm.type === 'email') {
      return comm.body || comm.content || comm.subject || 'No content';
    }
    return comm.message || comm.content || 'No message';
  };

  const exportData = () => {
    const csv = [
      ['Type', 'Direction', 'Customer', 'Message', 'Timestamp', 'Status'].join(','),
      ...filteredComms.map(c => [
        c.type,
        c.direction,
        c.customer_name || c.from || c.to || 'Unknown',
        `"${getMessagePreview(c).replace(/"/g, '""')}"`,
        new Date(c.timestamp || c.created_at || '').toISOString(),
        c.read ? 'Read' : 'Unread'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `communications_${new Date().toISOString()}.csv`;
    a.click();
  };

  const fetchConversationHistory = async (comm: Communication) => {
    setLoadingConversation(true);
    try {
      // Fetch conversation history based on customer_id and type
      const response = await fetch(
        `${BACKEND_URL}/communications?customer_id=${comm.customer_id}&type=${comm.type}&sort=timestamp:asc`
      );
      
      if (response.ok) {
        const data = await response.json();
        setConversationHistory(data);
      } else {
        // If API fails, just show the single message
        setConversationHistory([comm]);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      // Fallback to single message
      setConversationHistory([comm]);
    } finally {
      setLoadingConversation(false);
    }
  };

  const handleMessageClick = async (comm: Communication) => {
    setSelectedComm(comm);
    setShowReplyModal(true);
    setReplyText('');
    setShowEmojiPicker(false);
    
    // Pre-populate subject for email replies
    if (comm.type === 'email' && comm.subject) {
      setReplySubject(comm.subject.startsWith('Re:') ? comm.subject : `Re: ${comm.subject}`);
    } else {
      setReplySubject('');
    }
    
    // Fetch conversation history
    await fetchConversationHistory(comm);
  };
  
  const addEmoji = (emoji: any) => {
    setReplyText(replyText + emoji.native);
    setShowEmojiPicker(false);
  };
  
  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const sendReply = async () => {
    if (!selectedComm) return;
    
    setSending(true);
    
    try {
      let endpoint = '';
      let payload: any = {};

      switch (selectedComm.type) {
        case 'inapp':
          endpoint = '/messages/send';
          payload = {
            customer_id: selectedComm.customer_id,
            message: replyText,
            type: 'inapp'
          };
          break;
        
        case 'sms':
          endpoint = '/communications/sms/send';
          payload = {
            to: selectedComm.from || selectedComm.to || selectedComm.phone,
            message: replyText,
            customer_id: selectedComm.customer_id
          };
          break;
        
        case 'email':
          endpoint = '/gmail/send';
          payload = {
            to: selectedComm.from || selectedComm.to,
            subject: replySubject,
            body: replyText,
            customer_id: selectedComm.customer_id
          };
          break;
        
        case 'phone':
          endpoint = '/communications/phone/log';
          payload = {
            customer_id: selectedComm.customer_id,
            phone: selectedComm.phone || selectedComm.from || selectedComm.to,
            notes: replyText,
            direction: 'outbound',
            duration: 0
          };
          break;
      }

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowReplyModal(false);
        setReplyText('');
        setReplySubject('');
        setSelectedComm(null);
        fetchAllCommunications(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const getReplyPlaceholder = () => {
    if (!selectedComm) return 'Type your reply...';
    
    switch (selectedComm.type) {
      case 'inapp':
        return 'Type your InApp message...';
      case 'sms':
        return 'Type your SMS message...';
      case 'email':
        return 'Type your email message...';
      case 'phone':
        return 'Enter call notes or summary...';
      default:
        return 'Type your reply...';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Unified Communications Center</h1>
                <p className="text-sm text-gray-500 mt-1">All messages, emails, SMS, and calls in one place</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchAllCommunications}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-6 gap-4 mt-4">
            <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500 mt-1">Total</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-white p-4 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-700">{stats.inapp}</div>
              <div className="text-xs text-orange-600 mt-1">InApp</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">{stats.sms}</div>
              <div className="text-xs text-green-600 mt-1">SMS</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{stats.email}</div>
              <div className="text-xs text-blue-600 mt-1">Email</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-700">{stats.phone}</div>
              <div className="text-xs text-purple-600 mt-1">Phone</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-white p-4 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-700">{stats.unread}</div>
              <div className="text-xs text-red-600 mt-1">Unread</div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages, customers, or content..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 border rounded-lg flex items-center gap-2 transition-colors ${
                showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Direction:</span>
                <div className="flex gap-2">
                  {(['all', 'inbound', 'outbound'] as const).map((dir) => (
                    <button
                      key={dir}
                      onClick={() => setFilterDirection(dir)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        filterDirection === dir
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {dir.charAt(0).toUpperCase() + dir.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 border-t border-gray-200 bg-gray-50">
          {[
            { id: 'all' as const, label: 'All Messages', count: stats.total },
            { id: 'inapp' as const, label: 'InApp', count: stats.inapp, color: 'orange' },
            { id: 'sms' as const, label: 'SMS', count: stats.sms, color: 'green' },
            { id: 'email' as const, label: 'Email', count: stats.email, color: 'blue' },
            { id: 'phone' as const, label: 'Phone', count: stats.phone, color: 'purple' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors relative ${
                activeTab === tab.id
                  ? `border-${tab.color || 'blue'}-500 text-${tab.color || 'blue'}-600 bg-white`
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                activeTab === tab.id
                  ? `bg-${tab.color || 'blue'}-100 text-${tab.color || 'blue'}-700`
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Communications List */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading communications...</p>
            </div>
          </div>
        ) : filteredComms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="w-20 h-20 mb-4 opacity-50" />
            <p className="text-lg font-medium">No communications found</p>
            <p className="text-sm mt-2">
              {searchQuery ? 'Try adjusting your search or filters' : 'Communications will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredComms.map((comm) => (
              <div
                key={comm._id}
                onClick={() => handleMessageClick(comm)}
                className={`bg-white rounded-lg border shadow-sm hover:shadow-lg transition-all p-4 cursor-pointer ${
                  !comm.read ? 'border-l-4 border-l-blue-500 bg-blue-50' : 'border-gray-200'
                } hover:border-blue-300`}
              >
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={`p-3 rounded-lg ${getTypeColor(comm.type)} text-white`}>
                    {getTypeIcon(comm.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-900">
                            {comm.customer_name || comm.from || comm.to || 'Unknown'}
                          </span>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          comm.direction === 'inbound'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {comm.direction === 'inbound' ? '← Received' : '→ Sent'}
                        </span>
                        {comm.type === 'email' && comm.subject && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                            {comm.subject}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs font-medium text-gray-700">
                              {formatTimestamp(comm.timestamp || comm.created_at || '')}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(comm.timestamp || comm.created_at || '').toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {comm.read ? (
                          <CheckCircle className="w-4 h-4 text-green-500" title="Read" />
                        ) : (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" title="Unread" />
                        )}
                      </div>
                    </div>

                    <p className="text-gray-700 text-sm line-clamp-2">
                      {getMessagePreview(comm)}
                    </p>

                    {/* Attachments */}
                    {comm.attachments && comm.attachments.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {comm.attachments.length} attachment{comm.attachments.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Compose Area - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl p-4 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Message Type Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setQuickComposeType('inapp')}
                className={`p-2 rounded-lg transition-colors ${
                  quickComposeType === 'inapp' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="InApp Message"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <button
                onClick={() => setQuickComposeType('sms')}
                className={`p-2 rounded-lg transition-colors ${
                  quickComposeType === 'sms' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="SMS"
              >
                <Smartphone className="w-5 h-5" />
              </button>
              <button
                onClick={() => setQuickComposeType('email')}
                className={`p-2 rounded-lg transition-colors ${
                  quickComposeType === 'email' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Email"
              >
                <Mail className="w-5 h-5" />
              </button>
              <button
                onClick={() => setQuickComposeType('phone')}
                className={`p-2 rounded-lg transition-colors ${
                  quickComposeType === 'phone' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Phone Log"
              >
                <Phone className="w-5 h-5" />
              </button>
            </div>

            {/* Attachment Button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  setSelectedFiles(Array.from(e.target.files));
                }
              }}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Attach files"
            >
              <PaperClipIcon className="w-5 h-5" />
            </button>

            {/* Quick Compose Input */}
            <input
              type="text"
              value={quickComposeText}
              onChange={(e) => setQuickComposeText(e.target.value)}
              placeholder={`Quick compose ${quickComposeType.toUpperCase()}... (This feature coming soon - use Reply button for now)`}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            />

            {/* Send Button */}
            <button
              disabled
              className="px-6 py-2.5 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
              title="Use Reply button on messages to send"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
          
          {selectedFiles.length > 0 && (
            <div className="mt-2 flex gap-2">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {file.name}
                  <button onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedComm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className={`p-6 border-b border-gray-200 ${getTypeColor(selectedComm.type)} bg-opacity-10`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${getTypeColor(selectedComm.type)} text-white`}>
                    {getTypeIcon(selectedComm.type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedComm.type === 'phone' ? 'Add Call Notes' : `Reply via ${selectedComm.type.toUpperCase()}`}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      To: {selectedComm.customer_name || selectedComm.from || selectedComm.to || 'Unknown'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowReplyModal(false);
                    setSelectedComm(null);
                    setReplyText('');
                    setReplySubject('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Original Message */}
            <div className="p-6 bg-gray-50 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Original Message:</h3>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                {selectedComm.type === 'email' && selectedComm.subject && (
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    Subject: {selectedComm.subject}
                  </p>
                )}
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {getMessagePreview(selectedComm)}
                </p>
                
                {/* Attachments Display */}
                {selectedComm.attachments && selectedComm.attachments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <PaperClipIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-medium text-gray-700">
                        {selectedComm.attachments.length} Attachment{selectedComm.attachments.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedComm.attachments.map((attachment: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          {attachment.type?.startsWith('image/') ? (
                            <ImageIcon className="w-4 h-4 text-blue-500" />
                          ) : (
                            <FileText className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="text-xs text-gray-700 max-w-[200px] truncate">
                            {attachment.filename || attachment.name || `Attachment ${idx + 1}`}
                          </span>
                          {attachment.size && (
                            <span className="text-xs text-gray-400">
                              ({(attachment.size / 1024).toFixed(1)} KB)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                  {formatTimestamp(selectedComm.timestamp || selectedComm.created_at || '')}
                </p>
              </div>
            </div>

            {/* Reply Form */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedComm.type === 'email' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    placeholder="Email subject..."
                    autoFocus
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedComm.type === 'phone' ? 'Call Notes' : 'Message'}
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={getReplyPlaceholder()}
                  rows={8}
                  autoFocus={selectedComm.type !== 'email'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowReplyModal(false);
                    setSelectedComm(null);
                    setReplyText('');
                    setReplySubject('');
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={sendReply}
                  disabled={sending || !replyText.trim() || (selectedComm.type === 'email' && !replySubject.trim())}
                  className={`px-6 py-2 text-white rounded-lg transition-colors ${getTypeColor(selectedComm.type)} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Sending...
                    </>
                  ) : (
                    <>
                      {selectedComm.type === 'phone' ? 'Save Note' : 'Send Reply'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
