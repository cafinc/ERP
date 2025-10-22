'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
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
  Download,
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
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    email: true,
    phone: true,
    address: true,
    type: true,
    status: true,
    created: true,
    actions: true,
  });

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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PageHeader
          title="Customers"
          subtitle="Manage your customer database"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "CRM", href: "/crm/dashboard" },
            { label: "Customers" },
          ]}
        />
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Customers"
        subtitle="Manage your customer database and contacts"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "CRM", href: "/crm/dashboard" },
          { label: "Customers" },
        ]}
        actions={[
          {
            label: "Export",
            icon: <Download className="w-4 h-4 mr-2" />,
            variant: "secondary",
            onClick: () => alert("Export functionality"),
          },
          {
            label: "New Customer",
            icon: <Plus className="w-4 h-4 mr-2" />,
            variant: "secondary",
            onClick: () => router.push('/customers/create'),
          },
        ]}
        tabs={[
          { label: "All", value: "all", count: customers.length },
          { label: "Active", value: "active", count: customers.filter(c => c.active).length },
          { label: "Inactive", value: "inactive", count: customers.filter(c => !c.active).length },
          { label: "Individual", value: "individual", count: customers.filter(c => c.customer_type === 'individual').length },
          { label: "Company", value: "company", count: customers.filter(c => c.customer_type === 'company').length },
        ]}
        activeTab={filterActive}
        onTabChange={(value) => {
          setFilterActive(value);
          // Reset type filter when switching to type-specific tabs
          if (value === 'individual' || value === 'company') {
            setFilterType(value);
          } else {
            setFilterType('all');
          }
        }}
        showSearch={true}
        searchPlaceholder="Search customers..."
        onSearch={setSearchQuery}
        showFilter={true}
        onFilterClick={() => alert("Filter options")}
        showViewToggle={true}
        viewMode={viewMode}
        onViewChange={setViewMode}
        customTabsRight={
          viewMode === 'list' ? (
            <div className="relative ml-auto">
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Columns
              </button>
              
              {showColumnSelector && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-3">
                    <div className="text-sm font-semibold text-gray-900 mb-3">Show/Hide Columns</div>
                    <div className="space-y-2">
                      {Object.entries({
                        name: 'Name',
                        email: 'Email',
                        phone: 'Phone',
                        address: 'Address',
                        type: 'Type',
                        status: 'Status',
                        created: 'Created Date',
                      }).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={visibleColumns[key as keyof typeof visibleColumns]}
                            onChange={(e) => setVisibleColumns({
                              ...visibleColumns,
                              [key]: e.target.checked
                            })}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                      <button
                        onClick={() => {
                          setVisibleColumns({
                            name: true,
                            email: true,
                            phone: true,
                            address: true,
                            type: true,
                            status: true,
                            created: true,
                            actions: true,
                          });
                        }}
                        className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        Show All
                      </button>
                      <button
                        onClick={() => setShowColumnSelector(false)}
                        className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="p-6">
        {/* List View Header/Legend */}
        {viewMode === 'list' && filteredCustomers.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-t-lg px-6 py-3">
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {visibleColumns.name && <div className="col-span-2">Name</div>}
              {visibleColumns.address && <div className="col-span-3">Address</div>}
              {visibleColumns.phone && <div className="col-span-2">Phone</div>}
              {visibleColumns.email && <div className="col-span-3">Email</div>}
              {visibleColumns.type && <div className="col-span-1">Type</div>}
              {visibleColumns.status && <div className="col-span-1">Status</div>}
            </div>
          </div>
        )}
        
        {/* Customers Display */}
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center mx-6">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Customers Found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterActive !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Get started by adding your first customer'}
            </p>
            {!searchQuery && filterActive === 'all' && (
              <button
                onClick={() => router.push('/customers/create')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
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
                'bg-[#5b8ec4]',
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
                        className="flex-1 px-3 py-1.5 bg-[#3f72af] hover:bg-[#2c5282] text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
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
                'bg-[#5b8ec4]',
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
                          <Briefcase className="w-4 h-4 text-[#3f72af] flex-shrink-0" />
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
                        <div className="mt-2 inline-flex items-center text-xs text-[#3f72af] bg-blue-50 px-2 py-1 rounded">
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
                        className="px-4 py-2 bg-[#3f72af] hover:bg-[#2c5282] text-white text-sm rounded-lg transition-colors flex items-center gap-1"
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
    </div>
  );
}
