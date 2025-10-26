'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import CustomerQuickViewModal from '@/components/CustomerQuickViewModal';
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
  LayoutGrid,
  List,
  Filter,
  Home,
  Factory,
  ShoppingBag,
  Truck,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  Download,
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Bulk Operations State
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [bulkActionType, setBulkActionType] = useState<'delete' | 'archive' | null>(null);
  
  // Quick View State
  const [quickViewSite, setQuickViewSite] = useState<Site | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

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

  // Bulk Operations Functions
  const toggleSelectSite = (siteId: string) => {
    setSelectedSites(prev => 
      prev.includes(siteId) 
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSites.length === filteredSites.length) {
      setSelectedSites([]);
    } else {
      setSelectedSites(filteredSites.map(s => s.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedSites.length} site(s)?`)) {
      return;
    }

    try {
      await Promise.all(selectedSites.map(id => api.delete(`/sites/${id}`)));
      alert('Sites deleted successfully!');
      setSelectedSites([]);
      setBulkActionType(null);
      loadData();
    } catch (error) {
      console.error('Error deleting sites:', error);
      alert('Failed to delete sites. Please try again.');
    }
  };

  const handleBulkArchive = async (archive: boolean) => {
    try {
      await Promise.all(selectedSites.map(id => 
        api.put(`/sites/${id}`, { active: !archive })
      ));
      alert(`Sites ${archive ? 'archived' : 'unarchived'} successfully!`);
      setSelectedSites([]);
      setBulkActionType(null);
      loadData();
    } catch (error) {
      console.error('Error updating sites:', error);
      alert('Failed to update sites. Please try again.');
    }
  };

  // Export Functions
  const exportToCSV = () => {
    const headers = ['Site Name', 'Address', 'Customer', 'Type', 'Status', 'Created Date'];
    const rows = filteredSites.map(site => [
      site.name,
      site.location?.address || '',
      getCustomerName(site.customer_id),
      getSiteTypeLabel(site.site_type),
      site.active ? 'Active' : 'Archived',
      new Date(site.created_at).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sites_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Quick View Functions
  const handleQuickView = (site: Site) => {
    setQuickViewSite(site);
    setShowQuickView(true);
  };

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
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      );
  }

  return (
    <>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
        <PageHeader
          title="Sites"
          subtitle="Manage service locations and properties"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dispatch", href: "/dispatch" }, { label: "Sites" }]}
          actions={[
            {
              label: 'Export',
              icon: <Download className="w-4 h-4 mr-2" />,
              onClick: exportToCSV,
              variant: 'secondary',
            },
            {
              label: 'Add Site',
              icon: <Plus className="w-4 h-4 mr-2" />,
              onClick: handleCreateSite,
              variant: 'primary',
            },
          ]}
          stats={[
            {
              label: 'Total Sites',
              value: sites.length,
              icon: <MapPin className="w-4 h-4" />,
              color: 'blue',
              onClick: () => setFilterActive('all')
            },
            {
              label: 'Active',
              value: sites.filter(s => s.active).length,
              icon: <MapPin className="w-4 h-4" />,
              color: 'green',
              onClick: () => setFilterActive('active')
            },
            {
              label: 'Customers',
              value: new Set(sites.map(s => s.customer_id)).size,
              icon: <Building className="w-4 h-4" />,
              color: 'purple'
            },
            {
              label: 'Archived',
              value: sites.filter(s => !s.active).length,
              icon: <Archive className="w-4 h-4" />,
              color: 'orange',
              onClick: () => setFilterActive('archived')
            }
          ]}
          secondaryTabs={[
            { label: "All Types", value: "all", count: sites.length },
            { label: "🏠 Residential", value: "residential", count: sites.filter(s => s.site_type === 'residential').length },
            { label: "🏢 Commercial", value: "commercial", count: sites.filter(s => s.site_type === 'commercial').length },
            { label: "🏭 Industrial", value: "industrial", count: sites.filter(s => s.site_type === 'industrial').length },
            { label: "🛍️ Retail", value: "retail", count: sites.filter(s => s.site_type === 'retail').length },
            { label: "🚨 Emergency", value: "emergency_services", count: sites.filter(s => s.site_type === 'emergency_services').length },
          ]}
          activeSecondaryTab={filterType}
          onSecondaryTabChange={(value) => setFilterType(value)}
          showSearch={true}
          searchPlaceholder="Search sites by name, address, or customer..."
          onSearch={setSearchQuery}
          showFilter={true}
          onFilterClick={() => setShowFilterDropdown(!showFilterDropdown)}
          filterDropdown={showFilterDropdown ? (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-4">
                <div className="text-sm font-semibold text-gray-900 mb-3">Advanced Filters</div>
                
                {/* Site Type Filter */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Site Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="residential">🏠 Residential</option>
                    <option value="commercial">🏢 Commercial</option>
                    <option value="industrial">🏭 Industrial</option>
                    <option value="retail">🛍️ Retail</option>
                    <option value="emergency_services">🚨 Emergency Services</option>
                  </select>
                </div>

                {/* Customer Filter */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Customer</label>
                  <select
                    value={filterCustomer}
                    onChange={(e) => setFilterCustomer(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white text-sm"
                  >
                    <option value="all">All Customers</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
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
                      setFilterType('all');
                      setFilterCustomer('all');
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

        {/* Bulk Actions Bar */}
        {selectedSites.length > 0 && (
          <div className="mx-6 mt-4 bg-blue-500 text-white rounded-xl shadow-lg p-4 flex items-center justify-between animate-slideUp">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-lg">
                {selectedSites.length} site{selectedSites.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={toggleSelectAll}
                className="text-sm underline hover:text-blue-100 transition-colors"
              >
                {selectedSites.length === filteredSites.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkArchive(true)}
                className="px-4 py-2 bg-white text-blue-500 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
              <button
                onClick={() => setBulkActionType('delete')}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={() => setSelectedSites([])}
                className="p-2 hover:bg-blue-600 rounded-lg transition-colors"
                title="Clear selection"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Sites Content */}
        <div className="mx-6 mt-6">
          {filteredSites.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center hover:shadow-md transition-shadow">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sites Found</h3>
              <p className="text-gray-600 mb-4">
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
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{filteredSites.map((site, index) => (
              <div
                key={site.id || `site-${index}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer relative"
              >
                {/* Checkbox for bulk selection */}
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={selectedSites.includes(site.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelectSite(site.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                
                {/* Card Content - wrapped in div with onClick */}
                <div onClick={() => handleQuickView(site)} className="pl-6">
                {/* Header - Site Name and Status */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{site.name || 'Unnamed Site'}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    site.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {site.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Address */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{site.location?.address || 'No address provided'}</span>
                  </p>
                </div>

                {/* Tags - Customer and Service Type */}
                <div className="flex flex-wrap gap-2">
                  {/* Customer Tag */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                    <Building className="w-3 h-3" />
                    {getCustomerName(site.customer_id)}
                  </span>
                  
                  {/* Site Type Tag */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                    {site.site_type === 'residential' && '🏠'}
                    {site.site_type === 'commercial' && '🏢'}
                    {site.site_type === 'industrial' && '🏭'}
                    {site.site_type === 'retail' && '🛍️'}
                    {site.site_type === 'emergency_services' && '🚨'}
                    {getSiteTypeLabel(site.site_type)}
                  </span>
                  
                  {/* Map Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewOnMap(site);
                    }}
                    className="ml-auto px-2.5 py-1 text-xs bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 inline-flex items-center gap-1"
                    title="View on Map"
                  >
                    <MapPin className="w-3 h-3" />
                    Map
                  </button>
                </div>
                </div>
              </div>
            ))}
          </div>
          ) : (
            /* List View - Table */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={selectedSites.length === filteredSites.length && filteredSites.length > 0}
                          onChange={toggleSelectAll}
                          className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Site Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
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
                    {filteredSites.map((site) => (
                      <tr key={site.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedSites.includes(site.id)}
                            onChange={() => toggleSelectSite(site.id)}
                            className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{site.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{site.location?.address || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{customers.find(c => c.id === site.customer_id)?.name || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded capitalize">
                            {site.site_type?.replace(/_/g, ' ') || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {site.active ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                              Archived
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleQuickView(site)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Quick View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/sites/${site.id}/edit`)}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="Edit site"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Customer Quick View Modal */}
      {selectedCustomerId && (
        <CustomerQuickViewModal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
    );
}
