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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f72af]"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      label: 'Add Lead',
      icon: <Users className="w-4 h-4 mr-2" />,
      onClick: () => router.push('/leads'),
      variant: 'secondary' as const,
    },
    {
      label: 'Add Customer',
      icon: <Briefcase className="w-4 h-4 mr-2" />,
      onClick: () => router.push('/customers/create'),
      variant: 'secondary' as const,
    },
    {
      label: 'Add Site',
      icon: <MapPin className="w-4 h-4 mr-2" />,
      onClick: () => router.push('/sites/create'),
      variant: 'secondary' as const,
    },
    {
      label: 'Manage Inventory',
      icon: <Package className="w-4 h-4 mr-2" />,
      onClick: () => router.push('/consumables'),
      variant: 'secondary' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header Section */}
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your business metrics and performance"
        breadcrumbs={[{ label: 'Home', href: '/' }]}
        actions={quickActions}
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards - Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Leads */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-[#3f72af]" />
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats?.leads.total || 0}</p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs text-gray-500">{stats?.leads.new || 0} new</p>
                  <span className="text-xs text-gray-400">•</span>
                  <p className="text-xs text-gray-500">{stats?.leads.conversionRate.toFixed(1)}% conversion</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-semibold">{stats?.leads.trend || 0}%</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/leads')}
              className="mt-4 w-full px-4 py-2 bg-blue-50 text-[#3f72af] rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              View Leads
            </button>
          </div>

          {/* Total Customers */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats?.customers.total || 0}</p>
                <p className="text-xs text-gray-500 mt-2">{stats?.customers.active || 0} active</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-semibold">{stats?.customers.trend || 0}%</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/customers')}
              className="mt-4 w-full px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
            >
              View Customers
            </button>
          </div>

          {/* Total Sites */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <p className="text-sm font-medium text-gray-600">Total Sites</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats?.sites.total || 0}</p>
                <p className="text-xs text-gray-500 mt-2">{stats?.sites.active || 0} active</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-semibold">{stats?.sites.trend || 0}%</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/sites')}
              className="mt-4 w-full px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
            >
              View Sites
            </button>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ${(stats?.revenue.total || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-2">${(stats?.revenue.monthly || 0).toLocaleString()} avg/month</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-semibold">{stats?.revenue.trend || 0}%</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/invoices')}
              className="mt-4 w-full px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium"
            >
              View Pipeline
            </button>
          </div>
        </div>

        {/* Middle Section - 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Conversion Funnel */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-[#3f72af]" />
              <h3 className="text-lg font-bold text-gray-900">Lead Conversion Funnel</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">New Leads</span>
                  <span className="font-semibold text-gray-900">{stats?.leads.new || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Contacted</span>
                  <span className="font-semibold text-gray-900">
                    {Math.floor((stats?.leads.total || 0) * 0.6)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Converted</span>
                  <span className="font-semibold text-gray-900">{stats?.leads.converted || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats?.leads.conversionRate || 0}%` }}></div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Conversion Rate</span>
                  <span className="text-2xl font-bold text-green-600">
                    {(stats?.leads.conversionRate || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Status */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-bold text-gray-900">Inventory Status</h3>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.consumables.lowStock || 0}
                </p>
                <p className="text-sm text-gray-600">Low Stock Items</p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total Inventory Value</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ${(stats?.consumables.totalValue || 0).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => router.push('/consumables')}
              className="mt-6 w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              View Inventory
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Platform Health */}
          {systemHealth && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-[#3f72af]" />
                <h3 className="text-lg font-bold text-gray-900">Platform Health</h3>
              </div>
              <div className="space-y-3">
                {systemHealth.services && systemHealth.services.slice(0, 3).map((service: any) => (
                  <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${service.status === 'healthy' ? 'bg-green-500' : service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm font-medium text-gray-900">{service.name}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      service.status === 'healthy' ? 'bg-green-100 text-green-700' :
                      service.status === 'degraded' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {service.status}
                    </span>
                  </div>
                ))}
                {systemHealth.database && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${systemHealth.database.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm font-medium text-gray-900">Database</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      systemHealth.database.connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {systemHealth.database.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => router.push('/system')}
                className="mt-6 w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                View Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Recent Activity - Full Width */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#3f72af]" />
              Recent Activity
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentActivity.map((activity) => {
              const Icon = activity.icon;
              return (
                <button
                  key={activity.id}
                  onClick={() => router.push('/activity')}
                  className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#3f72af] hover:bg-blue-50 transition-all cursor-pointer text-left"
                >
                  <div className={`bg-${activity.color}-100 rounded-lg p-2 mt-1 flex-shrink-0`}>
                    <Icon className={`w-4 h-4 text-${activity.color}-600`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          <button 
            onClick={() => router.push('/activity')}
            className="mt-6 w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            View All Activity
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
