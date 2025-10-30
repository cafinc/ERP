'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import { formatPhoneNumber } from '@/lib/utils/formatters';
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
  Trash2,
  X,
  Archive,
  CheckCircle,
  XCircle,
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
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
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
  
  // Bulk Operations State
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'delete' | 'archive' | null>(null);
  
  // Quick View State
  const [quickViewCustomer, setQuickViewCustomer] = useState<Customer | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);

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
    // Search filter
    const matchesSearch = 
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter (Active/Inactive)
    const matchesStatus = 
      filterActive === 'all' || 
      (filterActive === 'active' && customer.active) ||
      (filterActive === 'inactive' && !customer.active);
    
    // Type filter (Individual/Company)
    const matchesType =
      filterType === 'all' ||
      (filterType === 'individual' && (!customer.customer_type || customer.customer_type === 'individual')) ||
      (filterType === 'company' && customer.customer_type === 'company');
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Bulk Operations Functions
  const toggleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c._id || c.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCustomers.length} customer(s)?`)) {
      return;
    }

    try {
      await Promise.all(selectedCustomers.map(id => api.delete(`/customers/${id}`)));
      alert('Customers deleted successfully!');
      setSelectedCustomers([]);
      setBulkActionType(null);
      loadCustomers();
    } catch (error) {
      console.error('Error deleting customers:', error);
      alert('Failed to delete customers. Please try again.');
    }
  };

  const handleBulkArchive = async (archive: boolean) => {
    try {
      await Promise.all(selectedCustomers.map(id => 
        api.put(`/customers/${id}`, { active: !archive })
      ));
      alert(`Customers ${archive ? 'archived' : 'unarchived'} successfully!`);
      setSelectedCustomers([]);
      setBulkActionType(null);
      loadCustomers();
    } catch (error) {
      console.error('Error updating customers:', error);
      alert('Failed to update customers. Please try again.');
    }
  };

  // Export Functions
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Address', 'Type', 'Status', 'Created Date'];
    const rows = filteredCustomers.map(customer => [
      customer.name,
      customer.email,
      customer.phone,
      customer.address,
      customer.customer_type || 'individual',
      customer.active ? 'Active' : 'Inactive',
      new Date(customer.created_at).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Quick View Functions
  const handleQuickView = (customer: Customer) => {
    setQuickViewCustomer(customer);
    setShowQuickView(true);
  };

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
        </div></div>
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
            onClick: exportToCSV,
          },
          {
            label: "New Customer",
            icon: <Plus className="w-4 h-4 mr-2" />,
            variant: "secondary",
            href: '/customers/create',
          },
        ]}
        tabs={[
          { label: "All", value: "all", count: customers.length },
          { label: "Active", value: "active", count: customers.filter(c => c.active).length },
          { label: "Inactive", value: "inactive", count: customers.filter(c => !c.active).length },
          { label: "Individual", value: "individual", count: customers.filter(c => !c.customer_type || c.customer_type === 'individual').length },
          { label: "Company", value: "company", count: customers.filter(c => c.customer_type === 'company').length },
        ]}
        activeTab={filterType === 'individual' || filterType === 'company' ? filterType : filterActive}
        onTabChange={(value) => {
          if (value === 'individual' || value === 'company') {
            setFilterType(value);
            setFilterActive('all');
          } else {
            setFilterActive(value);
            setFilterType('all');
          }
        }}
        showSearch={true}
        searchPlaceholder="Search customers..."
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
                    <span className="text-sm text-gray-700">All</span>
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
                </div></div>

              {/* Type Filter */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-700 mb-2 block">Type</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="radio"
                      name="type"
                      checked={filterType === 'all'}
                      onChange={() => setFilterType('all')}
                      className="text-[#3f72af] focus:ring-[#3f72af]"
                    />
                    <span className="text-sm text-gray-700">All Types</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="radio"
                      name="type"
                      checked={filterType === 'individual'}
                      onChange={() => setFilterType('individual')}
                      className="text-[#3f72af] focus:ring-[#3f72af]"
                    />
                    <span className="text-sm text-gray-700">Individual</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="radio"
                      name="type"
                      checked={filterType === 'company'}
                      onChange={() => setFilterType('company')}
                      className="text-[#3f72af] focus:ring-[#3f72af]"
                    />
                    <span className="text-sm text-gray-700">Company</span>
                  </label>
                </div></div>

              <div className="pt-3 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => {
                    setFilterActive('all');
                    setFilterType('all');
                  }}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilterDropdown(false)}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-[#3f72af] rounded hover:bg-[#2c5282]"
                >
                  Apply
                </button></div></div></div>
        ) : undefined}
        showViewToggle={true}
        viewMode={viewMode}
        onViewChange={setViewMode}
        customTabsRight={
          viewMode === 'list' ? (
            <div className="relative ml-auto">
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="px-4 py-2 text-sm font-medium text-white bg-[#3f72af] border border-[#3f72af] rounded-lg hover:bg-[#2c5282] inline-flex items-center"
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
                      </button></div></div></div>
              )}
            </div>
          ) : undefined
        }
      />

      {/* Bulk Actions Bar */}
      {selectedCustomers.length > 0 && (
        <div className="mx-6 mt-4 bg-blue-500 text-white rounded-xl shadow-lg p-4 flex items-center justify-between animate-slideUp">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-lg">
              {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={toggleSelectAll}
              className="text-sm underline hover:text-blue-100 transition-colors"
            >
              {selectedCustomers.length === filteredCustomers.length ? 'Deselect All' : 'Select All'}
            </button></div>
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
              onClick={() => setSelectedCustomers([])}
              className="p-2 hover:bg-blue-600 rounded-lg transition-colors"
              title="Clear selection"
            >
              <X className="w-5 h-5" />
            </button></div></div>
      )}

      <div className="p-6">
        {/* List View Header/Legend */}
        {viewMode === 'list' && filteredCustomers.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-t-lg px-6 py-3">
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {visibleColumns.status && <div className="col-span-1">Status</div>}
              {visibleColumns.name && <div className="col-span-2">Name</div>}
              {visibleColumns.address && <div className="col-span-2">Address</div>}
              {visibleColumns.phone && <div className="col-span-2">Phone</div>}
              {visibleColumns.email && <div className="col-span-2">Email</div>}
              {visibleColumns.type && <div className="col-span-1">Type</div>}
              <div className="col-span-2">Action</div></div></div>
        )}
        
        {/* Customers Display */}
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-12 text-center mx-6 hover:shadow-md transition-shadow">
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
                  className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer overflow-hidden hover:shadow-md transition-shadow relative"
                >
                  {/* Checkbox for bulk selection */}
                  <div className="absolute top-3 left-3 z-10">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customerId)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelectCustomer(customerId);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  
                  {/* Card Content - wrapped in div with onClick */}
                  <div onClick={() => handleQuickView(customer)}>
                  {/* Card Header with Avatar */}
                  <div className="relative h-24 bg-gradient-to-br from-[#3f72af] to-[#2c5282]">
                    <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                      <div className={`${avatarColor} w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg`}>
                        {initials}
                      </div></div>
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        customer.active 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-400 text-white'
                      }`}>
                        {customer.active ? 'Active' : 'Inactive'}
                      </span>
                    </div></div>

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
                        </div></div>
                    )}

                    {/* Contact Info */}
                    <div className="space-y-2 text-left border-t border-gray-100 pt-3">
                      <div className="flex items-center text-xs text-gray-600">
                        <Mail className="w-3 h-3 mr-2 flex-shrink-0 text-gray-400" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <Phone className="w-3 h-3 mr-2 flex-shrink-0 text-gray-400" />
                        <span>{formatPhoneNumber(customer.phone)}</span>
                      </div>
                      <div className="flex items-start text-xs text-gray-600">
                        <MapPin className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                        <span className="line-clamp-1">{customer.address}</span>
                      </div></div></div></div></div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-white shadow-sm border border-gray-200 rounded-b-lg hover:shadow-md transition-shadow">
            {filteredCustomers.map((customer, index) => {
              const customerId = customer._id || customer.id;
              if (!customerId) return null;
              
              return (
                <div
                  key={customerId}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="grid grid-cols-12 gap-4 items-center text-sm">
                    {/* Checkbox Column */}
                    <div className="col-span-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customerId)}
                        onChange={() => toggleSelectCustomer(customerId)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    
                    {/* Status */}
                    {visibleColumns.status && (
                      <div className="col-span-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          customer.active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {customer.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    )}

                    {/* Name */}
                    {visibleColumns.name && (
                      <div className="col-span-2">
                        <div className="font-medium text-gray-900 truncate">{customer.name}</div>
                        {customer.customer_type === 'company' && customer.company_name && (
                          <div className="text-xs text-gray-500 truncate">{customer.company_name}</div>
                        )}
                      </div>
                    )}

                    {/* Address */}
                    {visibleColumns.address && (
                      <div className="col-span-2 text-gray-600 truncate">{customer.address}</div>
                    )}

                    {/* Phone */}
                    {visibleColumns.phone && (
                      <div className="col-span-2 text-gray-600">{formatPhoneNumber(customer.phone)}</div>
                    )}

                    {/* Email */}
                    {visibleColumns.email && (
                      <div className="col-span-2 text-gray-600 truncate">{customer.email}</div>
                    )}

                    {/* Type */}
                    {visibleColumns.type && (
                      <div className="col-span-1">
                        {customer.customer_type === 'company' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#3f72af]/10 text-[#3f72af]">
                            Company
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            Individual
                          </span>
                        )}
                      </div>
                    )}

                    {/* View Action */}
                    <div className="col-span-2 flex items-center gap-2">
                      <button
                        onClick={() => handleQuickView(customer)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                        title="Quick View"
                      >
                        <Eye className="w-3 h-3" />
                        Quick View
                      </button>
                      <button
                        onClick={() => router.push(`/customers/${customerId}`)}
                        className="px-3 py-1.5 bg-[#3f72af] hover:bg-[#2c5282] text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button></div></div></div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bulk Action Modal - Delete */}
      {bulkActionType === 'delete' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-red-200 animate-slideUp">
            <div className="p-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Delete {selectedCustomers.length} Customer{selectedCustomers.length !== 1 ? 's' : ''}?
              </h3>
              <p className="text-gray-600 text-center mb-6">
                This action cannot be undone. Are you sure you want to delete the selected customers?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setBulkActionType(null)}
                  className="flex-1 px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex-1 px-5 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-sm hover:shadow-md font-semibold"
                >
                  Delete
                </button></div></div></div></div>
      )}

      {/* Quick View Panel */}
      {showQuickView && quickViewCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-end z-[60] animate-fadeIn">
          <div 
            className="fixed inset-0"
            onClick={() => setShowQuickView(false)}
          />
          <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl animate-slideInRight overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-br from-[#3f72af] to-[#2c5282] text-white p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-3">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{quickViewCustomer.name}</h2>
                  <p className="text-blue-100 text-sm">Customer Quick View</p>
                </div></div>
              <button
                onClick={() => setShowQuickView(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button></div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status and Type */}
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 ${
                  quickViewCustomer.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                } text-sm font-medium rounded-full`}>
                  {quickViewCustomer.active ? 'Active' : 'Inactive'}
                </span>
                <span className={`px-4 py-2 ${
                  quickViewCustomer.customer_type === 'company' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                } text-sm font-medium rounded-full flex items-center gap-2`}>
                  {quickViewCustomer.customer_type === 'company' ? <Briefcase className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  {quickViewCustomer.customer_type === 'company' ? 'Company' : 'Individual'}
                </span>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#3f72af]" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{formatPhoneNumber(quickViewCustomer.phone)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{quickViewCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{quickViewCustomer.address}</span>
                  </div>
                  {quickViewCustomer.company_name && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{quickViewCustomer.company_name}</span>
                    </div>
                  )}
                </div></div>

              {/* Notes */}
              {quickViewCustomer.notes && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#3f72af]" />
                    Notes
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{quickViewCustomer.notes}</p>
                </div>
              )}

              {/* Created Date */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Account Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Created</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(quickViewCustomer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Customer ID</p>
                    <p className="font-semibold text-gray-900 text-xs">{quickViewCustomer._id}</p>
                  </div></div></div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowQuickView(false);
                    router.push(`/customers/${quickViewCustomer._id}`);
                  }}
                  className="flex-1 px-6 py-3 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-all shadow-sm hover:shadow-md font-semibold flex items-center justify-center gap-2"
                >
                  <Edit className="w-5 h-5" />
                  Edit Customer
                </button>
                <button
                  onClick={() => router.push(`/customers/create?duplicate=${quickViewCustomer._id}`)}
                  className="px-6 py-3 border-2 border-[#3f72af] text-[#3f72af] rounded-lg hover:bg-blue-50 transition-all font-semibold flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Duplicate
                </button></div></div></div></div>
      )}
    </div>
  );
}
