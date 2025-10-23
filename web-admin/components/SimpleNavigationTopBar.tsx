'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  UserCog,
  Wrench,
  MapPin,
  MessageSquare,
  Shield,
  FileText,
  Camera,
  BarChart3,
  Briefcase,
  Settings,
  Link2,
  FolderOpen,
} from 'lucide-react';

interface MenuItem {
  label: string;
  icon: any;
  href?: string;
  submenu?: { label: string; href: string }[];
}

export default function SimpleNavigationTopBar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    {
      label: 'Sales',
      icon: TrendingUp,
      href: '/crm/dashboard',
      submenu: [
        { label: 'Sales Dashboard', href: '/crm/dashboard' },
        { label: 'Customers', href: '/customers' },
        { label: 'Leads', href: '/leads' },
        { label: 'Estimates', href: '/estimates' },
        { label: 'Agreements', href: '/contracts' },
        { label: 'Agreement Templates', href: '/agreements/templates' },
      ],
    },
    {
      label: 'Operations',
      icon: Settings,
      href: '/operations',
      submenu: [
        { label: 'Projects', href: '/projects' },
        { label: 'Work Orders', href: '/work-orders' },
        { label: 'Purchase Orders', href: '/purchase-orders' },
        { label: 'Inventory', href: '/inventory' },
      ],
    },
    {
      label: 'Finance',
      icon: DollarSign,
      href: '/finance/dashboard',
      submenu: [
        { label: 'Finance Dashboard', href: '/finance/dashboard' },
        { label: 'Invoices', href: '/invoices' },
        { label: 'Expenses', href: '/finance/expenses' },
        { label: 'Payments', href: '/finance/payments' },
        { label: 'Reports', href: '/finance/reports' },
      ],
    },
    {
      label: 'Access',
      icon: UserCog,
      href: '/access',
      submenu: [
        { label: 'Access Dashboard', href: '/access' },
        { label: 'Master Users', href: '/access/master' },
        { label: 'Admins', href: '/access/admins' },
        { label: 'Crew', href: '/access/crew' },
        { label: 'Subcontractors', href: '/access/subcontractors' },
        { label: 'Customer Users', href: '/access/customers' },
        { label: 'Vendors', href: '/access/vendors' },
        { label: 'Shift History', href: '/shifts/history' },
      ],
    },
    {
      label: 'Assets',
      icon: Wrench,
      href: '/equipment/dashboard',
      submenu: [
        { label: 'Assets Dashboard', href: '/equipment/dashboard' },
        { label: 'Equipment', href: '/equipment' },
        { label: 'Vehicles', href: '/assets/vehicles' },
        { label: 'Trailers', href: '/assets/trailers' },
        { label: 'Tools', href: '/assets/tools' },
        { label: 'Inventory', href: '/inventory' },
        { label: 'Maintenance', href: '/equipment/maintenance' },
        { label: 'Inspections', href: '/equipment/inspections' },
      ],
    },
    {
      label: 'Dispatch',
      icon: MapPin,
      href: '/dispatch/dashboard',
      submenu: [
        { label: 'Dispatch Dashboard', href: '/dispatch/dashboard' },
        { label: 'Dispatch', href: '/dispatch' },
        { label: 'Sites', href: '/sites' },
        { label: 'Site Maps', href: '/sites/maps' },
        { label: 'Routes', href: '/routes' },
        { label: 'Geofence', href: '/geofence' },
        { label: 'Tracking', href: '/tracking' },
        { label: 'Consumables', href: '/consumables' },
        { label: 'Services', href: '/services' },
        { label: 'Weather', href: '/weather' },
      ],
    },
    {
      label: 'Comms',
      icon: MessageSquare,
      href: '/communication/dashboard',
      submenu: [
        { label: 'Comms Dashboard', href: '/communication/dashboard' },
        { label: 'Messages', href: '/messages' },
        { label: 'RingCentral', href: '/ringcentral' },
        { label: 'Gmail', href: '/gmail' },
        { label: 'Emergency Alert', href: '/emergency-alert' },
        { label: 'Customer Feedback', href: '/feedback' },
        { label: 'Learning Centre', href: '/learning-documents' },
      ],
    },
    {
      label: 'Safety',
      icon: Shield,
      href: '/safety/dashboard',
      submenu: [
        { label: 'Safety Dashboard', href: '/safety/dashboard' },
        { label: 'Incident Reporting', href: '/safety/incidents' },
        { label: 'Safety Inspections', href: '/safety/inspections' },
        { label: 'Hazard Assessments', href: '/safety/hazards' },
        { label: 'Safety Training', href: '/safety/training' },
        { label: 'Safety Meetings', href: '/safety/meetings' },
        { label: 'PPE Management', href: '/safety/ppe' },
        { label: 'Safety Policies', href: '/safety/policies' },
        { label: 'Emergency Plans', href: '/safety/emergency' },
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
        { label: 'HR Dashboard', href: '/hr' },
        { label: 'Employees', href: '/hr/employees' },
        { label: 'Time & Attendance', href: '/hr/time-attendance' },
        { label: 'PTO Management', href: '/hr/pto' },
        { label: 'Training', href: '/hr/training' },
        { label: 'Performance', href: '/hr/performance' },
        { label: 'Payroll Settings', href: '/hr/payroll' },
      ],
    },
    {
      label: 'Settings',
      icon: Settings,
      href: '/settings',
      submenu: [
        { label: 'Settings Hub', href: '/settings' },
        { label: 'Account', href: '/settings/account' },
        { label: 'Profile', href: '/settings/profile' },
        { label: 'Company', href: '/settings/company' },
        { label: 'Security', href: '/settings/security' },
        { label: 'Branding', href: '/settings/branding' },
        { label: 'Service Areas', href: '/settings/service-areas' },
        { label: 'Billing', href: '/settings/billing' },
        { label: 'Notifications', href: '/settings/notifications' },
        { label: 'Document Templates', href: '/templates' },
        { label: 'Roles & Permissions', href: '/settings/roles-permissions' },
        { label: 'API Settings', href: '/settings/api' },
        { label: 'Webhooks', href: '/settings/webhooks' },
        { label: 'Integration Settings', href: '/settings/app-integration' },
        { label: 'Automation', href: '/automation' },
        { label: 'Integrations', href: '/integrations' },
        { label: 'Preferences', href: '/settings/preferences' },
        { label: 'Support', href: '/settings/support' },
        { label: 'Team', href: '/team' },
        { label: 'Crew', href: '/crew' },
      ],
    },
  ];

  const isActive = (href?: string, submenu?: { label: string; href: string }[]) => {
    if (href && pathname === href) return true;
    if (submenu) {
      return submenu.some(item => pathname.startsWith(item.href));
    }
    return false;
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.submenu) {
      setActiveMenu(activeMenu === item.label ? null : item.label);
    } else if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Collapsed Sidebar */}
        <div className="w-16 bg-[#2c3e50] flex flex-col items-center py-4 gap-2 shadow-lg z-30">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.submenu);
            
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
        {activeMenu && menuItems.find(m => m.label === activeMenu)?.submenu && (
          <div className="absolute left-16 top-0 bottom-0 w-64 bg-white shadow-lg z-20 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                {activeMenu}
              </h3>
              <nav className="space-y-1">
                {menuItems
                  .find(m => m.label === activeMenu)
                  ?.submenu?.map((subItem) => {
                    const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                    return (
                      <button
                        key={subItem.href}
                        onClick={() => {
                          router.push(subItem.href);
                          setActiveMenu(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          isSubActive
                            ? 'bg-[#3f72af] text-white font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {subItem.label}
                      </button>
                    );
                  })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
