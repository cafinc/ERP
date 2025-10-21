'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import CompactHeader from '@/components/CompactHeader';
import {
  Plus,
  Search,
  Eye,
  AlertTriangle,
  RefreshCw,
  Calendar,
  User,
  Edit,
  Phone,
  MapPin,
} from 'lucide-react';

export default function EmergencyPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState([
    {
      id: '1',
      plan_number: 'ERP-001',
      title: 'Fire Emergency Response',
      type: 'Fire',
      last_updated: '2024-06-01',
      last_drill: '2024-12-15',
      coordinator: 'John Smith',
      status: 'active',
      locations: ['Main Office', 'Equipment Yard'],
    },
    {
      id: '2',
      plan_number: 'ERP-002',
      title: 'Medical Emergency Response',
      type: 'Medical',
      last_updated: '2024-09-01',
      last_drill: '2025-01-10',
      coordinator: 'Sarah Williams',
      status: 'active',
      locations: ['All Sites'],
    },
    {
      id: '3',
      plan_number: 'ERP-003',
      title: 'Severe Weather Protocol',
      type: 'Weather',
      last_updated: '2024-11-01',
      last_drill: '2024-11-20',
      coordinator: 'Mike Johnson',
      status: 'active',
      locations: ['All Locations'],
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const getTypeColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      Fire: 'bg-red-100 text-red-700',
      Medical: 'bg-blue-100 text-blue-700',
      Weather: 'bg-cyan-100 text-cyan-700',
      Evacuation: 'bg-orange-100 text-orange-700',
      'Chemical Spill': 'bg-purple-100 text-purple-700',
    };
    return colorMap[type] || 'bg-gray-100 text-gray-700';
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      plan.plan_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || plan.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="p-4">
        <CompactHeader
          title="Emergency Response Plans"
          icon={AlertTriangle}
          badges={[
            { label: `${plans.length} Plans`, color: 'blue' },
            { label: `${plans.filter(p => p.status === 'active').length} Active`, color: 'green' },
          ]}
          actions={[
            {
              label: 'New Plan',
              icon: Plus,
              onClick: () => router.push('/safety/emergency/create'),
              variant: 'primary',
            },
          ]}
        />

        {/* Plan Type Filter Buttons */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({plans.length})
            </button>
            <button
              onClick={() => setFilterType('Fire')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterType === 'Fire'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Fire ({plans.filter(p => p.type === 'Fire').length})
            </button>
            <button
              onClick={() => setFilterType('Medical')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterType === 'Medical'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Medical ({plans.filter(p => p.type === 'Medical').length})
            </button>
            <button
              onClick={() => setFilterType('Weather')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterType === 'Weather'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Weather ({plans.filter(p => p.type === 'Weather').length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4 mx-6 mt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search emergency plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-6">
          {filteredPlans.map((plan, index) => (
            <div
              key={plan.id || `plan-${index}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/safety/emergency/${plan.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{plan.plan_number}</h3>
                    <p className="text-sm text-gray-600 truncate">{plan.title}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(plan.type)}`}>
                  {plan.type}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>Coordinator: {plan.coordinator}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Updated: {new Date(plan.last_updated).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Last Drill: {new Date(plan.last_drill).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{plan.locations.join(', ')}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/safety/emergency/${plan.id}`);
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/safety/emergency/${plan.id}/edit`);
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
    </DashboardLayout>
  );
}
