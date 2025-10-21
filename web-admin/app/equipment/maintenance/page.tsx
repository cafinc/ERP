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
  Wrench,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Calendar,
  Truck,
  User,
  FileText,
  Edit,
} from 'lucide-react';

interface MaintenanceRecord {
  id: string;
  equipment_id: string;
  equipment_name?: string;
  maintenance_type: string;
  description?: string;
  status: string;
  scheduled_date?: string;
  completed_date?: string;
  technician?: string;
  cost?: number;
  notes?: string;
  created_at: string;
}

export default function MaintenancePage() {
  const router = useRouter();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      // const response = await api.get('/equipment/maintenance');
      // setRecords(response.data || []);
      
      // Using mock data
      setRecords([
        {
          id: '1',
          equipment_id: 'eq1',
          equipment_name: 'Plow Truck #12',
          maintenance_type: 'routine',
          description: 'Oil change and tire rotation',
          status: 'completed',
          scheduled_date: '2025-01-15',
          completed_date: '2025-01-15',
          technician: 'John Smith',
          cost: 250,
          created_at: '2025-01-10',
        },
        {
          id: '2',
          equipment_id: 'eq2',
          equipment_name: 'Salt Spreader #5',
          maintenance_type: 'repair',
          description: 'Replace hydraulic pump',
          status: 'pending',
          scheduled_date: '2025-01-20',
          technician: 'Mike Johnson',
          cost: 850,
          created_at: '2025-01-12',
        },
        {
          id: '3',
          equipment_id: 'eq3',
          equipment_name: 'Loader #3',
          maintenance_type: 'inspection',
          description: 'Annual safety inspection',
          status: 'in_progress',
          scheduled_date: '2025-01-18',
          technician: 'Sarah Williams',
          created_at: '2025-01-14',
        },
      ]);
    } catch (error) {
      console.error('Error loading maintenance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      routine: 'Routine',
      repair: 'Repair',
      inspection: 'Inspection',
      emergency: 'Emergency',
      preventive: 'Preventive',
    };
    return typeMap[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      routine: 'bg-blue-100 text-blue-700',
      repair: 'bg-orange-100 text-orange-700',
      inspection: 'bg-purple-100 text-purple-700',
      emergency: 'bg-red-100 text-red-700',
      preventive: 'bg-green-100 text-green-700',
    };
    return colorMap[type] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'Pending',
      scheduled: 'Scheduled',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-700',
      scheduled: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-cyan-100 text-cyan-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.equipment_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.technician?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesType = filterType === 'all' || record.maintenance_type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4">
        {/* Compact Header */}
        <CompactHeader
          title="Equipment Maintenance"
          icon={Wrench}
          badges={[
            { label: `${records.length} Total`, color: 'blue' },
            { label: `${records.filter((r) => r.status === 'pending').length} Pending`, color: 'yellow' },
            { label: `${records.filter((r) => r.status === 'in_progress').length} In Progress`, color: 'cyan' },
          ]}
          actions={[
            {
              label: 'Schedule Maintenance',
              icon: Plus,
              onClick: () => router.push('/equipment/maintenance/create'),
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
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({records.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({records.filter((r) => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilterStatus('scheduled')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'scheduled'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Scheduled ({records.filter((r) => r.status === 'scheduled').length})
            </button>
            <button
              onClick={() => setFilterStatus('in_progress')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'in_progress'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Progress ({records.filter((r) => r.status === 'in_progress').length})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed ({records.filter((r) => r.status === 'completed').length})
            </button>
          </div>
        </div>

        {/* Search Bar with Type Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4 mx-6 mt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by equipment, description, or technician..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent text-sm"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="routine">Routine</option>
              <option value="repair">Repair</option>
              <option value="inspection">Inspection</option>
              <option value="emergency">Emergency</option>
              <option value="preventive">Preventive</option>
            </select>
            <button
              onClick={loadRecords}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Maintenance Records Grid */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center mx-6">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Maintenance Records Found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by scheduling your first maintenance'}
            </p>
            {!searchQuery && filterStatus === 'all' && filterType === 'all' && (
              <button
                onClick={() => router.push('/equipment/maintenance/create')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Schedule First Maintenance</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-6">
            {filteredRecords.map((record, index) => (
              <div
                key={record.id || `maintenance-${index}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/equipment/maintenance/${record.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{record.equipment_name}</h3>
                      <p className="text-sm text-gray-600 truncate">{record.description}</p>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                    {getStatusLabel(record.status)}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(record.maintenance_type)}`}>
                    {getTypeLabel(record.maintenance_type)}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {record.scheduled_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Scheduled: {new Date(record.scheduled_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {record.technician && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{record.technician}</span>
                    </div>
                  )}
                  {record.cost && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>Cost: ${record.cost.toLocaleString()}</span>
                    </div>
                  )}
                  {record.completed_date && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Completed: {new Date(record.completed_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/equipment/maintenance/${record.id}`);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/equipment/maintenance/${record.id}/edit`);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
