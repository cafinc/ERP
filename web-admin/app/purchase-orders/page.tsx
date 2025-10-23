'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import {
  Plus,
  Search,
  Eye,
  Edit,
  ShoppingCart,
  User,
  Calendar,
  DollarSign,
  RefreshCw,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  FileText,
} from 'lucide-react';

interface PurchaseOrder {
  _id: string;
  po_number: string;
  vendor_name: string;
  vendor_id?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'received' | 'cancelled';
  order_date: string;
  expected_delivery: string;
  actual_delivery?: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  items: {
    item_name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
  notes?: string;
  created_at: string;
  created_by: string;
}

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockData: PurchaseOrder[] = [
        {
          _id: '1',
          po_number: 'PO-2024-001',
          vendor_name: 'Salt Supply Co.',
          status: 'approved',
          order_date: '2024-01-10T09:00:00',
          expected_delivery: '2024-01-17T14:00:00',
          subtotal: 2500.00,
          tax: 325.00,
          shipping: 150.00,
          total: 2975.00,
          items: [
            { item_name: 'Rock Salt - 50lb bags', quantity: 100, unit_price: 15.00, total: 1500.00 },
            { item_name: 'Ice Melt - 25lb bags', quantity: 40, unit_price: 25.00, total: 1000.00 },
          ],
          created_at: '2024-01-10T09:00:00',
          created_by: 'John Doe',
        },
        {
          _id: '2',
          po_number: 'PO-2024-002',
          vendor_name: 'Equipment Rentals Inc.',
          status: 'pending_approval',
          order_date: '2024-01-14T10:30:00',
          expected_delivery: '2024-01-20T08:00:00',
          subtotal: 3200.00,
          tax: 416.00,
          shipping: 0.00,
          total: 3616.00,
          items: [
            { item_name: 'Snow Blower Rental - Week', quantity: 2, unit_price: 1200.00, total: 2400.00 },
            { item_name: 'Sand Spreader', quantity: 1, unit_price: 800.00, total: 800.00 },
          ],
          created_at: '2024-01-14T10:30:00',
          created_by: 'Jane Smith',
        },
        {
          _id: '3',
          po_number: 'PO-2024-003',
          vendor_name: 'Safety Gear Plus',
          status: 'received',
          order_date: '2024-01-08T11:00:00',
          expected_delivery: '2024-01-12T10:00:00',
          actual_delivery: '2024-01-12T09:30:00',
          subtotal: 850.00,
          tax: 110.50,
          shipping: 35.00,
          total: 995.50,
          items: [
            { item_name: 'Winter Work Gloves', quantity: 50, unit_price: 12.00, total: 600.00 },
            { item_name: 'Safety Vests', quantity: 25, unit_price: 10.00, total: 250.00 },
          ],
          created_at: '2024-01-08T11:00:00',
          created_by: 'Mike Johnson',
        },
      ];
      setPurchaseOrders(mockData);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchaseOrders = purchaseOrders.filter(po => {
    const matchesSearch = 
      po.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.created_by.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || po.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      ordered: 'bg-blue-100 text-blue-800',
      received: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <HybridNavigationTopBar>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <PageHeader
            title="Purchase Orders"
            subtitle="Manage procurement and orders"
            breadcrumbs={[
              { label: "Home", href: "/" },
              { label: "Operations", href: "/operations" },
              { label: "Purchase Orders" },
            ]}
          />
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
          </div>
        </div>
      </HybridNavigationTopBar>
    );
  }

  return (
    <HybridNavigationTopBar>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PageHeader
          title="Purchase Orders"
          subtitle="Manage procurement and vendor orders"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Operations", href: "/operations" },
            { label: "Purchase Orders" },
          ]}
          actions={[
            {
              label: "Export",
              icon: <Download className="w-4 h-4 mr-2" />,
              variant: "secondary",
              onClick: () => alert("Export functionality"),
            },
            {
              label: "New Purchase Order",
              icon: <Plus className="w-4 h-4 mr-2" />,
              variant: "primary",
              onClick: () => router.push('/purchase-orders/create'),
            },
          ]}
          tabs={[
            { label: "All", value: "all", count: purchaseOrders.length },
            { label: "Draft", value: "draft", count: purchaseOrders.filter(p => p.status === 'draft').length },
            { label: "Pending Approval", value: "pending_approval", count: purchaseOrders.filter(p => p.status === 'pending_approval').length },
            { label: "Approved", value: "approved", count: purchaseOrders.filter(p => p.status === 'approved').length },
            { label: "Received", value: "received", count: purchaseOrders.filter(p => p.status === 'received').length },
          ]}
          activeTab={filterStatus}
          onTabChange={setFilterStatus}
          showSearch={true}
          searchPlaceholder="Search purchase orders..."
          onSearch={setSearchQuery}
        />

        {/* Purchase Orders Grid */}
        <div className="flex-1 p-6">
          {filteredPurchaseOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchase orders found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'Try adjusting your search terms' : 'Get started by creating your first purchase order'}
              </p>
              <button
                onClick={() => router.push('/purchase-orders/create')}
                className="inline-flex items-center px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Purchase Order
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPurchaseOrders.map((po) => (
                <div
                  key={po._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/purchase-orders/${po._id}`)}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500">
                            {po.po_number}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {po.vendor_name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(po.status)}`}>
                          {po.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {formatCurrency(po.total)}
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(po.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>{formatCurrency(po.tax)}</span>
                        </div>
                        {po.shipping > 0 && (
                          <div className="flex justify-between">
                            <span>Shipping:</span>
                            <span>{formatCurrency(po.shipping)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="mb-4">
                      <div className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                        <Package className="w-3 h-3 mr-1" />
                        Items ({po.items.length})
                      </div>
                      <div className="space-y-1">
                        {po.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="text-xs text-gray-600 flex justify-between">
                            <span className="truncate mr-2">{item.item_name}</span>
                            <span className="text-gray-500">×{item.quantity}</span>
                          </div>
                        ))}
                        {po.items.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{po.items.length - 2} more items
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium mr-1">Ordered:</span>
                        <span>{formatDate(po.order_date)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium mr-1">Expected:</span>
                        <span>{formatDate(po.expected_delivery)}</span>
                      </div>
                      {po.actual_delivery && (
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="font-medium mr-1">Delivered:</span>
                          <span>{formatDate(po.actual_delivery)}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium mr-1">Created by:</span>
                        <span>{po.created_by}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/purchase-orders/${po._id}`);
                        }}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/purchase-orders/${po._id}/edit`);
                        }}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-[#3f72af] rounded-md hover:bg-[#2c5282]"
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
    </HybridNavigationTopBar>
  );
}
