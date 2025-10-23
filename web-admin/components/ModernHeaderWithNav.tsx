'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import AlertsDropdown from './AlertsDropdown';
import UnifiedCommunicationsDropdown from './UnifiedCommunicationsDropdown';
import ActivityDropdown from './ActivityDropdown';
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
  Activity,
  Menu,
  LayoutDashboard,
  Users,
  FolderOpen,
  DollarSign,
  MapPin,
  UserCog,
  Link2,
  Wrench,
  Shield,
  Camera,
  BarChart3,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface MenuItem {
  label: string;
  icon: any;
  href?: string;
  submenu?: { label: string; href: string; icon?: any }[];
}

export default function ModernHeaderWithNav() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUnifiedComms, setShowUnifiedComms] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [expandedNavItem, setExpandedNavItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const navMenuRef = useRef<HTMLDivElement>(null);

  // Branding
  const [companyName, setCompanyName] = useState<string>('');
  const [headerColor, setHeaderColor] = useState<string>('#3f72af');

  // Communications count
  const [totalUnreadComms, setTotalUnreadComms] = useState(0);

  useEffect(() => {
    const savedBranding = localStorage.getItem('branding_settings');
    if (savedBranding) {
      const branding = JSON.parse(savedBranding);
      if (branding.company_name) setCompanyName(branding.company_name);
      if (branding.primary_color) setHeaderColor(branding.primary_color);
    }
  }, []);

  // Navigation menu items
  const menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    {
      label: 'CRM',
      icon: TrendingUp,
      href: '/crm/dashboard',
      submenu: [
        { label: 'CRM Dashboard', href: '/crm/dashboard', icon: LayoutDashboard },
        { label: 'Customers', href: '/customers', icon: Users },
        { label: 'Leads', href: '/leads', icon: Users },
        { label: 'Estimates', href: '/estimates', icon: FileText },
        { label: 'Agreements', href: '/contracts', icon: FileText },
        { label: 'Agreement Templates', href: '/agreements/templates', icon: FileText },
        { label: 'Projects', href: '/projects', icon: FolderOpen },
      ],
    },
    {
      label: 'Finance',
      icon: DollarSign,
      href: '/finance/dashboard',
      submenu: [
        { label: 'Finance Dashboard', href: '/finance/dashboard', icon: LayoutDashboard },
        { label: 'Invoices', href: '/invoices', icon: DollarSign },
        { label: 'Expenses', href: '/finance/expenses', icon: DollarSign },
        { label: 'Payments', href: '/finance/payments', icon: DollarSign },
        { label: 'Reports', href: '/finance/reports', icon: FileText },
      ],
    },
    {
      label: 'Access',
      icon: UserCog,
      href: '/access',
      submenu: [
        { label: 'Access Dashboard', href: '/access', icon: LayoutDashboard },
        { label: 'Master Users', href: '/access/master', icon: Users },
        { label: 'Admins', href: '/access/admins', icon: Users },
        { label: 'Crew', href: '/access/crew', icon: Users },
        { label: 'Subcontractors', href: '/access/subcontractors', icon: Users },
        { label: 'Customer Users', href: '/access/customers', icon: Users },
        { label: 'Vendors', href: '/access/vendors', icon: Users },
        { label: 'Shift History', href: '/shifts/history', icon: FileText },
      ],
    },
    {
      label: 'Assets',
      icon: Wrench,
      href: '/equipment/dashboard',
      submenu: [
        { label: 'Assets Dashboard', href: '/equipment/dashboard', icon: LayoutDashboard },
        { label: 'Equipment', href: '/equipment', icon: Settings },
        { label: 'Vehicles', href: '/assets/vehicles', icon: MapPin },
        { label: 'Trailers', href: '/assets/trailers', icon: Settings },
        { label: 'Tools', href: '/assets/tools', icon: Settings },
        { label: 'Inventory', href: '/inventory', icon: FolderOpen },
        { label: 'Maintenance', href: '/equipment/maintenance', icon: Settings },
        { label: 'Inspections', href: '/equipment/inspections', icon: FileText },
      ],
    },
    {
      label: 'Dispatch',
      icon: MapPin,
      href: '/dispatch/dashboard',
      submenu: [
        { label: 'Dispatch Dashboard', href: '/dispatch/dashboard', icon: LayoutDashboard },
        { label: 'Dispatch', href: '/dispatch', icon: MapPin },
        { label: 'Sites', href: '/sites', icon: MapPin },
        { label: 'Site Maps', href: '/sites/maps', icon: MapPin },
        { label: 'Routes', href: '/routes', icon: MapPin },
        { label: 'Geofence', href: '/geofence', icon: MapPin },
        { label: 'Tracking', href: '/tracking', icon: MapPin },
        { label: 'Consumables', href: '/consumables', icon: FolderOpen },
        { label: 'Services', href: '/services', icon: Settings },
        { label: 'Weather', href: '/weather', icon: MapPin },
      ],
    },
    {
      label: 'Comms',
      icon: MessageSquare,
      href: '/communication/dashboard',
      submenu: [
        { label: 'Comms Dashboard', href: '/communication/dashboard', icon: LayoutDashboard },
        { label: 'Messages', href: '/messages', icon: Users },
        { label: 'RingCentral', href: '/ringcentral', icon: Users },
        { label: 'Gmail', href: '/gmail', icon: Users },
        { label: 'Emergency Alert', href: '/emergency-alert', icon: Users },
        { label: 'Customer Feedback', href: '/feedback', icon: FileText },
        { label: 'Learning Centre', href: '/learning-documents', icon: FileText },
      ],
    },
    {
      label: 'Safety',
      icon: Shield,
      href: '/safety/dashboard',
      submenu: [
        { label: 'Safety Dashboard', href: '/safety/dashboard', icon: LayoutDashboard },
        { label: 'Incident Reporting', href: '/safety/incidents', icon: FileText },
        { label: 'Safety Inspections', href: '/safety/inspections', icon: FileText },
        { label: 'Hazard Assessments', href: '/safety/hazards', icon: FileText },
        { label: 'Safety Training', href: '/safety/training', icon: FolderOpen },
        { label: 'Safety Meetings', href: '/safety/meetings', icon: Users },
        { label: 'PPE Management', href: '/safety/ppe', icon: Settings },
        { label: 'Safety Policies', href: '/safety/policies', icon: FileText },
        { label: 'Emergency Plans', href: '/safety/emergency', icon: FileText },
      ],
    },
    { label: 'Automation', icon: LayoutDashboard, href: '/automation' },
    { label: 'Tasks', icon: FileText, href: '/tasks' },
    { label: 'Forms', icon: FileText, href: '/forms' },
    { label: 'Photos', icon: Camera, href: '/photos' },
    { label: 'Analytics', icon: BarChart3, href: '/analytics' },
    { label: 'Reports', icon: FileText, href: '/reports' },
    {
      label: 'HR Module',
      icon: Briefcase,
      href: '/hr',
      submenu: [
        { label: 'HR Dashboard', href: '/hr', icon: Briefcase },
        { label: 'Employees', href: '/hr/employees', icon: Users },
        { label: 'Time & Attendance', href: '/hr/time-attendance', icon: LayoutDashboard },
        { label: 'PTO Management', href: '/hr/pto', icon: FileText },
        { label: 'Training', href: '/hr/training', icon: FolderOpen },
        { label: 'Performance', href: '/hr/performance', icon: DollarSign },
        { label: 'Payroll Settings', href: '/hr/payroll', icon: DollarSign },
      ],
    },
    { label: 'Integrations', icon: Link2, href: '/integrations' },
    {
      label: 'Settings',
      icon: Settings,
      href: '/settings',
      submenu: [
        { label: 'Settings Hub', href: '/settings', icon: Settings },
        { label: 'Account', href: '/settings/account', icon: Users },
        { label: 'Profile', href: '/settings/profile', icon: Users },
        { label: 'Company', href: '/settings/company', icon: Settings },
        { label: 'Security', href: '/settings/security', icon: Settings },
        { label: 'Branding', href: '/settings/branding', icon: Settings },
        { label: 'Service Areas', href: '/settings/service-areas', icon: MapPin },
        { label: 'Billing', href: '/settings/billing', icon: DollarSign },
        { label: 'Notifications', href: '/settings/notifications', icon: Settings },
        { label: 'Document Templates', href: '/templates', icon: FileText },
        { label: 'Roles & Permissions', href: '/settings/roles-permissions', icon: UserCog },
        { label: 'API Settings', href: '/settings/api', icon: Link2 },
        { label: 'Webhooks', href: '/settings/webhooks', icon: Link2 },
        { label: 'Integration Settings', href: '/settings/app-integration', icon: Link2 },
        { label: 'Preferences', href: '/settings/preferences', icon: Settings },
        { label: 'Support', href: '/settings/support', icon: Settings },
        { label: 'Team', href: '/team', icon: Users },
        { label: 'Crew', href: '/crew', icon: Users },
      ],
    },
  ];

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
      if (activityRef.current && !activityRef.current.contains(event.target as Node)) {
        setShowActivity(false);
      }
      if (navMenuRef.current && !navMenuRef.current.contains(event.target as Node)) {
        setShowNavMenu(false);
        setExpandedNavItem(null);
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

  const handleNavItemClick = (item: MenuItem) => {
    if (item.submenu) {
      setExpandedNavItem(expandedNavItem === item.label ? null : item.label);
    } else if (item.href) {
      router.push(item.href);
      setShowNavMenu(false);
      setExpandedNavItem(null);
    }
  };

  const handleSubMenuClick = (href: string) => {
    router.push(href);
    setShowNavMenu(false);
    setExpandedNavItem(null);
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-[#3f72af] text-white shadow-lg" style={{ backgroundColor: headerColor }}>
      <div className="px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left Side - Hamburger Menu and Company Name */}
          <div className="flex items-center gap-4">
            {/* Hamburger Menu */}
            <div ref={navMenuRef} className="relative">
              <button
                onClick={() => setShowNavMenu(!showNavMenu)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  showNavMenu 
                    ? 'text-white' 
                    : 'text-white hover:text-white'
                }`}
                style={{
                  backgroundColor: showNavMenu ? '#607d8b' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!showNavMenu) {
                    e.currentTarget.style.backgroundColor = '#607d8b';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showNavMenu) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                title="Navigation Menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Navigation Dropdown */}
              {showNavMenu && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
                  <div className="py-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const active = item.href ? isActive(item.href) : item.submenu?.some(sub => isActive(sub.href));
                      const isExpanded = expandedNavItem === item.label;

                      return (
                        <div key={item.label}>
                          <button
                            onClick={() => handleNavItemClick(item)}
                            className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-100 transition-colors cursor-pointer ${
                              active ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5" />
                              <span className="font-medium">{item.label}</span>
                            </div>
                            {item.submenu && (
                              isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                            )}
                          </button>

                          {/* Submenu */}
                          {item.submenu && isExpanded && (
                            <div className="bg-gray-50 border-t border-b border-gray-200">
                              {item.submenu.map((subItem) => {
                                const SubIcon = subItem.icon || FileText;
                                const subActive = isActive(subItem.href);

                                return (
                                  <button
                                    key={subItem.href}
                                    onClick={() => handleSubMenuClick(subItem.href)}
                                    className={`w-full flex items-center gap-3 px-12 py-2 text-sm hover:bg-gray-100 transition-colors cursor-pointer ${
                                      subActive ? 'text-blue-600 font-medium' : 'text-gray-600'
                                    }`}
                                  >
                                    <SubIcon className="w-4 h-4" />
                                    <span>{subItem.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Company Name */}
            <div className="text-xl font-bold">
              {companyName || 'CAF Group Of Companies'}
            </div>
          </div>

          {/* Right Side - All other elements */}
          <div className="flex items-center gap-3">
            {/* Quick Add Button */}
            <div ref={quickAddRef} className="relative flex-shrink-0">
              <button
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                className="p-2 rounded-lg transition-colors cursor-pointer"
                style={{
                  backgroundColor: showQuickAdd ? '#e0e0e0' : '#607d8b'
                }}
                onMouseEnter={(e) => {
                  if (!showQuickAdd) {
                    e.currentTarget.style.backgroundColor = '#e0e0e0';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.classList.add('text-gray-600');
                    if (icon) icon.classList.remove('text-white');
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showQuickAdd) {
                    e.currentTarget.style.backgroundColor = '#607d8b';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.classList.remove('text-gray-600');
                    if (icon) icon.classList.add('text-white');
                  }
                }}
                title="Quick Add"
              >
                <Plus className={`w-5 h-5 ${showQuickAdd ? 'text-gray-600' : 'text-white'}`} />
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
            <form onSubmit={handleSearch} style={{ width: '320px' }}>
              <div className="relative">
                <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
                  <Search className="w-4 h-4 text-gray-500" />
                </div>
                <input
                  id="global-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-16 py-1.5 bg-white text-gray-700 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm font-medium border border-gray-200"
                />
                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded border border-gray-200">
                    ⌘K
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
                <Bell className="w-5 h-5" />
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
                <MessageSquare className="w-5 h-5" />
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

            {/* Activity Icon */}
            <div ref={activityRef} className="relative flex-shrink-0">
              <button
                onClick={() => setShowActivity(!showActivity)}
                className={`p-2 rounded-lg relative cursor-pointer ${
                  showActivity 
                    ? 'bg-white text-[#3f72af]' 
                    : 'bg-transparent text-white hover:bg-white hover:text-[#3f72af] transition-colors duration-200'
                }`}
                title="Activity"
              >
                <Activity className="w-5 h-5" />
              </button>
              <ActivityDropdown
                isOpen={showActivity}
                onClose={() => setShowActivity(false)}
              />
            </div>

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
      </div>
    </header>
  );
}
