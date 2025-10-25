'use client';

import PageHeader from '@/components/PageHeader';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import {
  Plus,
  Package,
  TrendingDown,
  AlertTriangle,
  Edit,
  Trash2,
  RefreshCw,
  BarChart3,
  X,
  Droplets,
  Mountain,
  Fuel,
  BeakerIcon,
  Box,
} from 'lucide-react';

// Category configurations with icons
const CATEGORIES = [
  { value: 'traction_control', label: 'Traction Control', icon: '🏔️', color: 'text-orange-600' },
  { value: 'ice_management', label: 'Ice Management', icon: '🧊', color: 'text-blue-600' },
  { value: 'miscellaneous', label: 'Miscellaneous', icon: '📦', color: 'text-gray-600' },
];

const UNITS = [
  { value: 'bags', label: 'Bag' },
  { value: 'yards', label: 'Yard' },
  { value: 'gallons', label: 'Gallon' },
];

interface Consumable {
  _id?: string;
  id?: string;
  name: string;
  consumable_type: string;
  unit: string;
  quantity_available: number;
  reorder_level: number;
  cost_per_unit: number;
  active?: boolean;
}

export default function ConsumablesPage() {
  const router = useRouter();
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingConsumable, setEditingConsumable] = useState<Consumable | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: 'bags',
    current_stock: '' as any,
    min_stock_level: '' as any,
    unit_cost: '' as any,
    category: 'traction_control',
  });

  useEffect(() => {
    loadConsumables();
  }, []);

  const loadConsumables = async () => {
    try {
      setLoading(true);
      const response = await api.get('/consumables');
      setConsumables(response.data || []);
    } catch (error) {
      console.error('Error loading consumables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const loadingToast = toast.loading('Creating consumable...');
    
    try {
      const payload = {
        name: formData.name.trim(),
        consumable_type: formData.category,  // Backend expects consumable_type
        unit: formData.unit,
        quantity_available: parseFloat(formData.current_stock as string) || 0,  // Backend expects quantity_available
        reorder_level: parseFloat(formData.min_stock_level as string) || 0,  // Backend expects reorder_level
        cost_per_unit: parseFloat(formData.unit_cost as string) || 0,  // Backend expects cost_per_unit
        notes: null,
      };
      
      console.log('Payload being sent:', payload);
      
      await api.post('/consumables', payload);
      toast.success('Consumable created successfully!', { id: loadingToast });
      setShowCreateModal(false);
      setFormData({
        name: '',
        unit: 'bags',
        current_stock: '',
        min_stock_level: '',
        unit_cost: '',
        category: 'traction_control',
      });
      loadConsumables();
    } catch (error: any) {
      console.error('Error creating consumable:', error);
      console.error('Error response:', error?.response?.data);
      const errorMessage = error?.response?.data?.detail || 
                          (error?.response?.data?.message) || 
                          'Failed to create consumable. Please check all fields.';
      toast.error(errorMessage, { id: loadingToast });
    }
  };

  const handleEdit = (consumable: Consumable) => {
    setEditingConsumable(consumable);
    setFormData({
      name: consumable.name,
      unit: consumable.unit,
      current_stock: consumable.quantity_available,
      min_stock_level: consumable.reorder_level,
      unit_cost: consumable.cost_per_unit,
      category: consumable.consumable_type,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingConsumable) return;
    
    const loadingToast = toast.loading('Updating consumable...');
    
    try {
      const payload = {
        name: formData.name.trim(),
        consumable_type: formData.category,
        unit: formData.unit,
        quantity_available: parseFloat(formData.current_stock as string) || 0,
        reorder_level: parseFloat(formData.min_stock_level as string) || 0,
        cost_per_unit: parseFloat(formData.unit_cost as string) || 0,
      };
      
      const consumableId = editingConsumable._id || editingConsumable.id;
      await api.put(`/consumables/${consumableId}`, payload);
      toast.success('Consumable updated successfully!', { id: loadingToast });
      setShowEditModal(false);
      setEditingConsumable(null);
      setFormData({
        name: '',
        unit: 'bags',
        current_stock: '',
        min_stock_level: '',
        unit_cost: '',
        category: 'traction_control',
      });
      loadConsumables();
    } catch (error: any) {
      console.error('Error updating consumable:', error);
      const errorMessage = error?.response?.data?.detail || 'Failed to update consumable';
      toast.error(errorMessage, { id: loadingToast });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this consumable? This action cannot be undone.')) return;
    
    const loadingToast = toast.loading('Deleting consumable...');
    
    try {
      await api.delete(`/consumables/${id}`);
      toast.success('Consumable deleted successfully!', { id: loadingToast });
      loadConsumables();
    } catch (error: any) {
      console.error('Error deleting consumable:', error);
      const errorMessage = error?.response?.data?.detail || 'Failed to delete consumable';
      toast.error(errorMessage, { id: loadingToast });
    }
  };

  const getStockStatus = (consumable: Consumable) => {
    const percentage = (consumable.quantity_available / consumable.reorder_level) * 100;
    if (percentage < 50) return { color: 'red', label: 'Critical' };
    if (percentage < 100) return { color: 'yellow', label: 'Low' };
    return { color: 'green', label: 'Good' };
  };

  const lowStockCount = consumables.filter(c => c.quantity_available < c.reorder_level).length;
  const totalValue = consumables.reduce((sum, c) => sum + (c.quantity_available * (c.cost_per_unit || 0)), 0);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      );
  }

  return (
    <>
      <PageHeader
        title="Consumable Management"
        subtitle="Track and manage consumable materials for winter operations"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Consumable", href: "/consumables" }
        ]}
        actions={[
          {
            label: "Analytics",
            onClick: () => router.push('/consumables/analytics'),
            icon: <BarChart3 className="w-4 h-4 mr-2" />,
            variant: 'secondary'
          },
          {
            label: "Create Consumable",
            onClick: () => setShowCreateModal(true),
            icon: <Plus className="w-4 h-4 mr-2" />,
            variant: 'primary'
          }
        ]}
      />
      
      <div className="space-y-6">{/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-3">
                <Package className="w-6 h-6 text-[#3f72af]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{consumables.length}</p>
                <p className="text-sm text-gray-600">Total Items</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 rounded-lg p-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
                <p className="text-sm text-gray-600">Low Stock Alerts</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-3">
                <TrendingDown className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${totalValue.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total Inventory Value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Consumables List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Inventory</h2>
          </div>

          {consumables.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900">No Consumables Yet</p>
              <p className="text-sm text-gray-600 mt-2">Add your first consumable to start tracking inventory</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md rounded-lg hover:bg-[#2c5282]"
              >
                <Plus className="w-4 h-4" />
                Add Consumable
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {consumables.map((consumable) => {
                    const status = getStockStatus(consumable);
                    const consumableId = consumable._id || consumable.id;
                    return (
                      <tr key={consumableId} className="hover:bg-gray-50 transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{consumable.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded capitalize">
                            {consumable.consumable_type?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {consumable.quantity_available} {consumable.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {consumable.reorder_level} {consumable.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          ${consumable.cost_per_unit?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            status.color === 'red' ? 'bg-red-100 text-red-700' :
                            status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(consumable)}
                              className="p-1 text-[#3f72af] hover:bg-blue-50 rounded"
                              title="Edit consumable"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(consumableId!)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Delete consumable"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-2xl w-full shadow-2xl border border-white/40 animate-slideUp">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-[#3f72af] to-[#2c5282] rounded-xl p-3">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Add Consumable</h2>
                    <p className="text-sm text-gray-600 mt-0.5">Track inventory for materials and supplies</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleCreate} className="p-6 space-y-6">
                {/* Name and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                      placeholder="e.g., Rock Salt"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all bg-white"
                      style={{ fontSize: '16px' }}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Stock and Unit */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Box className="w-4 h-4 text-[#3f72af]" />
                    Inventory Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Current Stock <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.current_stock}
                        onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white font-semibold"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Unit <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white font-semibold"
                      >
                        {UNITS.map(unit => (
                          <option key={unit.value} value={unit.value}>
                            {unit.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Min Stock Level and Unit Cost */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    Alerts & Pricing
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Minimum Stock Level <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.min_stock_level}
                        onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white font-semibold"
                        placeholder="0.00"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this level</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Unit Cost <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.unit_cost}
                          onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                          className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white font-bold text-[#3f72af]"
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Cost per unit</p>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200/50">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2 text-sm bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-all shadow-sm hover:shadow-md font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    Create Consumable
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-2xl w-full shadow-2xl border border-white/40 animate-slideUp">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-[#3f72af] to-[#2c5282] rounded-xl p-3">
                    <Edit className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Edit Consumable</h2>
                    <p className="text-sm text-gray-600 mt-0.5">Update inventory details and settings</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleUpdate} className="p-6 space-y-6">
                {/* Name and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                      placeholder="e.g., Rock Salt"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all bg-white"
                      style={{ fontSize: '16px' }}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Stock and Unit */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Box className="w-4 h-4 text-[#3f72af]" />
                    Inventory Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Current Stock <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.current_stock}
                        onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white font-semibold"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Unit <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white font-semibold"
                      >
                        {UNITS.map(unit => (
                          <option key={unit.value} value={unit.value}>
                            {unit.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Min Stock Level and Unit Cost */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    Alerts & Pricing
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Minimum Stock Level <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.min_stock_level}
                        onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white font-semibold"
                        placeholder="0.00"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this level</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Unit Cost <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.unit_cost}
                          onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                          className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white font-bold text-[#3f72af]"
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Cost per unit</p>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200/50">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-5 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2 text-sm bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-all shadow-sm hover:shadow-md font-semibold"
                  >
                    <Edit className="w-4 h-4" />
                    Update Consumable
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
