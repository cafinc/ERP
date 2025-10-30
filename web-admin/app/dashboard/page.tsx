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

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [showLeadModal, setShowLeadModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all necessary data
      const [leadsRes, customersRes, sitesRes, consumablesRes] = await Promise.all([
        api.get('/leads'),
        api.get('/customers'),
        api.get('/sites'),
        api.get('/consumables'),
      ]);

      const leads = leadsRes.data || [];
      const customers = customersRes.data.customers || [];
      const sites = sitesRes.data || [];
      const consumables = consumablesRes.data || [];

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

      // Generate recent activity (mock data for now)
      const activity: RecentActivity[] = [
        {
          id: '1',
          type: 'lead',
          action: 'New Lead',
          description: 'New lead created from website',
          timestamp: new Date().toISOString(),
          icon: Users,
          color: 'blue',
        },
        {
          id: '2',
          type: 'customer',
          action: 'Customer Converted',
          description: 'Lead converted to customer',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          icon: CheckCircle,
          color: 'green',
        },
        {
          id: '3',
          type: 'site',
          action: 'New Site Added',
          description: 'Site added for commercial customer',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          icon: MapPin,
          color: 'purple',
        },
      ];

      setStats({
        leads: {
          total: leadsTotal,
          new: leadsNew,
          converted: leadsConverted,
          conversionRate: conversionRate,
          trend: 12.5, // Mock trend
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
          monthly: totalRevenue / 12, // Simplified
          trend: 15.2,
        },
        consumables: {
          lowStock: lowStockItems,
          totalValue: consumablesValue,
        },
      });
      
      setRecentActivity(activity);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Activity className="w-8 h-8 animate-spin text-[#3f72af]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your business metrics and performance"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dashboard" }]}
      />

      <div className="p-6 space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Leads Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-xl p-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              {stats && stats.leads.trend > 0 && (
                <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  {stats.leads.trend}%
                </div>
              )}
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Leads</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {stats?.leads.total || 0}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{stats?.leads.new || 0} new</span>
              <span>•</span>
              <span>{stats?.leads.conversionRate.toFixed(1)}% conversion</span>
            </div>
            <button
              onClick={() => router.push('/leads')}
              className="mt-4 w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              View Leads
            </button></div>

          {/* Customers Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-xl p-3">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
              {stats && stats.customers.trend > 0 && (
                <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  {stats.customers.trend}%
                </div>
              )}
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Customers</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {stats?.customers.total || 0}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{stats?.customers.active || 0} active</span>
            </div>
            <button
              onClick={() => router.push('/customers')}
              className="mt-4 w-full px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
            >
              View Customers
            </button></div>

          {/* Sites Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-xl p-3">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              {stats && stats.sites.trend > 0 && (
                <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  {stats.sites.trend}%
                </div>
              )}
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Sites</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {stats?.sites.total || 0}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{stats?.sites.active || 0} active</span>
            </div>
            <button
              onClick={() => router.push('/sites')}
              className="mt-4 w-full px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
            >
              View Sites
            </button></div>

          {/* Revenue Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 rounded-xl p-3">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              {stats && stats.revenue.trend > 0 && (
                <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  {stats.revenue.trend}%
                </div>
              )}
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Revenue</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              ${(stats?.revenue.total || 0).toLocaleString()}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>${(stats?.revenue.monthly || 0).toLocaleString()} avg/month</span>
            </div>
            <button
              onClick={() => router.push('/leads')}
              className="mt-4 w-full px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium"
            >
              View Pipeline
            </button></div></div>

        {/* Secondary Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversion Funnel */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#3f72af]" />
                Lead Conversion Funnel
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">New Leads</span>
                  <span className="text-sm font-bold text-gray-900">{stats?.leads.new || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all"
                    style={{ width: '100%' }}
                  />
                </div></div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Contacted</span>
                  <span className="text-sm font-bold text-gray-900">
                    {Math.round((stats?.leads.total || 0) * 0.7)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-purple-500 h-3 rounded-full transition-all"
                    style={{ width: '70%' }}
                  />
                </div></div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Converted</span>
                  <span className="text-sm font-bold text-gray-900">{stats?.leads.converted || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all"
                    style={{ width: `${stats?.leads.conversionRate || 0}%` }}
                  />
                </div></div></div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Conversion Rate</span>
                <span className="text-2xl font-bold text-green-600">
                  {stats?.leads.conversionRate.toFixed(1)}%
                </span>
              </div></div></div>

          {/* Inventory Alerts */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#3f72af]" />
                Inventory Status
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-red-100 rounded-xl p-3">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.consumables.lowStock || 0}
                  </p>
                  <p className="text-sm text-gray-600">Low Stock Items</p>
                </div></div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Inventory Value</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${(stats?.consumables.totalValue || 0).toLocaleString()}
                </p>
              </div></div>
            <button
              onClick={() => router.push('/consumables')}
              className="mt-6 w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              View Inventory
              <ArrowRight className="w-4 h-4" />
            </button></div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#3f72af]" />
                Recent Activity
              </h3>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`bg-${activity.color}-100 rounded-lg p-2 mt-1`}>
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
                    </div></div>
                );
              })}
            </div>
            <button className="mt-6 w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              View All Activity
            </button></div></div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setShowLeadModal(true)}
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <Users className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mb-2 mx-auto" />
              <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-600">
                Add Lead
              </p>
            </button>
            <button
              onClick={() => router.push('/customers/create')}
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
            >
              <Briefcase className="w-8 h-8 text-gray-400 group-hover:text-green-600 mb-2 mx-auto" />
              <p className="text-sm font-semibold text-gray-700 group-hover:text-green-600">
                Add Customer
              </p>
            </button>
            <button
              onClick={() => router.push('/sites/create')}
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <MapPin className="w-8 h-8 text-gray-400 group-hover:text-purple-600 mb-2 mx-auto" />
              <p className="text-sm font-semibold text-gray-700 group-hover:text-purple-600">
                Add Site
              </p>
            </button>
            <button
              onClick={() => router.push('/consumables')}
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 transition-all group"
            >
              <Package className="w-8 h-8 text-gray-400 group-hover:text-yellow-600 mb-2 mx-auto" />
              <p className="text-sm font-semibold text-gray-700 group-hover:text-yellow-600">
                Manage Inventory
              </p>
            </button></div></div></div>

      {/* Create Lead Modal */}
      {showLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create New Lead</h2>
                <button
                  onClick={() => setShowLeadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button></div></div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                To create a full lead with all details, please use the{' '}
                <button
                  onClick={() => {
                    setShowLeadModal(false);
                    router.push('/leads');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-semibold underline"
                >
                  Leads Page
                </button>
              </p>
              
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowLeadModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLeadModal(false);
                    router.push('/leads');
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all"
                >
                  Go to Leads Page
                </button></div></div></div></div>
      )}
    </div>
  );
}
