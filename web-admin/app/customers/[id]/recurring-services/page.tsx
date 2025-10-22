'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';
import api from '@/lib/api';
import {
  Plus,
  Calendar,
  RefreshCw,
  Edit,
  Trash2,
  Pause,
  Play,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Snowflake,
  Settings,
  Bell,
} from 'lucide-react';

interface RecurringService {
  id: string;
  customer_id: string;
  site_id: string;
  site_name?: string;
  service_type: 'snow_removal' | 'lawn_care' | 'maintenance';
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'seasonal';
  start_date: string;
  end_date?: string;
  is_active: boolean;
  price_per_service: number;
  auto_invoice: boolean;
  auto_dispatch: boolean;
  next_service_date?: string;
  last_service_date?: string;
  total_services_completed: number;
  notes?: string;
  created_at: string;
}

export default function RecurringServicesPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = (Array.isArray(params?.id) ? params.id[0] : params?.id) as string;

  const [customer, setCustomer] = useState<any>(null);
  const [services, setServices] = useState<RecurringService[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<RecurringService | null>(null);
  const [formData, setFormData] = useState({
    site_id: '',
    service_type: 'snow_removal' as RecurringService['service_type'],
    frequency: 'weekly' as RecurringService['frequency'],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    price_per_service: '',
    auto_invoice: true,
    auto_dispatch: false,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [customerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load customer
      const customerResponse = await api.get(`/customers/${customerId}`);
      setCustomer(customerResponse.data);

      // Load recurring services
      const servicesResponse = await api.get(`/customers/${customerId}/recurring-services`);
      setServices(servicesResponse.data || []);

      // Load sites
      const sitesResponse = await api.get(`/sites?customer_id=${customerId}`);
      setSites(sitesResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.site_id || !formData.price_per_service) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        customer_id: customerId,
        price_per_service: parseFloat(formData.price_per_service),
        end_date: formData.end_date || null,
      };

      if (editingService) {
        await api.put(`/recurring-services/${editingService.id}`, payload);
      } else {
        await api.post('/recurring-services', payload);
      }

      alert(`Recurring service ${editingService ? 'updated' : 'created'} successfully!`);
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving recurring service:', error);
      alert('Failed to save recurring service');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service: RecurringService) => {
    setEditingService(service);
    setFormData({
      site_id: service.site_id,
      service_type: service.service_type,
      frequency: service.frequency,
      start_date: service.start_date.split('T')[0],
      end_date: service.end_date ? service.end_date.split('T')[0] : '',
      price_per_service: service.price_per_service.toString(),
      auto_invoice: service.auto_invoice,
      auto_dispatch: service.auto_dispatch,
      notes: service.notes || '',
    });
    setShowModal(true);
  };

  const handleToggleActive = async (service: RecurringService) => {
    try {
      await api.put(`/recurring-services/${service.id}`, {
        is_active: !service.is_active,
      });
      loadData();
    } catch (error) {
      console.error('Error toggling service:', error);
      alert('Failed to update service status');
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this recurring service?')) {
      return;
    }

    try {
      await api.delete(`/recurring-services/${serviceId}`);
      alert('Recurring service deleted successfully!');
      loadData();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete recurring service');
    }
  };

  const resetForm = () => {
    setEditingService(null);
    setFormData({
      site_id: '',
      service_type: 'snow_removal',
      frequency: 'weekly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      price_per_service: '',
      auto_invoice: true,
      auto_dispatch: false,
      notes: '',
    });
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      seasonal: 'Seasonal',
    };
    return labels[frequency] || frequency;
  };

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      snow_removal: 'Snow Removal',
      lawn_care: 'Lawn Care',
      maintenance: 'Maintenance',
    };
    return labels[type] || type;
  };

  const activeServices = services.filter(s => s.is_active);
  const inactiveServices = services.filter(s => !s.is_active);

  if (loading) {
    return (
      <HybridNavigationTopBar>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading recurring services...</p>
          </div>
        </div>
      </HybridNavigationTopBar>
    );
  }

  return (
    <HybridNavigationTopBar>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Compact Header */}
          <CompactHeader
            title="Recurring Services"
            subtitle={`Manage recurring services for ${customer?.name}`}
            backUrl={`/customers/${customerId}`}
            icon={RefreshCw}
            actions={[
              {
                label: 'Add Service',
                icon: Plus,
                onClick: () => {
                  resetForm();
                  setShowModal(true);
                },
                variant: 'primary',
              },
            ]}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Services</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{activeServices.length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paused Services</p>
                  <p className="text-3xl font-bold text-gray-600 mt-2">{inactiveServices.length}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Pause className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-[#3f72af] mt-2">
                    ${activeServices.reduce((sum, s) => {
                      const monthly = s.frequency === 'monthly' ? s.price_per_service :
                                    s.frequency === 'weekly' ? s.price_per_service * 4 :
                                    s.frequency === 'biweekly' ? s.price_per_service * 2 :
                                    s.frequency === 'daily' ? s.price_per_service * 30 : 0;
                      return sum + monthly;
                    }, 0).toFixed(0)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-[#3f72af]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Completed</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {services.reduce((sum, s) => sum + s.total_services_completed, 0)}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Services List */}
          <div className="space-y-4">
            {/* Active Services */}
            {activeServices.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200 bg-green-50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Active Services ({activeServices.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {activeServices.map(service => (
                    <div key={service.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Snowflake className="w-5 h-5 text-[#3f72af]" />
                            <h3 className="font-semibold text-gray-900">
                              {getServiceTypeLabel(service.service_type)}
                            </h3>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {getFrequencyLabel(service.frequency)}
                            </span>
                            {service.auto_invoice && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                Auto-Invoice
                              </span>
                            )}
                            {service.auto_dispatch && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                                Auto-Dispatch
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{service.site_name || 'Unknown Site'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              <span>${service.price_per_service} per service</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>Next: {service.next_service_date ? new Date(service.next_service_date).toLocaleDateString() : 'TBD'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{service.total_services_completed} completed</span>
                            </div>
                          </div>

                          {service.notes && (
                            <p className="text-xs text-gray-500 mt-2 italic">{service.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleToggleActive(service)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Pause service"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(service)}
                            className="p-2 text-[#3f72af] hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Services */}
            {inactiveServices.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Pause className="w-5 h-5 text-gray-600" />
                    Paused Services ({inactiveServices.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {inactiveServices.map(service => (
                    <div key={service.id} className="p-4 hover:bg-gray-50 transition-colors opacity-60">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Snowflake className="w-5 h-5 text-gray-400" />
                            <h3 className="font-semibold text-gray-700">
                              {getServiceTypeLabel(service.service_type)}
                            </h3>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                              {getFrequencyLabel(service.frequency)}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{service.site_name || 'Unknown Site'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              <span>${service.price_per_service} per service</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleToggleActive(service)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Resume service"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(service)}
                            className="p-2 text-[#3f72af] hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {services.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <RefreshCw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recurring Services</h3>
                <p className="text-gray-600 mb-4">
                  Set up recurring services to automate scheduling and invoicing
                </p>
                <button
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                  className="px-6 py-2 bg-[#3f72af] hover:bg-[#2c5282] text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add First Service
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingService ? 'Edit' : 'Create'} Recurring Service
              </h2>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site *
                </label>
                <select
                  value={formData.site_id}
                  onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a site</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.name} - {site.address}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type *
                  </label>
                  <select
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="snow_removal">Snow Removal</option>
                    <option value="lawn_care">Lawn Care</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency *
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="seasonal">Seasonal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Per Service *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price_per_service}
                    onChange={(e) => setFormData({ ...formData, price_per_service: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_invoice}
                    onChange={(e) => setFormData({ ...formData, auto_invoice: e.target.checked })}
                    className="w-4 h-4 text-[#3f72af] rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Automatically create invoices</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_dispatch}
                    onChange={(e) => setFormData({ ...formData, auto_dispatch: e.target.checked })}
                    className="w-4 h-4 text-[#3f72af] rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Automatically create dispatch jobs</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes about this recurring service..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrUpdate}
                disabled={saving}
                className="px-6 py-2 bg-[#3f72af] hover:bg-[#2c5282] disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
              >
                {saving ? 'Saving...' : editingService ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </HybridNavigationTopBar>
  );
}
