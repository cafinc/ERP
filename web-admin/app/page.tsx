'use client';

import CompactHeader from '@/components/CompactHeader';
import { 
  Users, FileText, DollarSign, TrendingUp, Calendar, Phone, Mail, CheckSquare, Home,
  Package, Shield, BarChart3, Activity, AlertTriangle, TrendingDown, CheckCircle,
  Clock, Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    customers: 0,
    activeProjects: 0,
    pendingInvoices: 0,
    revenue: 0,
    lowStockItems: 0,
    activeUsers: 0,
    automationRuns: 0,
    pendingTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadRecentActivity();
  }, []);

  const loadStats = async () => {
    try {
      // Load dashboard stats
      const [customersRes, projectsRes, invoicesRes, inventoryRes] = await Promise.all([
        api.get('/customers').catch(() => ({ data: [] })),
        api.get('/projects').catch(() => ({ data: { projects: [] } })),
        api.get('/invoices').catch(() => ({ data: [] })),
        api.get('/inventory').catch(() => ({ data: [] })),
      ]);

      const customers = customersRes.data || [];
      const projects = projectsRes.data?.projects || projectsRes.data || [];
      const invoices = invoicesRes.data || [];
      const inventory = inventoryRes.data || [];

      setStats({
        customers: customers.length,
        activeProjects: projects.filter((p: any) => p.status === 'active').length,
        pendingInvoices: invoices.filter((i: any) => i.status !== 'paid').length,
        revenue: invoices
          .filter((i: any) => i.status === 'paid')
          .reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0),
        lowStockItems: inventory.filter((i: any) => i.status === 'low_stock' || i.status === 'out_of_stock').length,
        activeUsers: 4, // Mock data
        automationRuns: 168, // Mock data
        pendingTasks: 12, // Mock data
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    // Mock recent activity
    setRecentActivity([
      { type: 'invoice', message: 'Invoice #1234 paid', time: '2 mins ago', icon: CheckCircle, color: 'text-green-600' },
      { type: 'project', message: 'Project "Main St Plowing" updated', time: '15 mins ago', icon: FileText, color: 'text-[#3f72af]' },
      { type: 'alert', message: 'Low stock alert: Rock Salt', time: '1 hour ago', icon: AlertTriangle, color: 'text-yellow-600' },
      { type: 'customer', message: 'New customer added', time: '3 hours ago', icon: Users, color: 'text-purple-600' },
    ]);
  };

  const statCards = [
    {
      label: 'Total Customers',
      value: stats.customers,
      icon: Users,
      color: 'bg-[#5b8ec4]',
      change: '+12%',
      href: '/customers',
    },
    {
      label: 'Active Projects',
      value: stats.activeProjects,
      icon: FileText,
      color: 'bg-green-500',
      change: '+8%',
      href: '/projects',
    },
    {
      label: 'Pending Invoices',
      value: stats.pendingInvoices,
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '-5%',
      href: '/invoices',
    },
    {
      label: 'Total Revenue',
      value: `$${stats.revenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+23%',
      href: '/invoices?filter=paid',
    },
    {
      label: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: Package,
      color: 'bg-orange-500',
      change: stats.lowStockItems > 0 ? 'Alert' : 'OK',
      href: '/inventory',
    },
    {
      label: 'Active Users',
      value: stats.activeUsers,
      icon: Shield,
      color: 'bg-indigo-500',
      change: 'Online',
      href: '/access',
    },
    {
      label: 'Automation Runs',
      value: stats.automationRuns,
      icon: Zap,
      color: 'bg-teal-500',
      change: 'Today',
      href: '/automation/analytics',
    },
    {
      label: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: CheckSquare,
      color: 'bg-pink-500',
      change: 'This Week',
      href: '/tasks',
    },
  ];

  const quickActions = [
    { label: 'Schedule Service', icon: Calendar, href: '/dispatch' },
    { label: 'Call Customer', icon: Phone, href: '/customers' },
    { label: 'Send Email', icon: Mail, href: '/gmail' },
    { label: 'Create Task', icon: CheckSquare, href: '/tasks' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
      <div className="p-4 space-y-6">
        {/* Compact Header */}
        <CompactHeader
          title="Dashboard"
          icon={Home}
          badges={[
            { label: `${stats.customers} Customers`, color: 'blue' },
            { label: `${stats.activeProjects} Active`, color: 'green' },
            { label: `$${stats.revenue.toLocaleString()} Revenue`, color: 'purple' },
          ]}
        />

        {/* Stats Grid - More Compact - Now Clickable */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <a
              key={stat.label}
              href={stat.href}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-2">{stat.change} from last month</p>
                </div>
                <div className={`${stat.color} p-4 rounded-xl`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center justify-center text-center gap-3"
              >
                <action.icon className="w-8 h-8 text-[#3f72af]" />
                <span className="font-medium text-gray-900">{action.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Activity Feed */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Recent Activity</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-4 ${index < recentActivity.length - 1 ? 'pb-4 border-b' : ''}`}
                  >
                    <div className={`w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center`}>
                      <activity.icon className={`w-5 h-5 ${activity.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.message}</p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Platform Health */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Platform Health</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">System Status</span>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-[#3f72af]" />
                    <span className="font-medium text-gray-900">API Response Time</span>
                  </div>
                  <span className="text-gray-600 font-medium">125ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-900">Uptime</span>
                  </div>
                  <span className="text-gray-600 font-medium">99.9%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-gray-900">Automation Success</span>
                  </div>
                  <span className="text-gray-600 font-medium">98.2%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HybridNavigationTopBar>
  );
}
