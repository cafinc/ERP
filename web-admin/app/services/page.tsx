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
  LayoutGrid,
  List,
  Filter,
  SlidersHorizontal,
  Truck,
  ShoppingCart,
  Wrench,
  Link,
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
  equipment?: Array<{ equipment_id: string; rate: number; unit: string }>;
  trucks?: Array<{ truck_id: string; rate: number; unit: string }>;
  trailers?: Array<{ trailer_id: string; rate: number; unit: string }>;
  tools?: Array<{ tool_id: string; rate: number; unit: string }>;
  consumable_ids?: string[];
  requires_consumables?: boolean;
  created_at: string;
}

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterActive, setFilterActive] = useState('all'); // 'all', 'active', 'inactive'
  
  // Equipment and Consumables data
  const [equipment, setEquipment] = useState<any[]>([]);
  const [consumables, setConsumables] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [trailers, setTrailers] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    service_type: 'plowing',
    description: '',
    active: true,
    equipment: [] as Array<{ equipment_id: string; rate: number; unit: string }>,
    trucks: [] as Array<{ truck_id: string; rate: number; unit: string }>,
    trailers: [] as Array<{ trailer_id: string; rate: number; unit: string }>,
    tools: [] as Array<{ tool_id: string; rate: number; unit: string }>,
    consumable_ids: [] as string[],
    requires_consumables: false,
  });
  const [pricingEntries, setPricingEntries] = useState([
    { unit: 'hourly', amount: '' as any },
  ]);

  useEffect(() => {
    loadServices();
    loadEquipmentAndConsumables();
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

  const loadEquipmentAndConsumables = async () => {
    try {
      const [equipmentRes, consumablesRes, trucksRes, trailersRes, toolsRes] = await Promise.all([
        api.get('/inventory').catch(() => ({ data: [] })),
        api.get('/consumables').catch(() => ({ data: [] })),
        api.get('/trucks').catch(() => ({ data: [] })),
        api.get('/trailers').catch(() => ({ data: [] })),
        api.get('/tools').catch(() => ({ data: [] })),
      ]);
      setEquipment(equipmentRes.data || []);
      setConsumables(consumablesRes.data || []);
      setTrucks(trucksRes.data || []);
      setTrailers(trailersRes.data || []);
      setTools(toolsRes.data || []);
    } catch (error) {
      console.error('Error loading resources:', error);
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
      const payload = { 
        ...formData, 
        pricing,
        equipment: formData.equipment,
        trucks: formData.trucks,
        trailers: formData.trailers,
        tools: formData.tools,
        consumable_ids: formData.requires_consumables ? formData.consumable_ids : [],
        requires_consumables: formData.requires_consumables,
      };
      await api.post('/services', payload);
      toast.success('Service created successfully!', { id: loadingToast });
      setShowCreateModal(false);
      setFormData({
        name: '',
        service_type: 'plowing',
        description: '',
        active: true,
        equipment: [],
        trucks: [],
        trailers: [],
        tools: [],
        consumable_ids: [],
        requires_consumables: false,
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
    
    const loadingToast = toast.loading('Deleting service...');
    
    try {
      await api.delete(`/services/${id}`);
      toast.success('Service deleted successfully!', { id: loadingToast });
      loadServices();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      const errorMessage = error?.response?.data?.detail || 'Failed to delete service';
      toast.error(errorMessage, { id: loadingToast });
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
    
    const matchesActive = filterActive === 'all' || 
                         (filterActive === 'active' && service.active) ||
                         (filterActive === 'inactive' && !service.active);
    
    return matchesSearch && matchesType && matchesActive;
  });

  if (loading) {
    return (
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      );
  }

  return (
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
        <PageHeader
          title="Services"
          subtitle="Manage service offerings, pricing, and availability"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Dispatch", href: "/dispatch" },
            { label: "Services" }
          ]}
          actions={[
            {
              label: 'Add Service',
              icon: <Plus className="w-4 h-4 mr-2" />,
              onClick: () => setShowCreateModal(true),
              variant: 'primary',
            },
          ]}
          tabs={[
            { label: "All", value: "all", count: services.length },
            { label: "❄️ Plowing", value: "plowing", count: services.filter(s => s.service_type === 'plowing').length },
            { label: "⚪ Sanding", value: "sanding", count: services.filter(s => s.service_type === 'sanding').length },
            { label: "🧂 Salting", value: "salting", count: services.filter(s => s.service_type === 'salting').length },
            { label: "🚶 Sidewalk", value: "sidewalk_clear", count: services.filter(s => s.service_type === 'sidewalk_clear').length },
          ]}
          activeTab={filterType}
          onTabChange={(value) => setFilterType(value)}
          showSearch={true}
          searchPlaceholder="Search services..."
          onSearch={setSearchQuery}
          showFilter={true}
          onFilterClick={() => setShowFilterDropdown(!showFilterDropdown)}
          filterDropdown={showFilterDropdown ? (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-4">
                <div className="text-sm font-semibold text-gray-900 mb-3">Advanced Filters</div>
                
                {/* Status Filter */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Status</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="radio"
                        name="status"
                        checked={filterActive === 'all'}
                        onChange={() => setFilterActive('all')}
                        className="text-[#3f72af] focus:ring-[#3f72af]"
                      />
                      <span className="text-sm text-gray-700">All Services</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="radio"
                        name="status"
                        checked={filterActive === 'active'}
                        onChange={() => setFilterActive('active')}
                        className="text-[#3f72af] focus:ring-[#3f72af]"
                      />
                      <span className="text-sm text-gray-700">Active Only</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="radio"
                        name="status"
                        checked={filterActive === 'inactive'}
                        onChange={() => setFilterActive('inactive')}
                        className="text-[#3f72af] focus:ring-[#3f72af]"
                      />
                      <span className="text-sm text-gray-700">Inactive Only</span>
                    </label>
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-700 mb-2 block">View Mode</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-[#3f72af] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span className="text-sm">Grid</span>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        viewMode === 'list'
                          ? 'bg-[#3f72af] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <List className="w-4 h-4" />
                      <span className="text-sm">List</span>
                    </button>
                  </div>
                </div>

                {/* Apply/Clear Buttons */}
                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setFilterActive('all');
                      setShowFilterDropdown(false);
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowFilterDropdown(false)}
                    className="flex-1 px-3 py-2 text-sm bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282]"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          ) : undefined}
        />

 

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
          <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-2xl w-full shadow-2xl border border-white/40 animate-slideUp my-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
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
              <form onSubmit={handleCreate} className="p-6 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto">
                {/* Service Details Card */}
                <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 backdrop-blur-sm overflow-hidden">
                  {/* Header with Gradient */}
                  <div className="bg-gradient-to-r from-[#3f72af] to-[#2c5282] px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <Briefcase className="w-5 h-5 mr-2" />
                      Service Details
                    </h3>
                    
                    {/* Active Service Toggle */}
                    <label className="flex items-center cursor-pointer group">
                      <span className="mr-3 text-sm font-semibold text-white">Active Service</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.active}
                          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-white/30 rounded-full peer peer-checked:bg-green-400 transition-all duration-300 shadow-inner"></div>
                        <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-7 shadow-md"></div>
                      </div>
                    </label>
                  </div>

                  <div className="p-6 space-y-4">
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
                <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 backdrop-blur-sm overflow-hidden">
                  {/* Header with Gradient */}
                  <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Default Pricing
                    </h3>
                    <button
                      type="button"
                      onClick={addPricingEntry}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-white text-green-600 rounded-lg hover:bg-green-50 transition-all shadow-sm hover:shadow-md font-medium border-2 border-white"
                    >
                      <Plus className="w-4 h-4" />
                      Add Pricing Tier
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-3">
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

                {/* Equipment Selection Card */}
                <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 backdrop-blur-sm overflow-hidden">
                  {/* Header with Gradient */}
                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <Truck className="w-5 h-5 mr-2" />
                      Equipment & Rates
                    </h3>
                    <p className="text-sm text-purple-100 mt-1">Select equipment and set rates for each</p>
                  </div>
                  
                  <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                    {equipment.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-xl">
                        <Truck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No equipment available</p>
                      </div>
                    ) : (
                      equipment.map((item: any) => {
                        const equipmentId = item.id || item._id;
                        const existingEquipment = formData.equipment.find(e => e.equipment_id === equipmentId);
                        const isSelected = !!existingEquipment;
                        
                        return (
                          <div
                            key={equipmentId}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 shadow-md'
                                : 'bg-gray-50 border-gray-200 hover:border-blue-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Checkbox */}
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      equipment: [
                                        ...formData.equipment,
                                        { equipment_id: equipmentId, rate: 0, unit: 'hourly' }
                                      ]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      equipment: formData.equipment.filter(e => e.equipment_id !== equipmentId)
                                    });
                                  }
                                }}
                                className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer mt-1"
                              />
                              
                              {/* Equipment Info and Rate Inputs */}
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="font-bold text-gray-900">{item.name}</p>
                                    {item.equipment_type && (
                                      <p className="text-xs text-gray-600 capitalize">{item.equipment_type.replace('_', ' ')}</p>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Rate Inputs - Only show when selected */}
                                {isSelected && (
                                  <div className="mt-3 grid grid-cols-2 gap-3">
                                    {/* Unit Type Dropdown */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Unit Type</label>
                                      <select
                                        value={existingEquipment?.unit || 'hourly'}
                                        onChange={(e) => {
                                          setFormData({
                                            ...formData,
                                            equipment: formData.equipment.map(eq =>
                                              eq.equipment_id === equipmentId
                                                ? { ...eq, unit: e.target.value }
                                                : eq
                                            )
                                          });
                                        }}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white font-medium text-sm"
                                      >
                                        {UNITS.filter(u => u.value !== 'no_charge').map(unit => (
                                          <option key={unit.value} value={unit.value}>
                                            {unit.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    
                                    {/* Rate Input */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Rate</label>
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">$</span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={existingEquipment?.rate || ''}
                                          onChange={(e) => {
                                            setFormData({
                                              ...formData,
                                              equipment: formData.equipment.map(eq =>
                                                eq.equipment_id === equipmentId
                                                  ? { ...eq, rate: parseFloat(e.target.value) || 0 }
                                                  : eq
                                              )
                                            });
                                          }}
                                          className="w-full pl-8 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] font-bold text-[#3f72af] text-sm"
                                          placeholder="0.00"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {/* Selected Equipment Summary */}
                  {formData.equipment.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                      <p className="text-sm font-semibold text-gray-900 mb-2">
                        {formData.equipment.length} Equipment Selected
                      </p>
                      <div className="space-y-1">
                        {formData.equipment.map((eq, index) => {
                          const equipmentItem = equipment.find((e: any) => (e.id || e._id) === eq.equipment_id);
                          return (
                            <div key={index} className="text-xs text-gray-700 flex items-center justify-between">
                              <span>• {equipmentItem?.name || 'Unknown'}</span>
                              <span className="font-bold text-[#3f72af]">
                                ${eq.rate.toFixed(2)}/{eq.unit.replace('_', ' ')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Trucks Selection Card */}
                <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 backdrop-blur-sm overflow-hidden">
                  {/* Header with Gradient */}
                  <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <Truck className="w-5 h-5 mr-2" />
                      Trucks & Rates
                    </h3>
                    <p className="text-sm text-cyan-100 mt-1">Select trucks and set rates for each</p>
                  </div>
                  
                  <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                    {trucks.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-xl">
                        <Truck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No trucks available</p>
                      </div>
                    ) : (
                      trucks.map((item: any) => {
                        const truckId = item.id || item._id;
                        const existingTruck = formData.trucks.find(t => t.truck_id === truckId);
                        const isSelected = !!existingTruck;
                        
                        return (
                          <div
                            key={truckId}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-300 shadow-md'
                                : 'bg-gray-50 border-gray-200 hover:border-cyan-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      trucks: [...formData.trucks, { truck_id: truckId, rate: 0, unit: 'hourly' }]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      trucks: formData.trucks.filter(t => t.truck_id !== truckId)
                                    });
                                  }
                                }}
                                className="w-5 h-5 rounded border-gray-300 text-cyan-500 focus:ring-2 focus:ring-cyan-500 cursor-pointer mt-1"
                              />
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="font-bold text-gray-900">{item.name || item.make + ' ' + item.model}</p>
                                    {item.plate_number && (
                                      <p className="text-xs text-gray-600">Plate: {item.plate_number}</p>
                                    )}
                                  </div>
                                </div>
                                
                                {isSelected && (
                                  <div className="mt-3 grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Unit Type</label>
                                      <select
                                        value={existingTruck?.unit || 'hourly'}
                                        onChange={(e) => {
                                          setFormData({
                                            ...formData,
                                            trucks: formData.trucks.map(tr =>
                                              tr.truck_id === truckId ? { ...tr, unit: e.target.value } : tr
                                            )
                                          });
                                        }}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white font-medium text-sm"
                                      >
                                        {UNITS.filter(u => u.value !== 'no_charge').map(unit => (
                                          <option key={unit.value} value={unit.value}>{unit.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                    
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Rate</label>
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">$</span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={existingTruck?.rate || ''}
                                          onChange={(e) => {
                                            setFormData({
                                              ...formData,
                                              trucks: formData.trucks.map(tr =>
                                                tr.truck_id === truckId ? { ...tr, rate: parseFloat(e.target.value) || 0 } : tr
                                              )
                                            });
                                          }}
                                          className="w-full pl-8 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] font-bold text-[#3f72af] text-sm"
                                          placeholder="0.00"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {formData.trucks.length > 0 && (
                    <div className="mx-6 mb-6 p-4 bg-cyan-50 border-2 border-cyan-200 rounded-xl">
                      <p className="text-sm font-semibold text-gray-900 mb-2">{formData.trucks.length} Truck(s) Selected</p>
                      <div className="space-y-1">
                        {formData.trucks.map((tr, index) => {
                          const truckItem = trucks.find((t: any) => (t.id || t._id) === tr.truck_id);
                          return (
                            <div key={index} className="text-xs text-gray-700 flex items-center justify-between">
                              <span>• {truckItem?.name || truckItem?.make + ' ' + truckItem?.model || 'Unknown'}</span>
                              <span className="font-bold text-[#3f72af]">${tr.rate.toFixed(2)}/{tr.unit.replace('_', ' ')}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Trailers Selection Card */}
                <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 backdrop-blur-sm overflow-hidden">
                  {/* Header with Gradient */}
                  <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <Link className="w-5 h-5 mr-2" />
                      Trailers & Rates
                    </h3>
                    <p className="text-sm text-teal-100 mt-1">Select trailers and set rates for each</p>
                  </div>
                  
                  <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                    {trailers.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-xl">
                        <Link className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No trailers available</p>
                      </div>
                    ) : (
                      trailers.map((item: any) => {
                        const trailerId = item.id || item._id;
                        const existingTrailer = formData.trailers.find(t => t.trailer_id === trailerId);
                        const isSelected = !!existingTrailer;
                        
                        return (
                          <div
                            key={trailerId}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-300 shadow-md'
                                : 'bg-gray-50 border-gray-200 hover:border-teal-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      trailers: [...formData.trailers, { trailer_id: trailerId, rate: 0, unit: 'hourly' }]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      trailers: formData.trailers.filter(t => t.trailer_id !== trailerId)
                                    });
                                  }
                                }}
                                className="w-5 h-5 rounded border-gray-300 text-teal-500 focus:ring-2 focus:ring-teal-500 cursor-pointer mt-1"
                              />
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="font-bold text-gray-900">{item.name || item.type}</p>
                                    {item.plate_number && (
                                      <p className="text-xs text-gray-600">Plate: {item.plate_number}</p>
                                    )}
                                  </div>
                                </div>
                                
                                {isSelected && (
                                  <div className="mt-3 grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Unit Type</label>
                                      <select
                                        value={existingTrailer?.unit || 'hourly'}
                                        onChange={(e) => {
                                          setFormData({
                                            ...formData,
                                            trailers: formData.trailers.map(trl =>
                                              trl.trailer_id === trailerId ? { ...trl, unit: e.target.value } : trl
                                            )
                                          });
                                        }}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white font-medium text-sm"
                                      >
                                        {UNITS.filter(u => u.value !== 'no_charge').map(unit => (
                                          <option key={unit.value} value={unit.value}>{unit.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                    
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Rate</label>
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">$</span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={existingTrailer?.rate || ''}
                                          onChange={(e) => {
                                            setFormData({
                                              ...formData,
                                              trailers: formData.trailers.map(trl =>
                                                trl.trailer_id === trailerId ? { ...trl, rate: parseFloat(e.target.value) || 0 } : trl
                                              )
                                            });
                                          }}
                                          className="w-full pl-8 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] font-bold text-[#3f72af] text-sm"
                                          placeholder="0.00"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {formData.trailers.length > 0 && (
                    <div className="mx-6 mb-6 p-4 bg-teal-50 border-2 border-teal-200 rounded-xl">
                      <p className="text-sm font-semibold text-gray-900 mb-2">{formData.trailers.length} Trailer(s) Selected</p>
                      <div className="space-y-1">
                        {formData.trailers.map((trl, index) => {
                          const trailerItem = trailers.find((t: any) => (t.id || t._id) === trl.trailer_id);
                          return (
                            <div key={index} className="text-xs text-gray-700 flex items-center justify-between">
                              <span>• {trailerItem?.name || trailerItem?.type || 'Unknown'}</span>
                              <span className="font-bold text-[#3f72af]">${trl.rate.toFixed(2)}/{trl.unit.replace('_', ' ')}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tools Selection Card */}
                <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 backdrop-blur-sm overflow-hidden">
                  {/* Header with Gradient */}
                  <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <Wrench className="w-5 h-5 mr-2" />
                      Tools & Rates
                    </h3>
                    <p className="text-sm text-amber-100 mt-1">Select tools and set rates for each</p>
                  </div>
                  
                  <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                    {tools.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-xl">
                        <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No tools available</p>
                      </div>
                    ) : (
                      tools.map((item: any) => {
                        const toolId = item.id || item._id;
                        const existingTool = formData.tools.find(t => t.tool_id === toolId);
                        const isSelected = !!existingTool;
                        
                        return (
                          <div
                            key={toolId}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300 shadow-md'
                                : 'bg-gray-50 border-gray-200 hover:border-amber-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      tools: [...formData.tools, { tool_id: toolId, rate: 0, unit: 'hourly' }]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      tools: formData.tools.filter(t => t.tool_id !== toolId)
                                    });
                                  }
                                }}
                                className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-2 focus:ring-amber-500 cursor-pointer mt-1"
                              />
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="font-bold text-gray-900">{item.name}</p>
                                    {item.type && (
                                      <p className="text-xs text-gray-600 capitalize">{item.type}</p>
                                    )}
                                  </div>
                                </div>
                                
                                {isSelected && (
                                  <div className="mt-3 grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Unit Type</label>
                                      <select
                                        value={existingTool?.unit || 'hourly'}
                                        onChange={(e) => {
                                          setFormData({
                                            ...formData,
                                            tools: formData.tools.map(tl =>
                                              tl.tool_id === toolId ? { ...tl, unit: e.target.value } : tl
                                            )
                                          });
                                        }}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white font-medium text-sm"
                                      >
                                        {UNITS.filter(u => u.value !== 'no_charge').map(unit => (
                                          <option key={unit.value} value={unit.value}>{unit.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                    
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Rate</label>
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">$</span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={existingTool?.rate || ''}
                                          onChange={(e) => {
                                            setFormData({
                                              ...formData,
                                              tools: formData.tools.map(tl =>
                                                tl.tool_id === toolId ? { ...tl, rate: parseFloat(e.target.value) || 0 } : tl
                                              )
                                            });
                                          }}
                                          className="w-full pl-8 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] font-bold text-[#3f72af] text-sm"
                                          placeholder="0.00"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {formData.tools.length > 0 && (
                    <div className="mx-6 mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                      <p className="text-sm font-semibold text-gray-900 mb-2">{formData.tools.length} Tool(s) Selected</p>
                      <div className="space-y-1">
                        {formData.tools.map((tl, index) => {
                          const toolItem = tools.find((t: any) => (t.id || t._id) === tl.tool_id);
                          return (
                            <div key={index} className="text-xs text-gray-700 flex items-center justify-between">
                              <span>• {toolItem?.name || 'Unknown'}</span>
                              <span className="font-bold text-[#3f72af]">${tl.rate.toFixed(2)}/{tl.unit.replace('_', ' ')}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>


                {/* Consumables Selection Card */}
                <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 backdrop-blur-sm overflow-hidden">
                  {/* Header with Gradient */}
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center">
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Consumables
                      </h3>
                      <p className="text-sm text-orange-100 mt-1">Link consumables needed for this service</p>
                    </div>
                    
                    {/* Requires Consumables Toggle */}
                    <label className="flex items-center cursor-pointer group">
                      <span className="mr-3 text-sm font-semibold text-white">Required</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.requires_consumables}
                          onChange={(e) => setFormData({ ...formData, requires_consumables: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-white/30 rounded-full peer peer-checked:bg-yellow-300 transition-all duration-300 shadow-inner"></div>
                        <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-7 shadow-md"></div>
                      </div>
                    </label>
                  </div>
                  
                  <div className="p-6">
                  {formData.requires_consumables ? (
                    <>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {consumables.length === 0 ? (
                          <div className="text-center py-6 bg-gray-50 rounded-xl">
                            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No consumables available</p>
                          </div>
                        ) : (
                          consumables.map((item: any) => (
                            <label
                              key={item.id || item._id}
                              className="flex items-center gap-3 p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-yellow-200"
                            >
                              <input
                                type="checkbox"
                                checked={formData.consumable_ids.includes(item.id || item._id)}
                                onChange={(e) => {
                                  const consumableId = item.id || item._id;
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      consumable_ids: [...formData.consumable_ids, consumableId]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      consumable_ids: formData.consumable_ids.filter(id => id !== consumableId)
                                    });
                                  }
                                }}
                                className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-2 focus:ring-yellow-500 cursor-pointer"
                              />
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{item.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-600">{item.unit}</span>
                                  {item.current_stock !== undefined && (
                                    <span className={`text-xs font-medium ${
                                      item.current_stock > (item.reorder_level || 0) 
                                        ? 'text-green-600' 
                                        : 'text-red-600'
                                    }`}>
                                      Stock: {item.current_stock}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">This service does not require consumables</p>
                      <p className="text-xs text-gray-400 mt-1">Enable the toggle above to select consumables</p>
                    </div>
                  )}
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