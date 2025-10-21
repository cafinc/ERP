'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  MessageSquare,
  Mail,
  Bell,
  Phone,
  Calendar,
  X,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
} from 'lucide-react';

interface NotificationCenterProps {
  onClose: () => void;
  onExpand?: (type: string) => void;
}

export default function NotificationCenter({ onClose, onExpand }: NotificationCenterProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'messages' | 'emails' | 'notifications' | 'calls'>('messages');
  const [messages, setMessages] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'messages':
          await loadMessages();
          break;
        case 'emails':
          await loadEmails();
          break;
        case 'notifications':
          await loadNotifications();
          break;
        case 'calls':
          await loadCalls();
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await api.get('/messages/conversations?limit=10');
      const conversations = res.data.conversations || [];
      
      // Get latest message from each conversation
      const messagesPromises = conversations.map(async (conv: any) => {
        const msgRes = await api.get(`/messages/conversations/${conv._id}/messages?limit=1`);
        const msgs = msgRes.data.messages || [];
        return {
          ...conv,
          latest_message: msgs[0] || null,
        };
      });
      
      const conversationsWithMessages = await Promise.all(messagesPromises);
      setMessages(conversationsWithMessages.filter(c => c.latest_message));
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const loadEmails = async () => {
    try {
      const res = await api.get('/gmail/emails?limit=10');
      setEmails(res.data.emails || res.data || []);
    } catch (error) {
      console.error('Error loading emails:', error);
      setEmails([]);
    }
  };

  const loadNotifications = async () => {
    try {
      // Mock notifications - replace with actual API
      setNotifications([
        {
          id: '1',
          type: 'success',
          title: 'Agreement Signed',
          message: 'Customer John Smith signed the snow removal agreement',
          timestamp: new Date().toISOString(),
          read: false,
        },
        {
          id: '2',
          type: 'warning',
          title: 'Estimate Expiring Soon',
          message: 'Estimate EST-2024 expires in 2 days',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false,
        },
        {
          id: '3',
          type: 'info',
          title: 'New Project Assigned',
          message: 'You have been assigned to Project PRJ-456',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          read: true,
        },
      ]);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  const loadCalls = async () => {
    try {
      const res = await api.get('/ringcentral/call-logs?limit=10');
      setCalls(res.data.calls || res.data || []);
    } catch (error) {
      console.error('Error loading calls:', error);
      setCalls([]);
    }
  };

  const formatTime = (timestamp: string) => {
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const unreadCount = {
    messages: messages.filter(m => m.unread_count > 0).length,
    emails: emails.filter(e => !e.read).length,
    notifications: notifications.filter(n => !n.read).length,
    calls: 0,
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'messages'
              ? 'text-[#3f72af] border-b-2 border-[#3f72af] bg-[#3f72af]/5'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Messages</span>
          {unreadCount.messages > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full">
              {unreadCount.messages}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('emails')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'emails'
              ? 'text-[#3f72af] border-b-2 border-[#3f72af] bg-[#3f72af]/5'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Emails</span>
          {unreadCount.emails > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full">
              {unreadCount.emails}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'notifications'
              ? 'text-[#3f72af] border-b-2 border-[#3f72af] bg-[#3f72af]/5'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Alerts</span>
          {unreadCount.notifications > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full">
              {unreadCount.notifications}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading...</div>
        ) : (
          <>
            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div>
                {messages.length === 0 ? (
                  <div className="p-8 text-center text-gray-600">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No recent messages</p>
                  </div>
                ) : (
                  messages.map((msg: any) => (
                    <div
                      key={msg._id}
                      onClick={() => {
                        router.push('/messages');
                        onClose();
                      }}
                      className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {msg.title || msg.participants?.map((p: any) => p.user_name).join(', ')}
                        </h4>
                        {msg.unread_count > 0 && (
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                        {msg.latest_message?.content || msg.last_message}
                      </p>
                      <p className="text-xs text-gray-400">{formatTime(msg.last_message_at || msg.latest_message?.created_at)}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Emails Tab */}
            {activeTab === 'emails' && (
              <div>
                {emails.length === 0 ? (
                  <div className="p-8 text-center text-gray-600">
                    <Mail className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No recent emails</p>
                  </div>
                ) : (
                  emails.map((email: any) => (
                    <div
                      key={email.id}
                      onClick={() => {
                        router.push('/gmail');
                        onClose();
                      }}
                      className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
                          {email.subject}
                        </h4>
                        {!email.read && (
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-1">From: {email.from}</p>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                        {email.snippet || email.body?.substring(0, 100)}
                      </p>
                      <p className="text-xs text-gray-400">{formatTime(email.timestamp || email.date)}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-600">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((notif: any) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notif.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notif.type)}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {notif.title}
                            </h4>
                            {!notif.read && (
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{notif.message}</p>
                          <p className="text-xs text-gray-400">{formatTime(notif.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer with Expand Button */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => {
            if (activeTab === 'messages') router.push('/messages');
            else if (activeTab === 'emails') router.push('/gmail');
            else if (activeTab === 'notifications') router.push('/notifications');
            onClose();
          }}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#3f72af]/90 transition-colors text-sm font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          <span>View All {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
        </button>
      </div>
    </div>
  );
}
