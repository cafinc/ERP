'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import {
  MessageSquare,
  Send,
  Inbox,
  Archive,
  Star,
  Trash2,
  Search,
  Plus,
  X,
  Paperclip,
  Reply,
  Forward,
  Check,
  CheckCheck,
  User,
} from 'lucide-react';

interface Message {
  id: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  starred: boolean;
  archived: boolean;
  attachments?: { name: string; size: string }[];
  category: 'inbox' | 'sent' | 'archived';
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedTab, setSelectedTab] = useState<'inbox' | 'sent' | 'archived'>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockMessages: Message[] = [
        {
          id: '1',
          from: 'John Smith',
          to: ['You'],
          subject: 'Weekly Schedule Update',
          body: 'Hi team,\n\nPlease review the updated schedule for next week. We have several important jobs scheduled.\n\nBest regards,\nJohn',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: false,
          starred: true,
          archived: false,
          category: 'inbox',
          attachments: [{ name: 'schedule.pdf', size: '2.3 MB' }],
        },
        {
          id: '2',
          from: 'Sarah Johnson',
          to: ['You'],
          subject: 'Equipment Maintenance Required',
          body: 'Hello,\n\nEquipment #245 needs immediate maintenance. Please schedule at your earliest convenience.\n\nThanks,\nSarah',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          read: false,
          starred: false,
          archived: false,
          category: 'inbox',
        },
        {
          id: '3',
          from: 'Mike Davis',
          to: ['You'],
          subject: 'Invoice #12345 Approved',
          body: 'The invoice has been approved and payment will be processed within 5 business days.',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          starred: false,
          archived: false,
          category: 'inbox',
        },
        {
          id: '4',
          from: 'You',
          to: ['Team'],
          subject: 'Safety Meeting Tomorrow',
          body: 'Reminder: Safety meeting tomorrow at 9 AM in the conference room.',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          read: true,
          starred: false,
          archived: false,
          category: 'sent',
        },
        {
          id: '5',
          from: 'You',
          to: ['Admin'],
          subject: 'Vacation Request',
          body: 'I would like to request vacation time from June 15-20.',
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          read: true,
          starred: false,
          archived: false,
          category: 'sent',
        },
      ];
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages
    .filter(m => m.category === selectedTab)
    .filter(m => 
      !searchQuery || 
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.body.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const unreadCount = messages.filter(m => m.category === 'inbox' && !m.read).length;

  const handleSend = () => {
    if (!composeData.to || !composeData.subject || !composeData.body) {
      alert('Please fill in all fields');
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      from: 'You',
      to: composeData.to.split(',').map(e => e.trim()),
      subject: composeData.subject,
      body: composeData.body,
      timestamp: new Date().toISOString(),
      read: true,
      starred: false,
      archived: false,
      category: 'sent',
    };

    setMessages([newMessage, ...messages]);
    setComposeData({ to: '', subject: '', body: '' });
    setShowCompose(false);
    alert('Message sent successfully!');
  };

  const handleMarkAsRead = (id: string) => {
    setMessages(messages.map(m => 
      m.id === id ? { ...m, read: true } : m
    ));
  };

  const handleToggleStar = (id: string) => {
    setMessages(messages.map(m => 
      m.id === id ? { ...m, starred: !m.starred } : m
    ));
  };

  const handleArchive = (id: string) => {
    setMessages(messages.map(m => 
      m.id === id ? { ...m, archived: true, category: 'archived' } : m
    ));
    setSelectedMessage(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this message?')) {
      setMessages(messages.filter(m => m.id !== id));
      setSelectedMessage(null);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Messages"
        icon={<MessageSquare size={28} />}
        subtitle={`${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Messages" }]}
        actions={[
          {
            label: 'Compose',
            icon: <Plus className="w-4 h-4" />,
            onClick: () => setShowCompose(true),
            variant: 'primary',
          },
        ]}
      />

      <div className="flex-1 flex overflow-hidden mx-6 mb-6">
        {/* Left Sidebar - Message List */}
        <div className="w-96 bg-white rounded-l-xl border border-r-0 border-gray-200 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setSelectedTab('inbox')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                selectedTab === 'inbox'
                  ? 'text-[#3f72af] border-b-2 border-[#3f72af]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Inbox className="w-4 h-4" />
                <span>Inbox</span>
                {unreadCount > 0 && (
                  <span className="bg-[#3f72af] text-white text-xs rounded-full px-2 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setSelectedTab('sent')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                selectedTab === 'sent'
                  ? 'text-[#3f72af] border-b-2 border-[#3f72af]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                <span>Sent</span>
              </div>
            </button>
            <button
              onClick={() => setSelectedTab('archived')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                selectedTab === 'archived'
                  ? 'text-[#3f72af] border-b-2 border-[#3f72af]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Archive className="w-4 h-4" />
                <span>Archived</span>
              </div>
            </button>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3f72af]"></div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No messages found</p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (!message.read) handleMarkAsRead(message.id);
                  }}
                  className={`w-full p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left ${
                    selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                  } ${!message.read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.category === 'sent' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {message.category === 'sent' ? (
                          <Send className="w-4 h-4 text-green-600" />
                        ) : (
                          <User className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!message.read ? 'font-semibold' : 'font-medium'}`}>
                          {message.from}
                        </p>
                        <p className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</p>
                      </div>
                    </div>
                    {message.starred && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className={`text-sm mb-1 truncate ${!message.read ? 'font-semibold' : ''}`}>
                    {message.subject}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2">{message.body}</p>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Paperclip className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{message.attachments.length} attachment(s)</span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Message Detail or Compose */}
        <div className="flex-1 bg-white rounded-r-xl border border-gray-200 flex flex-col">
          {showCompose ? (
            // Compose Message
            <div className="flex flex-col h-full">
              {/* Compose Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">New Message</h3>
                <button
                  onClick={() => setShowCompose(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Compose Form */}
              <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To:</label>
                    <input
                      type="text"
                      placeholder="Recipient email(s), separated by commas"
                      value={composeData.to}
                      onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject:</label>
                    <input
                      type="text"
                      placeholder="Message subject"
                      value={composeData.subject}
                      onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message:</label>
                    <textarea
                      placeholder="Type your message here..."
                      value={composeData.body}
                      onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                      rows={12}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Compose Footer */}
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Paperclip className="w-4 h-4" />
                  <span className="text-sm">Attach File</span>
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCompose(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    className="px-6 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#3f72af]/90 transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          ) : selectedMessage ? (
            // Message Detail
            <div className="flex flex-col h-full">
              {/* Message Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedMessage.from.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{selectedMessage.from}</h3>
                        {selectedMessage.read ? (
                          <CheckCheck className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Check className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">To: {selectedMessage.to.join(', ')}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(selectedMessage.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStar(selectedMessage.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        selectedMessage.starred
                          ? 'text-yellow-500 hover:bg-yellow-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${selectedMessage.starred ? 'fill-yellow-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleArchive(selectedMessage.id)}
                      className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Archive className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(selectedMessage.id)}
                      className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedMessage.subject}</h2>
              </div>

              {/* Message Body */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.body}</p>
                </div>

                {/* Attachments */}
                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Attachments</h4>
                    <div className="space-y-2">
                      {selectedMessage.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <Paperclip className="w-5 h-5 text-gray-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                            <p className="text-xs text-gray-500">{attachment.size}</p>
                          </div>
                          <button className="text-[#3f72af] hover:text-[#3f72af]/80 text-sm font-medium">
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Message Actions */}
              <div className="p-4 border-t border-gray-200 flex items-center gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#3f72af]/90 transition-colors">
                  <Reply className="w-4 h-4" />
                  <span>Reply</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Forward className="w-4 h-4" />
                  <span>Forward</span>
                </button>
              </div>
            </div>
          ) : (
            // Empty State
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No message selected</h3>
                <p className="text-gray-500">Select a message to read or compose a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
