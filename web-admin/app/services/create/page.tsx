'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Briefcase,
  DollarSign,
  FileText,
  Tag,
  Snowflake,
  Truck,
  ShoppingCart,
  Droplet,
  Wind,
} from 'lucide-react';

// Service type configurations with icons and labels
const SERVICE_TYPES = [
  { value: 'site_checks', label: 'Site Checks', icon: '🔍', color: 'text-blue-600' },
  { value: 'sidewalk_clear', label: 'Sidewalk Clear', icon: '🚶', color: 'text-green-600' },
  { value: 'second_sidewalk_clear', label: '2nd Sidewalk Clear', icon: '🚶‍♂️', color: 'text-green-700' },
  { value: 'call_back', label: 'Call Back', icon: '📞', color: 'text-purple-600' },
  { value: 'plowing', label: 'Plowing', icon: '❄️', color: 'text-blue-700' },
  { value: 'sanding', label: 'Sanding', icon: '⚪', color: 'text-yellow-700' },
  { value: 'brining', label: 'Brining', icon: '💧', color: 'text-cyan-600' },
  { value: 'hauling', label: 'Hauling', icon: '🚛', color: 'text-orange-600' },
];

// Helper function to get service type config
const getServiceTypeConfig = (type: string) => {
  return SERVICE_TYPES.find(st => st.value === type) || SERVICE_TYPES[0];
};

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
      toast.error('Failed to load service');
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
      toast.error('Please fill in all required fields');
      return;
    }

    // Convert pricing entries to object
    const pricing: { [key: string]: number } = {};
    pricingEntries.forEach(entry => {
      if (entry.unit && entry.amount > 0) {
        pricing[entry.unit] = entry.amount;
      }
    });

    setSaving(true);
    const loadingToast = toast.loading(isEdit ? 'Updating service...' : 'Creating service...');

    try {
      const payload = { ...formData, pricing };
      
      if (isEdit) {
        await api.put(`/services/${serviceId}`, payload);
        toast.success('Service updated successfully!', { id: loadingToast });
        setTimeout(() => router.push('/services'), 1000);
      } else {
        await api.post('/services', payload);
        toast.success('Service created successfully!', { id: loadingToast });
        setTimeout(() => router.push('/services'), 1000);
      }
    } catch (error: any) {
      console.error('Error saving service:', error);
      const errorMessage = error?.response?.data?.detail || 'Failed to save service';
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Create Services"
          subtitle="Add new services"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Services", href: "/services" }, { label: "Create" }]}
        />
        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={isEdit ? "Edit Service" : "Create Service"}
        subtitle={isEdit ? "Update service details" : "Add a new service offering"}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Services", href: "/services" }, { label: isEdit ? "Edit" : "Create" }]}
      />
      
      <div className="h-full bg-gray-50 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            
            {/* Service Details Card */}
            <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-8 backdrop-blur-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Briefcase className="w-6 h-6 text-[#3f72af] mr-2" />
                  Service Details
                </h2>
                
                {/* Active Service Toggle */}
                <label className="flex items-center cursor-pointer group">
                  <span className="mr-3 text-sm font-semibold text-gray-700">Active Service</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-300 rounded-full peer peer-checked:bg-[#3f72af] transition-all duration-300 shadow-inner"></div>
                    <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-7 shadow-md"></div></div>
                </label>
              </div>
              
              <div className="space-y-6">
                {/* Service Name and Service Type - Same Line */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Service Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                      placeholder="e.g., Standard Snow Plowing"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <Tag className="w-4 h-4 inline-block mr-1 text-[#3f72af]" />
                      Service Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.service_type}
                      onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all bg-white"
                      style={{ fontSize: '16px' }}
                    >
                      {SERVICE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <FileText className="w-4 h-4 inline-block mr-1 text-[#3f72af]" />
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all resize-none"
                    placeholder="Describe this service in detail..."
                  />
                </div>
              </div>
            </div>

            {/* Default Pricing Card */}
            <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-8 backdrop-blur-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <DollarSign className="w-6 h-6 text-[#3f72af] mr-2" />
                  Default Pricing
                </h2>
                <button
                  type="button"
                  onClick={addPricingEntry}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-all shadow-sm hover:shadow-md font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Pricing Tier
                </button>
              </div>
              
              <div className="space-y-4">
                {pricingEntries.map((entry, index) => (
                  <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-100 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      {/* Unit Type Dropdown */}
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-2">Unit Type</label>
                        <select
                          value={entry.unit}
                          onChange={(e) => updatePricingEntry(index, 'unit', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white font-medium"
                        >
                          <option value="hourly">Hourly</option>
                          <option value="per_occurrence">Per Occurrence</option>
                          <option value="monthly">Monthly</option>
                          <option value="per_yard">Per Yard</option>
                          <option value="no_charge">No Charge</option>
                        </select>
                      </div>
                      
                      {/* Amount Input */}
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-2">Amount</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={entry.amount}
                            onChange={(e) => updatePricingEntry(index, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] font-bold text-[#3f72af]"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      {pricingEntries.length > 1 && (
                        <div className="flex items-end pb-1">
                          <button
                            type="button"
                            onClick={() => removePricingEntry(index)}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove pricing tier"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {pricingEntries.length === 0 && (
                  <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                    <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No pricing tiers configured</p>
                    <p className="text-sm text-gray-400 mt-1">Click "Add Pricing Tier" to get started</p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-between gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/services')}
                className="px-5 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 text-sm bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md font-semibold"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {isEdit ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEdit ? 'Update Service' : 'Create Service'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}