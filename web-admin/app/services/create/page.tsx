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

// Helper function to get icon for service types
const getServiceTypeIcon = (type: string) => {
  const icons: Record<string, JSX.Element> = {
    plowing: <Snowflake className="w-5 h-5" />,
    sanding: <Droplet className="w-5 h-5" />,
    salting: <ShoppingCart className="w-5 h-5" />,
    brining: <Wind className="w-5 h-5" />,
    hauling: <Truck className="w-5 h-5" />,
  };
  return icons[type] || <Briefcase className="w-5 h-5" />;
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Briefcase className="w-6 h-6 text-[#3f72af] mr-2" />
                Service Details
              </h2>
              
              <div className="space-y-6">
                {/* Service Name */}
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

                {/* Service Type and Active Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <Tag className="w-4 h-4 inline-block mr-1 text-[#3f72af]" />
                      Service Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#3f72af]">
                        {getServiceTypeIcon(formData.service_type)}
                      </div>
                      <select
                        value={formData.service_type}
                        onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                        required
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all bg-white appearance-none"
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
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <label className="flex items-center cursor-pointer bg-gray-50/80 px-6 py-4 rounded-xl border-2 border-gray-200 hover:border-[#3f72af] transition-all">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="w-5 h-5 text-[#3f72af] border-gray-300 rounded focus:ring-[#3f72af] focus:ring-2"
                      />
                      <span className="ml-3 text-sm font-semibold text-gray-900">Active Service</span>
                    </label>
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

            {/* Pricing Structure Card */}
            <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-8 backdrop-blur-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <DollarSign className="w-6 h-6 text-[#3f72af] mr-2" />
                  Pricing Structure
                </h2>
                <button
                  type="button"
                  onClick={addPricingEntry}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3f72af] text-white rounded-xl hover:bg-[#2c5282] transition-all shadow-md hover:shadow-lg font-medium"
                >
                  <Plus className="w-5 h-5" />
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
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-8 py-3 bg-[#3f72af] text-white rounded-xl hover:bg-[#2c5282] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-semibold"
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
          </form>
        </div>
      </div>
    </>
  );
}