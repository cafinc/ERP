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
  Menu,
  X,
} from 'lucide-react';

interface MenuItem {
  label: string;
  icon: any;
  href?: string;
  submenu?: { label: string; href: string }[];
}

export default function HybridNavigationLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { label: 'Customers', icon: Users, href: '/customers' },
    { label: 'Estimates', icon: FileText, href: '/estimates' },
    { label: 'Projects', icon: FolderOpen, href: '/projects' },
    { label: 'Invoices', icon: DollarSign, href: '/invoices' },
    {
      label: 'Sites',
      icon: MapPin,
      submenu: [
        { label: 'All Sites', href: '/sites' },
        { label: 'Site Maps', href: '/sites/maps' },
      ],
    },
    {
      label: 'HR Module',
      icon: Briefcase,
      submenu: [
        { label: 'Overview', href: '/hr' },
        { label: 'Employees', href: '/hr/employees' },
        { label: 'Time & Attendance', href: '/hr/time-attendance' },
        { label: 'PTO', href: '/hr/pto' },
        { label: 'Training', href: '/hr/training' },
        { label: 'Performance', href: '/hr/performance' },
        { label: 'Payroll', href: '/hr/payroll' },
      ],
    },
    { label: 'Integrations', icon: Link2, href: '/integrations' },
    { label: 'Access', icon: UserCog, href: '/access' },
    {
      label: 'Settings',
      icon: Settings,
      submenu: [
        { label: 'Account', href: '/settings/account' },
        { label: 'Security', href: '/settings/security' },
        { label: 'Branding', href: '/settings/branding' },
        { label: 'Roles & Permissions', href: '/settings/roles' },
        { label: 'API', href: '/settings/api' },
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
              <div className="flex items-center gap-4">
                {menuItems
                  .find(item => item.label === expandedMenu)
                  ?.submenu?.map((subItem) => (
                    <button
                      key={subItem.href}
                      onClick={() => {
                        router.push(subItem.href);
                        setExpandedMenu(null);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive(subItem.href)
                          ? 'bg-[#3f72af] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {subItem.label}
                    </button>
                  ))}
              </div>
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
