'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  Briefcase,
  DollarSign,
  Package,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  ArrowRight,
} from 'lucide-react';

interface DashboardStats {
  leads: {
    total: number;
    new: number;
    converted: number;
    conversionRate: number;
    trend: number;
  };
  customers: {
    total: number;
    active: number;
    trend: number;
  };
  sites: {
    total: number;
    active: number;
    trend: number;
  };
  revenue: {
    total: number;
    monthly: number;
    trend: number;
  };
  consumables: {
    lowStock: number;
    totalValue: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'lead' | 'customer' | 'site' | 'order';
  action: string;
  description: string;
  timestamp: string;
  icon: any;
  color: string;
}

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all necessary data including activity and system health
      const [leadsRes, customersRes, sitesRes, consumablesRes, activityRes, systemRes] = await Promise.all([
        api.get('/leads'),
        api.get('/customers'),
        api.get('/sites'),
        api.get('/consumables'),
        api.get('/activity?limit=10').catch(() => ({ data: [] })), // Fetch recent activity
        api.get('/system').catch(() => ({ data: null })), // Fetch system health
      ]);

      const leads = leadsRes.data || [];
      const customers = customersRes.data.customers || [];
      const sites = sitesRes.data || [];
      const consumables = consumablesRes.data || [];
      const activities = activityRes.data || [];
      const system = systemRes.data;

      // Calculate stats
      const leadsTotal = leads.length;
      const leadsNew = leads.filter((l: any) => l.status === 'new').length;
      const leadsConverted = leads.filter((l: any) => l.status === 'converted').length;
      const conversionRate = leadsTotal > 0 ? (leadsConverted / leadsTotal) * 100 : 0;
      
      const customersActive = customers.filter((c: any) => c.active).length;
      const sitesActive = sites.filter((s: any) => s.active).length;
      
      const totalRevenue = leads
        .filter((l: any) => l.status === 'converted')
        .reduce((sum: number, l: any) => sum + (l.estimated_value || 0), 0);
      
      const lowStockItems = consumables.filter(
        (c: any) => c.current_stock <= (c.reorder_level || 0)
      ).length;
      
      const consumablesValue = consumables.reduce(
        (sum: number, c: any) => sum + (c.current_stock * (c.unit_cost || 0)), 0
      );

      // Map activity data to dashboard format
      const activityMapped: RecentActivity[] = activities.map((act: any) => {
        const getActivityIcon = (type: string) => {
          switch (type) {
            case 'lead': return Users;
            case 'customer': return CheckCircle;
            case 'site': return MapPin;
            case 'work_order': return Briefcase;
            case 'invoice': return DollarSign;
            case 'task': return CheckCircle;
            default: return Activity;
          }
        };

        const getActivityColor = (type: string) => {
          switch (type) {
            case 'lead': return 'blue';
            case 'customer': return 'green';
            case 'site': return 'purple';
            case 'work_order': return 'orange';
            case 'invoice': return 'emerald';
            case 'task': return 'indigo';
            default: return 'gray';
          }
        };

        return {
          id: act._id || act.id,
          type: act.type || 'order',
          action: act.action || 'Activity',
          description: act.description || act.message || '',
          timestamp: act.created_at || act.timestamp,
          icon: getActivityIcon(act.type),
          color: getActivityColor(act.type),
        };
      });

      setStats({
        leads: {
          total: leadsTotal,
          new: leadsNew,
          converted: leadsConverted,
          conversionRate,
          trend: 12.5,
        },
        customers: {
          total: customers.length,
          active: customersActive,
          trend: 8.3,
        },
        sites: {
          total: sites.length,
          active: sitesActive,
          trend: 5.7,
        },
        revenue: {
          total: totalRevenue,
          monthly: totalRevenue,
          trend: 15.2,
        },
        consumables: {
          lowStock: lowStockItems,
          totalValue: consumablesValue,
        },
      });

      setRecentActivity(activityMapped);
      setSystemHealth(system);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
        <div className="text-xl text-gray-600">Loading dashboard...</div></div>
  );
  }

  return (
      <div className="p-4 space-y-6">
        {/* Compact Header */}
        <PageHeader
          title="Dashboard"
          subtitle="Overview of your snow removal operations"
          breadcrumbs={[{ label: "Home" }]}
        />

        {/* Stats Grid - More Compact - Now Clickable */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <a
              key={stat.label}
              href={stat.href}
              className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-5 hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer transform hover:scale-105 hover:shadow-md transition-shadow"
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
                className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center justify-center text-center gap-3 hover:shadow-md transition-shadow"
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
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
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
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
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
  );
}
