'use client';

import PageHeader from '@/components/PageHeader';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Plus,
  Trash2,
} from 'lucide-react';

export default function ServiceFormPage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params?.id as string;
  const isEdit = !!serviceId && serviceId !== 'create';
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    service_type: 'plowing',
    description: '',
    pricing: {} as { [key: string]: number },
    active: true,
  });

  const [pricingEntries, setPricingEntries] = useState<Array<{ unit: string; amount: number }>>([
    { unit: 'hourly', amount: 0 }
  ]);

  useEffect(() => {
    if (isEdit) {
      loadService();
    }
  }, [serviceId]);

  const loadService = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/services/${serviceId}`);
      setFormData({
        name: response.data.name || '',
        service_type: response.data.service_type || 'plowing',
        description: response.data.description || '',
        pricing: response.data.pricing || {},
        active: response.data.active !== false,
      });
      
      // Convert pricing object to entries
      const entries = Object.entries(response.data.pricing || {}).map(([unit, amount]) => ({
        unit,
        amount: Number(amount)
      }));
      setPricingEntries(entries.length > 0 ? entries : [{ unit: 'hourly', amount: 0 }]);
    } catch (error) {
      console.error('Error loading service:', error);
      alert('Failed to load service');
    } finally {
      setLoading(false);
    }
  };

  const addPricingEntry = () => {
    setPricingEntries([...pricingEntries, { unit: 'hourly', amount: 0 }]);
  };

  const removePricingEntry = (index: number) => {
    setPricingEntries(pricingEntries.filter((_, i) => i !== index));
  };

  const updatePricingEntry = (index: number, field: 'unit' | 'amount', value: string | number) => {
    const updated = [...pricingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setPricingEntries(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.service_type) {
      alert('Please fill in all required fields');
      return;
    }

    // Convert pricing entries to object
    const pricing: { [key: string]: number } = {};
    pricingEntries.forEach(entry => {
      if (entry.unit && entry.amount > 0) {
        pricing[entry.unit] = entry.amount;
      }
    });

    try {
      setSaving(true);
      const payload = { ...formData, pricing };
      
      if (isEdit) {
        await api.put(`/services/${serviceId}`, payload);
        alert('Service updated successfully!');
        router.push('/services');
      } else {
        await api.post('/services', payload);
        alert('Service created successfully!');
        router.push('/services');
      }
    } catch (error: any) {
      console.error('Error saving service:', error);
      alert(error?.response?.data?.detail || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Edit [Id]"
        subtitle="Update information"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Services", href: "/services" }, { label: "Details" }]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
    
    </div>
    </div>
    );
  }

  return (
          <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/services')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? 'Edit Service' : 'Add Service'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit ? 'Update service details' : 'Create a new service offering'}
            </p>
          </div>
        </div>

        {/* Service Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Standard Snow Plowing"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type *
              </label>
              <select
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="site_checks">Site Checks</option>
                <option value="sidewalk_clear">Sidewalk Clear</option>
                <option value="second_sidewalk_clear">2nd Sidewalk Clear</option>
                <option value="call_back">Call Back</option>
                <option value="plowing">Plowing</option>
                <option value="sanding">Sanding</option>
                <option value="salting">Salting</option>
                <option value="brining">Brining</option>
                <option value="hauling">Hauling</option>
              </select>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-[#3f72af] border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active Service</span>
              </label>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Describe this service..."
              />
            </div>

        {/* Pricing */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pricing Structure</h2>
            <button
              type="button"
              onClick={addPricingEntry}
              className="flex items-center gap-2 text-sm text-[#3f72af] hover:text-blue-800"
            >
              <Plus className="w-4 h-4" />
              Add Pricing Tier
            </button>
          </div>
          
          <div className="space-y-3">
            {pricingEntries.map((entry, index) => (
              <div key={index} className="flex items-center gap-3">
                <select
                  value={entry.unit}
                  onChange={(e) => updatePricingEntry(index, 'unit', e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hourly">Hourly</option>
                  <option value="per_occurrence">Per Occurrence</option>
                  <option value="monthly">Monthly</option>
                  <option value="per_yard">Per Yard</option>
                  <option value="no_charge">No Charge</option>
                </select>
                
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={entry.amount}
                    onChange={(e) => updatePricingEntry(index, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                
                {pricingEntries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePricingEntry(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/services')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] disabled:opacity-50 disabled:cursor-not-allowed"
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
                {isEdit ? 'Update Service' : 'Create Service'}
              </>
            )}
          </button>
        </div>
      </div>
      </form>
    </div>
  );
}