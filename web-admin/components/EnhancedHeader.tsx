'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import NotificationCenter from './NotificationCenter';
import UnifiedCommunicationsDropdown from './UnifiedCommunicationsDropdown';
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
  const [showUnifiedComms, setShowUnifiedComms] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadEmailCount, setUnreadEmailCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [totalUnreadComms, setTotalUnreadComms] = useState(0);
  
  // Branding state
  const [headerColor, setHeaderColor] = useState('#3f72af');
  const [logoUrl, setLogoUrl] = useState('');
  const [companyName, setCompanyName] = useState('');

  const notificationRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const emailsRef = useRef<HTMLDivElement>(null);
  const callsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Load branding settings
  useEffect(() => {
    const savedBranding = localStorage.getItem('branding_settings');
    if (savedBranding) {
      try {
        const branding = JSON.parse(savedBranding);
        setHeaderColor(branding.header_color || '#3f72af');
        setLogoUrl(branding.logo_url || '');
        setCompanyName(branding.company_name || '');
      } catch (error) {
        console.error('Error loading branding settings:', error);
      }
    }
  }, []);

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
        let totalUnread = 0;
        let unreadEmails = 0;

        // Messages
        const res = await api.get('/messages/conversations');
        const conversations = res.data.conversations || [];
        totalUnread = conversations.reduce((sum: number, conv: any) => sum + (conv.unread_count || 0), 0);
        setUnreadMessageCount(totalUnread);

        // Emails
        try {
          const emailsRes = await api.get('/gmail/emails?limit=50');
          const emails = emailsRes.data.emails || emailsRes.data || [];
          unreadEmails = emails.filter((e: any) => !e.read).length;
          setUnreadEmailCount(unreadEmails);
        } catch (error) {
          console.error('Error fetching emails:', error);
        }

        // Notifications (mock for now)
        setUnreadNotificationCount(3);
        
        // Calculate total unread communications
        setTotalUnreadComms(totalUnread + unreadEmails);
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
    <header className="bg-[#3f72af] text-white shadow-lg" style={{ backgroundColor: headerColor }}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo & Branding */}
          <div className="flex items-center">
            {logoUrl ? (
              <img 
                src={logoUrl}
                alt="Company Logo" 
                className="h-16 w-auto"
                style={{ maxWidth: '200px', objectFit: 'contain' }}
              />
            ) : companyName ? (
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                {companyName}
              </div>
            ) : (
              <img 
                src="https://customer-assets.emergentagent.com/job_snowmsg-hub/artifacts/qz23wi1m_White%20logo%20-%20no%20background.png" 
                alt="Logo" 
                className="h-16 w-auto"
                style={{ maxWidth: '240px', objectFit: 'contain' }}
              />
            )}
          </div>

          {/* Right: Date/Time, Actions & Profile */}
          <div className="flex items-center space-x-4">
            {/* Date & Time */}
            <div className="hidden md:flex items-center space-x-6 mr-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium" suppressHydrationWarning>{formatDate()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium" suppressHydrationWarning>{formatTime()}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-8 bg-white bg-opacity-20" />

            {/* Quick Actions with Dropdowns */}
            <div className="flex items-center space-x-2">
              {/* Unified Communications Center */}
              <div className="relative">
                <button
                  onClick={() => setShowUnifiedComms(!showUnifiedComms)}
                  className={`p-2 rounded-lg relative cursor-pointer ${
                    showUnifiedComms 
                      ? 'bg-white text-[#3f72af]' 
                      : 'bg-transparent text-white hover:bg-white hover:text-[#3f72af] transition-colors duration-200'
                  }`}
                  title="All Communications"
                >
                  <MessageSquare className="w-5 h-5" />
                  {totalUnreadComms > 0 && (
                    <span className="absolute top-0 right-0 flex items-center justify-center">
                      <span className="absolute inline-flex h-3 w-3 rounded-full bg-blue-500 opacity-75 animate-ping"></span>
                      <span className="relative inline-flex items-center justify-center h-3 w-3 rounded-full bg-blue-500 text-white text-[8px] font-bold">
                        {totalUnreadComms > 9 ? '9+' : totalUnreadComms}
                      </span>
                    </span>
                  )}
                </button>
                <UnifiedCommunicationsDropdown 
                  ref={unifiedCommsDropdownRef}
                  isOpen={showUnifiedComms}
                  onClose={() => setShowUnifiedComms(false)}
                />
              </div>

              {/* Notifications with NotificationCenter */}
              <div ref={notificationRef} className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-lg relative cursor-pointer ${
                    showNotifications 
                      ? 'bg-white text-[#3f72af]' 
                      : 'bg-transparent text-white hover:bg-white hover:text-[#3f72af] transition-colors duration-200'
                  }`}
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
                onMouseEnter={(e) => e.currentTarget.classList.add('hovered')}
                onMouseLeave={(e) => e.currentTarget.classList.remove('hovered')}
                className="p-2 rounded-lg transition-all duration-200 ease-in-out cursor-pointer text-white [&.hovered]:bg-white [&.hovered]:text-[#3f72af]"
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
                  // Check if avatar is an emoji (single character) or image URL
                  user.avatar.length <= 4 ? (
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center border-2 border-white border-opacity-30">
                      <span className="text-2xl">{user.avatar}</span>
                    </div>
                  ) : (
                    <img
                      src={user.avatar}
                      alt="Profile"
                      className="w-10 h-10 rounded-full border-2 border-white border-opacity-30 object-cover"
                    />
                  )
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
                      <p className="text-xs text-[#3f72af] capitalize mt-1">{user?.role}</p>
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
