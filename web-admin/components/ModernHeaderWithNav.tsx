'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import AlertsDropdown from './AlertsDropdown';
import UnifiedCommunicationsDropdown from './UnifiedCommunicationsDropdown';
import ActivityDropdown from './ActivityDropdown';
import SystemStatusDropdown from './SystemStatusDropdown';
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
  RefreshCw,
  Sun,
  Moon,
  Monitor,
  Clock,
  CheckCircle,
  Database,
  Server,
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
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const navMenuRef = useRef<HTMLDivElement>(null);

  // Branding
  const [companyName, setCompanyName] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [headerColor, setHeaderColor] = useState<string>('#3f72af');

  // Notifications counts
  const [totalUnreadComms, setTotalUnreadComms] = useState(0);
  const [alertsCount, setAlertsCount] = useState(3);
  const [activityCount, setActivityCount] = useState(5);
  
  // Theme preferences
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  
  // Phase 3: Scroll behavior
  const [isCompact, setIsCompact] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Phase 3: Weather widget
  const [weather, setWeather] = useState({ temp: -5, condition: 'Heavy Snow', icon: '❄️' });
  const [showWeatherWidget, setShowWeatherWidget] = useState(false);
  const weatherRef = useRef<HTMLDivElement>(null);
  
  // Phase 3: Status indicator dropdown
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedBranding = localStorage.getItem('branding_settings');
    if (savedBranding) {
      const branding = JSON.parse(savedBranding);
      if (branding.company_name) setCompanyName(branding.company_name);
      if (branding.logo_url) setLogoUrl(branding.logo_url);
      if (branding.primary_color) setHeaderColor(branding.primary_color);
      if (branding.header_color) setHeaderColor(branding.header_color); // Backwards compatibility
    }
    
    // Load theme preference
    const savedTheme = localStorage.getItem('theme_preference');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);
  
  const toggleTheme = (theme: 'light' | 'dark' | 'auto') => {
    if (theme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme_preference', 'dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme_preference', 'light');
    }
    setShowThemeMenu(false);
  };

  // Navigation menu items
  const menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    {
      label: 'Sales',
      icon: TrendingUp,
      href: '/crm/dashboard',
      submenu: [
        { label: 'Sales Dashboard', href: '/crm/dashboard', icon: LayoutDashboard },
        { label: 'Customers', href: '/customers', icon: Users },
        { label: 'Leads', href: '/leads', icon: Users },
        { label: 'Estimates', href: '/estimates', icon: FileText },
        { label: 'Agreements', href: '/contracts', icon: FileText },
        { label: 'Agreement Templates', href: '/agreements/templates', icon: FileText },
      ],
    },
    {
      label: 'Operations',
      icon: Settings,
      href: '/operations',
      submenu: [
        { label: 'Projects', href: '/projects', icon: FolderOpen },
        { label: 'Work Orders', href: '/work-orders', icon: FileText },
        { label: 'Purchase Orders', href: '/purchase-orders', icon: DollarSign },
        { label: 'Inventory', href: '/inventory', icon: FolderOpen },
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
      href: '/dispatch',
      submenu: [
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
        { label: 'Automation', href: '/automation', icon: LayoutDashboard },
        { label: 'Integrations', href: '/integrations', icon: Link2 },
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
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
      if (weatherRef.current && !weatherRef.current.contains(event.target as Node)) {
        setShowWeatherWidget(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setSearchLoading(true);
      setShowSearchResults(true);

      try {
        // Simulate search - replace with actual API call
        const mockResults = [
          { id: '1', type: 'customer', title: 'ABC Corporation', subtitle: 'customer@abc.com', href: '/customers/1' },
          { id: '2', type: 'lead', title: 'XYZ Industries Lead', subtitle: 'Contact: John Doe', href: '/leads/2' },
          { id: '3', type: 'estimate', title: 'Estimate #EST-2024-001', subtitle: '$12,500.00', href: '/estimates/3' },
          { id: '4', type: 'project', title: 'Winter Maintenance 2024', subtitle: 'In Progress', href: '/projects/4' },
          { id: '5', type: 'invoice', title: 'Invoice #INV-2024-123', subtitle: 'Paid - $5,240.00', href: '/invoices/5' },
        ].filter(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
        );

        setTimeout(() => {
          setSearchResults(mockResults);
          setSearchLoading(false);
        }, 300);
      } catch (error) {
        console.error('Search error:', error);
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Enhanced Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
      
      // Ctrl/Cmd + N: Open Quick Add menu
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowQuickAdd(!showQuickAdd);
      }
      
      // Ctrl/Cmd + M: Open Communications
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        setShowUnifiedComms(!showUnifiedComms);
      }
      
      // Ctrl/Cmd + B: Open Navigation Menu
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setShowNavMenu(!showNavMenu);
      }
      
      // Escape: Close all dropdowns
      if (e.key === 'Escape') {
        setShowProfileMenu(false);
        setShowNotifications(false);
        setShowQuickAdd(false);
        setShowActivity(false);
        setShowNavMenu(false);
        setShowUnifiedComms(false);
        setShowSearchResults(false);
        setExpandedNavItem(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showQuickAdd, showUnifiedComms, showNavMenu]);

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
    { icon: <TrendingUp className="w-4 h-4" />, label: 'Lead', path: '/leads' },
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

  // Scroll detection for shadow and compact mode
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 10);
      
      // Compact mode: Activate when scrolling down past 100px
      if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        setIsCompact(true);
      } else if (currentScrollY < 50) {
        setIsCompact(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* CSS for animated gradient */}
      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animated-gradient-header {
          background: linear-gradient(135deg, ${headerColor} 0%, ${headerColor}cc 25%, ${headerColor}dd 50%, ${headerColor}cc 75%, ${headerColor} 100%);
          background-size: 200% 200%;
          animation: gradientShift 15s ease infinite;
        }
      `}</style>
      
      <header 
        className={`text-white sticky top-0 z-40 animated-gradient-header ${
          isScrolled ? 'shadow-2xl' : 'shadow-lg'
        }`} 
        style={{ 
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: isScrolled ? '0 8px 32px rgba(0, 0, 0, 0.15)' : '0 4px 24px rgba(0, 0, 0, 0.12)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease-in-out',
          height: isCompact ? '84px' : '96px',
        }}
      >
        <div className="max-w-[2000px] mx-auto px-6 transition-all duration-300" style={{ 
          height: '100%',
          paddingTop: isCompact ? '12px' : '18px',
          paddingBottom: isCompact ? '12px' : '18px',
        }}>
        <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
          {/* Left Side - Hamburger Menu and Company Name */}
          <div className="flex items-center gap-4">
            {/* Hamburger Menu */}
            <div ref={navMenuRef} className="relative">
              <button
                onClick={() => setShowNavMenu(!showNavMenu)}
                className={`p-2 rounded-lg transition-all duration-300 cursor-pointer ${
                  showNavMenu 
                    ? 'text-white' 
                    : 'text-white hover:text-white'
                }`}
                style={{
                  backgroundColor: showNavMenu ? '#607d8b' : 'transparent',
                  fontSize: isCompact ? '14px' : '16px',
                  transform: showNavMenu ? 'rotate(90deg)' : 'rotate(0deg)',
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
                aria-label="Open navigation menu"
                aria-expanded={showNavMenu}
                aria-haspopup="true"
              >
                <Menu className="w-9 h-9" />
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

            {/* Company Logo / Name */}
            <div className="flex items-center">
              {logoUrl ? (
                <img 
                  src={logoUrl}
                  alt="Company Logo" 
                  className="h-8 sm:h-10 w-auto max-w-[120px] sm:max-w-[200px] object-contain"
                />
              ) : (
                <div className="text-lg sm:text-xl md:text-2xl font-semibold tracking-wide truncate max-w-[150px] sm:max-w-none" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', letterSpacing: '0.5px' }}>
                  {companyName || 'CAF Group'}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - All other elements */}
          <div className="flex items-center gap-3">
            {/* Quick Add Button */}
            <div ref={quickAddRef} className="relative flex-shrink-0">
              <button
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                className="p-2 rounded-lg transition-all duration-200 cursor-pointer hover:scale-110"
                style={{
                  backgroundColor: showQuickAdd ? '#e0e0e0' : '#607d8b',
                  transform: showQuickAdd ? 'rotate(45deg)' : 'rotate(0deg)',
                }}
                onMouseEnter={(e) => {
                  if (!showQuickAdd) {
                    e.currentTarget.style.backgroundColor = '#e0e0e0';
                    e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.classList.add('text-gray-600');
                    if (icon) icon.classList.remove('text-white');
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showQuickAdd) {
                    e.currentTarget.style.backgroundColor = '#607d8b';
                    e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.classList.remove('text-gray-600');
                    if (icon) icon.classList.add('text-white');
                  }
                }}
                title="Quick Add"
              >
                <Plus className={`w-6 h-6 transition-transform duration-200 ${showQuickAdd ? 'text-gray-600' : 'text-white'}`} />
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
            <div ref={searchRef} className="relative hidden md:block" style={{ width: '320px' }}>
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
                    <Search className="w-4 h-4 text-gray-500" />
                  </div>
                  <input
                    id="global-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-16 py-1.5 bg-white text-gray-700 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm font-medium border border-gray-200 focus:scale-105 focus:shadow-lg"
                    style={{ transition: 'all 0.2s ease-in-out' }}
                  />
                  <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                    <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded border border-gray-200">
                      ⌘K
                    </kbd>
                  </div>
                </div>
              </form>

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  {searchLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => {
                            router.push(result.href);
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all text-left border-b border-gray-100 last:border-0 group"
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform ${
                            result.type === 'customer' ? 'bg-gradient-to-br from-blue-100 to-blue-50' :
                            result.type === 'lead' ? 'bg-gradient-to-br from-green-100 to-green-50' :
                            result.type === 'estimate' ? 'bg-gradient-to-br from-purple-100 to-purple-50' :
                            result.type === 'project' ? 'bg-gradient-to-br from-orange-100 to-orange-50' :
                            'bg-gradient-to-br from-gray-100 to-gray-50'
                          }`}>
                            {result.type === 'customer' && <Users className="w-5 h-5 text-blue-600" />}
                            {result.type === 'lead' && <TrendingUp className="w-5 h-5 text-green-600" />}
                            {result.type === 'estimate' && <FileText className="w-5 h-5 text-purple-600" />}
                            {result.type === 'project' && <Briefcase className="w-5 h-5 text-orange-600" />}
                            {result.type === 'invoice' && <DollarSign className="w-5 h-5 text-gray-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900 truncate">{result.title}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                result.type === 'customer' ? 'bg-blue-100 text-blue-700' :
                                result.type === 'lead' ? 'bg-green-100 text-green-700' :
                                result.type === 'estimate' ? 'bg-purple-100 text-purple-700' :
                                result.type === 'project' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {result.type}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                        </button>
                      ))}
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">No results found for "{searchQuery}"</p>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">Type at least 2 characters to search</p>
                    </div>
                  )}
                </div>
              )}
            </div>

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
                {alertsCount > 0 && (
                  <span className="absolute top-0 right-0 flex items-center justify-center">
                    <span className="absolute inline-flex h-4 w-4 rounded-full bg-red-500 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {alertsCount > 9 ? '9+' : alertsCount}
                    </span>
                  </span>
                )}
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
                <Activity className="w-6 h-6" />
                {activityCount > 0 && (
                  <span className="absolute top-0 right-0 flex items-center justify-center">
                    <span className="absolute inline-flex h-4 w-4 rounded-full bg-orange-500 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex items-center justify-center h-4 w-4 rounded-full bg-orange-500 text-white text-[10px] font-bold">
                      {activityCount > 9 ? '9+' : activityCount}
                    </span>
                  </span>
                )}
              </button>
              <ActivityDropdown
                isOpen={showActivity}
                onClose={() => setShowActivity(false)}
              />
            </div>

            {/* System Status Icon with Dropdown */}
            <div ref={statusRef} className="relative flex-shrink-0">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="p-2 rounded-lg transition-colors cursor-pointer relative"
                style={{
                  backgroundColor: showStatusDropdown ? '#e0e0e0' : '#607d8b'
                }}
                onMouseEnter={(e) => {
                  if (!showStatusDropdown) {
                    e.currentTarget.style.backgroundColor = '#e0e0e0';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.classList.add('text-gray-600');
                    if (icon) icon.classList.remove('text-white');
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showStatusDropdown) {
                    e.currentTarget.style.backgroundColor = '#607d8b';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.classList.remove('text-gray-600');
                    if (icon) icon.classList.add('text-white');
                  }
                }}
                title="System Status"
              >
                <Server className={`w-6 h-6 ${showStatusDropdown ? 'text-gray-600' : 'text-white'}`} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </button>

              {showStatusDropdown && (
                <SystemStatusDropdown onClose={() => setShowStatusDropdown(false)} />
              )}
            </div>

            {/* Weather Widget - Clickable to navigate to weather page */}
            <div ref={weatherRef} className="relative hidden xl:block">
              <button
                onClick={() => router.push('/weather')}
                className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg shadow-sm transition-all cursor-pointer border border-blue-400"
              >
                <span className="text-2xl">{weather.icon}</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">{weather.temp}°C</span>
                  <span className="text-sm text-white opacity-90">{weather.condition}</span>
                </div>
              </button>
            </div>

            {/* Avatar */}
            <div ref={profileRef} className="relative flex-shrink-0">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-15 h-15 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all border-2 border-white shadow-lg cursor-pointer"
              >
                {user?.avatar ? (
                  user.avatar.length <= 4 ? (
                    <span className="text-xl text-white font-bold">{user.avatar}</span>
                  ) : (
                    <img
                      src={user.avatar}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  )
                ) : (
                  <span className="text-sm font-bold text-white">{getInitials()}</span>
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
    </>
  );
}
