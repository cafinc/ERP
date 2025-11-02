'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { Bell, Mail, MessageSquare, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationPreference {
  email: boolean;
  sms: boolean;
  inApp: boolean;
}

interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  preferences: NotificationPreference;
  icon: any;
  color: string;
}

export default function NotificationsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: 'work_orders',
      name: 'Work Orders',
      description: 'Updates on work order assignments, completions, and changes',
      preferences: { email: true, sms: false, inApp: true },
      icon: CheckCircle,
      color: 'blue'
    },
    {
      id: 'dispatch',
      name: 'Dispatch & Routing',
      description: 'Route assignments, location updates, and dispatch notifications',
      preferences: { email: false, sms: true, inApp: true },
      icon: Smartphone,
      color: 'green'
    },
    {
      id: 'alerts',
      name: 'Critical Alerts',
      description: 'Urgent issues, system alerts, and emergency notifications',
      preferences: { email: true, sms: true, inApp: true },
      icon: AlertCircle,
      color: 'red'
    },
    {
      id: 'sites',
      name: 'Site Updates',
      description: 'New sites, site modifications, and geofence events',
      preferences: { email: true, sms: false, inApp: true },
      icon: Bell,
      color: 'purple'
    },
    {
      id: 'customers',
      name: 'Customer Activity',
      description: 'New customers, messages, and service requests',
      preferences: { email: true, sms: false, inApp: true },
      icon: Mail,
      color: 'orange'
    },
    {
      id: 'team',
      name: 'Team Collaboration',
      description: 'Team messages, mentions, and collaboration updates',
      preferences: { email: false, sms: false, inApp: true },
      icon: MessageSquare,
      color: 'teal'
    },
    {
      id: 'reports',
      name: 'Reports & Analytics',
      description: 'Daily summaries, weekly reports, and analytics insights',
      preferences: { email: true, sms: false, inApp: false },
      icon: Bell,
      color: 'gray'
    },
    {
      id: 'billing',
      name: 'Billing & Invoices',
      description: 'Invoice created, payments received, and billing updates',
      preferences: { email: true, sms: false, inApp: true },
      icon: Bell,
      color: 'indigo'
    }
  ]);

  const togglePreference = (categoryId: string, channel: 'email' | 'sms' | 'inApp') => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          preferences: {
            ...cat.preferences,
            [channel]: !cat.preferences[channel]
          }
        };
      }
      return cat;
    }));
    setSaved(false);
  };

  const toggleAllForChannel = (channel: 'email' | 'sms' | 'inApp', value: boolean) => {
    setCategories(prev => prev.map(cat => ({
      ...cat,
      preferences: {
        ...cat.preferences,
        [channel]: value
      }
    })));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const getChannelStats = () => {
    const stats = { email: 0, sms: 0, inApp: 0 };
    categories.forEach(cat => {
      if (cat.preferences.email) stats.email++;
      if (cat.preferences.sms) stats.sms++;
      if (cat.preferences.inApp) stats.inApp++;
    });
    return stats;
  };

  const stats = getChannelStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <PageHeader
        title="Notification Preferences"
        subtitle="Manage how you receive notifications across different channels"
        icon={<Bell size={28} />}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Settings", href: "/settings" },
          { label: "Notifications" }
        ]}
      />

      {/* Channel Overview Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Email</h3>
              <p className="text-sm text-gray-600">{stats.email} of {categories.length} enabled</p>
            </div>
          </div>
          <button
            onClick={() => toggleAllForChannel('email', stats.email < categories.length)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {stats.email === categories.length ? 'Disable All' : 'Enable All'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Smartphone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">SMS</h3>
              <p className="text-sm text-gray-600">{stats.sms} of {categories.length} enabled</p>
            </div>
          </div>
          <button
            onClick={() => toggleAllForChannel('sms', stats.sms < categories.length)}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            {stats.sms === categories.length ? 'Disable All' : 'Enable All'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">In-App</h3>
              <p className="text-sm text-gray-600">{stats.inApp} of {categories.length} enabled</p>
            </div>
          </div>
          <button
            onClick={() => toggleAllForChannel('inApp', stats.inApp < categories.length)}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            {stats.inApp === categories.length ? 'Disable All' : 'Enable All'}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1">About Notification Channels</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>Email:</strong> Delivered to your registered email address</li>
              <li><strong>SMS:</strong> Text messages sent to your phone (carrier charges may apply)</li>
              <li><strong>In-App:</strong> Unified message center accessible within the application</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Notification Categories */}
      <div className="mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Notification Categories</h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 grid grid-cols-12 gap-4 font-semibold text-sm text-gray-700">
            <div className="col-span-5">Category</div>
            <div className="col-span-2 text-center">Email</div>
            <div className="col-span-2 text-center">SMS</div>
            <div className="col-span-2 text-center">In-App</div>
            <div className="col-span-1"></div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-5 flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      category.color === 'blue' ? 'bg-blue-100' :
                      category.color === 'green' ? 'bg-green-100' :
                      category.color === 'red' ? 'bg-red-100' :
                      category.color === 'purple' ? 'bg-purple-100' :
                      category.color === 'orange' ? 'bg-orange-100' :
                      category.color === 'teal' ? 'bg-teal-100' :
                      category.color === 'indigo' ? 'bg-indigo-100' :
                      'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        category.color === 'blue' ? 'text-blue-600' :
                        category.color === 'green' ? 'text-green-600' :
                        category.color === 'red' ? 'text-red-600' :
                        category.color === 'purple' ? 'text-purple-600' :
                        category.color === 'orange' ? 'text-orange-600' :
                        category.color === 'teal' ? 'text-teal-600' :
                        category.color === 'indigo' ? 'text-indigo-600' :
                        'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-600 mt-0.5">{category.description}</p>
                    </div>
                  </div>

                  <div className="col-span-2 flex justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={category.preferences.email}
                        onChange={() => togglePreference(category.id, 'email')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="col-span-2 flex justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={category.preferences.sms}
                        onChange={() => togglePreference(category.id, 'sms')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="col-span-2 flex justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={category.preferences.inApp}
                        onChange={() => togglePreference(category.id, 'inApp')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="col-span-1">
                    {category.preferences.email || category.preferences.sms || category.preferences.inApp ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        Disabled
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div>
          <h3 className="font-semibold text-gray-900">Save Your Preferences</h3>
          <p className="text-sm text-gray-600 mt-1">Changes will take effect immediately</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-[#3f72af] text-white rounded-lg hover:bg-[#2d5a8f] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Saved!
            </>
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>
    </div>
  );
}
