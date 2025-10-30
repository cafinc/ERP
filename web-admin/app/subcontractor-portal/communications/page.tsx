'use client';

import PageHeader from '@/components/PageHeader';

import React, { useState, useEffect, useRef } from 'react';
import { 
  PaperAirplaneIcon, 
  PaperClipIcon, 
  PhotoIcon,
  DocumentIcon,
  CheckIcon,
  CheckCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface Message {
  _id: string;
  type: 'inapp';
  direction: 'inbound' | 'outbound';
  content: string;
  message: string;
  timestamp: string;
  read: boolean;
  status: string;
  attachments?: Array<{
    file_id: string;
    filename: string;
    url: string;
    thumbnail_url?: string;
    file_type: string;
    file_size: number;
  }>;
}

interface MessageTemplate {
  _id: string;
  name: string;
  content: string;
  type: string;
  category?: string;
}

export default function SubcontractorCommunicationsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Get subcontractor ID from session/auth (mock for now - replace with actual auth)
  const subcontractorId = 'subcontractor-123';

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${BACKEND_URL}/api/communications?customer_id=${subcontractorId}&type=inapp`
      );
      if (response.ok) {
        const data = await response.json();
        const sorted = data.sort((a: Message, b: Message) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        setMessages(sorted);
        setFilteredMessages(sorted);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/communications/templates?type=inapp`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  // WebSocket connection
  const connectWebSocket = () => {
    try {
      const wsUrl = BACKEND_URL.replace('http', 'ws');
      const ws = new WebSocket(`${wsUrl}/api/ws/${subcontractorId}`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
        
        ws.addEventListener('close', () => clearInterval(pingInterval));
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message' && data.customer_id === subcontractorId) {
          fetchMessages();
        } else if (data.type === 'message_read') {
          setMessages(prev => prev.map(msg => 
            msg._id === data.communication_id ? { ...msg, read: true } : msg
          ));
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        setTimeout(connectWebSocket, 5000);
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchTemplates();
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Search messages
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = messages.filter(msg => 
        msg.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.message?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [searchQuery, messages]);

  // File upload
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('customer_id', subcontractorId);

    const response = await fetch(`${BACKEND_URL}/api/communications/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const data = await response.json();
    return data.file.file_id;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const useTemplate = (template: MessageTemplate) => {
    setMessageText(template.content);
    setShowTemplates(false);
  };

  const sendMessage = async () => {
    if (!messageText.trim() && selectedFiles.length === 0) {
      return;
    }

    setSending(true);
    setUploadProgress(0);
    
    try {
      const uploadedFileIds = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const fileId = await uploadFile(selectedFiles[i]);
        uploadedFileIds.push(fileId);
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }

      const response = await fetch(`${BACKEND_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: subcontractorId,
          message: messageText,
          type: 'inapp',
          attachments: uploadedFileIds,
        }),
      });

      if (response.ok) {
        setMessageText('');
        setSelectedFiles([]);
        setUploadProgress(0);
        fetchMessages();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Communications"
        subtitle="Manage communications"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Subcontractor Portal", href: "/subcontractor-portal" }, { label: "Communications" }]}
      />
      <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 shadow-sm px-6 py-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <BuildingOfficeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Subcontractor Portal</h1>
              <p className="text-sm text-gray-500 mt-1">
                Communicate with project managers
              </p>
            </div>
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm text-gray-600">
                {wsConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
            
            {/* Message Count */}
            <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              {filteredMessages.length} messages
            </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading messages...</p>
            </div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ChatBubbleLeftRightIcon className="w-20 h-20 mb-4 opacity-50" />
            <p className="text-lg font-medium">
              {searchQuery ? 'No messages found' : 'No messages yet'}
            </p>
            <p className="text-sm">
              {searchQuery ? 'Try a different search term' : 'Start a conversation with the project team'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => {
              const isOutbound = message.direction === 'outbound';
              return (
                <div
                  key={message._id}
                  className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-lg rounded-2xl px-4 py-3 shadow-md ${
                      isOutbound
                        ? 'bg-purple-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.message || message.content}
                    </p>
                    
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 p-2 rounded-lg ${
                              isOutbound ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-50 hover:bg-gray-100'
                            } transition-colors`}
                          >
                            {att.thumbnail_url ? (
                              <img
                                src={att.thumbnail_url}
                                alt={att.filename}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <DocumentIcon className="w-6 h-6" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{att.filename}</p>
                              <p className="text-xs opacity-75">{formatFileSize(att.file_size)}</p>
                            </div>
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </a>
                        ))}
                      </div>
                    )}
                    
                    {/* Footer */}
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-xs opacity-75">
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {isOutbound && (
                        message.read ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-300" title="Read" />
                        ) : (
                          <CheckIcon className="w-4 h-4 opacity-75" title="Delivered" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="px-6 py-3 bg-purple-50 border-t border-purple-100">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="relative flex-shrink-0">
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-20 h-20 object-cover rounded-lg border-2 border-purple-200"
                  />
                ) : (
                  <div className="w-20 h-20 bg-white rounded-lg flex flex-col items-center justify-center border-2 border-purple-200">
                    <DocumentIcon className="w-8 h-8 text-purple-500" />
                    <p className="text-xs text-gray-600 mt-1 px-1 truncate w-full text-center">
                      {file.name.substring(0, 8)}...
                    </p>
                  </div>
                )}
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">Uploading... {uploadProgress.toFixed(0)}%</p>
            </div>
          )}
        </div>
      )}

      {/* Templates Dropdown */}
      {showTemplates && (
        <div className="px-6 py-3 bg-white border-t border-gray-200 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">Quick Templates</h3>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {templates.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-2">No templates available</p>
            ) : (
              templates.map((template) => (
                <button
                  key={template._id}
                  onClick={() => useTemplate(template)}
                  className="text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">{template.name}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{template.content}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white shadow-sm border-t border-gray-200 px-6 py-4 shadow-lg hover:shadow-md transition-shadow">
        <div className="flex items-end gap-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Attach file"
          >
            <PaperClipIcon className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'image/*';
                fileInputRef.current.click();
              }
            }}
            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Attach image"
          >
            <PhotoIcon className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className={`p-2 ${showTemplates ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'} rounded-lg transition-colors`}
            title="Use template"
          >
            <DocumentTextIcon className="w-6 h-6" />
          </button>
          
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message... (Press Enter to send)"
            rows={1}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          
          <button
            onClick={sendMessage}
            disabled={sending || (!messageText.trim() && selectedFiles.length === 0)}
            className="p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
            ) : (
              <PaperAirplaneIcon className="w-6 h-6" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          🏢 Subcontractor Portal • Real-time delivery • File attachments supported
        </p>
      </div>
  );
}
