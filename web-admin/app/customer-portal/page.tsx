'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  FileText,
  Receipt,
  Briefcase,
  MessageSquare,
  CheckSquare,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Clock,
} from 'lucide-react';

export default function CustomerPortalPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    pending_estimates: 0,
    unpaid_invoices: 0,
    active_work_orders: 0,
    total_due: 0,
    active_tasks: 0,
  });
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const userResponse = await api.get('/auth/me');
      const customerId = userResponse.data.id;

      const [estimates, invoices, workOrders, tasksRes] = await Promise.all([
        api.get(`/estimates?customer_id=${customerId}`).catch(() => ({ data: [] })),
        api.get(`/invoices?customer_id=${customerId}`).catch(() => ({ data: [] })),
        api.get(`/work-orders?customer_id=${customerId}`).catch(() => ({ data: [] })),
        api.get(`/tasks?assigned_to=${customerId}`).catch(() => ({ data: [] })),
      ]);

      const pendingEstimates = (estimates.data || []).filter((e: any) => e.status === 'pending').length;
      const unpaidInvoices = (invoices.data || []).filter((i: any) => i.status === 'unpaid').length;
      const activeWorkOrders = (workOrders.data || []).filter((w: any) => 
        w.status === 'active' || w.status === 'in_progress'
      ).length;
      const totalDue = (invoices.data || []).reduce((sum: number, inv: any) => 
        inv.status === 'unpaid' ? sum + (inv.total_amount || 0) : sum, 0
      );
      const activeTasks = (tasksRes.data || []).filter((t: any) => 
        t.status !== 'completed' && t.status !== 'cancelled'
      ).length;

      setStats({
        pending_estimates: pendingEstimates,
        unpaid_invoices: unpaidInvoices,
        active_work_orders: activeWorkOrders,
        total_due: totalDue,
        active_tasks: activeTasks,
      });

      setTasks((tasksRes.data || []).slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: <FileText className="w-4 h-4 mr-2" />, label: 'View Estimates', route: '/customer-portal/estimates', color: 'blue' },
    { icon: Receipt, label: 'View Invoices', route: '/customer-portal/invoices', color: 'green' },
    { icon: Briefcase, label: 'Work Orders', route: '/customer-portal/work-orders', color: 'orange' },
    { icon: MessageSquare, label: 'Messages', route: '/communications/center', color: 'purple' },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      purple: 'bg-purple-100 text-purple-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Customer Portal"
        subtitle="Manage customer portal"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Customer Portal" }]}
        title="Customer Portal"
        description="Welcome to your customer dashboard"
          />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.pending_estimates}</h3>
            <p className="text-sm text-gray-600">Pending Estimates</p>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Receipt className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.unpaid_invoices}</h3>
            <p className="text-sm text-gray-600">Unpaid Invoices</p>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Briefcase className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.active_work_orders}</h3>
            <p className="text-sm text-gray-600">Active Work Orders</p>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">${stats.total_due.toFixed(2)}</h3>
            <p className="text-sm text-gray-600">Total Due</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => router.push(action.route)}
                className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow text-left"
              >
                <div className={`w-12 h-12 rounded-lg ${getColorClasses(action.color)} flex items-center justify-center mb-4`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900">{action.label}</h3>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Tasks */}
          {tasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
                <button
                  onClick={() => router.push('/tasks')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View All
                </button>
              </div>
              <div className="bg-white rounded-lg shadow border border-gray-200 divide-y">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => router.push(`/tasks/${task.id}`)}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{task.title}</h3>
                        <p className="text-sm text-gray-600">
                          {task.priority.toUpperCase()} • {task.type.replace('_', ' ')}
                        </p>
                      </div>
                      <CheckSquare className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="bg-white rounded-lg shadow border border-gray-200 divide-y">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">Estimate EST-001 sent for review</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">Work order WO-123 completed</p>
                    <p className="text-xs text-gray-500">Yesterday</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
