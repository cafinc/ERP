'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';
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
} from 'lucide-react';

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
      <HybridNavigationTopBar>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </HybridNavigationTopBar>
    );
  }

  return (
    <HybridNavigationTopBar>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        {/* Compact Header */}
        <CompactHeader
          title="Services"
          icon={Package}
          badges={[
            { label: `${services.length} Total`, color: 'blue' },
            { label: `${services.filter(s => s.active).length} Active`, color: 'green' },
          ]}
          actions={[
            {
              label: 'Add Service',
              icon: Plus,
              onClick: () => router.push('/services/create'),
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
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              All Types ({services.length})
            </button>
            <button
              onClick={() => setFilterType('plowing')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'plowing'
                  ? 'bg-blue-600 text-white'
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
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 mb-4 mx-6 mt-6">
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center mx-6">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Services Found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your search or filters' 
                : 'Get started by adding your first service'}
            </p>
            {!searchQuery && filterType === 'all' && (
              <button
                onClick={() => router.push('/services/create')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-600/90 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add First Service</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-6">
            {filteredServices.map((service, index) => (
              <div
                key={service.id || `service-${index}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
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
                    className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-3">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
                <p className="text-sm text-gray-600">Total Services</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
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

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
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
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
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
                    <tr key={service.id} className="hover:bg-gray-50">
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
                            className="text-blue-600 hover:text-blue-800"
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
      </div>
    </HybridNavigationTopBar>
  );
}