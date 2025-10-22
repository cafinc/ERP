'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CompactHeader from '@/components/CompactHeader';
import api from '@/lib/api';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Box,
  Wrench,
  Truck,
  ShoppingCart,
  BarChart3,
  FileText,
  RefreshCw,
  Filter,
  Download,
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: 'equipment' | 'parts' | 'materials' | 'consumables';
  quantity: number;
  unit: string;
  min_quantity: number;
  location: string;
  supplier?: string;
  supplier_contact?: string;
  cost_per_unit: number;
  last_restocked?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  notes?: string;
}

export default function InventoryPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inventory');
      setInventory(response.data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
      setInventory([]);
      alert('Failed to load inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalItems = inventory.length;
  const lowStockCount = inventory.filter(i => i.status === 'low_stock').length;
  const outOfStockCount = inventory.filter(i => i.status === 'out_of_stock').length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.cost_per_unit), 0);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'equipment': return <Truck className="w-4 h-4" />;
      case 'parts': return <Wrench className="w-4 h-4" />;
      case 'materials': return <Package className="w-4 h-4" />;
      case 'consumables': return <ShoppingCart className="w-4 h-4" />;
      default: return <Box className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'equipment': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'parts': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'materials': return 'bg-green-100 text-green-700 border-green-200';
      case 'consumables': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-700 border-green-200';
      case 'low_stock': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'out_of_stock': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock': return <CheckCircle className="w-4 h-4" />;
      case 'low_stock': return <AlertTriangle className="w-4 h-4" />;
      case 'out_of_stock': return <TrendingDown className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Category', 'Quantity', 'Unit', 'Min Qty', 'Status', 'Location', 'Supplier', 'Cost/Unit', 'Total Value', 'Last Restocked'];
    const rows = filteredInventory.map(item => [
      item.name,
      item.category,
      item.quantity,
      item.unit,
      item.min_quantity,
      item.status,
      item.location,
      item.supplier || 'N/A',
      item.cost_per_unit,
      (item.quantity * item.cost_per_unit).toFixed(2),
      item.last_restocked ? new Date(item.last_restocked).toLocaleDateString() : 'Never'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <HybridNavigationTopBar>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        {/* Header */}
        <CompactHeader
          title="Inventory & Assets"
          icon={Package}
          badges={[
            { label: `${totalItems} Total Items`, color: 'blue' },
            { label: `${lowStockCount} Low Stock`, color: 'yellow' },
            { label: `${outOfStockCount} Out of Stock`, color: 'red' },
          ]}
          actions={[
            {
              label: 'Add Item',
              icon: Plus,
              onClick: () => router.push('/inventory/add'),
              variant: 'primary',
            },
            {
              label: 'Export CSV',
              icon: Download,
              onClick: exportToCSV,
              variant: 'secondary',
            },
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mx-6 mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Value</p>
                <p className="text-3xl font-bold text-gray-900">${(totalValue / 1000).toFixed(1)}k</p>
                <p className="text-sm text-gray-500 mt-1">In inventory</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-xl">
                <BarChart3 className="w-6 h-6 text-[#3f72af]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">In Stock</p>
                <p className="text-3xl font-bold text-green-600">
                  {inventory.filter(i => i.status === 'in_stock').length}
                </p>
                <p className="text-sm text-green-600 mt-1">Items available</p>
              </div>
              <div className="bg-green-100 p-4 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Low Stock</p>
                <p className="text-3xl font-bold text-yellow-600">{lowStockCount}</p>
                <p className="text-sm text-yellow-600 mt-1">Need reorder</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Out of Stock</p>
                <p className="text-3xl font-bold text-red-600">{outOfStockCount}</p>
                <p className="text-sm text-red-600 mt-1">Critical</p>
              </div>
              <div className="bg-red-100 p-4 rounded-xl">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 bg-white rounded-xl shadow-lg border border-gray-200 mt-6 mx-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, location, or supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="equipment">Equipment</option>
              <option value="parts">Parts</option>
              <option value="materials">Materials</option>
              <option value="consumables">Consumables</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            <button
              onClick={loadInventory}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="mx-6 mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {item.notes && (
                            <div className="text-sm text-gray-500">{item.notes}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 w-fit ${getCategoryColor(item.category)}`}>
                          {getCategoryIcon(item.category)}
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{item.quantity} {item.unit}</div>
                          <div className="text-gray-500">Min: {item.min_quantity}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 w-fit ${getStatusBadge(item.status)}`}>
                          {getStatusIcon(item.status)}
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{item.supplier || 'N/A'}</div>
                          {item.supplier_contact && (
                            <div className="text-gray-500">{item.supplier_contact}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            ${(item.quantity * item.cost_per_unit).toLocaleString()}
                          </div>
                          <div className="text-gray-500">${item.cost_per_unit}/unit</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/inventory/${item.id}/edit`)}
                            className="text-[#3f72af] hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => alert('Delete feature coming soon!')}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredInventory.length === 0 && (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No inventory items found</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockCount > 0 && (
          <div className="mx-6 mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                  {lowStockCount} Item{lowStockCount !== 1 ? 's' : ''} Need Restocking
                </h3>
                <p className="text-sm text-yellow-700 mb-2">
                  The following items are below minimum quantity and should be reordered:
                </p>
                <ul className="text-sm text-yellow-700 list-disc list-inside">
                  {inventory
                    .filter(i => i.status === 'low_stock')
                    .slice(0, 3)
                    .map(item => (
                      <li key={item.id}>
                        {item.name} - {item.quantity} {item.unit} (Min: {item.min_quantity})
                      </li>
                    ))}
                  {lowStockCount > 3 && <li>and {lowStockCount - 3} more...</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </HybridNavigationTopBar>
  );
}
