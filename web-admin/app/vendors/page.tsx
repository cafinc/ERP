'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  Users,
  Plus,
  Search,
  Building,
  Phone,
  Mail,
  DollarSign,
  FileText,
  TrendingUp,
  RefreshCw,
  Edit,
  Eye
} from 'lucide-react';

interface Vendor {
  _id: string;
  vendor_name: string;
  vendor_code: string;
  vendor_type: string;
  primary_contact: {
    name: string;
    email: string;
    phone: string;
  };
  payment_terms: string;
  status: string;
  created_at: string;
}

export default function VendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');

  useEffect(() => {
    fetchVendors();
  }, [typeFilter, statusFilter]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (typeFilter && typeFilter !== 'all') {
        params.append('vendor_type', typeFilter);
      }
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status_filter', statusFilter);
      }
      
      const response = await api.get(`/api/vendors?${params.toString()}`);
      
      if (response.data.success) {
        setVendors(response.data.vendors);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.vendor_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.primary_contact.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getVendorTypeBadge = (type: string) => {
    const config = {
      supplier: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Supplier' },
      subcontractor: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Subcontractor' },
      service_provider: { bg: 'bg-green-100', text: 'text-green-700', label: 'Service Provider' }
    };

    const typeConfig = config[type as keyof typeof config] || config.supplier;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig.bg} ${typeConfig.text}`}>
        {typeConfig.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        Inactive
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Vendors"
        subtitle="Manage vendor relationships"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Vendors" }
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Vendors</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{vendors.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Suppliers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {vendors.filter(v => v.vendor_type === 'supplier').length}
                </p>
              </div>
              <Building className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Subcontractors</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {vendors.filter(v => v.vendor_type === 'subcontractor').length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Vendors</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {vendors.filter(v => v.status === 'active').length}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search vendors by name, code, or contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="supplier">Suppliers</option>
                <option value="subcontractor">Subcontractors</option>
                <option value="service_provider">Service Providers</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <button
                onClick={() => router.push('/vendors/create')}
                className="flex items-center gap-2 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Vendor
              </button>

              <button
                onClick={fetchVendors}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Terms
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
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p>No vendors found</p>
                      <button
                        onClick={() => router.push('/vendors/create')}
                        className="mt-4 text-[#3f72af] hover:text-[#2c5282] font-medium"
                      >
                        Create your first vendor
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => (
                    <tr key={vendor._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {vendor.vendor_name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{vendor.vendor_name}</div>
                            <div className="text-xs text-gray-500">{vendor.vendor_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getVendorTypeBadge(vendor.vendor_type)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{vendor.primary_contact.name}</div>
                        <div className="flex items-center gap-4 mt-1">
                          {vendor.primary_contact.email && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Mail className="w-3 h-3" />
                              {vendor.primary_contact.email}
                            </div>
                          )}
                          {vendor.primary_contact.phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Phone className="w-3 h-3" />
                              {vendor.primary_contact.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.payment_terms}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(vendor.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => router.push(`/vendors/${vendor._id}`)}
                            className="text-[#3f72af] hover:text-[#2c5282]"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => router.push(`/vendors/${vendor._id}/edit`)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
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

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/finance/bills')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <FileText className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Vendor Bills</h3>
            <p className="text-sm text-gray-600">View all vendor bills and payments</p>
          </button>

          <button
            onClick={() => router.push('/purchase-orders')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <DollarSign className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Purchase Orders</h3>
            <p className="text-sm text-gray-600">Manage vendor purchase orders</p>
          </button>

          <button
            onClick={() => router.push('/vendors/performance')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Vendor Performance</h3>
            <p className="text-sm text-gray-600">Analyze vendor metrics and trends</p>
          </button>
        </div>
      </div>
    </div>
  );
}
