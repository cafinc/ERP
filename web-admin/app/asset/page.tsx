'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  Plus,
  Search,
  Eye,
  Truck,
  Wrench,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Calendar,
  Hash,
  FileText,
  Edit,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Package,
  Car,
  Hammer,
} from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  type?: string;
  equipment_type: string;
  unit_number?: string;
  license_plate?: string;
  license_required: boolean;
  maintenance_due?: string;
  status: string;
  notes?: string;
  active: boolean;
  created_at: string;
  make?: string;
  model?: string;
  year?: number;
}

type SortField = 'name' | 'type' | 'status' | 'created_at' | 'maintenance_due';
type SortOrder = 'asc' | 'desc';

export default function EquipmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState(searchParams.get('type') || 'all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadEquipment();
  }, []);

  useEffect(() => {
    // Update filter from URL query params
    const typeParam = searchParams.get('type');
    if (typeParam && typeParam !== 'all') {
      setFilterType(typeParam);
      setShowFilters(true);
    }
  }, [searchParams]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const response = await api.get('/equipment');
      setEquipment(response.data?.equipment || response.data || []);
    } catch (error) {
      console.error('Error loading equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'vehicle': return Car;
      case 'trailer': return Truck;
      case 'tool': return Hammer;
      default: return Package;
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'equipment': 'Equipment',
      'vehicle': 'Vehicle',
      'trailer': 'Trailer',
      'tool': 'Tool',
      'plow_truck': 'Plow Truck',
      'truck': 'Truck',
      'loader': 'Loader',
      'skid_steer': 'Skid Steer',
      'sanding_truck': 'Sanding Truck',
      'brine_truck': 'Brine Truck',
    };
    return typeMap[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'operational':
      case 'available': 
        return 'bg-green-100 text-green-700';
      case 'in_use': 
        return 'bg-blue-100 text-blue-700';
      case 'maintenance': 
        return 'bg-orange-100 text-orange-700';
      case 'retired':
      case 'unavailable': 
        return 'bg-red-100 text-red-700';
      default: 
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'operational': 'Operational',
      'available': 'Available',
      'in_use': 'In Use',
      'maintenance': 'Maintenance',
      'retired': 'Retired',
      'unavailable': 'Unavailable'
    };
    return statusMap[status] || status;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterStatus('all');
    setSortField('name');
    setSortOrder('asc');
  };

  const isMaintenanceDue = (dueDate?: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    const daysUntilDue = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 7;
  };

  // Filter and sort equipment
  const filteredAndSortedEquipment = equipment
    .filter(item => {
      const itemType = item.type || item.equipment_type;
      const matchesSearch = 
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.unit_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.license_plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.model?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === 'all' || itemType === filterType;
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'type':
          aVal = (a.type || a.equipment_type || '').toLowerCase();
          bVal = (b.type || b.equipment_type || '').toLowerCase();
          break;
        case 'status':
          aVal = a.status?.toLowerCase() || '';
          bVal = b.status?.toLowerCase() || '';
          break;
        case 'created_at':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case 'maintenance_due':
          aVal = a.maintenance_due ? new Date(a.maintenance_due).getTime() : 0;
          bVal = b.maintenance_due ? new Date(b.maintenance_due).getTime() : 0;
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Get unique types and statuses for filter options
  const availableTypes = ['all', ...new Set(equipment.map(e => e.type || e.equipment_type).filter(Boolean))];
  const availableStatuses = ['all', ...new Set(equipment.map(e => e.status).filter(Boolean))];

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
        title="Equipment"
        subtitle="Manage your snow removal equipment inventory"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Assets", href: "/equipment/dashboard" }, { label: "Equipment" }]}
          actions={[
            {
              label: 'Add Equipment',
              onClick: () => router.push('/equipment/create'),
              variant: 'primary',
            },
          ]}
        />

        {/* Status Filter Buttons */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-[#3f72af] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              All ({equipment.length})
            </button>
            <button
              onClick={() => setFilterStatus('available')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'available'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Available ({equipment.filter(e => e.status === 'available').length})
            </button>
            <button
              onClick={() => setFilterStatus('in_use')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'in_use'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              In Use ({equipment.filter(e => e.status === 'in_use').length})
            </button>
            <button
              onClick={() => setFilterStatus('maintenance')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'maintenance'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Maintenance ({equipment.filter(e => e.status === 'maintenance').length})
            </button>
            <button
              onClick={() => setFilterStatus('unavailable')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'unavailable'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Unavailable ({equipment.filter(e => e.status === 'unavailable').length})
            </button>
          </div>
        </div>

        {/* Search, Filter, and Sort Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 mx-6 mt-6 hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-4">
            {/* Top Row: Search and Actions */}
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, unit number, license plate, make, or model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    showFilters || filterType !== 'all' || filterStatus !== 'all'
                      ? 'bg-[#3f72af] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  {(filterType !== 'all' || filterStatus !== 'all') && (
                    <span className="bg-white text-[#3f72af] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {(filterType !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0)}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={loadEquipment}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Collapsible Filters Section */}
            {showFilters && (
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Equipment Type
                    </label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      {availableTypes.filter(t => t !== 'all').map(type => (
                        <option key={type} value={type}>{getTypeLabel(type)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Statuses</option>
                      {availableStatuses.filter(s => s !== 'all').map(status => (
                        <option key={status} value={status}>{getStatusLabel(status)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort By
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value as SortField)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="name">Name</option>
                        <option value="type">Type</option>
                        <option value="status">Status</option>
                        <option value="created_at">Date Added</option>
                        <option value="maintenance_due">Maintenance Due</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                      >
                        {sortOrder === 'asc' ? (
                          <ArrowUp className="w-5 h-5" />
                        ) : (
                          <ArrowDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(searchQuery || filterType !== 'all' || filterStatus !== 'all' || sortField !== 'name' || sortOrder !== 'asc') && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-2 text-sm"
                    >
                      <X className="w-4 h-4" />
                      <span>Clear All Filters</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Active Filters Display */}
            {!showFilters && (filterType !== 'all' || filterStatus !== 'all') && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {filterType !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    Type: {getTypeLabel(filterType)}
                    <button
                      onClick={() => setFilterType('all')}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterStatus !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    Status: {getStatusLabel(filterStatus)}
                    <button
                      onClick={() => setFilterStatus('all')}
                      className="hover:bg-green-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="mx-6 mb-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredAndSortedEquipment.length}</span> of <span className="font-semibold">{equipment.length}</span> assets
            {sortField !== 'name' && (
              <span> • Sorted by <span className="font-semibold">{sortField === 'created_at' ? 'Date Added' : sortField === 'maintenance_due' ? 'Maintenance Due' : sortField.charAt(0).toUpperCase() + sortField.slice(1)}</span> ({sortOrder === 'asc' ? 'ascending' : 'descending'})</span>
            )}
          </p>
        </div>

        {/* Equipment Grid */}
        {filteredEquipment.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-12 text-center mx-6 hover:shadow-md transition-shadow">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Equipment Found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                ? 'Try adjusting your search or filters' 
                : 'Get started by adding your first equipment'}
            </p>
            {!searchQuery && filterStatus === 'all' && filterType === 'all' && (
              <button
                onClick={() => router.push('/equipment/create')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add First Equipment</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mx-6">
            {filteredEquipment.map((item, index) => (
              <div
                key={item.id || `equipment-${index}`}
                className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/equipment/${item.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Truck className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                      <p className="text-sm text-gray-600">{getTypeLabel(item.equipment_type)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isMaintenanceDue(item.maintenance_due) && (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                    <span className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {item.unit_number && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Hash className="w-4 h-4" />
                      <span>Unit {item.unit_number}</span>
                    </div>
                  )}
                  {item.license_plate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>{item.license_plate}</span>
                    </div>
                  )}
                  {item.maintenance_due && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Maintenance: {new Date(item.maintenance_due).toLocaleDateString()}</span>
                      {isMaintenanceDue(item.maintenance_due) && (
                        <span className="text-red-600 font-medium">Due Soon</span>
                      )}
                    </div>
                  )}
                  {item.license_required && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                        License Required
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/equipment/${item.id}`);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/equipment/${item.id}/edit`);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/equipment/${item.id}`);
                  }}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
  );
}
