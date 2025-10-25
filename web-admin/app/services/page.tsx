'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Package,
  RefreshCw,
  CheckCircle,
  XCircle,
  Eye,
  X,
  Save,
  Briefcase,
  Tag,
  FileText,
  Box,
  AlertTriangle,
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

const UNITS = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'per_occurrence', label: 'Per Occurrence' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'per_yard', label: 'Per Yard' },
  { value: 'no_charge', label: 'No Charge' },
];

interface Service {
  id: string;
  name: string;
  service_type: string;
  description?: string;
  pricing: { [key: string]: number };
  active: boolean;
  created_at: string;
}

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    service_type: 'plowing',
    description: '',
    active: true,
  });
  const [pricingEntries, setPricingEntries] = useState([
    { unit: 'hourly', amount: '' as any },
  ]);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/services');
      setServices(response.data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPricingEntry = () => {
    setPricingEntries([...pricingEntries, { unit: 'hourly', amount: '' }]);
  };

  const removePricingEntry = (index: number) => {
    setPricingEntries(pricingEntries.filter((_, i) => i !== index));
  };

  const updatePricingEntry = (index: number, field: string, value: any) => {
    const updated = [...pricingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setPricingEntries(updated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.service_type) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Convert pricing entries to object
    const pricing: { [key: string]: number } = {};
    pricingEntries.forEach(entry => {
      if (entry.unit && entry.amount) {
        pricing[entry.unit] = parseFloat(entry.amount);
      }
    });

    const loadingToast = toast.loading('Creating service...');

    try {
      const payload = { ...formData, pricing };
      await api.post('/services', payload);
      toast.success('Service created successfully!', { id: loadingToast });
      setShowCreateModal(false);
      setFormData({
        name: '',
        service_type: 'plowing',
        description: '',
        active: true,
      });
      setPricingEntries([{ unit: 'hourly', amount: '' }]);
      loadServices();
    } catch (error: any) {
      console.error('Error creating service:', error);
      const errorMessage = error?.response?.data?.detail || 'Failed to create service';
      toast.error(errorMessage, { id: loadingToast });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service? This action cannot be undone.')) return;
    
    try {
      await api.delete(`/services/${id}`);
      alert('Service deleted successfully!');
      loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service');
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'site_checks': 'Site Checks',
      'sidewalk_clear': 'Sidewalk Clear',
      'second_sidewalk_clear': '2nd Sidewalk Clear',
      'call_back': 'Call Back',
      'plowing': 'Plowing',
      'sanding': 'Sanding',
      'salting': 'Salting',
      'brining': 'Brining',
      'hauling': 'Hauling'
    };
    return typeMap[type] || type;
  };

  const formatPricing = (pricing: { [key: string]: number }) => {
    const entries = Object.entries(pricing);
    if (entries.length === 0) return 'No pricing set';
    
    return entries.map(([key, value]) => {
      const label = key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `${label}: $${value}`;
    }).join(', ');
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || service.service_type === filterType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      );
  }

  return (
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        {/* Compact Header */}
        <PageHeader
          title="Services"
          subtitle="Manage service offerings and pricing"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dispatch", href: "/dispatch" }, { label: "Services" }]}
          actions={[
            {
              label: 'Add Service',
              icon: <Plus className="w-4 h-4 mr-2" />,
              onClick: () => setShowCreateModal(true),
              variant: 'primary',
            },
          ]}
        />

        {/* Filter Buttons */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-[#3f72af] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              All Types ({services.length})
            </button>
            <button
              onClick={() => setFilterType('plowing')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'plowing'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Plowing ({services.filter(s => s.service_type === 'plowing').length})
            </button>
            <button
              onClick={() => setFilterType('salting')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'salting'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Salting ({services.filter(s => s.service_type === 'salting').length})
            </button>
            <button
              onClick={() => setFilterType('sanding')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'sanding'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Sanding ({services.filter(s => s.service_type === 'sanding').length})
            </button>
            <button
              onClick={() => setFilterType('sidewalk_clear')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'sidewalk_clear'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Sidewalk ({services.filter(s => s.service_type === 'sidewalk_clear').length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-3 mb-4 mx-6 mt-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              onClick={loadServices}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-100 transition-all text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-12 text-center mx-6 hover:shadow-md transition-shadow">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Services Found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your search or filters' 
                : 'Get started by adding your first service'}
            </p>
            {!searchQuery && filterType === 'all' && (
              <button
                onClick={() => router.push('/services/create')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add First Service</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mx-6">
            {filteredServices.map((service, index) => (
              <div
                key={service.id || `service-${index}`}
                className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-600">{service.category}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    service.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {service.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Rate:</span>
                    <span className="text-gray-900 font-medium">${service.rate}/{service.unit}</span>
                  </div>
                  {service.description && (
                    <p className="text-sm text-gray-600">{service.description}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button 
                    onClick={() => router.push(`/services/${service.id}`)}
                    className="flex-1 px-3 py-1.5 text-sm bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282]"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => router.push(`/services/${service.id}/edit`)}
                    className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mx-6 mt-6">
          <div className="bg-white rounded-xl shadow-md shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-3">
                <Package className="w-6 h-6 text-[#3f72af]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
                <p className="text-sm text-gray-600">Total Services</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {services.filter(s => s.active).length}
                </p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 rounded-lg p-3">
                <XCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {services.filter(s => !s.active).length}
                </p>
                <p className="text-sm text-gray-600">Inactive</p>
              </div>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-white rounded-xl shadow-md shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No services found</p>
                      <p className="text-sm">Add your first service to get started</p>
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50 transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {service.name}
                          </div>
                          {service.description && (
                            <div className="text-sm text-gray-500">
                              {service.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">
                          {getTypeLabel(service.service_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span>{formatPricing(service.pricing)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          service.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {service.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/services/${service.id}/edit`)}
                            className="text-[#3f72af] hover:text-blue-800"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Service Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-2xl w-full shadow-2xl border border-white/40 animate-slideUp max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200/50 sticky top-0 bg-white/95 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-[#3f72af] to-[#2c5282] rounded-xl p-3">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Create Service</h2>
                    <p className="text-sm text-gray-600 mt-0.5">Add a new service offering</p>
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
                {/* Service Details Card */}
                <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <Briefcase className="w-5 h-5 text-[#3f72af] mr-2" />
                      Service Details
                    </h3>
                    
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
                        <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-7 shadow-md"></div>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-4">
                    {/* Service Name and Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all resize-none"
                        placeholder="Describe this service in detail..."
                      />
                    </div>
                  </div>
                </div>

                {/* Default Pricing Card */}
                <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <DollarSign className="w-5 h-5 text-[#3f72af] mr-2" />
                      Default Pricing
                    </h3>
                    <button
                      type="button"
                      onClick={addPricingEntry}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-all shadow-sm hover:shadow-md font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Pricing Tier
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {pricingEntries.map((entry, index) => (
                      <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-100 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          {/* Unit Type Dropdown */}
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Unit Type</label>
                            <select
                              value={entry.unit}
                              onChange={(e) => updatePricingEntry(index, 'unit', e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white font-medium text-sm"
                            >
                              {UNITS.map(unit => (
                                <option key={unit.value} value={unit.value}>
                                  {unit.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Amount Input */}
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={entry.amount}
                                onChange={(e) => updatePricingEntry(index, 'amount', e.target.value)}
                                className="w-full pl-8 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] font-bold text-[#3f72af] text-sm"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          
                          {/* Delete Button */}
                          {pricingEntries.length > 1 && (
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => removePricingEntry(index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove pricing tier"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {pricingEntries.length === 0 && (
                      <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                        <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 font-medium text-sm">No pricing tiers configured</p>
                      </div>
                    )}
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
                    <Save className="w-4 h-4" />
                    Create Service
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
}