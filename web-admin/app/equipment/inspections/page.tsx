'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  Bell,
  FileText,
  TrendingUp,
  ClipboardCheck,
  Eye,
  Edit,
  Search,
} from 'lucide-react';

interface InspectionDashboard {
  summary: {
    total_scheduled: number;
    due_today: number;
    due_this_week: number;
    overdue: number;
    completed_this_month: number;
    non_compliant_equipment_count: number;
  };
  upcoming_inspections: any[];
  overdue_inspections: any[];
  non_compliant_equipment: any[];
}

export default function InspectionsDashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<InspectionDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'overdue' | 'non-compliant'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/equipment-inspections/dashboard/overview');
      setDashboard(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'due': return 'bg-yellow-100 text-yellow-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <PageHeader>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </PageHeader>
    );
  }

  const summary = dashboard?.summary || {
    total_scheduled: 0,
    due_today: 0,
    due_this_week: 0,
    overdue: 0,
    completed_this_month: 0,
    non_compliant_equipment_count: 0,
  };

  const upcomingInspections = dashboard?.upcoming_inspections || [];
  const overdueInspections = dashboard?.overdue_inspections || [];
  const nonCompliantEquipment = dashboard?.non_compliant_equipment || [];

  const activeInspections =
    activeTab === 'upcoming'
      ? upcomingInspections
      : activeTab === 'overdue'
      ? overdueInspections
      : nonCompliantEquipment;

  const filteredInspections = activeInspections.filter((item: any) =>
    searchQuery
      ? item.equipment_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.inspection_type?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <PageHeader>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        {/* Compact Header */}
        <PageHeader
          title="Equipment Inspections"
          
          actions={[
            {
              label: 'Manage Schedules',
              icon: Calendar,
              onClick: () => router.push('/equipment/inspections/schedules'),
              variant: 'secondary',
            },
            {
              label: 'New Inspection',
              icon: <Plus className="w-4 h-4 mr-2" />,
              onClick: () => router.push('/equipment/inspections/create'),
              variant: 'primary',
            },
          ]}
        />

        {/* Tab Filter Buttons */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming ({upcomingInspections.length})
            </button>
            <button
              onClick={() => setActiveTab('overdue')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overdue'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Overdue ({overdueInspections.length})
            </button>
            <button
              onClick={() => setActiveTab('non-compliant')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'non-compliant'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Non-Compliant ({nonCompliantEquipment.length})
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
                placeholder="Search by equipment or inspection type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              onClick={loadDashboard}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Inspections Grid */}
        {filteredInspections.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center mx-6">
            <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Inspections Found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? 'Try adjusting your search'
                : activeTab === 'upcoming'
                ? 'No upcoming inspections scheduled'
                : activeTab === 'overdue'
                ? 'No overdue inspections'
                : 'No non-compliant equipment'}
            </p>
            {!searchQuery && activeTab === 'upcoming' && (
              <button
                onClick={() => router.push('/equipment/inspections/schedules')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
              >
                <Calendar className="w-5 h-5" />
                <span>Manage Schedules</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mx-6">
            {filteredInspections.map((item: any, index: number) => (
              <div
                key={item.id || `inspection-${index}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/equipment/inspections/${item.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ClipboardCheck className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{item.equipment_name}</h3>
                      <p className="text-sm text-gray-600 truncate">{item.inspection_type}</p>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status || 'scheduled')}`}>
                    {item.status || 'Scheduled'}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {item.due_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {formatDate(item.due_date)}</span>
                      {getDaysUntilDue(item.due_date) < 0 && (
                        <span className="text-red-600 font-medium">Overdue</span>
                      )}
                    </div>
                  )}
                  {item.inspector && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>{item.inspector}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/equipment/inspections/${item.id}`);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/equipment/inspections/${item.id}/edit`);
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
    </PageHeader>
  );
}
