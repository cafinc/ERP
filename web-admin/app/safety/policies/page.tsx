'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';
import {
  Plus,
  Search,
  Eye,
  Clipboard,
  RefreshCw,
  Calendar,
  FileText,
  Download,
  CheckCircle,
  Shield,
  Snowflake,
  Wrench,
} from 'lucide-react';

export default function SafetyPoliciesPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState([
    {
      id: '1',
      policy_number: 'POL-001',
      title: 'Workplace Safety Policy',
      category: 'General Safety',
      version: '2.1',
      effective_date: '2024-01-01',
      review_date: '2025-01-01',
      status: 'active',
      approved_by: 'Management',
    },
    {
      id: '2',
      policy_number: 'POL-002',
      title: 'Winter Operations Safety',
      category: 'Seasonal',
      version: '1.5',
      effective_date: '2024-11-01',
      review_date: '2025-11-01',
      status: 'active',
      approved_by: 'Safety Committee',
    },
    {
      id: '3',
      policy_number: 'POL-003',
      title: 'Equipment Operation Policy',
      category: 'Equipment',
      version: '3.0',
      effective_date: '2024-06-01',
      review_date: '2025-06-01',
      status: 'active',
      approved_by: 'Operations Manager',
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      'General Safety': 'bg-green-100 text-green-700',
      'Seasonal': 'bg-cyan-100 text-cyan-700',
      'Equipment': 'bg-orange-100 text-orange-700',
      'Emergency': 'bg-red-100 text-red-700',
      'Training': 'bg-purple-100 text-purple-700',
    };
    return colorMap[category] || 'bg-gray-100 text-gray-700';
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: any } = {
      'General Safety': Shield,
      'Seasonal': Snowflake,
      'Equipment': Wrench,
      'Emergency': FileText,
      'Training': FileText,
    };
    return iconMap[category] || FileText;
  };

  const getCategoryGradient = (category: string) => {
    const gradientMap: { [key: string]: string } = {
      'General Safety': 'from-green-500 to-green-600',
      'Seasonal': 'from-cyan-500 to-cyan-600',
      'Equipment': 'from-orange-500 to-orange-600',
      'Emergency': 'from-red-500 to-red-600',
      'Training': 'from-purple-500 to-purple-600',
    };
    return gradientMap[category] || 'from-gray-500 to-gray-600';
  };

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      policy.policy_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || policy.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <CompactHeader
          title="Safety Policies"
          icon={Clipboard}
          badges={[
            { label: `${policies.length} Policies`, color: 'blue' },
            { label: `${policies.filter(p => p.status === 'active').length} Active`, color: 'green' },
          ]}
          actions={[
            {
              label: 'Add Policy',
              icon: Plus,
              onClick: () => router.push('/safety/policies/create'),
              variant: 'primary',
            },
          ]}
        />

        {/* Category Filter Buttons */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterCategory === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({policies.length})
            </button>
            <button
              onClick={() => setFilterCategory('General Safety')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterCategory === 'General Safety'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              General ({policies.filter(p => p.category === 'General Safety').length})
            </button>
            <button
              onClick={() => setFilterCategory('Seasonal')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterCategory === 'Seasonal'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Seasonal ({policies.filter(p => p.category === 'Seasonal').length})
            </button>
            <button
              onClick={() => setFilterCategory('Equipment')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterCategory === 'Equipment'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Equipment ({policies.filter(p => p.category === 'Equipment').length})
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
                placeholder="Search policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-6">
          {filteredPolicies.map((policy, index) => {
            const CategoryIcon = getCategoryIcon(policy.category);
            const categoryGradient = getCategoryGradient(policy.category);
            
            return (
              <div
                key={policy.id || `policy-${index}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/safety/policies/${policy.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-12 h-12 bg-gradient-to-br ${categoryGradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <CategoryIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{policy.policy_number}</h3>
                      <p className="text-sm text-gray-600 truncate">{policy.title}</p>
                    </div>
                  </div>
                </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getCategoryColor(policy.category)}`}>
                  {policy.category}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  v{policy.version}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Effective: {new Date(policy.effective_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Review: {new Date(policy.review_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Approved by: {policy.approved_by}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/safety/policies/${policy.id}`);
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-600/90 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle download
                  }}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
