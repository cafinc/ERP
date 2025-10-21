'use client';

import { ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Users,
  FileText,
  FolderOpen,
  Receipt,
  FileSignature,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CRMLayoutProps {
  children: ReactNode;
}

export default function CRMLayout({ children }: CRMLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const crmMenu = [
    { id: 'customers', label: 'Customers', icon: Users, href: '/customers' },
    { id: 'estimates', label: 'Estimates', icon: FileText, href: '/estimates' },
    { id: 'projects', label: 'Projects', icon: FolderOpen, href: '/projects' },
    { id: 'invoices', label: 'Invoices', icon: Receipt, href: '/invoices' },
    { id: 'agreements', label: 'Agreements', icon: FileSignature, href: '/contracts' },
  ];

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  return (
    <DashboardLayout>
      <div className="flex h-full">
        {/* CRM Sidebar */}
        <div
          className={`bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0 ${
            isSidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Collapse Toggle */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              {!isSidebarCollapsed && (
                <h2 className="text-lg font-bold text-gray-900">CRM</h2>
              )}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
                title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {crmMenu.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center ${
                      isSidebarCollapsed ? 'justify-center' : 'space-x-3'
                    } px-3 py-3 rounded-lg transition-all ${
                      active
                        ? 'bg-[#3f72af] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-50">
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
}
