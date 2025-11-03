'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  CheckCircle,
  Calendar,
  RefreshCw,
  FileText
} from 'lucide-react';

interface DashboardMetrics {
  total_outstanding: number;
  bills_count: number;
  due_soon: {
    amount: number;
    count: number;
  };
  overdue: {
    amount: number;
    count: number;
  };
  pending_approval: number;
  month_spending: number;
}

export default function APDashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/bills/dashboard/metrics');
      
      if (response.data.success) {
        setMetrics(response.data.metrics);
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading || !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Accounts Payable Dashboard"
        subtitle="Monitor and manage vendor bills and payments"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Finance", href: "/finance" },
          { label: "AP Dashboard" }
        ]}
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Key Metrics Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Outstanding */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Total Outstanding</p>
              <DollarSign className="w-6 h-6 opacity-75" />
            </div>
            <p className="text-3xl font-bold mb-1">{formatCurrency(metrics.total_outstanding)}</p>
            <p className="text-xs opacity-75">{metrics.bills_count} unpaid bills</p>
          </div>

          {/* Due Soon */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Due Within 7 Days</p>
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(metrics.due_soon.amount)}
            </p>
            <p className="text-sm text-gray-600">{metrics.due_soon.count} bills</p>
          </div>

          {/* Overdue */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Overdue</p>
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-600 mb-1">
              {formatCurrency(metrics.overdue.amount)}
            </p>
            <p className="text-sm text-gray-600">{metrics.overdue.count} bills</p>
          </div>

          {/* This Month's Spending */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">This Month's Spending</p>
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(metrics.month_spending)}
            </p>
            <p className="text-sm text-gray-600">Paid bills</p>
          </div>
        </div>

        {/* Quick Stats Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pending Approval */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.pending_approval}</p>
              </div>
            </div>
          </div>

          {/* Average Days to Pay */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Efficiency</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.overdue.count === 0 ? '100%' : 
                    `${Math.round((metrics.bills_count - metrics.overdue.count) / metrics.bills_count * 100)}%`}
                </p>
              </div>
            </div>
          </div>

          {/* Overdue Rate */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.bills_count === 0 ? '0%' : 
                    `${Math.round(metrics.overdue.count / metrics.bills_count * 100)}%`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/finance/bills/create')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Create Bill</h3>
            </div>
            <p className="text-sm text-gray-600">Record a new vendor bill</p>
          </button>

          <button
            onClick={() => router.push('/finance/bills/unpaid')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Pay Bills</h3>
            </div>
            <p className="text-sm text-gray-600">Process vendor payments</p>
          </button>

          <button
            onClick={() => router.push('/finance/bills/aging')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Aging Report</h3>
            </div>
            <p className="text-sm text-gray-600">View accounts payable aging</p>
          </button>

          <button
            onClick={() => router.push('/vendors')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Manage Vendors</h3>
            </div>
            <p className="text-sm text-gray-600">View and manage vendors</p>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Bills</h3>
          </div>
          <div className="p-6">
            <button
              onClick={() => router.push('/finance/bills')}
              className="text-[#3f72af] hover:text-[#2c5282] font-medium"
            >
              View All Bills →
            </button>
          </div>
        </div>

        {/* Alerts */}
        {metrics.overdue.count > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-1">Overdue Bills Require Attention</h4>
                <p className="text-sm text-red-700 mb-3">
                  You have {metrics.overdue.count} bill{metrics.overdue.count !== 1 ? 's' : ''} that {metrics.overdue.count !== 1 ? 'are' : 'is'} overdue, totaling {formatCurrency(metrics.overdue.amount)}
                </p>
                <button
                  onClick={() => router.push('/finance/bills?status=overdue')}
                  className="text-sm font-medium text-red-900 hover:text-red-700"
                >
                  View Overdue Bills →
                </button>
              </div>
            </div>
          </div>
        )}

        {metrics.due_soon.count > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-orange-900 mb-1">Bills Due Soon</h4>
                <p className="text-sm text-orange-700 mb-3">
                  {metrics.due_soon.count} bill{metrics.due_soon.count !== 1 ? 's' : ''} due within the next 7 days, totaling {formatCurrency(metrics.due_soon.amount)}
                </p>
                <button
                  onClick={() => router.push('/finance/bills/unpaid')}
                  className="text-sm font-medium text-orange-900 hover:text-orange-700"
                >
                  View Due Soon Bills →
                </button>
              </div>
            </div>
          </div>
        )}

        {metrics.pending_approval > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <FileText className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-900 mb-1">Bills Pending Approval</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  {metrics.pending_approval} bill{metrics.pending_approval !== 1 ? 's' : ''} waiting for approval
                </p>
                <button
                  onClick={() => router.push('/finance/bills?status=pending_approval')}
                  className="text-sm font-medium text-yellow-900 hover:text-yellow-700"
                >
                  Review Pending Bills →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
