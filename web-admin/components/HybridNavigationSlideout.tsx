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
  X,
} from 'lucide-react';

interface MenuItem {
  label: string;
  icon: any;
  href?: string;
  submenu?: { label: string; href: string; icon?: any }[];
}

export default function HybridNavigationSlideout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

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
        { label: 'All Sites', href: '/sites', icon: MapPin },
        { label: 'Site Maps', href: '/sites/maps', icon: MapPin },
      ],
    },
    {
      label: 'HR Module',
      icon: Briefcase,
      submenu: [
        { label: 'Overview', href: '/hr', icon: Briefcase },
        { label: 'Employees', href: '/hr/employees', icon: Users },
        { label: 'Time & Attendance', href: '/hr/time-attendance', icon: LayoutDashboard },
        { label: 'PTO', href: '/hr/pto', icon: FileText },
        { label: 'Training', href: '/hr/training', icon: FolderOpen },
        { label: 'Performance', href: '/hr/performance', icon: DollarSign },
        { label: 'Payroll', href: '/hr/payroll', icon: DollarSign },
      ],
    },
    { label: 'Integrations', icon: Link2, href: '/integrations' },
    { label: 'Access', icon: UserCog, href: '/access' },
    {
      label: 'Settings',
      icon: Settings,
      submenu: [
        { label: 'Account', href: '/settings/account', icon: Users },
        { label: 'Security', href: '/settings/security', icon: Settings },
        { label: 'Branding', href: '/settings/branding', icon: Settings },
        { label: 'Roles & Permissions', href: '/settings/roles', icon: UserCog },
        { label: 'API', href: '/settings/api', icon: Link2 },
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

  const currentExpandedItem = menuItems.find(item => item.label === expandedMenu);

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

        {/* Slide-out Panel */}
        {expandedMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/20 z-40 transition-opacity"
              onClick={() => setExpandedMenu(null)}
            />
            
            {/* Panel */}
            <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out">
              <div className="p-6 h-full overflow-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    {currentExpandedItem && (
                      <div className="p-2 bg-[#3f72af]/10 rounded-lg">
                        <currentExpandedItem.icon className="w-6 h-6 text-[#3f72af]" />
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-gray-900">{expandedMenu}</h3>
                  </div>
                  <button
                    onClick={() => setExpandedMenu(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Menu Items */}
                <div className="space-y-2">
                  {currentExpandedItem?.submenu?.map((subItem) => {
                    const SubIcon = subItem.icon || ChevronRight;
                    return (
                      <button
                        key={subItem.href}
                        onClick={() => {
                          router.push(subItem.href);
                          setExpandedMenu(null);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                          isActive(subItem.href)
                            ? 'bg-[#3f72af] text-white shadow-md'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <SubIcon className={`w-5 h-5 ${
                          isActive(subItem.href) ? 'text-white' : 'text-[#3f72af]'
                        }`} />
                        <span className="font-medium">{subItem.label}</span>
                        {isActive(subItem.href) && (
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}