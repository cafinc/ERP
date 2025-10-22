'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import {
  MessageSquare,
  Phone,
  Mail,
  AlertTriangle,
  Star,
  LayoutDashboard,
  Send,
} from 'lucide-react';

export default function CommunicationDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalCalls: 0,
    totalEmails: 0,
    emergencyAlerts: 0,
    feedback: 0,
  });

  const statCards = [
    {
      label: 'RingCentral Calls',
      value: stats.totalCalls,
      icon: Phone,
      color: 'bg-[#5b8ec4]',
      href: '/ringcentral',
    },
    {
      label: 'Gmail Messages',
      value: stats.totalEmails,
      icon: Mail,
      color: 'bg-green-500',
      href: '/gmail',
    },
    {
      label: 'Emergency Alerts',
      value: stats.emergencyAlerts,
      icon: AlertTriangle,
      color: 'bg-red-500',
      href: '/emergency-alert',
    },
    {
      label: 'Customer Feedback',
      value: stats.feedback,
      icon: Star,
      color: 'bg-yellow-500',
      href: '/feedback',
    },
  ];

  return (
    <HybridNavigationTopBar>
      <div className="p-4 space-y-6">
        <CompactHeader
          title="Communication Dashboard"
          icon={LayoutDashboard}
          badges={[
            { label: `${stats.totalCalls} Calls`, color: 'blue' },
            { label: `${stats.totalEmails} Emails`, color: 'green' },
          ]}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <button
              key={stat.label}
              onClick={() => router.push(stat.href)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => router.push('/ringcentral')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Phone className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">RingCentral</span>
            </button>
            <button
              onClick={() => router.push('/gmail')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              <Mail className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Gmail</span>
            </button>
            <button
              onClick={() => router.push('/emergency-alert')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors"
            >
              <AlertTriangle className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Emergency Alert</span>
            </button>
            <button
              onClick={() => router.push('/feedback')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-colors"
            >
              <Star className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Feedback</span>
            </button>
          </div>
        </div>
      </div>
    </HybridNavigationTopBar>
  );
}
