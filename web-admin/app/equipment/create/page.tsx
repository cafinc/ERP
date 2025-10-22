'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import api from '@/lib/api';
import {
  ArrowLeft,
  Save,
  RefreshCw,
} from 'lucide-react';

export default function EquipmentFormPage() {
  const router = useRouter();
  const params = useParams();
  const equipmentId = params?.id as string;
  const isEdit = !!equipmentId && equipmentId !== 'create';
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    equipment_type: 'plow_truck',
    unit_number: '',
    license_plate: '',
    license_required: false,
    maintenance_due: '',
    last_maintenance: '',
    status: 'available',
    notes: '',
    active: true,
  });

  useEffect(() => {
    if (isEdit) {
      loadEquipment();
    }
  }, [equipmentId]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/equipment/${equipmentId}`);
      setFormData({
        name: response.data.name || '',
        equipment_type: response.data.equipment_type || 'plow_truck',
        unit_number: response.data.unit_number || '',
        license_plate: response.data.license_plate || '',
        license_required: response.data.license_required || false,
        maintenance_due: response.data.maintenance_due?.split('T')[0] || '',
        last_maintenance: response.data.last_maintenance?.split('T')[0] || '',
        status: response.data.status || 'available',
        notes: response.data.notes || '',
        active: response.data.active !== false,
      });
    } catch (error) {
      console.error('Error loading equipment:', error);
      alert('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.equipment_type) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      if (isEdit) {
        await api.put(`/equipment/${equipmentId}`, formData);
        alert('Equipment updated successfully!');
        router.push(`/equipment/${equipmentId}`);
      } else {
        const response = await api.post('/equipment', formData);
        alert('Equipment created successfully!');
        router.push(`/equipment/${response.data.id}`);
      }
    } catch (error: any) {
      console.error('Error saving equipment:', error);
      alert(error?.response?.data?.detail || 'Failed to save equipment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <HybridNavigationTopBar>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </HybridNavigationTopBar>
    );
  }

  return (
    <HybridNavigationTopBar>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push(isEdit ? `/equipment/${equipmentId}` : '/equipment')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? 'Edit Equipment' : 'Add Equipment'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit ? 'Update equipment information' : 'Add new equipment to your fleet'}
            </p>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equipment Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Plow Truck #1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equipment Type *
              </label>
              <select
                value={formData.equipment_type}
                onChange={(e) => setFormData({ ...formData, equipment_type: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="plow_truck">Plow Truck</option>
                <option value="truck">Truck</option>
                <option value="loader">Loader</option>
                <option value="skid_steer">Skid Steer</option>
                <option value="sanding_truck">Sanding Truck</option>
                <option value="brine_truck">Brine Truck</option>
                <option value="cab_sweeper">Cab Sweeper</option>
                <option value="single_stage_thrower">Single Stage Thrower</option>
                <option value="gravely_sweeper">Gravely Sweeper</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">Available</option>
                <option value="in_use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Number
              </label>
              <input
                type="text"
                value={formData.unit_number}
                onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., UNIT-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Plate
              </label>
              <input
                type="text"
                value={formData.license_plate}
                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., ABC-1234"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.license_required}
                  onChange={(e) => setFormData({ ...formData, license_required: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Requires Driver's License</span>
              </label>
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Maintenance Date
              </label>
              <input
                type="date"
                value={formData.last_maintenance}
                onChange={(e) => setFormData({ ...formData, last_maintenance: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next Maintenance Due
              </label>
              <input
                type="date"
                value={formData.maintenance_due}
                onChange={(e) => setFormData({ ...formData, maintenance_due: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Add any notes about this equipment..."
          />
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push(isEdit ? `/equipment/${equipmentId}` : '/equipment')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {isEdit ? 'Update Equipment' : 'Create Equipment'}
              </>
            )}
          </button>
        </div>
      </form>
    </HybridNavigationTopBar>
  );
}
