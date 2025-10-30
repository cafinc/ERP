'use client';

import PageHeader from '@/components/PageHeader';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  MessageSquare,
  Send,
  Paperclip,
  Search,
  Plus,
  Users,
  Archive,
  MoreVertical,
  Image as ImageIcon,
  File,
  X,
  User,
  Clock,
  Check,
  CheckCheck,
} from 'lucide-react';

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [conversationType, setConversationType] = useState<'direct' | 'group'>('direct');
  const [groupName, setGroupName] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadConversations();
    loadUsersAndCustomers();
    
    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      if (selectedConversation) {
        loadMessages(selectedConversation._id, true); // Silent reload
      }
    }, 3000);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/messages/conversations');
      setConversations(res.data.conversations || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsersAndCustomers = async () => {
    try {
      const [usersRes, customersRes] = await Promise.all([
        api.get('/team'),
        api.get('/customers')
      ]);
      setUsers(usersRes.data.users || usersRes.data || []);
      setCustomers(customersRes.data.customers || customersRes.data || []);
    } catch (error) {
      console.error('Error loading users/customers:', error);
    }
  };

  const loadMessages = async (conversationId: string, silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get(`/messages/conversations/${conversationId}/messages`);
      setMessages(res.data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation: any) => {
    setSelectedConversation(conversation);
    await loadMessages(conversation._id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!selectedConversation) return;

    try {
      setSending(true);
      
      // Extract mentions from message
      const mentions = extractMentions(newMessage);
      
      await api.post('/messages', {
        conversation_id: selectedConversation._id,
        content: newMessage,
        attachments: attachments,
        mentions: mentions
      });

      setNewMessage('');
      setAttachments([]);
      await loadMessages(selectedConversation._id);
      await loadConversations(); // Update conversation list
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    if (!matches) return [];
    
    // Convert mentions to user IDs (simplified - in production, match against actual users)
    return matches.map(m => m.substring(1));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingFile(true);
      
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        // Upload file
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const attachment = {
          file_name: file.name,
          file_url: uploadRes.data.url || uploadRes.data.file_url,
          file_type: file.type,
          file_size: file.size,
          thumbnail_url: file.type.startsWith('image/') ? uploadRes.data.url : null
        };

        setAttachments(prev => [...prev, attachment]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one participant');
      return;
    }

    if (conversationType === 'group' && !groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    try {
      const res = await api.post('/messages/conversations', {
        conversation_type: conversationType,
        title: conversationType === 'group' ? groupName : null,
        participant_ids: selectedUsers
      });

      setShowNewConversation(false);
      setSelectedUsers([]);
      setGroupName('');
      await loadConversations();
      
      // Select the new conversation
      const newConv = conversations.find(c => c._id === res.data.conversation_id);
      if (newConv) {
        handleSelectConversation(newConv);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to create conversation');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadConversations();
      return;
    }

    try {
      const res = await api.get(`/messages/search?query=${encodeURIComponent(searchQuery)}`);
      const searchResults = res.data.messages || [];
      
      // Group results by conversation
      const conversationIds = [...new Set(searchResults.map((m: any) => m.conversation_id))];
      const filtered = conversations.filter(c => conversationIds.includes(c._id));
      setConversations(filtered);
    } catch (error) {
      console.error('Error searching messages:', error);
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      await api.put(`/messages/conversations/${conversationId}/archive`);
      await loadConversations();
      if (selectedConversation?._id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
      alert('Failed to archive conversation');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const allContacts = [
    ...users.map((u: any) => ({ ...u, type: 'team', display_name: u.name || u.full_name })),
    ...customers.map((c: any) => ({ ...c, type: 'customer', display_name: c.name || c.company_name }))
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Messages"
        subtitle="Manage messages"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Messages" }]}
      />
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Sidebar - Conversations List */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <button
                onClick={() => setShowNewConversation(true)}
                className="p-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#3f72af]/90 transition-colors"
                title="New Conversation"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading && conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-600">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-600">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No conversations yet</p>
                <button
                  onClick={() => setShowNewConversation(true)}
                  className="mt-4 text-[#3f72af] hover:underline"
                >
                  Start a new conversation
                </button>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                    selectedConversation?._id === conv._id
                      ? 'bg-[#3f72af]/10'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conv.title || conv.participants?.map((p: any) => p.user_name).join(', ')}
                        </h3>
                        {conv.unread_count > 0 && (
                          <span className="px-2 py-0.5 bg-[#3f72af] text-white rounded-full text-xs font-medium">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conv.last_message || 'No messages yet'}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {conv.last_message_at ? formatTimestamp(conv.last_message_at) : ''}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchiveConversation(conv._id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedConversation.title || selectedConversation.participants?.map((p: any) => p.user_name).join(', ')}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedConversation.participants?.length} participants
                  </p>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.sender_role !== 'customer'; // Simplified
                  
                  return (
                    <div
                      key={message._id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                        {!isOwnMessage && (
                          <p className="text-xs text-gray-600 mb-1 px-2">{message.sender_name}</p>
                        )}
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isOwnMessage
                              ? 'bg-[#3f72af] text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          
                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map((att: any, idx: number) => (
                                <a
                                  key={idx}
                                  href={att.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center space-x-2 p-2 rounded ${
                                    isOwnMessage ? 'bg-white/20' : 'bg-gray-100'
                                  }`}
                                >
                                  {att.file_type.startsWith('image/') ? (
                                    <ImageIcon className="w-4 h-4" />
                                  ) : (
                                    <File className="w-4 h-4" />
                                  )}
                                  <span className="text-sm truncate">{att.file_name}</span>
                                </a>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-1">
                            <p className={`text-xs ${isOwnMessage ? 'text-white/70' : 'text-gray-500'}`}>
                              {formatTimestamp(message.created_at)}
                              {message.is_edited && ' (edited)'}
                            </p>
                            {isOwnMessage && (
                              <CheckCheck className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
                </div>
              </div>
              <div className="p-4 bg-white border-t border-gray-200">
                {/* Attachments Preview */}
                {attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="relative">
                        <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                          <File className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-700 truncate max-w-[200px]">
                            {att.file_name}
                          </span>
                          <button
                            onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                            className="p-0.5 hover:bg-gray-200 rounded"
                          >
                            <X className="w-3 h-3 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </div>
                )}
                
                <div className="flex items-end space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    title="Attach file"
                  >
                    {uploadingFile ? (
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Paperclip className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                  
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message... Use @ to mention someone"
                    rows={1}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                  />
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || (!newMessage.trim() && attachments.length === 0)}
                    className="p-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#3f72af]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversation selected</h3>
                <p className="text-gray-600">Select a conversation from the list or start a new one</p>
              </div>
          )}
        </div>

        {/* New Conversation Modal */}
        {showNewConversation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">New Conversation</h2>
                <button
                  onClick={() => setShowNewConversation(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              {/* Conversation Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setConversationType('direct')}
                    className={`flex-1 py-2 px-4 rounded-lg border ${
                      conversationType === 'direct'
                        ? 'bg-[#3f72af] text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    <User className="w-5 h-5 inline mr-2" />
                    Direct Message
                  </button>
                  <button
                    onClick={() => setConversationType('group')}
                    className={`flex-1 py-2 px-4 rounded-lg border ${
                      conversationType === 'group'
                        ? 'bg-[#3f72af] text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    <Users className="w-5 h-5 inline mr-2" />
                    Group Chat
                  </button>
                </div>
              {/* Group Name */}
              {conversationType === 'group' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Participants */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Participants {conversationType === 'direct' && '(1 person)'}
                </label>
                <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg">
                  {allContacts.map((contact: any) => (
                    <label
                      key={contact._id}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(contact._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (conversationType === 'direct' && selectedUsers.length >= 1) {
                              setSelectedUsers([contact._id]);
                            } else {
                              setSelectedUsers([...selectedUsers, contact._id]);
                            }
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== contact._id));
                          }
                        }}
                        className="w-4 h-4 text-[#3f72af] border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{contact.display_name}</p>
                        <p className="text-sm text-gray-600">{contact.email}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                          contact.type === 'team' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {contact.type === 'team' ? 'Team' : 'Customer'}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowNewConversation(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateConversation}
                  disabled={selectedUsers.length === 0}
                  className="px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#3f72af]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Conversation
                </button>
              </div>
            </div>
        )}
      </div>
  );
}
