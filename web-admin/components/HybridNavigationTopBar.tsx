'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import EnhancedHeader from './EnhancedHeader';
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  DollarSign,
  MapPin,
  Settings,
  UserCog,
  Link2,
  Briefcase,
  ChevronRight,
} from 'lucide-react';

interface MenuItem {
  label: string;
  icon: any;
  href?: string;
  submenu?: { label: string; href: string; icon?: any }[];
}

export default function HybridNavigationTopBar({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const menuItems: MenuItem[] = [
    // Core Operations
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    {
      label: 'Dispatch',
      icon: MapPin,
      submenu: [
        { label: 'Dispatch Dashboard', href: '/dispatch/dashboard', icon: LayoutDashboard },
        { label: 'All Dispatches', href: '/dispatch', icon: MapPin },
        { label: 'Create Dispatch', href: '/dispatch/create', icon: FileText },
      ],
    },
    {
      label: 'Sites',
      icon: MapPin,
      submenu: [
        { label: 'All Sites', href: '/sites', icon: MapPin },
        { label: 'Site Detail', href: '/sites/[id]', icon: FileText },
        { label: 'Site Maps', href: '/sites/maps', icon: MapPin },
        { label: 'Create Site', href: '/sites/create', icon: FileText },
      ],
    },
    
    // Business Management
    { label: 'Customers', icon: Users, href: '/customers' },
    { label: 'Estimates', icon: FileText, href: '/estimates' },
    { label: 'Projects', icon: FolderOpen, href: '/projects' },
    { label: 'Invoices', icon: DollarSign, href: '/invoices' },
    {
      label: 'Contracts',
      icon: FileText,
      submenu: [
        { label: 'All Contracts', href: '/contracts', icon: FileText },
        { label: 'Create Contract', href: '/contracts/create', icon: FileText },
      ],
    },
    
    // Finance
    {
      label: 'Finance',
      icon: DollarSign,
      submenu: [
        { label: 'Finance Dashboard', href: '/finance/dashboard', icon: LayoutDashboard },
        { label: 'Payments', href: '/finance/payments', icon: DollarSign },
        { label: 'Expenses', href: '/finance/expenses', icon: DollarSign },
        { label: 'Reports', href: '/finance/reports', icon: FileText },
      ],
    },
    
    // Equipment & Assets
    {
      label: 'Equipment',
      icon: Settings,
      submenu: [
        { label: 'Equipment Dashboard', href: '/equipment/dashboard', icon: LayoutDashboard },
        { label: 'All Equipment', href: '/equipment', icon: Settings },
        { label: 'Inspections', href: '/equipment/inspections', icon: FileText },
        { label: 'Maintenance', href: '/equipment/maintenance', icon: Settings },
        { label: 'Create Equipment', href: '/equipment/create', icon: FileText },
      ],
    },
    {
      label: 'Assets',
      icon: Settings,
      submenu: [
        { label: 'Vehicles', href: '/assets/vehicles', icon: MapPin },
        { label: 'Trailers', href: '/assets/trailers', icon: Settings },
        { label: 'Tools', href: '/assets/tools', icon: Settings },
      ],
    },
    {
      label: 'Inventory',
      icon: FolderOpen,
      submenu: [
        { label: 'Inventory List', href: '/inventory', icon: FolderOpen },
        { label: 'Consumables', href: '/consumables', icon: FolderOpen },
        { label: 'Analytics', href: '/consumables/analytics', icon: LayoutDashboard },
      ],
    },
    
    // Team & HR
    {
      label: 'Team',
      icon: Users,
      submenu: [
        { label: 'Team Members', href: '/team', icon: Users },
        { label: 'Crew', href: '/crew', icon: Users },
        { label: 'Shifts', href: '/shifts', icon: FileText },
        { label: 'Shift History', href: '/shifts/history', icon: FileText },
      ],
    },
    {
      label: 'HR Module',
      icon: Briefcase,
      submenu: [
        { label: 'HR Dashboard', href: '/hr', icon: Briefcase },
        { label: 'Employees', href: '/hr/employees', icon: Users },
        { label: 'Time & Attendance', href: '/hr/time-attendance', icon: LayoutDashboard },
        { label: 'PTO', href: '/hr/pto', icon: FileText },
        { label: 'Training', href: '/hr/training', icon: FolderOpen },
        { label: 'Performance', href: '/hr/performance', icon: DollarSign },
        { label: 'Payroll', href: '/hr/payroll', icon: DollarSign },
      ],
    },
    
    // Operations & Safety
    {
      label: 'Safety',
      icon: UserCog,
      submenu: [
        { label: 'Safety Dashboard', href: '/safety/dashboard', icon: LayoutDashboard },
        { label: 'Incidents', href: '/safety/incidents', icon: FileText },
        { label: 'Inspections', href: '/safety/inspections', icon: FileText },
        { label: 'Training', href: '/safety/training', icon: FolderOpen },
        { label: 'Hazards', href: '/safety/hazards', icon: FileText },
        { label: 'Meetings', href: '/safety/meetings', icon: Users },
        { label: 'Policies', href: '/safety/policies', icon: FileText },
        { label: 'PPE', href: '/safety/ppe', icon: Settings },
      ],
    },
    {
      label: 'Routes',
      icon: MapPin,
      submenu: [
        { label: 'All Routes', href: '/routes', icon: MapPin },
        { label: 'Optimize Routes', href: '/routes/optimize', icon: LayoutDashboard },
      ],
    },
    
    // Communication
    {
      label: 'Communication',
      icon: Users,
      submenu: [
        { label: 'Communication Dashboard', href: '/communication/dashboard', icon: LayoutDashboard },
        { label: 'Messages', href: '/messages', icon: Users },
        { label: 'Gmail', href: '/gmail', icon: Users },
        { label: 'Feedback', href: '/feedback', icon: FileText },
      ],
    },
    {
      label: 'RingCentral',
      icon: Users,
      submenu: [
        { label: 'RingCentral Hub', href: '/ringcentral', icon: Users },
        { label: 'Active Calls', href: '/ringcentral/active-calls', icon: Users },
        { label: 'Messaging', href: '/ringcentral/messaging', icon: Users },
        { label: 'SMS', href: '/ringcentral/sms', icon: Users },
        { label: 'Recordings', href: '/ringcentral/recordings', icon: FileText },
        { label: 'Analytics', href: '/ringcentral/analytics', icon: LayoutDashboard },
        { label: 'Contacts', href: '/ringcentral/contacts', icon: Users },
      ],
    },
    
    // Tools & Automation
    {
      label: 'Forms',
      icon: FileText,
      submenu: [
        { label: 'All Forms', href: '/forms', icon: FileText },
        { label: 'Form Builder', href: '/forms/builder', icon: FileText },
        { label: 'Responses', href: '/forms/responses', icon: FileText },
      ],
    },
    {
      label: 'Automation',
      icon: LayoutDashboard,
      submenu: [
        { label: 'Workflows', href: '/automation/workflows', icon: LayoutDashboard },
        { label: 'Analytics', href: '/automation/analytics', icon: LayoutDashboard },
        { label: 'Create Workflow', href: '/automation/workflows/create', icon: FileText },
      ],
    },
    { label: 'Weather', icon: MapPin, href: '/weather' },
    { label: 'Tracking', icon: MapPin, href: '/tracking' },
    { label: 'Reports', icon: FileText, href: '/reports' },
    { label: 'Analytics', icon: LayoutDashboard, href: '/analytics' },
    { label: 'Tasks', icon: FileText, href: '/tasks' },
    
    // Admin
    {
      label: 'Access',
      icon: UserCog,
      submenu: [
        { label: 'Access Dashboard', href: '/access', icon: LayoutDashboard },
        { label: 'Master Users', href: '/access/master', icon: Users },
        { label: 'Admins', href: '/access/admins', icon: Users },
        { label: 'Crew', href: '/access/crew', icon: Users },
        { label: 'Customers', href: '/access/customers', icon: Users },
        { label: 'Subcontractors', href: '/access/subcontractors', icon: Users },
        { label: 'Vendors', href: '/access/vendors', icon: Users },
      ],
    },
    { label: 'Integrations', icon: Link2, href: '/integrations' },
    {
      label: 'Settings',
      icon: Settings,
      submenu: [
        { label: 'Settings Hub', href: '/settings', icon: Settings },
        { label: 'Account', href: '/settings/account', icon: Users },
        { label: 'Profile', href: '/settings/profile', icon: Users },
        { label: 'Company', href: '/settings/company', icon: Settings },
        { label: 'Security', href: '/settings/security', icon: Settings },
        { label: 'Branding', href: '/settings/branding', icon: Settings },
        { label: 'Service Areas', href: '/settings/service-areas', icon: MapPin },
        { label: 'Roles & Permissions', href: '/settings/roles-permissions', icon: UserCog },
        { label: 'Permissions Matrix', href: '/settings/permissions-matrix', icon: UserCog },
        { label: 'Billing', href: '/settings/billing', icon: DollarSign },
        { label: 'Notifications', href: '/settings/notifications', icon: Settings },
        { label: 'Email Config', href: '/settings/email-config', icon: Settings },
        { label: 'Email Templates', href: '/settings/email-templates', icon: FileText },
        { label: 'SMS Config', href: '/settings/sms-config', icon: Settings },
        { label: 'API', href: '/settings/api', icon: Link2 },
        { label: 'Webhooks', href: '/settings/webhooks', icon: Link2 },
        { label: 'Google', href: '/settings/google', icon: Link2 },
        { label: 'QuickBooks', href: '/settings/quickbooks', icon: Link2 },
        { label: 'RingCentral', href: '/settings/ringcentral', icon: Link2 },
        { label: 'Preferences', href: '/settings/preferences', icon: Settings },
        { label: 'Equipment Forms', href: '/settings/equipment-forms', icon: FileText },
        { label: 'Support', href: '/settings/support', icon: Settings },
      ],
    },
  ];

  const handleMenuClick = (item: MenuItem) => {
    if (item.href) {
      router.push(item.href);
      setExpandedMenu(null);
    } else if (item.submenu) {
      setExpandedMenu(expandedMenu === item.label ? null : item.label);
    }
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Enhanced Header */}
      <EnhancedHeader />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Collapsed Sidebar */}
        <div className="w-16 bg-[#2c3e50] flex flex-col items-center py-4 gap-2 shadow-lg z-30">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = item.href ? isActive(item.href) : item.submenu?.some(sub => isActive(sub.href));
            
            return (
              <button
                key={item.label}
                onClick={() => handleMenuClick(item)}
                className={`relative p-3 rounded-lg transition-all group ${
                  active
                    ? 'bg-[#3f72af] text-white'
                    : 'text-gray-400 hover:bg-[#34495e] hover:text-white'
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
                
                {/* Tooltip on hover */}
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Top Navigation Bar for Submenus */}
        {expandedMenu && (
          <div className="absolute top-0 left-16 right-0 bg-white border-b border-gray-200 shadow-md z-40">
            <div className="px-6 py-3">
              <div className="flex items-center gap-3 flex-wrap">
                {menuItems
                  .find(item => item.label === expandedMenu)
                  ?.submenu?.map((subItem) => {
                    const SubIcon = subItem.icon || ChevronRight;
                    return (
                      <button
                        key={subItem.href}
                        onClick={() => {
                          router.push(subItem.href);
                          setExpandedMenu(null);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive(subItem.href)
                            ? 'bg-[#3f72af] text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <SubIcon className={`w-4 h-4 ${
                          isActive(subItem.href) ? 'text-white' : 'text-[#3f72af]'
                        }`} />
                        {subItem.label}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className={`flex-1 overflow-auto transition-all ${expandedMenu ? 'pt-14' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}