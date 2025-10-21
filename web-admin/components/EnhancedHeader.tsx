'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import NotificationCenter from './NotificationCenter';
import {
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  Bell,
  Settings,
  User,
  LogOut,
  Phone,
  ChevronDown,
} from 'lucide-react';

export default function EnhancedHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessagesDropdown, setShowMessagesDropdown] = useState(false);
  const [showEmailsDropdown, setShowEmailsDropdown] = useState(false);
  const [showCallsDropdown, setShowCallsDropdown] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadEmailCount, setUnreadEmailCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const notificationRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const emailsRef = useRef<HTMLDivElement>(null);
  const callsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch unread counts
  useEffect(() => {
    if (!user) return;
    
    const fetchUnreadCounts = async () => {
      try {
        // Messages
        const res = await api.get('/messages/conversations');
        const conversations = res.data.conversations || [];
        const totalUnread = conversations.reduce((sum: number, conv: any) => sum + (conv.unread_count || 0), 0);
        setUnreadMessageCount(totalUnread);

        // Emails
        try {
          const emailsRes = await api.get('/gmail/emails?limit=50');
          const emails = emailsRes.data.emails || emailsRes.data || [];
          const unreadEmails = emails.filter((e: any) => !e.read).length;
          setUnreadEmailCount(unreadEmails);
        } catch (error) {
          console.error('Error fetching emails:', error);
        }

        // Notifications (mock for now)
        setUnreadNotificationCount(3);
      } catch (error) {
        console.error('Error fetching unread counts:', error);
      }
    };

    fetchUnreadCounts();
    
    // Poll for unread count every 30 seconds
    const interval = setInterval(fetchUnreadCounts, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target as Node)) {
        setShowMessagesDropdown(false);
      }
      if (emailsRef.current && !emailsRef.current.contains(event.target as Node)) {
        setShowEmailsDropdown(false);
      }
      if (callsRef.current && !callsRef.current.contains(event.target as Node)) {
        setShowCallsDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return currentTime.toLocaleDateString('en-US', options);
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getInitials = () => {
    if (!user?.full_name && !user?.name) return 'U';
    const name = user.full_name || user.name || '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getDashboardTitle = () => {
    const role = user?.role?.toLowerCase();
    if (role === 'admin') return 'Snow Removal Management';
    if (role === 'crew') return 'Crew Dashboard';
    if (role === 'customer') return 'Customer Portal';
    return 'Dashboard';
  };

  return (
    <header className="bg-[#3f72af] text-white shadow-lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo & Branding */}
          <div className="flex items-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_snow-ops-hub/artifacts/cj7hlxxz_noBgWhite.png" 
              alt="CAF Logo" 
              className="h-16 w-auto"
            />
          </div>

          {/* Right: Date/Time, Actions & Profile */}
          <div className="flex items-center space-x-4">
            {/* Date & Time */}
            <div className="hidden md:flex items-center space-x-6 mr-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">{formatDate()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{formatTime()}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-8 bg-white bg-opacity-20" />

            {/* Quick Actions with Dropdowns */}
            <div className="flex items-center space-x-2">
              {/* Gmail */}
              <div ref={emailsRef} className="relative">
                <button
                  onClick={() => setShowEmailsDropdown(!showEmailsDropdown)}
                  className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors relative cursor-pointer"
                  title="Gmail"
                >
                  <Mail className="w-5 h-5" />
                  {unreadEmailCount > 0 && (
                    <span className="absolute top-0 right-0 flex items-center justify-center">
                      <span className="absolute inline-flex h-3 w-3 rounded-full bg-red-500 opacity-75 animate-ping"></span>
                      <span className="relative inline-flex items-center justify-center h-3 w-3 rounded-full bg-red-500 text-white text-[8px] font-bold">
                        {unreadEmailCount > 9 ? '9+' : unreadEmailCount}
                      </span>
                    </span>
                  )}
                </button>
                {showEmailsDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Recent Emails</h3>
                      <button
                        onClick={() => {
                          router.push('/gmail');
                          setShowEmailsDropdown(false);
                        }}
                        className="text-xs text-[#3f72af] hover:underline cursor-pointer"
                      >
                        View All
                      </button>
                    </div>
                    <div className="p-4 text-center text-gray-600 text-sm">
                      Click "View All" to access Gmail
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div ref={messagesRef} className="relative">
                <button
                  onClick={() => setShowMessagesDropdown(!showMessagesDropdown)}
                  className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors relative cursor-pointer"
                  title="Messages"
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadMessageCount > 0 && (
                    <span className="absolute top-0 right-0 flex items-center justify-center">
                      <span className="absolute inline-flex h-3 w-3 rounded-full bg-red-500 opacity-75 animate-ping"></span>
                      <span className="relative inline-flex items-center justify-center h-3 w-3 rounded-full bg-red-500 text-white text-[8px] font-bold">
                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                      </span>
                    </span>
                  )}
                </button>
                {showMessagesDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Recent Messages</h3>
                      <button
                        onClick={() => {
                          router.push('/messages');
                          setShowMessagesDropdown(false);
                        }}
                        className="text-xs text-[#3f72af] hover:underline cursor-pointer"
                      >
                        View All
                      </button>
                    </div>
                    <div className="p-4 text-center text-gray-600 text-sm">
                      {unreadMessageCount > 0 ? `${unreadMessageCount} unread messages` : 'No new messages'}
                    </div>
                  </div>
                )}
              </div>

              {/* RingCentral Calls */}
              <div ref={callsRef} className="relative">
                <button
                  onClick={() => setShowCallsDropdown(!showCallsDropdown)}
                  className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors relative cursor-pointer"
                  title="RingCentral Calls"
                >
                  <Phone className="w-5 h-5" />
                </button>
                {showCallsDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Recent Calls</h3>
                      <button
                        onClick={() => {
                          router.push('/ringcentral');
                          setShowCallsDropdown(false);
                        }}
                        className="text-xs text-[#3f72af] hover:underline cursor-pointer"
                      >
                        View All
                      </button>
                    </div>
                    <div className="p-4 text-center text-gray-600 text-sm">
                      Click "View All" to access RingCentral
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications with NotificationCenter */}
              <div ref={notificationRef} className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {(unreadMessageCount + unreadEmailCount + unreadNotificationCount) > 0 && (
                    <span className="absolute top-0 right-0 flex items-center justify-center">
                      <span className="absolute inline-flex h-3 w-3 rounded-full bg-red-500 opacity-75 animate-ping"></span>
                      <span className="relative inline-flex items-center justify-center h-3 w-3 rounded-full bg-red-500 text-white text-[8px] font-bold">
                        {(unreadMessageCount + unreadEmailCount + unreadNotificationCount) > 9 ? '9+' : (unreadMessageCount + unreadEmailCount + unreadNotificationCount)}
                      </span>
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationCenter
                    onClose={() => setShowNotifications(false)}
                    onExpand={(type) => {
                      setShowNotifications(false);
                      if (type === 'messages') router.push('/messages');
                      else if (type === 'emails') router.push('/gmail');
                      else if (type === 'notifications') router.push('/notifications');
                    }}
                  />
                )}
              </div>

              {/* Settings */}
              <button
                onClick={() => router.push('/settings')}
                className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors cursor-pointer"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-white bg-opacity-20" />

            {/* Profile Section */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 hover:bg-white hover:bg-opacity-10 rounded-lg px-3 py-2 transition-colors cursor-pointer"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-white border-opacity-30 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center border-2 border-white border-opacity-30">
                    <span className="text-sm font-bold">{getInitials()}</span>
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold">{user?.full_name || user?.name || 'User'}</p>
                  <p className="text-xs text-blue-100 capitalize">{user?.role || 'User'}</p>
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.full_name || user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <p className="text-xs text-blue-600 capitalize mt-1">{user?.role}</p>
                    </div>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        router.push('/settings/profile');
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      <span>My Profile</span>
                    </button>

                    <div className="border-t border-gray-200 my-2" />

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
