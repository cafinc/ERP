'use client';

import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { ChatProvider } from './ChatProvider';
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  Receipt,
  Snowflake,
  MapPin,
  Map,
  Navigation,
  Radio,
  UsersRound,
  Wrench,
  Package,
  CheckSquare,
  Mail,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Phone,
  Cloud,
  Truck,
  UserCircle,
  CloudRain,
  Image as ImageIcon,
  MessageSquare,
  AlertTriangle,
  Star,
  BookOpen,
  ClipboardList,
  Clock,
  Shield,
  HardHat,
  Clipboard,
  DollarSign,
  TrendingUp,
  CreditCard,
  Container,
  Box,
  Zap,
  UserPlus,
  Calendar,
  Camera,
  Bell,
  Key,
  Webhook,
  Code,
  Lock,
  UserCog,
  Globe,
  Crown,
  User,
  Palette,
  Link2,
} from 'lucide-react';
import { useState } from 'react';
import CallPopup from './CallPopup';
import EnhancedHeader from './EnhancedHeader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebarMinimized') === 'true';
    }
    return false;
  });

  // Auto-expand menu based on current pathname
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get saved expanded menus from localStorage
      const savedExpandedMenus = localStorage.getItem('expandedMenus');
      if (savedExpandedMenus) {
        try {
          setExpandedMenus(JSON.parse(savedExpandedMenus));
        } catch (e) {
          setExpandedMenus([]);
        }
      }
    }
  }, []);

  // Auto-expand parent menu when on a submenu page
  useEffect(() => {
    // Map of pathname prefixes to menu keys
    const pathToMenuMap: { [key: string]: string } = {
      '/customers': 'crm',
      '/leads': 'crm',
      '/estimates': 'crm',
      '/contracts': 'crm',
      '/agreements': 'crm',
      '/projects': 'crm',
      '/invoices': 'crm',
      '/finance': 'finance',
      '/access': 'access',
      '/team': 'access',
      '/crew': 'access',
      '/shifts': 'access',
      '/equipment': 'equipment',
      '/assets': 'equipment',
      '/inventory': 'equipment',
      '/dispatch': 'dispatch',
      '/sites': 'dispatch',
      '/routes': 'dispatch',
      '/geofence': 'dispatch',
      '/tracking': 'dispatch',
      '/consumables': 'dispatch',
      '/services': 'dispatch',
      '/weather': 'dispatch',
      '/messages': 'communication',
      '/ringcentral': 'communication',
      '/gmail': 'communication',
      '/emergency-alert': 'communication',
      '/feedback': 'communication',
      '/learning-documents': 'communication',
      '/safety': 'safety',
      '/settings': 'settings',
    };

    // Find which menu should be expanded based on current path
    for (const [path, menuKey] of Object.entries(pathToMenuMap)) {
      if (pathname.startsWith(path)) {
        setExpandedMenus((prev) => {
          if (!prev.includes(menuKey)) {
            const newExpanded = [...prev, menuKey];
            localStorage.setItem('expandedMenus', JSON.stringify(newExpanded));
            return newExpanded;
          }
          return prev;
        });
        break;
      }
    }
  }, [pathname]);

  // Auto-minimize sidebar only when viewing a customer profile
  useEffect(() => {
    // Check if viewing a specific customer profile (e.g., /customers/[id])
    const isViewingCustomerProfile = /^\/customers\/[^/]+$/.test(pathname);
    
    if (isViewingCustomerProfile && !isSidebarMinimized) {
      setIsSidebarMinimized(true);
      localStorage.setItem('sidebarMinimized', 'true');
    }
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const toggleMenu = (menu: string) => {
    setExpandedMenus((prev) => {
      const newExpanded = prev.includes(menu) 
        ? prev.filter((m) => m !== menu) 
        : [...prev, menu];
      localStorage.setItem('expandedMenus', JSON.stringify(newExpanded));
      return newExpanded;
    });
  };

  const handleMenuLabelClick = (item: any) => {
    // If item has a dashboard, navigate to it
    if (item.dashboardHref) {
      router.push(item.dashboardHref);
    }
    
    // If item has submenu, toggle it
    if (item.submenu && item.key) {
      toggleMenu(item.key);
    }
  };

  // Check if any submenu item is active
  const isMenuActive = (item: any) => {
    if (item.href && pathname === item.href) return true;
    if (item.submenu) {
      return item.submenu.some((subItem: any) => pathname === subItem.href || pathname.startsWith(subItem.href + '/'));
    }
    return false;
  };

  const toggleSidebar = () => {
    const newState = !isSidebarMinimized;
    setIsSidebarMinimized(newState);
    
    // Collapse all menus when minimizing to prevent flash
    if (newState) {
      setExpandedMenus([]);
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarMinimized', String(newState));
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    {
      icon: Users,
      label: 'CRM',
      key: 'crm',
      dashboardHref: '/crm/dashboard',
      submenu: [
        { icon: Users, label: 'Customers', href: '/customers' },
        { icon: UserPlus, label: 'Leads', href: '/leads' },
        { icon: FileText, label: 'Estimates', href: '/estimates' },
        { icon: FileText, label: 'Agreements', href: '/contracts' },
        { icon: FileText, label: 'Agreement Templates', href: '/agreements/templates' },
        { icon: FolderOpen, label: 'Projects', href: '/projects' },
        { icon: Receipt, label: 'Invoices', href: '/invoices' },
      ],
    },
    {
      icon: DollarSign,
      label: 'Finance',
      key: 'finance',
      dashboardHref: '/finance/dashboard',
      submenu: [
        { icon: Receipt, label: 'Invoices', href: '/invoices' },
        { icon: FileText, label: 'Estimates', href: '/estimates' },
        { icon: TrendingUp, label: 'Expenses', href: '/finance/expenses' },
        { icon: CreditCard, label: 'Payments', href: '/finance/payments' },
        { icon: BarChart3, label: 'Reports', href: '/finance/reports' },
      ],
    },
    {
      icon: Users,
      label: 'Access',
      key: 'access',
      dashboardHref: '/access/dashboard',
      submenu: [
        { icon: Shield, label: 'Access Control', href: '/access' },
        { icon: Crown, label: 'Master Users', href: '/access/master' },
        { icon: UserCog, label: 'Admins', href: '/access/admins' },
        { icon: HardHat, label: 'Crew', href: '/access/crew' },
        { icon: Users, label: 'Subcontractors', href: '/access/subcontractors' },
        { icon: User, label: 'Customers', href: '/access/customers' },
        { icon: Package, label: 'Vendors', href: '/access/vendors' },
        { icon: Clock, label: 'Shift History', href: '/shifts/history' },
      ],
    },
    {
      icon: Truck,
      label: 'Assets',
      key: 'equipment',
      dashboardHref: '/equipment/dashboard',
      submenu: [
        { icon: Truck, label: 'Equipment', href: '/equipment' },
        { icon: Truck, label: 'Vehicles', href: '/assets/vehicles' },
        { icon: Box, label: 'Trailers', href: '/assets/trailers' },
        { icon: Wrench, label: 'Tools', href: '/assets/tools' },
        { icon: Package, label: 'Inventory', href: '/inventory' },
        { icon: Wrench, label: 'Maintenance', href: '/equipment/maintenance' },
        { icon: ClipboardList, label: 'Inspections', href: '/equipment/inspections' },
      ],
    },
    {
      icon: Snowflake,
      label: 'Dispatch',
      key: 'dispatch',
      dashboardHref: '/dispatch/dashboard',
      submenu: [
        { icon: Calendar, label: 'Dispatch', href: '/dispatch' },
        { icon: MapPin, label: 'Sites', href: '/sites' },
        { icon: Map, label: 'Routes', href: '/routes' },
        { icon: Map, label: 'Route Optimization', href: '/routes/optimize' },
        { icon: MapPin, label: 'Geofence', href: '/geofence' },
        { icon: Navigation, label: 'Tracking', href: '/tracking' },
        { icon: Package, label: 'Consumables', href: '/consumables' },
        { icon: BarChart3, label: 'Consumables Analytics', href: '/consumables/analytics' },
        { icon: Wrench, label: 'Services', href: '/services' },
        { icon: Cloud, label: 'Weather', href: '/weather' },
      ],
    },
    {
      icon: MessageSquare,
      label: 'Comms',
      key: 'communication',
      dashboardHref: '/communication/dashboard',
      submenu: [
        { icon: MessageSquare, label: 'Messages', href: '/messages' },
        { icon: Phone, label: 'RingCentral', href: '/ringcentral' },
        { icon: Phone, label: 'RC Active Calls', href: '/ringcentral/active-calls' },
        { icon: MessageSquare, label: 'RC SMS', href: '/ringcentral/sms' },
        { icon: Mail, label: 'Gmail', href: '/gmail' },
        { icon: AlertTriangle, label: 'Emergency Alert', href: '/emergency-alert' },
        { icon: Star, label: 'Customer Feedback', href: '/feedback' },
        { icon: BookOpen, label: 'Learning Centre', href: '/learning-documents' },
      ],
    },
    {
      icon: Shield,
      label: 'Safety',
      key: 'safety',
      dashboardHref: '/safety/dashboard',
      submenu: [
        { icon: AlertTriangle, label: 'Incident Reporting', href: '/safety/incidents' },
        { icon: ClipboardList, label: 'Safety Inspections', href: '/safety/inspections' },
        { icon: FileText, label: 'Hazard Assessments', href: '/safety/hazards' },
        { icon: BookOpen, label: 'Safety Training', href: '/safety/training' },
        { icon: Users, label: 'Safety Meetings', href: '/safety/meetings' },
        { icon: HardHat, label: 'PPE Management', href: '/safety/ppe' },
        { icon: Clipboard, label: 'Safety Policies', href: '/safety/policies' },
        { icon: AlertTriangle, label: 'Emergency Plans', href: '/safety/emergency' },
      ],
    },
    { icon: Zap, label: 'Automation', href: '/automation' },
    { icon: CheckSquare, label: 'Tasks', href: '/tasks' },
    { icon: FileText, label: 'Forms', href: '/forms' },
    { icon: Camera, label: 'Photos', href: '/photos' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: TrendingUp, label: 'Reports', href: '/reports' },
    {
      icon: Users,
      label: 'HR Module',
      key: 'hr',
      dashboardHref: '/hr',
      submenu: [
        { icon: Users, label: 'Employees', href: '/hr/employees' },
        { icon: Clock, label: 'Time & Attendance', href: '/hr/time-attendance' },
        { icon: Calendar, label: 'PTO Management', href: '/hr/pto' },
        { icon: BookOpen, label: 'Training', href: '/hr/training' },
        { icon: TrendingUp, label: 'Performance', href: '/hr/performance' },
        { icon: DollarSign, label: 'Payroll Settings', href: '/hr/payroll' },
      ],
    },
    {
      icon: Link2,
      label: 'Integrations',
      key: 'integrations',
      dashboardHref: '/integrations',
      submenu: [
        { icon: Link2, label: 'Integration Hub', href: '/integrations' },
        { icon: DollarSign, label: 'QuickBooks', href: '/settings/quickbooks' },
        { icon: Cloud, label: 'Microsoft 365', href: '/integrations?type=microsoft_365' },
      ],
    },
    {
      icon: Settings,
      label: 'Settings',
      key: 'settings',
      dashboardHref: '/settings',
      submenu: [
        { icon: UserCog, label: 'Account', href: '/settings/account' },
        { icon: Lock, label: 'Security', href: '/settings/security' },
        { icon: Palette, label: 'Branding', href: '/settings/branding' },
        { icon: Bell, label: 'Notifications', href: '/settings/notifications' },
        { icon: Zap, label: 'App Integration', href: '/settings/app-integration' },
        { icon: Mail, label: 'Email Templates', href: '/settings/email-templates' },
        { icon: Shield, label: 'Roles & Permissions', href: '/settings/roles-permissions' },
        { icon: Settings, label: 'Permissions Matrix', href: '/settings/permissions-matrix' },
        { icon: Code, label: 'API Settings', href: '/settings/api' },
        { icon: Webhook, label: 'Webhooks', href: '/settings/webhooks' },
        { icon: Globe, label: 'Preferences', href: '/settings/preferences' },
        { icon: Key, label: 'QuickBooks', href: '/settings/quickbooks' },
      ],
    },
  ];

  return (
    <ChatProvider>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Enhanced Header */}
        <EnhancedHeader />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Call Popup Widget - Real-time incoming call notifications */}
          {/* TEMPORARILY DISABLED */}
          {/* <CallPopup apiUrl={process.env.NEXT_PUBLIC_API_URL || ''} /> */}
          
          {/* Sidebar */}
          <aside className={`${isSidebarMinimized ? 'w-16' : 'w-52'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => (
            <div key={item.label}>
              {item.submenu ? (
                <>
                  <div className={`w-full flex items-center ${isSidebarMinimized ? 'justify-center' : 'justify-between'} rounded-lg overflow-hidden ${isMenuActive(item) ? 'bg-[#3f72af]/5' : ''}`}>
                    {/* Label - clickable to navigate to dashboard and toggle submenu */}
                    <button
                      onClick={() => handleMenuLabelClick(item)}
                      className={`flex-1 flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${isSidebarMinimized ? 'justify-center' : 'gap-3'} ${
                        isMenuActive(item)
                          ? 'text-[#3f72af] font-medium'
                          : 'text-gray-700 hover:bg-[#3f72af]/10 hover:text-[#3f72af]'
                      }`}
                      title={isSidebarMinimized ? item.label : ''}
                    >
                      <item.icon className={`w-5 h-5 ${isMenuActive(item) ? 'stroke-[2.5]' : ''}`} />
                      {!isSidebarMinimized && <span className="font-medium">{item.label}</span>}
                    </button>
                    
                    {/* Arrow - clickable to toggle submenu */}
                    {!isSidebarMinimized && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(item.key!);
                        }}
                        className={`px-2 py-3 rounded-lg transition-all duration-200 mr-2 ${
                          isMenuActive(item)
                            ? 'text-[#3f72af] hover:bg-[#3f72af]/20'
                            : 'text-gray-700 hover:bg-[#3f72af]/10 hover:text-[#3f72af]'
                        }`}
                        title={expandedMenus.includes(item.key!) ? 'Collapse' : 'Expand'}
                      >
                        <ChevronDown 
                          className={`w-4 h-4 transition-transform duration-300 ${
                            expandedMenus.includes(item.key!) ? 'rotate-0' : '-rotate-90'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      !isSidebarMinimized && expandedMenus.includes(item.key!)
                        ? 'max-h-[1000px] opacity-100'
                        : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="ml-4 mt-1 space-y-1 pb-1">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                            pathname === subItem.href || pathname.startsWith(subItem.href + '/')
                              ? 'bg-[#3f72af]/10 text-[#3f72af] font-medium shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          {subItem.icon && <subItem.icon className={`w-4 h-4 ${pathname === subItem.href || pathname.startsWith(subItem.href + '/') ? 'stroke-[2.5]' : ''}`} />}
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  href={item.href!}
                  className={`flex items-center ${isSidebarMinimized ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-all duration-200 ${
                    isMenuActive(item)
                      ? 'bg-[#3f72af]/10 text-[#3f72af] font-medium shadow-sm'
                      : 'text-gray-700 hover:bg-[#3f72af]/10 hover:text-[#3f72af]'
                  }`}
                  title={isSidebarMinimized ? item.label : ''}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isMenuActive(item) ? 'stroke-[2.5]' : ''}`} />
                  {!isSidebarMinimized && <span className="font-medium">{item.label}</span>}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Collapse/Expand Toggle */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={toggleSidebar}
            className={`w-full flex items-center justify-center py-3 bg-gray-50 hover:bg-[#3f72af]/20 rounded-lg transition-colors ${
              isSidebarMinimized ? 'px-0' : 'px-4'
            }`}
            title={isSidebarMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
            aria-label={isSidebarMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
          >
            {isSidebarMinimized ? (
              <ChevronRight className="w-7 h-7 text-[#3f72af]" strokeWidth={2.5} />
            ) : (
              <ChevronLeft className="w-7 h-7 text-[#3f72af]" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Page Content */}
        {children}
      </main>
      </div>
    </div>
    </ChatProvider>
  );
}
