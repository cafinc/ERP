'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import SimpleNavigationTopBar from '@/components/SimpleNavigationTopBar';
import api from '@/lib/api';
import {
  ArrowLeft,
  Calendar,
  User,
  MapPin,
  Clock,
  FileText,
  CheckCircle,
  DollarSign,
  Package,
  Truck,
  Edit,
  RefreshCw,
} from 'lucide-react';

interface WorkOrder {
  id: string;
  work_order_number?: string;
  title: string;
  description: string;
  customer_name: string;
  customer_id: string;
  site_address?: string;
  site_id?: string;
  assigned_to?: string;
  assigned_crew?: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  service_type: string;
  scheduled_date: string;
  completed_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  service_cost?: number;
  estimated_cost?: number;
  labor_rate?: number;
  consumables_used?: Array<{
    name: string;
    quantity: number;
    cost: number;
  }>;
  equipment_needed?: string[];
  special_instructions?: string;
  completion_notes?: string;
  notes?: string;
  invoice_id?: string;
  invoiced?: boolean;
  created_at: string;
}

export default function WorkOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workOrderId = params.id as string;

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (workOrderId) {
      loadWorkOrder();
    }
  }, [workOrderId]);

  const loadWorkOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/work-orders/${workOrderId}`);
      if (response.data.success) {
        setWorkOrder(response.data.work_order);
      }
    } catch (error) {
      console.error('Error loading work order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!workOrder) return;

    // Confirm action
    if (!confirm('Generate an invoice for this completed work order?')) {
      return;
    }

    try {
      setGenerating(true);
      const response = await api.post(`/work-orders/${workOrderId}/generate-invoice`);
      
      if (response.data.success) {
        alert(`✅ Invoice ${response.data.invoice.invoice_number} generated successfully!`);
        
        // Reload work order to get updated invoice_id
        await loadWorkOrder();
        
        // Navigate to invoice
        if (response.data.invoice.id) {
          router.push(`/invoices/${response.data.invoice.id}`);
        }
      } else {
        if (response.data.invoice_id) {
          alert('Invoice already exists for this work order.');
          router.push(`/invoices/${response.data.invoice_id}`);
        } else {
          alert(response.data.message || 'Failed to generate invoice');
        }
      }
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      alert(error.response?.data?.detail || 'Error generating invoice. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return styles[priority as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <SimpleNavigationTopBar>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </SimpleNavigationTopBar>
    );
  }

  if (!workOrder) {
    return (
      <SimpleNavigationTopBar>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Work Order Not Found</h3>
            <button
              onClick={() => router.push('/work-orders')}
              className="text-[#3f72af] hover:underline"
            >
              ← Back to Work Orders
            </button></div></div>
      </SimpleNavigationTopBar>
    );
  }

  const canGenerateInvoice = workOrder.status === 'completed' && !workOrder.invoice_id && !workOrder.invoiced;

  return (
    <SimpleNavigationTopBar>
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title={workOrder.work_order_number || workOrder.title}
          subtitle={workOrder.title}
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Work Orders", href: "/work-orders" },
            { label: "Details" },
          ]}
          actions={[
            {
              label: "Edit",
              icon: <Edit className="w-4 h-4 mr-2" />,
              variant: "secondary",
              onClick: () => router.push(`/work-orders/${workOrderId}/edit`),
            },
          ]}
        />

        <div className="p-6">
          {/* Back Button */}
          <button
            onClick={() => router.push('/work-orders')}
            className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Work Orders
          </button>

          {/* Status and Priority Badges */}
          <div className="flex items-center gap-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(workOrder.status)}`}>
              {workOrder.status.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadge(workOrder.priority)}`}>
              {workOrder.priority.toUpperCase()} PRIORITY
            </span>
            {workOrder.invoiced && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                INVOICED
              </span>
            )}
          </div>

          {/* Generate Invoice Button - Only show for completed, non-invoiced work orders */}
          {canGenerateInvoice && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Ready to Invoice</h3>
                    <p className="text-sm text-gray-600">
                      This work order is complete. Generate an invoice for the customer.
                    </p>
                  </div></div>
                <button
                  onClick={handleGenerateInvoice}
                  disabled={generating}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all shadow-lg ${
                    generating
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-105'
                  }`}
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5" />
                      Generate Invoice
                    </>
                  )}
                </button></div></div>
          )}

          {/* Invoice Link - Show if already invoiced */}
          {workOrder.invoice_id && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">
                    Invoice has been generated for this work order
                  </span>
                </div>
                <button
                  onClick={() => router.push(`/invoices/${workOrder.invoice_id}`)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  View Invoice
                </button></div></div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* General Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">General Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Service Type</p>
                    <p className="font-semibold text-gray-900">{workOrder.service_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Customer</p>
                    <p className="font-semibold text-gray-900">{workOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Scheduled Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(workOrder.scheduled_date).toLocaleDateString()}
                    </p>
                  </div>
                  {workOrder.completed_date && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Completed Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(workOrder.completed_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div></div>

              {/* Description */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Description</h3>
                <p className="text-gray-700">{workOrder.description || 'No description provided'}</p>
              </div>

              {/* Special Instructions */}
              {workOrder.special_instructions && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Special Instructions
                  </h3>
                  <p className="text-amber-800">{workOrder.special_instructions}</p>
                </div>
              )}

              {/* Completion Notes */}
              {workOrder.completion_notes && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Completion Notes</h3>
                  <p className="text-gray-700">{workOrder.completion_notes}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Cost Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Cost Information</h3>
                <div className="space-y-3">
                  {(workOrder.service_cost || workOrder.estimated_cost) && (
                    <div>
                      <p className="text-sm text-gray-600">Service Cost</p>
                      <p className="text-xl font-bold text-green-600">
                        ${workOrder.service_cost || workOrder.estimated_cost || 0}
                      </p>
                    </div>
                  )}
                  {workOrder.estimated_hours && (
                    <div>
                      <p className="text-sm text-gray-600">Estimated Hours</p>
                      <p className="font-semibold text-gray-900">{workOrder.estimated_hours}h</p>
                    </div>
                  )}
                  {workOrder.actual_hours && (
                    <div>
                      <p className="text-sm text-gray-600">Actual Hours</p>
                      <p className="font-semibold text-gray-900">{workOrder.actual_hours}h</p>
                    </div>
                  )}
                </div></div>

              {/* Assigned Crew */}
              {(workOrder.assigned_to || workOrder.assigned_crew) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Assigned Crew
                  </h3>
                  <p className="text-gray-700">
                    {workOrder.assigned_to || workOrder.assigned_crew?.join(', ') || 'Not assigned'}
                  </p>
                </div>
              )}

              {/* Location */}
              {workOrder.site_address && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location
                  </h3>
                  <p className="text-gray-700">{workOrder.site_address}</p>
                </div>
              )}

              {/* Equipment */}
              {workOrder.equipment_needed && workOrder.equipment_needed.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Equipment Needed
                  </h3>
                  <ul className="space-y-2">
                    {workOrder.equipment_needed.map((equipment, index) => (
                      <li key={index} className="flex items-center gap-2 text-gray-700">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        {equipment}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Consumables Used */}
              {workOrder.consumables_used && workOrder.consumables_used.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Consumables Used
                  </h3>
                  <div className="space-y-2">
                    {workOrder.consumables_used.map((consumable, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-700">{consumable.name}</span>
                        <span className="text-sm font-medium text-gray-600">
                          {consumable.quantity} × ${consumable.cost}
                        </span>
                      </div>
                    ))}
                  </div></div>
              )}
            </div></div></div></div>
    </SimpleNavigationTopBar>
  );
}
