'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { BookOpen, Plus, Search } from 'lucide-react';

const mockTrainings = [
  { id: 1, employee: 'John Smith', course: 'WHMIS 2015', status: 'active', completionDate: '2024-01-15', expiryDate: '2027-01-15' },
  { id: 2, employee: 'Sarah Johnson', course: 'First Aid Level 1', status: 'expiring_soon', completionDate: '2023-02-20', expiryDate: '2026-02-20' },
  { id: 3, employee: 'Mike Brown', course: 'Confined Space Entry', status: 'active', completionDate: '2024-03-10', expiryDate: '2027-03-10' },
  { id: 4, employee: 'Emily Davis', course: 'Fall Protection', status: 'expired', completionDate: '2020-05-12', expiryDate: '2023-05-12' },
];

export default function SafetyTrainingPage() {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const trainings = mockTrainings;

  const filteredTrainings = trainings.filter(training => {
    const matchesSearch = 
      training.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      training.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || training.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <PageHeader>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <PageHeader
        title="Safety Training"
        subtitle="Manage safety training programs"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Safety", href: "/safety/dashboard" }, { label: "Training" }]}
        title="Safety Training"
          
          actions={[
            {
              label: 'Add Training',
              icon: <Plus className="w-4 h-4 mr-2" />,
              onClick: () => router.push('/safety/training/create'),
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
              All ({trainings.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active ({trainings.filter(t => t.status === 'active').length})
            </button>
            <button
              onClick={() => setFilterStatus('expiring_soon')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'expiring_soon'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Expiring Soon ({trainings.filter(t => t.status === 'expiring_soon').length})
            </button>
            <button
              onClick={() => setFilterStatus('expired')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'expired'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Expired ({trainings.filter(t => t.status === 'expired').length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 mb-4 mx-6 mt-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search training records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Training List */}
        <div className="mx-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTrainings.map((training) => (
                    <tr key={training.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{training.employee}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{training.course}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{training.completionDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{training.expiryDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          training.status === 'active' ? 'bg-green-100 text-green-800' :
                          training.status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {training.status === 'expiring_soon' ? 'Expiring Soon' : training.status.charAt(0).toUpperCase() + training.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-[#3f72af] hover:text-blue-900">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageHeader>
  );
}
