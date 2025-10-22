'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';
import {
  Plus,
  Search,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Calendar,
  User,
  MapPin,
  Edit,
  FileText,
} from 'lucide-react';

interface Incident {
  id: string;
  incident_number: string;
  date: string;
  type: string;
  severity: string;
  status: string;
  location: string;
  reported_by: string;
  description: string;
  injured_person?: string;
  witnesses?: string[];
  corrective_actions?: string;
  investigation_complete: boolean;
}

export default function IncidentReportingPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: '1',
      incident_number: 'INC-2025-001',
      date: '2025-01-15',
      type: 'near_miss',
      severity: 'low',
      status: 'resolved',
      location: 'Parking Lot A',
      reported_by: 'John Smith',
      description: 'Nearly slipped on icy patch',
      investigation_complete: true,
    },
    {
      id: '2',
      incident_number: 'INC-2025-002',
      date: '2025-01-18',
      type: 'injury',
      severity: 'medium',
      status: 'investigating',
      location: 'Equipment Yard',
      reported_by: 'Mike Johnson',
      injured_person: 'Mike Johnson',
      description: 'Minor hand injury while operating equipment',
      investigation_complete: false,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const getTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      near_miss: 'Near Miss',
      injury: 'Injury',
      property_damage: 'Property Damage',
      environmental: 'Environmental',
      vehicle: 'Vehicle Incident',
    };
    return typeMap[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      near_miss: 'bg-yellow-100 text-yellow-700',
      injury: 'bg-red-100 text-red-700',
      property_damage: 'bg-orange-100 text-orange-700',
      environmental: 'bg-green-100 text-green-700',
      vehicle: 'bg-blue-100 text-blue-700',
    };
    return colorMap[type] || 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      reported: 'bg-blue-100 text-blue-700',
      investigating: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700';
  };

  const getSeverityColor = (severity: string) => {
    const colorMap: { [key: string]: string } = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };
    return colorMap[severity] || 'bg-gray-100 text-gray-700';
  };

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.incident_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
    const matchesType = filterType === 'all' || incident.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <HybridNavigationTopBar>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        {/* Compact Header */}
        <CompactHeader
          title="Incident Reporting"
          icon={AlertTriangle}
          badges={[
            { label: `${incidents.length} Total`, color: 'blue' },
            { label: `${incidents.filter(i => i.status === 'investigating').length} Under Investigation`, color: 'yellow' },
            { label: `${incidents.filter(i => i.type === 'injury').length} Injuries`, color: 'red' },
          ]}
          actions={[
            {
              label: 'Report Incident',
              icon: Plus,
              onClick: () => router.push('/safety/incidents/create'),
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
              All ({incidents.length})
            </button>
            <button
              onClick={() => setFilterStatus('reported')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'reported'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Reported ({incidents.filter(i => i.status === 'reported').length})
            </button>
            <button
              onClick={() => setFilterStatus('investigating')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'investigating'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Investigating ({incidents.filter(i => i.status === 'investigating').length})
            </button>
            <button
              onClick={() => setFilterStatus('resolved')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'resolved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Resolved ({incidents.filter(i => i.status === 'resolved').length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 mb-4 mx-6 mt-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Incidents Grid */}
        {filteredIncidents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center mx-6">
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Incidents Found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No incidents reported yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-6">
            {filteredIncidents.map((incident, index) => (
              <div
                key={incident.id || `incident-${index}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/safety/incidents/${incident.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{incident.incident_number}</h3>
                      <p className="text-sm text-gray-600 truncate">{incident.description}</p>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(incident.type)}`}>
                    {getTypeLabel(incident.type)}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                    {incident.status}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                    {incident.severity}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(incident.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{incident.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Reported by: {incident.reported_by}</span>
                  </div>
                  {incident.investigation_complete && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Investigation Complete</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/safety/incidents/${incident.id}`);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-600/90 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/safety/incidents/${incident.id}/edit`);
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
