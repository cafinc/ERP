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
  TrendingUp,
  Wrench,
  MessageSquare,
  Shield,
  Camera,
  BarChart3,
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
        { label: 'Email Settings', href: '/settings/email-templates', icon: FileText },
        { label: 'SMS Config', href: '/settings/sms-config', icon: Settings },
        { label: 'Roles & Permissions', href: '/settings/roles-permissions', icon: UserCog },
        { label: 'API Settings', href: '/settings/api', icon: Link2 },
        { label: 'Webhooks', href: '/settings/webhooks', icon: Link2 },
        { label: 'Integration Settings', href: '/settings/app-integration', icon: Link2 },
        { label: 'QuickBooks', href: '/settings/quickbooks', icon: Link2 },
        { label: 'Google', href: '/settings/google', icon: Link2 },
        { label: 'RingCentral', href: '/settings/ringcentral', icon: Link2 },
        { label: 'Equipment Forms', href: '/settings/equipment-forms', icon: FileText },
        { label: 'Preferences', href: '/settings/preferences', icon: Settings },
        { label: 'Support', href: '/settings/support', icon: Settings },
        { label: 'Team', href: '/team', icon: Users },
        { label: 'Crew', href: '/crew', icon: Users },
        { label: 'Shifts', href: '/shifts', icon: FileText },
      ],
    },
  ];

  const handleMenuClick = (item: MenuItem) => {
    if (item.href && item.submenu) {
      // If it has both href and submenu (dashboard sections)
      router.push(item.href);
      // Keep menu expanded or toggle it
      setExpandedMenu(expandedMenu === item.label ? item.label : item.label);
    } else if (item.href) {
      // Single page without submenu
      router.push(item.href);
      setExpandedMenu(null);
    } else if (item.submenu) {
      // Has submenu but no href (shouldn't happen now)
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