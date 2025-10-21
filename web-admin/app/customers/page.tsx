'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import CompactHeader from '@/components/CompactHeader';
import api from '@/lib/api';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Users,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  FileText,
  DollarSign,
  Briefcase,
} from 'lucide-react';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  customer_type?: 'individual' | 'company';
  company_name?: string;
  company_id?: string;
  contact_ids?: string[];
  notes?: string;
  active: boolean;
  created_at: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [filterType, setFilterType] = useState('all'); // 'all', 'individual', 'company'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // View toggle - default to grid

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/customers');
      const customerData = Array.isArray(response.data) ? response.data : (response.data?.customers || []);
      // Ensure each customer has a valid _id
      const validCustomers = customerData.filter((c: any) => c._id || c.id);
      setCustomers(validCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterActive === 'all' || 
      (filterActive === 'active' && customer.active) ||
      (filterActive === 'inactive' && !customer.active);
    
    const matchesType =
      filterType === 'all' ||
      (filterType === 'individual' && (!customer.customer_type || customer.customer_type === 'individual')) ||
      (filterType === 'company' && customer.customer_type === 'company');
    
    return matchesSearch && matchesFilter && matchesType;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        {/* Compact Header */}
        <CompactHeader
          title="Customers"
          icon={Users}
          badges={[
            { label: `${customers.length} Total`, color: 'blue' },
            { label: `${customers.filter(c => c.active).length} Active`, color: 'green' },
          ]}
          actions={[
            {
              label: 'New Customer',
              icon: Plus,
              onClick: () => router.push('/customers/create'),
              variant: 'primary',
            },
          ]}
        />

        {/* Filter Buttons */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-wrap gap-2">
              <button
                onClick={() => setFilterActive('all')}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  filterActive === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
                }`}
              >
                All ({customers.length})
              </button>
              <button
                onClick={() => setFilterActive('active')}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  filterActive === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
                }`}
              >
                Active ({customers.filter(c => c.active).length})
              </button>
              <button
                onClick={() => setFilterActive('inactive')}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  filterActive === 'inactive'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
                }`}
              >
                Inactive ({customers.filter(c => !c.active).length})
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setFilterType('individual')}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  filterType === 'individual'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
                }`}
              >
                Individual ({customers.filter(c => c.customer_type === 'individual').length})
              </button>
              <button
                onClick={() => setFilterType('company')}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  filterType === 'company'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
                }`}
              >
                Company ({customers.filter(c => c.customer_type === 'company').length})
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="List View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Grid View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Stats - Removed, moved to header badges */}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 mb-4 mx-6 mt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone, address, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              onClick={loadCustomers}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-100 transition-all text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Customers Display */}
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center mx-6">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Customers Found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterActive !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Get started by adding your first customer'}
            </p>
            {!searchQuery && filterActive === 'all' && (
              <button
                onClick={() => router.push('/customers/create')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-600/90 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add First Customer</span>
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View with Pictures */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mx-6">
            {filteredCustomers.map((customer, index) => {
              const customerId = customer._id || customer.id;
              if (!customerId) return null;
              
              // Generate avatar from initials
              const initials = customer.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();
              
              const avatarColors = [
                'bg-blue-500',
                'bg-green-500',
                'bg-purple-500',
                'bg-orange-500',
                'bg-pink-500',
                'bg-indigo-500',
              ];
              const avatarColor = avatarColors[index % avatarColors.length];
              
              return (
                <div
                  key={customerId}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer overflow-hidden"
                  onClick={() => router.push(`/customers/${customerId}`)}
                >
                  {/* Card Header with Avatar */}
                  <div className="relative h-24 bg-gradient-to-br from-[#3f72af] to-[#2c5282]">
                    <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                      <div className={`${avatarColor} w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg`}>
                        {initials}
                      </div>
                    </div>
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        customer.active 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-400 text-white'
                      }`}>
                        {customer.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="pt-12 px-4 pb-4 text-center">
                    {/* Name */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                      {customer.name}
                    </h3>
                    
                    {/* Type Badge */}
                    <div className="flex items-center justify-center gap-1 mb-3">
                      {customer.customer_type === 'company' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <Briefcase className="w-3 h-3 mr-1" />
                          Company
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          <Users className="w-3 h-3 mr-1" />
                          Individual
                        </span>
                      )}
                    </div>

                    {/* Company Link for Individuals */}
                    {customer.company_name && customer.customer_type !== 'company' && (
                      <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-center text-xs text-blue-700">
                          <Briefcase className="w-3 h-3 mr-1" />
                          <span className="truncate">{customer.company_name}</span>
                        </div>
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="space-y-2 text-left border-t border-gray-100 pt-3">
                      <div className="flex items-center text-xs text-gray-600">
                        <Mail className="w-3 h-3 mr-2 flex-shrink-0 text-gray-400" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <Phone className="w-3 h-3 mr-2 flex-shrink-0 text-gray-400" />
                        <span>{customer.phone}</span>
                      </div>
                      <div className="flex items-start text-xs text-gray-600">
                        <MapPin className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                        <span className="line-clamp-1">{customer.address}</span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/customers/${customerId}`);
                        }}
                        className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-[#2c5282] text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/customers/${customerId}/edit`);
                        }}
                        className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-100 transition-all text-gray-700 text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="mx-6 space-y-3">
            {filteredCustomers.map((customer, index) => {
              const customerId = customer._id || customer.id;
              if (!customerId) return null;
              
              // Generate avatar from initials
              const initials = customer.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();
              
              const avatarColors = [
                'bg-blue-500',
                'bg-green-500',
                'bg-purple-500',
                'bg-orange-500',
                'bg-pink-500',
                'bg-indigo-500',
              ];
              const avatarColor = avatarColors[index % avatarColors.length];
              
              return (
                <div
                  key={customerId}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-500 transition-all cursor-pointer p-4"
                  onClick={() => router.push(`/customers/${customerId}`)}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`${avatarColor} w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0`}>
                      {initials}
                    </div>

                    {/* Customer Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {customer.name}
                        </h3>
                        {customer.customer_type === 'company' ? (
                          <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        ) : (
                          <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          customer.active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {customer.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{customer.phone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      </div>

                      {customer.company_name && customer.customer_type !== 'company' && (
                        <div className="mt-2 inline-flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          <Briefcase className="w-3 h-3 mr-1" />
                          {customer.company_name}
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/customers/${customerId}`);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-[#2c5282] text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/customers/${customerId}/edit`);
                        }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-100 transition-all text-gray-700 text-sm rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
