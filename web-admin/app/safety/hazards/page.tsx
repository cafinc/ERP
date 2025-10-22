'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';
import {
  Plus,
  Search,
  Eye,
  FileText,
  RefreshCw,
  Calendar,
  User,
  Edit,
  AlertTriangle,
  MapPin,
} from 'lucide-react';

export default function HazardAssessmentsPage() {
  const router = useRouter();
  const [hazards, setHazards] = useState([
    {
      id: '1',
      assessment_number: 'HA-2025-001',
      job_type: 'Snow Plowing',
      location: 'Highway 401',
      assessed_by: 'John Smith',
      date: '2025-01-10',
      risk_level: 'medium',
      status: 'active',
      hazards_identified: 5,
      controls_implemented: 5,
    },
    {
      id: '2',
      assessment_number: 'HA-2025-002',
      job_type: 'Sidewalk Clearing',
      location: 'Downtown Core',
      assessed_by: 'Sarah Williams',
      date: '2025-01-15',
      risk_level: 'low',
      status: 'active',
      hazards_identified: 3,
      controls_implemented: 3,
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');

  const getRiskColor = (level: string) => {
    const colorMap: { [key: string]: string } = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };
    return colorMap[level] || 'bg-gray-100 text-gray-700';
  };

  const filteredHazards = hazards.filter((hazard) => {
    const matchesSearch =
      hazard.assessment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hazard.job_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = filterRisk === 'all' || hazard.risk_level === filterRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <HybridNavigationTopBar>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <CompactHeader
          title="Hazard Assessments"
          icon={FileText}
          badges={[
            { label: `${hazards.length} Assessments`, color: 'blue' },
            { label: `${hazards.filter(h => h.risk_level === 'high' || h.risk_level === 'critical').length} High Risk`, color: 'red' },
          ]}
          actions={[
            {
              label: 'New Assessment',
              icon: Plus,
              onClick: () => router.push('/safety/hazards/create'),
              variant: 'primary',
            },
          ]}
        />

        {/* Risk Level Filter Buttons */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => setFilterRisk('all')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterRisk === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({hazards.length})
            </button>
            <button
              onClick={() => setFilterRisk('low')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterRisk === 'low'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Low Risk ({hazards.filter(h => h.risk_level === 'low').length})
            </button>
            <button
              onClick={() => setFilterRisk('medium')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterRisk === 'medium'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Medium Risk ({hazards.filter(h => h.risk_level === 'medium').length})
            </button>
            <button
              onClick={() => setFilterRisk('high')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterRisk === 'high'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              High Risk ({hazards.filter(h => h.risk_level === 'high').length})
            </button>
            <button
              onClick={() => setFilterRisk('critical')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterRisk === 'critical'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Critical ({hazards.filter(h => h.risk_level === 'critical').length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 mb-4 mx-6 mt-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search hazards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-6">
          {filteredHazards.map((hazard, index) => (
            <div
              key={hazard.id || `hazard-${index}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/safety/hazards/${hazard.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{hazard.assessment_number}</h3>
                    <p className="text-sm text-gray-600 truncate">{hazard.job_type}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRiskColor(hazard.risk_level)}`}>
                  {hazard.risk_level.toUpperCase()} RISK
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{hazard.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{hazard.assessed_by}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(hazard.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-600">Hazards: {hazard.hazards_identified}</span>
                  <span className="text-gray-600">Controls: {hazard.controls_implemented}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/safety/hazards/${hazard.id}`);
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/safety/hazards/${hazard.id}/edit`);
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
    </HybridNavigationTopBar>
  );
}
