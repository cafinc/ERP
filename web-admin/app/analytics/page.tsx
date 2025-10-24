'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  DollarSign,
  TrendingUp,
  Users,
  MapPin,
  Clock,
  Truck,
  FileText,
  RefreshCw,
  Calendar,
  Target,
  Award,
  BarChart3,
} from 'lucide-react';

interface AnalyticsData {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    change: number;
  };
  customers: {
    total: number;
    active: number;
    new: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
  };
  estimates: {
    total: number;
    accepted: number;
    pending: number;
    acceptanceRate: number;
  };
  sites: {
    total: number;
    serviced: number;
  };
  team: {
    total: number;
    onShift: number;
  };
  equipment: {
    total: number;
    available: number;
    inMaintenance: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30');

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load all data concurrently
      const [
        customers,
        projects,
        estimates,
        sites,
        users,
        equipment,
        invoices
      ] = await Promise.all([
        api.get('/customers'),
        api.get('/projects'),
        api.get('/estimates'),
        api.get('/sites'),
        api.get('/users'),
        api.get('/equipment'),
        api.get('/invoices')
      ]);

      // Calculate analytics
      const customerData = customers.data.customers || [];
      const projectData = projects.data.projects || [];
      const estimateData = Array.isArray(estimates.data) ? estimates.data : [];
      const siteData = sites.data || [];
      const userData = users.data || [];
      const equipmentData = equipment.data || [];
      const invoiceData = invoices.data.invoices || [];

      // Calculate revenue
      const totalRevenue = invoiceData.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);
      const thisMonthRevenue = invoiceData
        .filter((inv: any) => {
          const date = new Date(inv.created_at);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        })
        .reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);
      
      const lastMonthRevenue = invoiceData
        .filter((inv: any) => {
          const date = new Date(inv.created_at);
          const now = new Date();
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
        })
        .reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);

      const revenueChange = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      // Calculate estimate acceptance rate
      const acceptedEstimates = estimateData.filter((e: any) => e.status === 'accepted').length;
      const acceptanceRate = estimateData.length > 0 
        ? (acceptedEstimates / estimateData.length) * 100 
        : 0;

      setData({
        revenue: {
          total: totalRevenue,
          thisMonth: thisMonthRevenue,
          lastMonth: lastMonthRevenue,
          change: revenueChange
        },
        customers: {
          total: customerData.length,
          active: customerData.filter((c: any) => c.active).length,
          new: customerData.filter((c: any) => {
            const date = new Date(c.created_at);
            const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
            return daysAgo <= parseInt(timeframe);
          }).length
        },
        projects: {
          total: projectData.length,
          active: projectData.filter((p: any) => p.status === 'in_progress').length,
          completed: projectData.filter((p: any) => p.status === 'completed').length
        },
        estimates: {
          total: estimateData.length,
          accepted: acceptedEstimates,
          pending: estimateData.filter((e: any) => e.status === 'pending').length,
          acceptanceRate
        },
        sites: {
          total: siteData.length,
          serviced: siteData.filter((s: any) => s.active).length
        },
        team: {
          total: userData.length,
          onShift: userData.filter((u: any) => u.status === 'on_shift').length
        },
        equipment: {
          total: equipmentData.length,
          available: equipmentData.filter((e: any) => e.status === 'available').length,
          inMaintenance: equipmentData.filter((e: any) => e.status === 'maintenance').length
        }
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      );
  }

  if (!data) {
    return (
        <div className="text-center py-12">
          <p className="text-gray-600">Failed to load analytics data</p>
        </div>
      );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        {/* Compact Header */}
        <PageHeader
        title="Analytics"
        subtitle="Business intelligence and data insights"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Analytics" }]}
        title="Analytics Dashboard"
          
        />

        {/* Timeframe Filter */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Timeframe</h3>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>
          </div>
        </div>

        <div className="mx-6 mt-6 space-y-6">{/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Total Revenue</h3>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold mb-2">
              ${data.revenue.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-2 text-sm opacity-90">
              <TrendingUp className="w-4 h-4" />
              <span>{data.revenue.change > 0 ? '+' : ''}{data.revenue.change.toFixed(1)}% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">This Month</h3>
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              ${data.revenue.thisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-600">Current month revenue</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Last Month</h3>
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              ${data.revenue.lastMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-600">Previous month revenue</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-lg p-3">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <Award className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.customers.total}</p>
            <p className="text-sm text-gray-600 mt-1">Total Customers</p>
            <p className="text-xs text-green-600 mt-2">
              {data.customers.new} new in last {timeframe} days
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <FileText className="w-6 h-6 text-[#3f72af]" />
              </div>
              <Target className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.projects.total}</p>
            <p className="text-sm text-gray-600 mt-1">Total Projects</p>
            <p className="text-xs text-[#3f72af] mt-2">
              {data.projects.active} active, {data.projects.completed} completed
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.sites.total}</p>
            <p className="text-sm text-gray-600 mt-1">Service Sites</p>
            <p className="text-xs text-purple-600 mt-2">
              {data.sites.serviced} active locations
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 rounded-lg p-3">
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.equipment.total}</p>
            <p className="text-sm text-gray-600 mt-1">Equipment Fleet</p>
            <p className="text-xs text-orange-600 mt-2">
              {data.equipment.available} available
            </p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estimate Performance</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Acceptance Rate</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {data.estimates.acceptanceRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${data.estimates.acceptanceRate}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{data.estimates.total}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{data.estimates.accepted}</p>
                  <p className="text-xs text-gray-600">Accepted</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{data.estimates.pending}</p>
                  <p className="text-xs text-gray-600">Pending</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Status</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Active Crew</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {data.team.onShift} / {data.team.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#3f72af] h-2 rounded-full" 
                    style={{ width: `${(data.team.onShift / data.team.total) * 100}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{data.team.total}</p>
                  <p className="text-xs text-gray-600">Team Members</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{data.team.onShift}</p>
                  <p className="text-xs text-gray-600">On Shift</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
}
