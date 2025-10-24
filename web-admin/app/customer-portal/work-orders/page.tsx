'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import { Briefcase, Eye, Clock, CheckCircle, PlayCircle, Calendar } from 'lucide-react';

export default function CustomerWorkOrdersPage() {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadWorkOrders();
  }, [filter]);

  const loadWorkOrders = async () => {
    try {
      setLoading(true);
      const userResponse = await api.get('/auth/me');
      const customerId = userResponse.data.id;
      
      const params = new URLSearchParams({ customer_id: customerId });
      if (filter !== 'all') params.append('status', filter);
      
      const response = await api.get(`/work-orders?${params.toString()}`);
      setWorkOrders(response.data || []);
    } catch (error) {
      console.error('Error loading work orders:', error);
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      case 'in_progress': return <PlayCircle className="w-5 h-5" />;
      case 'scheduled': return <Calendar className="w-5 h-5" />;
      case 'pending': return <Clock className="w-5 h-5" />;
      default: return <Briefcase className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Work Orders"
        subtitle="Manage work orders"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Customer Portal", href: "/customer-portal" }, { label: "Work Orders" }]}
        title="My Work Orders"
        description="Track your service work orders"
          />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
          <div className="flex gap-2">
            {['all', 'scheduled', 'in_progress', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Work Orders List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading work orders...</p>
          </div>
        ) : workOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No work orders found</h3>
            <p className="text-gray-600">You don't have any work orders yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {workOrders.map((workOrder) => (
              <div
                key={workOrder._id || workOrder.id}
                onClick={() => router.push(`/work-orders/${workOrder._id || workOrder.id}`)}
                className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-lg ${getStatusColor(workOrder.status).replace('text-', 'bg-').replace('border-', '').replace('-800', '-100')}`}>
                      {getStatusIcon(workOrder.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {workOrder.work_order_number || `WO-${(workOrder._id || workOrder.id)?.slice(-6)}`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(workOrder.scheduled_date || workOrder.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(workOrder.status)}`}>
                    {workOrder.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                  </span>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2">
                  {workOrder.title || 'Snow Removal Service'}
                </h4>

                {workOrder.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{workOrder.description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600">
                  {workOrder.crew_assigned && (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Crew assigned
                    </span>
                  )}
                  <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
