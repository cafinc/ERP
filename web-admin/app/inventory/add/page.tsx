'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';
import api from '@/lib/api';
import {
  Package,
  Save,
  X,
  Truck,
  Wrench,
  Box,
  ShoppingCart,
} from 'lucide-react';

export default function AddInventoryItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'equipment',
    quantity: '',
    unit: 'units',
    min_quantity: '',
    location: '',
    supplier: '',
    supplier_contact: '',
    cost_per_unit: '',
    notes: '',
  });

  const categories = [
    { value: 'equipment', label: 'Equipment', icon: Truck, color: 'text-blue-600' },
    { value: 'parts', label: 'Parts', icon: Wrench, color: 'text-purple-600' },
    { value: 'materials', label: 'Materials', icon: Package, color: 'text-green-600' },
    { value: 'consumables', label: 'Consumables', icon: ShoppingCart, color: 'text-orange-600' },
  ];

  const units = [
    'units', 'tons', 'gallons', 'pounds', 'liters', 'boxes', 'pallets', 
    'cases', 'bags', 'drums', 'each'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.quantity || !formData.min_quantity || !formData.location || !formData.cost_per_unit) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const itemData = {
        name: formData.name,
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        min_quantity: parseFloat(formData.min_quantity),
        location: formData.location,
        supplier: formData.supplier || undefined,
        supplier_contact: formData.supplier_contact || undefined,
        cost_per_unit: parseFloat(formData.cost_per_unit),
        notes: formData.notes || undefined,
      };

      await api.post('/inventory', itemData);
      alert('Inventory item added successfully!');
      router.push('/inventory');
    } catch (error) {
      console.error('Error adding inventory item:', error);
      alert('Failed to add inventory item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        {/* Header */}
        <CompactHeader
          title="Add Inventory Item"
          icon={Package}
          actions={[
            {
              label: 'Cancel',
              icon: X,
              onClick: () => router.push('/inventory'),
              variant: 'secondary',
            },
          ]}
        />

        {/* Form */}
        <div className="max-w-4xl mx-auto mt-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Basic Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Snow Plow Blade"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Main Warehouse"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Quantity Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quantity Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="min_quantity"
                    value={formData.min_quantity}
                    onChange={handleChange}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert threshold for low stock</p>
                </div>
              </div>
            </div>

            {/* Supplier Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                    placeholder="e.g., Heavy Equipment Co."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Supplier Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Contact
                  </label>
                  <input
                    type="text"
                    name="supplier_contact"
                    value={formData.supplier_contact}
                    onChange={handleChange}
                    placeholder="Phone or email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Cost Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cost per Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost per Unit ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="cost_per_unit"
                    value={formData.cost_per_unit}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Total Value (calculated) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Value (calculated)
                  </label>
                  <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 font-semibold">
                    ${formData.quantity && formData.cost_per_unit 
                      ? (parseFloat(formData.quantity) * parseFloat(formData.cost_per_unit)).toFixed(2)
                      : '0.00'
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Any additional information about this item..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/inventory')}
                disabled={loading}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-[#2c5282] text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Adding...' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
