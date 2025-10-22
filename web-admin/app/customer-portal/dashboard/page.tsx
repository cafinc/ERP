'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CompactHeader from '@/components/CompactHeader';
import {
  Home,
  MapPin,
  FileText,
  Receipt,
  FolderOpen,
  MessageSquare,
  Star,
  ClipboardList,
  LogOut,
  Bell,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Paperclip,
} from 'lucide-react';

interface CustomerPortalLayoutProps {
  children?: React.ReactNode;
}

function CustomerPortalLayout({ children }: CustomerPortalLayoutProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/customer-portal/dashboard' },
    { icon: MapPin, label: 'My Sites', href: '/customer-portal/sites' },
    { icon: FileText, label: 'Estimates', href: '/customer-portal/estimates' },
    { icon: Receipt, label: 'Invoices', href: '/customer-portal/invoices' },
    { icon: FolderOpen, label: 'Projects', href: '/customer-portal/projects' },
    { icon: ClipboardList, label: 'Service Requests', href: '/customer-portal/requests' },
    { icon: Star, label: 'Feedback', href: '/customer-portal/feedback' },
    { icon: FileText, label: 'Agreements', href: '/customer-portal/agreements' },
    { icon: MessageSquare, label: 'Messages', href: '/customer-portal/messages' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#3f72af] rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Customer Portal</h1>
                <p className="text-xs text-gray-500">Welcome back!</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={() => router.push('/customer-portal/profile')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/customer-portal')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    activeSites: 5,
    upcomingServices: 3,
    pendingInvoices: 2,
    totalSpent: 12450,
    activeProjects: 1,
    messagesUnread: 2,
  });

  const [message, setMessage] = useState('');

  const recentActivity = [
    {
      id: '1',
      type: 'service',
      title: 'Snow Plowing Completed',
      description: 'Main Parking Lot - 401 King St',
      date: '2025-01-20',
      status: 'completed',
    },
    {
      id: '2',
      type: 'invoice',
      title: 'Invoice #INV-2025-015',
      description: 'Amount: $850.00 - Due Feb 15',
      date: '2025-01-18',
      status: 'pending',
    },
    {
      id: '3',
      type: 'estimate',
      title: 'New Estimate Received',
      description: 'Seasonal Snow Removal - 2025/2026',
      date: '2025-01-15',
      status: 'new',
    },
    {
      id: '4',
      type: 'message',
      title: 'Message from Admin',
      description: 'Your seasonal contract is ready for review',
      date: '2025-01-12',
      status: 'new',
    },
    {
      id: '5',
      type: 'service',
      title: 'De-icing Applied',
      description: 'Back Parking Area - 401 King St',
      date: '2025-01-10',
      status: 'completed',
    },
  ];

  const upcomingServices = [
    { id: '1', site: 'Main Parking Lot', date: '2025-01-25', time: '6:00 AM', service: 'Snow Plowing' },
    { id: '2', site: 'Front Entrance', date: '2025-01-25', time: '6:30 AM', service: 'De-icing' },
    { id: '3', site: 'Side Lot B', date: '2025-01-27', time: '7:00 AM', service: 'Snow Plowing' },
  ];

  const activeSitesData = [
    { id: '1', name: 'Main Parking Lot', address: '401 King St', lastService: '2025-01-20', status: 'active' },
    { id: '2', name: 'Front Entrance', address: '401 King St', lastService: '2025-01-18', status: 'active' },
    { id: '3', name: 'Side Lot B', address: '401 King St', lastService: '2025-01-15', status: 'active' },
    { id: '4', name: 'Back Parking Area', address: '401 King St', lastService: '2025-01-10', status: 'active' },
    { id: '5', name: 'Loading Dock', address: '401 King St', lastService: '2025-01-08', status: 'active' },
  ];

  const pendingInvoicesData = [
    { id: '1', number: 'INV-2025-015', amount: 850, dueDate: '2025-02-15', service: 'Snow Removal - January' },
    { id: '2', number: 'INV-2025-012', amount: 1200, dueDate: '2025-02-10', service: 'Seasonal Contract' },
  ];

  return (
    <CustomerPortalLayout>
      <div className="space-y-6">
        {/* Compact Header */}
        <CompactHeader
          title="My Dashboard"
          subtitle="Welcome back! Here's your snow removal service overview"
          icon={Home}
          badges={[
            { label: `${stats.activeSites} Active Sites`, color: 'blue' },
            { label: `${stats.upcomingServices} Upcoming`, color: 'green' },
          ]}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-[#3f72af]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.activeSites}</p>
                <p className="text-xs text-gray-600">Active Sites</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingServices}</p>
                <p className="text-xs text-gray-600">Upcoming</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Receipt className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingInvoices}</p>
                <p className="text-xs text-gray-600">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${(stats.totalSpent / 1000).toFixed(1)}k</p>
                <p className="text-xs text-gray-600">Total Spent</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
                <p className="text-xs text-gray-600">Projects</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.messagesUnread}</p>
                <p className="text-xs text-gray-600">Messages</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-[#3f72af]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('sites')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'sites'
                    ? 'border-blue-500 text-[#3f72af]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Active Sites ({stats.activeSites})
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'upcoming'
                    ? 'border-blue-500 text-[#3f72af]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upcoming Services ({stats.upcomingServices})
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'invoices'
                    ? 'border-blue-500 text-[#3f72af]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Invoices ({stats.pendingInvoices})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => router.push('/customer-portal/requests')}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
                  >
                    <ClipboardList className="w-8 h-8 text-[#3f72af] mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">Request Service</h3>
                    <p className="text-sm text-gray-600">Submit a new service request</p>
                  </button>

                  <button
                    onClick={() => router.push('/customer-portal/invoices')}
                    className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
                  >
                    <Receipt className="w-8 h-8 text-orange-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">Pay Invoice</h3>
                    <p className="text-sm text-gray-600">View and pay pending invoices</p>
                  </button>

                  <button
                    onClick={() => router.push('/customer-portal/messages')}
                    className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
                  >
                    <MessageSquare className="w-8 h-8 text-green-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">Contact Us</h3>
                    <p className="text-sm text-gray-600">Send us a message</p>
                  </button>

                  <button
                    onClick={() => router.push('/customer-portal/feedback')}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
                  >
                    <Star className="w-8 h-8 text-purple-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">Give Feedback</h3>
                    <p className="text-sm text-gray-600">Rate our service</p>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'sites' && (
              <div className="space-y-3">
                {activeSitesData.map((site) => (
                  <div key={site.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-[#3f72af]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{site.name}</h4>
                        <p className="text-sm text-gray-600">{site.address}</p>
                        <p className="text-xs text-gray-500 mt-1">Last Service: {new Date(site.lastService).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'upcoming' && (
              <div className="space-y-3">
                {upcomingServices.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{service.service}</h4>
                        <p className="text-sm text-gray-600">{service.site}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(service.date).toLocaleDateString()} at {service.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="space-y-3">
                {pendingInvoicesData.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{invoice.number}</h4>
                        <p className="text-sm text-gray-600">{invoice.service}</p>
                        <p className="text-xs text-gray-500 mt-1">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">${invoice.amount}</p>
                      <button className="mt-2 px-4 py-1 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white text-sm rounded-lg transition-colors">
                        Pay Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout: Communication Center (Left) and Recent Activity (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Communication Center (2/3 width) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Communication Center
                </h3>
              </div>
              <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
                <div className="mb-4">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    placeholder="Type your message to our team..."
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Paperclip className="w-4 h-4" />
                    <span className="text-sm">Attach File</span>
                  </button>
                  <button className="flex items-center gap-2 px-6 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg transition-colors">
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        activity.status === 'completed' ? 'bg-green-100' :
                        activity.status === 'pending' ? 'bg-yellow-100' :
                        'bg-blue-100'
                      }`}>
                        {activity.status === 'completed' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                         activity.status === 'pending' ? <Clock className="w-4 h-4 text-yellow-600" /> :
                         <AlertCircle className="w-4 h-4 text-[#3f72af]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm">{activity.title}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerPortalLayout>
  );
}
