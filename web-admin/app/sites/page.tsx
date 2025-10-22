'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';
import api from '@/lib/api';
import {
  Plus,
  Search,
  MapPin,
  User,
  Calendar,
  RefreshCw,
  Eye,
  SquareArrowOutUpRight,
  Building,
  Archive,
  Edit,
} from 'lucide-react';

interface Site {
  id: string;
  customer_id: string;
  name: string;
  site_reference?: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  site_type: string;
  area_size?: number;
  services?: any[];
  active: boolean;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
}

export default function SitesPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterActive, setFilterActive] = useState('active');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sitesResponse, customersResponse] = await Promise.all([
        api.get('/sites'),
        api.get('/customers')
      ]);
      setSites(sitesResponse.data || []);
      setCustomers(customersResponse.data.customers || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  const getSiteTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'parking_lot': 'Parking Lot',
      'driveway': 'Driveway',
      'sidewalk': 'Sidewalk',
      'roadway': 'Roadway',
      'loading_dock': 'Loading Dock',
      'other': 'Other'
    };
    return typeMap[type] || type;
  };

  const filteredSites = sites.filter(site => {
    const matchesSearch = 
      site.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.site_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.location?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getCustomerName(site.customer_id)?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCustomer = filterCustomer === 'all' || site.customer_id === filterCustomer;
    const matchesType = filterType === 'all' || site.site_type === filterType;
    const matchesActive = filterActive === 'all' || 
      (filterActive === 'active' && site.active) ||
      (filterActive === 'archived' && !site.active);
    
    return matchesSearch && matchesCustomer && matchesType && matchesActive;
  });

  const handleCreateSite = () => {
    router.push('/sites/create');
  };

  const handleViewSite = (id: string) => {
    router.push(`/sites/${id}`);
  };

  const handleViewOnMap = (site: Site) => {
    if (site.location?.latitude && site.location?.longitude) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${site.location.latitude},${site.location.longitude}`,
        '_blank'
      );
    }
  };

  if (loading) {
    return (
      <HybridNavigationTopBar>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </HybridNavigationTopBar>
    );
  }

  return (
    <HybridNavigationTopBar>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        {/* Compact Header */}
        <CompactHeader
          title="Sites"
          icon={MapPin}
          badges={[
            { label: `${sites.length} Total`, color: 'blue' },
            { label: `${sites.filter(s => s.active).length} Active`, color: 'green' },
            { label: `${sites.filter(s => !s.active).length} Archived`, color: 'gray' },
          ]}
          actions={[
            {
              label: 'Add Site',
              icon: Plus,
              onClick: handleCreateSite,
              variant: 'primary',
            },
          ]}
        />

        {/* Filter Buttons */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => setFilterActive('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterActive === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Active ({sites.filter(s => s.active).length})
            </button>
            <button
              onClick={() => setFilterActive('archived')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterActive === 'archived'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Archived ({sites.filter(s => !s.active).length})
            </button>
            <button
              onClick={() => setFilterActive('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterActive === 'all'
                  ? 'bg-[#3f72af] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              All ({sites.length})
            </button>
          </div>
        </div>

        {/* Search Bar with Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 mb-4 mx-6 mt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search sites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="parking_lot">Parking Lot</option>
              <option value="driveway">Driveway</option>
              <option value="sidewalk">Sidewalk</option>
              <option value="roadway">Roadway</option>
              <option value="loading_dock">Loading Dock</option>
              <option value="other">Other</option>
            </select>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-100 transition-all text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Sites Grid */}
        {filteredSites.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center mx-6">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sites Found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterType !== 'all' || filterActive !== 'active'
                ? 'Try adjusting your search or filters' 
                : 'Get started by adding your first site'}
            </p>
            {!searchQuery && filterType === 'all' && filterActive === 'active' && (
              <button
                onClick={handleCreateSite}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add First Site</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-6">
            {filteredSites.map((site, index) => (
              <div
                key={site.id || `site-${index}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{site.name}</h3>
                    <p className="text-sm text-gray-600">{site.type}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    site.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {site.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Address:</span>
                    <span className="text-gray-900 font-medium text-right">{site.address}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Customer:</span>
                    <span className="text-gray-900 font-medium">{site.customer_name}</span>
                  </div>
                  {site.size && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Size:</span>
                      <span className="text-gray-900 font-medium">{site.size} sq ft</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button 
                    onClick={() => router.push(`/sites/${site.id}`)}
                    className="flex-1 px-3 py-1.5 text-sm bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282]"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => router.push(`/sites/${site.id}/edit`)}
                    className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-3">
                <MapPin className="w-6 h-6 text-[#3f72af]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {sites.length}
                </p>
                <p className="text-sm text-gray-600">Total Sites</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-3">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {sites.filter(s => s.active).length}
                </p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-lg p-3">
                <Building className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(sites.map(s => s.customer_id)).size}
                </p>
                <p className="text-sm text-gray-600">Customers</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 rounded-lg p-3">
                <Archive className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {sites.filter(s => !s.active).length}
                </p>
                <p className="text-sm text-gray-600">Archived</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sites Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Area
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
                {filteredSites.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No sites found</p>
                      <p className="text-sm">Create your first site to get started</p>
                    </td>
                  </tr>
                ) : (
                  filteredSites.map((site) => (
                    <tr key={site.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewSite(site.id)}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {site.name}
                          </div>
                          {site.site_reference && (
                            <div className="text-sm text-gray-500">
                              Ref: {site.site_reference}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {getCustomerName(site.customer_id)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 max-w-xs truncate">
                            {site.location?.address || 'No address'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">
                          {getSiteTypeLabel(site.site_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">
                          {site.area_size ? `${site.area_size.toLocaleString()} sq ft` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          site.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {site.active ? 'Active' : 'Archived'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewSite(site.id);
                            }}
                            className="text-[#3f72af] hover:text-blue-800 text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewOnMap(site);
                            }}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            <SquareArrowOutUpRight className="w-4 h-4" />
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
