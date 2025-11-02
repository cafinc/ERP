'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import { Package, Truck, Car, Hammer, Save, X } from 'lucide-react';

export default function CreateEquipmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'equipment',
    status: 'operational',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    serialNumber: '',
    description: '',
    location: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/equipment', formData);
      alert('Asset created successfully!');
      router.push('/asset');
    } catch (error) {
      console.error('Error creating asset:', error);
      alert('Failed to create asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">\n      <PageHeader
        title="Add New Asset"
        subtitle="Create a new asset entry"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Assets", href: "/asset/dashboard" },
          { label: "Equipment", href: "/asset" },
          { label: "Add New" }
        ]}
        actions={[
          {
            label: 'Cancel',
            onClick: () => router.push('/asset'),
            variant: 'secondary',
          },
        ]}
      />

      <div className="max-w-4xl mx-auto mt-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Asset Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Asset Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { value: 'equipment', label: 'Equipment', icon: Package, color: 'blue' },
                { value: 'vehicle', label: 'Vehicle', icon: Car, color: 'purple' },
                { value: 'trailer', label: 'Trailer', icon: Truck, color: 'indigo' },
                { value: 'tool', label: 'Tool', icon: Hammer, color: 'orange' },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.type === type.value
                      ? `border-${type.color}-500 bg-${type.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <type.icon className={`w-8 h-8 mx-auto mb-2 ${
                    formData.type === type.value ? `text-${type.color}-600` : 'text-gray-400'
                  }`} />
                  <div className="text-sm font-medium text-gray-900">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Asset name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="operational">Operational</option>
                  <option value="maintenance">In Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Details</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Manufacturer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Model number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Year"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Serial/VIN number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Storage location"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional details about this asset..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.push('/asset')}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2d5a8f] font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
      <PageHeader
        title="Add New Asset"
        subtitle="Create a new asset entry"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Assets", href: "/asset/dashboard" },
          { label: "Equipment", href: "/asset" },
          { label: "Add New" }
        ]}
        actions={[
          {
            label: 'Cancel',
            onClick: () => router.push('/asset'),
            variant: 'secondary',
          },
        ]}
      />

      <div className="max-w-4xl mx-auto mt-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Asset Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Asset Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { value: 'equipment', label: 'Equipment', icon: Package, color: 'blue' },
                { value: 'vehicle', label: 'Vehicle', icon: Car, color: 'purple' },
                { value: 'trailer', label: 'Trailer', icon: Truck, color: 'indigo' },
                { value: 'tool', label: 'Tool', icon: Hammer, color: 'orange' },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.type === type.value
                      ? `border-${type.color}-500 bg-${type.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <type.icon className={`w-8 h-8 mx-auto mb-2 ${
                    formData.type === type.value ? `text-${type.color}-600` : 'text-gray-400'
                  }`} />
                  <div className="text-sm font-medium text-gray-900">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Asset name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="operational">Operational</option>
                  <option value="maintenance">In Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Details</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Manufacturer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Model number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Year"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Serial/VIN number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Storage location"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional details about this asset..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.push('/equipment')}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2d5a8f] font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
