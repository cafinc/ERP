'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Maximize2,
  X,
  Clock,
  User,
  Smartphone
} from 'lucide-react';

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
  timestamp: string;
  read: boolean;
}

interface UnifiedCommunicationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UnifiedCommunicationsDropdown({
  isOpen,
  onClose,
}: UnifiedCommunicationsDropdownProps) {
  const [recentComms, setRecentComms] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRecentCommunications();
    }
  }, [isOpen]);

  const fetchRecentCommunications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/communications/list-all`);
      if (response.ok) {
        const data = await response.json();
        // Sort by timestamp desc and take first 10
        const sorted = data.sort((a: Communication, b: Communication) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setRecentComms(sorted.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching recent communications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const openFullCommunicationsCenter = (type?: string) => {
    const url = type ? `/communications/center?tab=${type}` : '/communications/center';
    window.open(url, '_blank', 'width=1200,height=800');
    onClose();
  };

  const handleMessageClick = (comm: Communication) => {
    openFullCommunicationsCenter(comm.type);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'inapp':
        return <MessageSquare className="w-4 h-4" />;
      case 'sms':
        return <Smartphone className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'phone':
        return <Phone className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'inapp':
        return 'bg-orange-100 text-orange-700';
      case 'sms':
        return 'bg-green-100 text-green-700';
      case 'email':
        return 'bg-blue-100 text-blue-700';
      case 'phone':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getMessagePreview = (comm: Communication) => {
    if (comm.type === 'email') {
      return comm.subject || comm.body || 'No subject';
    }
    return comm.message || comm.content || 'No message';
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 animate-fade-in"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">All Communications</h3>
        <button
          onClick={() => {
            window.open('/communications/center', '_blank', 'width=1200,height=800');
            onClose();
          }}
          className="text-xs text-[#3f72af] hover:underline cursor-pointer"
        >
          View All
        </button>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : recentComms.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent communications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentComms.map((comm) => (
              <div
                key={comm._id}
                onClick={() => handleMessageClick(comm)}
                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !comm.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Type Icon */}
                  <div className={`p-2 rounded-lg ${getTypeColor(comm.type)}`}>
                    {getIcon(comm.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {comm.customer_name || comm.from || comm.to || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatTime(comm.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {getMessagePreview(comm)}
                    </p>

                    {/* Direction indicator */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        comm.direction === 'inbound' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {comm.direction === 'inbound' ? '← Received' : '→ Sent'}
                      </span>
                      {!comm.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full" title="Unread" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
