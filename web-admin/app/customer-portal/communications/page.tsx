'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  PaperAirplaneIcon, 
  PaperClipIcon, 
  PhotoIcon,
  DocumentIcon,
  CheckIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface Message {
  _id: string;
  type: 'inapp' | 'sms' | 'email' | 'phone';
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

export default function CustomerCommunicationsPage() {
  const [activeTab, setActiveTab] = useState<'inapp' | 'sms' | 'email' | 'phone'>('inapp');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Get customer ID from session/auth (mock for now)
  const customerId = 'customer-123';

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${BACKEND_URL}/api/communications?customer_id=${customerId}&type=${activeTab}`
      );
      const data = await response.json();
      setMessages(data.sort((a: Message, b: Message) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ));
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // WebSocket connection
  const connectWebSocket = () => {
    try {
      const wsUrl = BACKEND_URL.replace('http', 'ws');
      const ws = new WebSocket(`${wsUrl}/api/ws/${customerId}`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        // Send ping every 30s
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
        
        ws.addEventListener('close', () => clearInterval(pingInterval));
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message' && data.customer_id === customerId) {
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
        // Attempt reconnect after 5s
        setTimeout(connectWebSocket, 5000);
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [activeTab]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // File upload
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('customer_id', customerId);

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

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)]);
    }
  };

  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // Send message
  const sendMessage = async () => {
    if (!messageText.trim() && selectedFiles.length === 0) {
      return;
    }

    setSending(true);
    try {
      // Upload files first
      const uploadedFileIds = [];
      for (const file of selectedFiles) {
        const fileId = await uploadFile(file);
        uploadedFileIds.push(fileId);
      }

      // Send message
      const response = await fetch(`${BACKEND_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          message: messageText,
          type: activeTab,
          attachments: uploadedFileIds,
        }),
      });

      if (response.ok) {
        setMessageText('');
        setSelectedFiles([]);
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

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
            <p className="text-sm text-gray-500 mt-1">
              Chat with your service provider
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-600">
              {wsConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex space-x-1 px-6">
          {[
            { id: 'inapp', label: 'Messages', icon: '💬' },
            { id: 'sms', label: 'SMS', icon: '📱' },
            { id: 'email', label: 'Email', icon: '✉️' },
            { id: 'phone', label: 'Calls', icon: '📞' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Start a conversation with your service provider</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOutbound = message.direction === 'outbound';
              return (
                <div
                  key={message._id}
                  className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-lg rounded-2xl px-4 py-3 ${
                      isOutbound
                        ? 'bg-blue-500 text-white'
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
                              isOutbound ? 'bg-blue-600' : 'bg-gray-50'
                            } hover:opacity-80 transition-opacity`}
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
                          <CheckCircleIcon className="w-4 h-4 text-green-300" />
                        ) : (
                          <CheckIcon className="w-4 h-4 opacity-75" />
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
        <div className="px-6 py-2 bg-gray-100 border-t border-gray-200">
          <div className="flex gap-2 overflow-x-auto">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="relative flex-shrink-0">
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center border border-gray-300">
                    <DocumentIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
                <p className="text-xs text-center mt-1 truncate w-20">{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
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
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Attach image"
          >
            <PhotoIcon className="w-6 h-6" />
          </button>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={sendMessage}
            disabled={sending || (!messageText.trim() && selectedFiles.length === 0)}
            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
            ) : (
              <PaperAirplaneIcon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
