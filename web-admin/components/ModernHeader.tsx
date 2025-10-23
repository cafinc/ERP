'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import AlertsDropdown from './AlertsDropdown';
import UnifiedCommunicationsDropdown from './UnifiedCommunicationsDropdown';
import {
  MessageSquare,
  Bell,
  Settings,
  User,
  LogOut,
  Search,
  Plus,
  UserPlus,
  FileText,
  Briefcase,
  TrendingUp,
} from 'lucide-react';

export default function ModernHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUnifiedComms, setShowUnifiedComms] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);

  // Branding
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [headerColor, setHeaderColor] = useState<string>('#3f72af');

  // Communications count
  const [totalUnreadComms, setTotalUnreadComms] = useState(0);

  useEffect(() => {
    const savedBranding = localStorage.getItem('branding_settings');
    if (savedBranding) {
      const branding = JSON.parse(savedBranding);
      if (branding.logo) setLogoUrl(branding.logo);
      if (branding.company_name) setCompanyName(branding.company_name);
      if (branding.primary_color) setHeaderColor(branding.primary_color);
    }
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
        setShowQuickAdd(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for search (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const quickAddItems = [
    { icon: <UserPlus className="w-4 h-4" />, label: 'Customer', path: '/customers/create' },
    { icon: <TrendingUp className="w-4 h-4" />, label: 'Lead', path: '/leads/create' },
    { icon: <FileText className="w-4 h-4" />, label: 'Estimate', path: '/estimates/create' },
    { icon: <Briefcase className="w-4 h-4" />, label: 'Project', path: '/projects/create' },
  ];

  return (
    <header className="bg-[#3f72af] text-white shadow-lg" style={{ backgroundColor: headerColor }}>
      <div className="px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            {logoUrl ? (
              <img 
                src={logoUrl}
                alt="Company Logo" 
                className="h-12 w-auto"
                style={{ maxWidth: '200px', objectFit: 'contain' }}
              />
            ) : companyName ? (
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                {companyName}
              </div>
            ) : (
              <img 
                src="https://customer-assets.emergentagent.com/job_snowmsg-hub/artifacts/qz23wi1m_White%20logo%20-%20no%20background.png" 
                alt="Logo" 
                className="h-12 w-auto"
                style={{ maxWidth: '200px', objectFit: 'contain' }}
              />
            )}
          </div>

          {/* Quick Add Button */}
          <div ref={quickAddRef} className="relative flex-shrink-0">
            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="p-2 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors cursor-pointer"
              title="Quick Add"
            >
              <Plus className="w-6 h-6" />
            </button>

            {/* Quick Add Dropdown */}
            {showQuickAdd && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden">
                <div className="py-2">
                  {quickAddItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setShowQuickAdd(false);
                        router.push(item.path);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      {item.icon}
                      <span>Add {item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="global-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a customer, lead, estimate, or project..."
                className="w-full pl-11 pr-20 py-2.5 bg-white bg-opacity-10 text-white placeholder-white placeholder-opacity-60 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <kbd className="px-2 py-1 text-xs font-semibold text-white bg-white bg-opacity-20 rounded">
                  Ctrl K
                </kbd>
              </div>
            </div>
          </form>

          {/* Alerts Icon */}
          <div ref={notificationRef} className="relative flex-shrink-0">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-lg relative cursor-pointer ${
                showNotifications 
                  ? 'bg-white text-[#3f72af]' 
                  : 'bg-transparent text-white hover:bg-white hover:text-[#3f72af] transition-colors duration-200'
              }`}
              title="Notifications"
            >
              <Bell className="w-6 h-6" />
            </button>
            <AlertsDropdown
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>

          {/* Communications Icon */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowUnifiedComms(!showUnifiedComms)}
              className={`p-2 rounded-lg relative cursor-pointer ${
                showUnifiedComms 
                  ? 'bg-white text-[#3f72af]' 
                  : 'bg-transparent text-white hover:bg-white hover:text-[#3f72af] transition-colors duration-200'
              }`}
              title="All Communications"
            >
              <MessageSquare className="w-6 h-6" />
              {totalUnreadComms > 0 && (
                <span className="absolute top-0 right-0 flex items-center justify-center">
                  <span className="absolute inline-flex h-4 w-4 rounded-full bg-blue-500 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                    {totalUnreadComms > 9 ? '9+' : totalUnreadComms}
                  </span>
                </span>
              )}
            </button>
            <UnifiedCommunicationsDropdown 
              isOpen={showUnifiedComms}
              onClose={() => setShowUnifiedComms(false)}
            />
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white bg-opacity-20" />

          {/* Avatar */}
          <div ref={profileRef} className="relative flex-shrink-0">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 transition-all border-2 border-white border-opacity-30 cursor-pointer"
            >
              {user?.avatar ? (
                user.avatar.length <= 4 ? (
                  <span className="text-xl">{user.avatar}</span>
                ) : (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                )
              ) : (
                <span className="text-sm font-bold">{getInitials()}</span>
              )}
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <p className="font-semibold text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  <p className="text-xs text-gray-500 mt-1 capitalize">{user?.role}</p>
                </div>

                <div className="py-2">
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

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      router.push('/settings');
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>

                  <div className="border-t border-gray-200 my-2" />

                  <button
                    onClick={() => {
                      logout();
                      router.push('/login');
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
