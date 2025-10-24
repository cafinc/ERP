'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import {
  Plus,
  Search,
  Eye,
  ClipboardCheck,
  RefreshCw,
  Calendar,
  User,
  Edit,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function SafetyInspectionsPage() {
  const router = useRouter();
  const [inspections, setInspections] = useState([
    {
      id: '1',
      inspection_number: 'SI-2025-001',
      type: 'workplace',
      date: '2025-01-20',
      inspector: 'John Smith',
      location: 'Equipment Yard',
      status: 'completed',
      score: 95,
      findings: 2,
      corrective_actions: 1,
    },
    {
      id: '2',
      inspection_number: 'SI-2025-002',
      type: 'vehicle',
      date: '2025-01-22',
      inspector: 'Mike Johnson',
      location: 'Plow Truck #12',
      status: 'pending',
      findings: 0,
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      scheduled: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      pending: 'bg-orange-100 text-orange-700',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredInspections = inspections.filter((inspection) => {
    const matchesSearch =
      inspection.inspection_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspection.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || inspection.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <PageHeader>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <PageHeader
        title="Safety Inspections"
        subtitle="Schedule and conduct safety inspections"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Safety", href: "/safety/dashboard" }, { label: "Inspections" }]}
        title="Safety Inspections"
          
          actions={[
            {
              label: 'New Inspection',
              icon: <Plus className="w-4 h-4 mr-2" />,
              onClick: () => router.push('/safety/inspections/create'),
              variant: 'primary',
            },
          ]}
        />

        {/* Status Filter Buttons */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({inspections.length})
            </button>
            <button
              onClick={() => setFilterStatus('scheduled')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'scheduled'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Scheduled ({inspections.filter(i => i.status === 'scheduled').length})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed ({inspections.filter(i => i.status === 'completed').length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({inspections.filter(i => i.status === 'pending').length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 mb-4 mx-6 mt-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search inspections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mx-6">
          {filteredInspections.map((inspection, index) => (
            <div
              key={inspection.id || `inspection-${index}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/safety/inspections/${inspection.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{inspection.inspection_number}</h3>
                    <p className="text-sm text-gray-600 truncate">{inspection.type}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                  {inspection.status}
                </span>
                {inspection.score && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Score: {inspection.score}%
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(inspection.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{inspection.inspector}</span>
                </div>
                {inspection.findings !== undefined && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{inspection.findings} Findings</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/safety/inspections/${inspection.id}`);
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/safety/inspections/${inspection.id}/edit`);
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
      </div>
    </PageHeader>
  );
}
