'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import {
  MessageSquare,
  Mail,
  PhoneCall,
  MessageCircle,
  Megaphone,
  Search,
  RefreshCw,
  User,
  Clock,
  AlertCircle,
  ArrowUpCircle,
  MinusCircle,
  ArrowDownCircle,
  Circle,
} from 'lucide-react';

interface Conversation {
  id: string;
  other_user: {
    id: string;
    name: string;
    role: string;
    status?: string;
  };
  type: 'direct' | 'sms' | 'email';
  last_message?: string;
  unread_count: number;
  updated_at: string;
}

interface FeedbackMessage {
  id: string;
  title: string;
  content: string;
  status: 'pending' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  from_user_name: string;
  created_at: string;
}

export default function CommunicationCenterPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'sms' | 'email' | 'feedback'>('all');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [feedbackMessages, setFeedbackMessages] = useState<FeedbackMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [conversationsRes, messagesRes] = await Promise.all([
        api.get('/unified-conversations'),
        api.get('/messages'),
      ]);
      setConversations(conversationsRes.data || []);
      setFeedbackMessages(messagesRes.data || []);
    } catch (error) {
      console.error('Error fetching communication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredConversations = () => {
    let filtered = conversations;

    // Apply tab filter
    if (activeTab === 'direct') {
      filtered = filtered.filter(c => c.type === 'direct');
    } else if (activeTab === 'sms') {
      filtered = filtered.filter(c => c.type === 'sms');
    } else if (activeTab === 'email') {
      filtered = filtered.filter(c => c.type === 'email');
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.other_user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const getFilteredFeedback = () => {
    if (feedbackFilter === 'all') return feedbackMessages;
    return feedbackMessages.filter(msg => msg.status === feedbackFilter);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'crew': return 'bg-green-100 text-green-700 border-green-300';
      case 'customer': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'high': return <ArrowUpCircle className="w-5 h-5 text-orange-600" />;
      case 'medium': return <MinusCircle className="w-5 h-5 text-gray-600" />;
      case 'low': return <ArrowDownCircle className="w-5 h-5 text-gray-400" />;
      default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const renderConversationsList = () => {
    const filteredConversations = getFilteredConversations();

    if (filteredConversations.length === 0) {
      return (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Start a conversation by clicking on a contact
          </p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-200">
        {filteredConversations.map((conversation) => (
          <Link
            key={conversation.id}
            href={`/communication/${conversation.id}`}
            className="block p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="p-3 bg-blue-100 rounded-full">
                  <User className="w-6 h-6 text-[#3f72af]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {conversation.other_user?.name || 'Unknown User'}
                    </h3>
                    {conversation.type === 'sms' && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        SMS
                      </span>
                    )}
                    {conversation.type === 'email' && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        EMAIL
                      </span>
                    )}
                  </div>
                  {conversation.last_message && (
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {conversation.last_message}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(conversation.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="ml-4 flex flex-col items-end space-y-2">
                {conversation.unread_count > 0 && (
                  <div className="px-2 py-1 bg-[#3f72af] text-white text-xs font-bold rounded-full min-w-[24px] text-center">
                    {conversation.unread_count}
                  </div>
                )}
                <span className={`px-2 py-1 text-xs font-semibold rounded border ${getRoleBadgeColor(conversation.other_user?.role)}`}>
                  {conversation.other_user?.role?.charAt(0).toUpperCase() + conversation.other_user?.role?.slice(1)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  const renderFeedbackBoard = () => {
    const filteredFeedback = getFilteredFeedback();

    return (
      <div>
        {/* Feedback Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFeedbackFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                feedbackFilter === 'all'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All ({feedbackMessages.length})
            </button>
            <button
              onClick={() => setFeedbackFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                feedbackFilter === 'pending'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Pending ({feedbackMessages.filter(m => m.status === 'pending').length})
            </button>
            <button
              onClick={() => setFeedbackFilter('in_progress')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                feedbackFilter === 'in_progress'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              In Progress ({feedbackMessages.filter(m => m.status === 'in_progress').length})
            </button>
            <button
              onClick={() => setFeedbackFilter('resolved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                feedbackFilter === 'resolved'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Resolved ({feedbackMessages.filter(m => m.status === 'resolved').length})
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        <div className="divide-y divide-gray-200">
          {filteredFeedback.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No feedback messages</p>
            </div>
          ) : (
            filteredFeedback.map((message) => (
              <Link
                key={message.id}
                href={`/communication/feedback/${message.id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3 flex-1">
                    {getPriorityIcon(message.priority)}
                    <h3 className="font-semibold text-gray-900 flex-1">{message.title}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeColor(message.status)}`}>
                    {message.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{message.content}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>From: {message.from_user_name}</span>
                  <span>{new Date(message.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Communication Center</h1>
            <p className="text-gray-600">Manage all your conversations and messages</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#2c5282] text-white rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4">
          <div className="flex items-center space-x-2 p-4 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === 'all'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>All ({conversations.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === 'direct'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Direct Messages ({conversations.filter(c => c.type === 'direct').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('sms')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === 'sms'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <PhoneCall className="w-4 h-4" />
              <span>SMS ({conversations.filter(c => c.type === 'sms').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === 'email'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Email ({conversations.filter(c => c.type === 'email').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === 'feedback'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Feedback ({feedbackMessages.length})</span>
            </button>
          </div>

          {/* Search Bar (only for conversation tabs) */}
          {activeTab !== 'feedback' && (
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
            </div>
          ) : activeTab === 'feedback' ? (
            renderFeedbackBoard()
          ) : (
            renderConversationsList()
          )}
        </div>
      </div>
    );
}
