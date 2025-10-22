'use client';

import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import Link from 'next/link';
import {
  MessageSquare,
  Phone,
  Mic,
  Users,
  BarChart3,
  MessageCircle,
  Settings,
  ArrowRight,
} from 'lucide-react';

export default function RingCentralHub() {
  const features = [
    {
      title: 'SMS Messages',
      description: 'Send and manage SMS messages with customers and team',
      icon: MessageSquare,
      href: '/ringcentral/sms',
      color: 'bg-[#5b8ec4]',
    },
    {
      title: 'Active Calls',
      description: 'Monitor and control active calls in real-time',
      icon: Phone,
      href: '/ringcentral/active-calls',
      color: 'bg-green-500',
    },
    {
      title: 'Call Recordings',
      description: 'Access and download call recordings',
      icon: Mic,
      href: '/ringcentral/recordings',
      color: 'bg-purple-500',
    },
    {
      title: 'Contacts',
      description: 'Manage and sync RingCentral contacts',
      icon: Users,
      href: '/ringcentral/contacts',
      color: 'bg-orange-500',
    },
    {
      title: 'Analytics',
      description: 'View call statistics and performance metrics',
      icon: BarChart3,
      href: '/ringcentral/analytics',
      color: 'bg-indigo-500',
    },
    {
      title: 'Team Messaging',
      description: 'Internal team communication and messaging',
      icon: MessageCircle,
      href: '/ringcentral/messaging',
      color: 'bg-pink-500',
    },
  ];

  return (
    <HybridNavigationTopBar>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-3 bg-[#3f72af] rounded-lg">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">RingCentral</h1>
              <p className="text-gray-600">
                Comprehensive communication and telephony management
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-[#3f72af]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">SMS Messages</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Calls</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Mic className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Recordings</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Contacts</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all hover:scale-105"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 ${feature.color} rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </Link>
            );
          })}
        </div>

        {/* Settings Link */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Settings className="w-6 h-6 text-[#3f72af]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  RingCentral Settings
                </h3>
                <p className="text-sm text-gray-600">
                  Configure your RingCentral integration and credentials
                </p>
              </div>
            </div>
            <Link
              href="/settings/ringcentral"
              className="flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#2c5282] text-white rounded-lg font-medium transition-colors"
            >
              <span>Settings</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </HybridNavigationTopBar>
  );
}
