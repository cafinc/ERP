'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import SimpleNavigationTopBar from '@/components/SimpleNavigationTopBar';
import LowStockAlertBanner from '@/components/LowStockAlertBanner';
import CustomerQuickViewModal from '@/components/CustomerQuickViewModal';
import {
  Plus,
  Search,
  Eye,
  Edit,
  ClipboardList,
  User,
  Calendar,
  MapPin,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Filter,
} from 'lucide-react';

interface WorkOrder {
  _id: string;
  work_order_number: string;
  title: string;
  description: string;
  customer_name: string;
  customer_id?: string;
  site_address: string;
  assigned_to: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_date: string;
  completed_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  notes?: string;
  created_at: string;
}

export default function WorkOrdersPage() {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const loadWorkOrders = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockData: WorkOrder[] = [
        {
          _id: '1',
          work_order_number: 'WO-2024-001',
          title: 'Snow Removal - Parking Lot A',
          description: 'Clear 4 inches of snow from main parking area',
          customer_name: 'ABC Corporation',
          site_address: '123 Main St, Toronto, ON',
          assigned_to: 'John Doe',
          status: 'in_progress',
          priority: 'high',
          scheduled_date: '2024-01-15T08:00:00',
          estimated_hours: 3,
          created_at: '2024-01-14T10:00:00',
        },
        {
          _id: '2',
          work_order_number: 'WO-2024-002',
          title: 'Ice Melting - Front Entrance',
          description: 'Apply ice melt to front walkways and entrance',
          customer_name: 'XYZ Industries',
          site_address: '456 Oak Ave, Toronto, ON',
          assigned_to: 'Jane Smith',
          status: 'pending',
          priority: 'medium',
          scheduled_date: '2024-01-16T07:00:00',
          estimated_hours: 1.5,
          created_at: '2024-01-14T14:30:00',
        },
        {
          _id: '3',
          work_order_number: 'WO-2024-003',
          title: 'Emergency Snow Clearing',
          description: 'Emergency snow removal after blizzard',
          customer_name: 'City Plaza Mall',
          site_address: '789 Plaza Dr, Toronto, ON',
          assigned_to: 'Mike Johnson',
          status: 'completed',
          priority: 'urgent',
          scheduled_date: '2024-01-13T05:00:00',
          completed_date: '2024-01-13T11:30:00',
          estimated_hours: 6,
          actual_hours: 6.5,
          created_at: '2024-01-13T04:00:00',
        },
      ];
      setWorkOrders(mockData);
    } catch (error) {
      console.error('Error loading work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkOrders = workOrders.filter(wo => {
    const matchesSearch = 
      wo.work_order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.site_address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || wo.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || wo.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <PageHeader>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <PageHeader
            title="Work Orders"
            subtitle="Manage and track work orders"
            breadcrumbs={[
              { label: "Home", href: "/" },
              { label: "Operations", href: "/operations" },
              { label: "Work Orders" },
            ]}
          />
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
          </div>
        </div>
      </PageHeader>
    );
  }

  return (
    <SimpleNavigationTopBar>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PageHeader
          title="Work Orders"
          subtitle="Manage and track all work orders"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Operations", href: "/operations" },
            { label: "Work Orders" },
          ]}
          actions={[
            {
              label: "Export",
              icon: <Download className="w-4 h-4 mr-2" />,
              variant: "secondary",
              onClick: () => alert("Export functionality"),
            },
            {
              label: "New Work Order",
              icon: <Plus className="w-4 h-4 mr-2" />,
              variant: "primary",
              onClick: () => router.push('/work-orders/create'),
            },
          ]}
          tabs={[
            { label: "All", value: "all", count: workOrders.length },
            { label: "Pending", value: "pending", count: workOrders.filter(w => w.status === 'pending').length },
            { label: "In Progress", value: "in_progress", count: workOrders.filter(w => w.status === 'in_progress').length },
            { label: "Completed", value: "completed", count: workOrders.filter(w => w.status === 'completed').length },
          ]}
          activeTab={filterStatus}
          onTabChange={setFilterStatus}
          showSearch={true}
          searchPlaceholder="Search work orders..."
          onSearch={setSearchQuery}
          showFilter={true}
          onFilterClick={() => setShowFilterDropdown(!showFilterDropdown)}
          filterDropdown={showFilterDropdown ? (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-4">
                <div className="text-sm font-semibold text-gray-900 mb-3">Filters</div>
                
                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Priority</label>
                  <div className="space-y-2">
                    {['all', 'low', 'medium', 'high', 'urgent'].map(p => (
                      <label key={p} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="radio"
                          name="priority"
                          checked={filterPriority === p}
                          onChange={() => setFilterPriority(p)}
                          className="text-[#3f72af] focus:ring-[#3f72af]"
                        />
                        <span className="text-sm text-gray-700 capitalize">{p}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 flex gap-2">
                  <button
                    onClick={() => {
                      setFilterPriority('all');
                      setShowFilterDropdown(false);
                    }}
                    className="flex-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowFilterDropdown(false)}
                    className="flex-1 px-3 py-2 text-sm text-white bg-[#3f72af] rounded-md hover:bg-[#2c5282]"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          ) : undefined}
        />

        {/* Work Orders Grid */}
        <div className="flex-1 p-6">
          {/* Low Stock Alert Banner */}
          <LowStockAlertBanner />
          
          {filteredWorkOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No work orders found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'Try adjusting your search terms' : 'Get started by creating your first work order'}
              </p>
              <button
                onClick={() => router.push('/work-orders/create')}
                className="inline-flex items-center px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Work Order
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkOrders.map((workOrder) => (
                <div
                  key={workOrder._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500">
                            {workOrder.work_order_number}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(workOrder.priority)}`}>
                            {workOrder.priority}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {workOrder.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(workOrder.status)}`}>
                          {workOrder.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {workOrder.description}
                    </p>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium mr-1">Customer:</span>
                        <span>{workOrder.customer_name}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="truncate">{workOrder.site_address}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium mr-1">Assigned:</span>
                        <span>{workOrder.assigned_to}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium mr-1">Scheduled:</span>
                        <span>{formatDate(workOrder.scheduled_date)}</span>
                      </div>
                      {workOrder.estimated_hours && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium mr-1">Est. Hours:</span>
                          <span>{workOrder.estimated_hours}h</span>
                          {workOrder.actual_hours && (
                            <span className="ml-2 text-gray-500">(Actual: {workOrder.actual_hours}h)</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/work-orders/${workOrder._id}`);
                        }}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-[#3f72af] rounded-md hover:bg-[#2c5282]"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/work-orders/${workOrder._id}/edit`);
                        }}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SimpleNavigationTopBar>
  );
}
