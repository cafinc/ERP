'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import CompactHeader from '@/components/CompactHeader';
import {
  Plus,
  Search,
  Eye,
  HardHat,
  RefreshCw,
  User,
  Edit,
  Package,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function PPEManagementPage() {
  const router = useRouter();
  const [ppeItems, setPpeItems] = useState([
    {
      id: '1',
      item_type: 'Hard Hat',
      assigned_to: 'John Smith',
      issue_date: '2024-01-15',
      condition: 'good',
      size: 'M',
      serial_number: 'HH-2024-001',
      expiry_date: '2027-01-15',
    },
    {
      id: '2',
      item_type: 'Safety Boots',
      assigned_to: 'Mike Johnson',
      issue_date: '2024-06-20',
      condition: 'fair',
      size: '11',
      serial_number: 'SB-2024-015',
    },
    {
      id: '3',
      item_type: 'High-Vis Vest',
      assigned_to: 'Sarah Williams',
      issue_date: '2024-11-10',
      condition: 'good',
      size: 'L',
      serial_number: 'HV-2024-032',
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCondition, setFilterCondition] = useState('all');

  const getConditionColor = (condition: string) => {
    const colorMap: { [key: string]: string } = {
      excellent: 'bg-green-100 text-green-700',
      good: 'bg-blue-100 text-blue-700',
      fair: 'bg-yellow-100 text-yellow-700',
      poor: 'bg-orange-100 text-orange-700',
      damaged: 'bg-red-100 text-red-700',
    };
    return colorMap[condition] || 'bg-gray-100 text-gray-700';
  };

  const filteredPPE = ppeItems.filter((item) => {
    const matchesSearch =
      item.item_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.assigned_to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serial_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCondition = filterCondition === 'all' || item.condition === filterCondition;
    return matchesSearch && matchesCondition;
  });

  return (
    <DashboardLayout>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <CompactHeader
          title="PPE Management"
          icon={HardHat}
          badges={[
            { label: `${ppeItems.length} Items Tracked`, color: 'blue' },
            { label: `${ppeItems.filter(p => p.condition === 'good' || p.condition === 'excellent').length} Good Condition`, color: 'green' },
          ]}
          actions={[
            {
              label: 'Issue PPE',
              icon: Plus,
              onClick: () => router.push('/safety/ppe/create'),
              variant: 'primary',
            },
          ]}
        />

        {/* Condition Filter Buttons */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => setFilterCondition('all')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterCondition === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({ppeItems.length})
            </button>
            <button
              onClick={() => setFilterCondition('good')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterCondition === 'good'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Good ({ppeItems.filter(p => p.condition === 'good').length})
            </button>
            <button
              onClick={() => setFilterCondition('fair')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterCondition === 'fair'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Fair ({ppeItems.filter(p => p.condition === 'fair').length})
            </button>
            <button
              onClick={() => setFilterCondition('poor')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterCondition === 'poor'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Poor ({ppeItems.filter(p => p.condition === 'poor').length})
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
                placeholder="Search PPE items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-6">
          {filteredPPE.map((item, index) => (
            <div
              key={item.id || `ppe-${index}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/safety/ppe/${item.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <HardHat className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.item_type}</h3>
                    <p className="text-sm text-gray-600 truncate">{item.serial_number}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
                  {item.condition.toUpperCase()}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  Size: {item.size}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>Assigned to: {item.assigned_to}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Package className="w-4 h-4" />
                  <span>Issued: {new Date(item.issue_date).toLocaleDateString()}</span>
                </div>
                {item.expiry_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>Expires: {new Date(item.expiry_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/safety/ppe/${item.id}`);
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-600/90 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/safety/ppe/${item.id}/edit`);
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
