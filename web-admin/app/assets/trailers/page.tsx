'use client';

import React, { useState } from 'react';
import { Container, Plus, Search, Filter, Download } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

// Mock data
const mockTrailers = [
  {
    id: 1,
    trailerNumber: 'TRL-001',
    type: 'Salt Spreader',
    make: 'SnowEx',
    model: 'SP-575',
    year: 2021,
    capacity: '575 lbs',
    status: 'Active',
    assignedTo: 'VEH-001',
    lastService: '2024-05-10',
    nextService: '2024-08-10'
  },
  {
    id: 2,
    trailerNumber: 'TRL-002',
    type: 'Equipment Trailer',
    make: 'PJ Trailers',
    model: 'CE202',
    year: 2022,
    capacity: '20 ft',
    status: 'Active',
    assignedTo: 'VEH-002',
    lastService: '2024-04-15',
    nextService: '2024-07-15'
  },
  {
    id: 3,
    trailerNumber: 'TRL-003',
    type: 'Plow Attachment',
    make: 'Boss',
    model: 'HTX V-Plow',
    year: 2020,
    capacity: '9 ft',
    status: 'Maintenance',
    assignedTo: null,
    lastService: '2024-05-30',
    nextService: '2024-06-05'
  },
  {
    id: 4,
    trailerNumber: 'TRL-004',
    type: 'Salt Spreader',
    make: 'Western',
    model: 'FLEET FLEX',
    year: 2023,
    capacity: '1000 lbs',
    status: 'Active',
    assignedTo: 'VEH-004',
    lastService: '2024-05-25',
    nextService: '2024-08-25'
  },
  {
    id: 5,
    trailerNumber: 'TRL-005',
    type: 'Utility Trailer',
    make: 'Big Tex',
    model: '70PI-16',
    year: 2021,
    capacity: '16 ft',
    status: 'Active',
    assignedTo: null,
    lastService: '2024-05-05',
    nextService: '2024-08-05'
  }
];

export default function TrailersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const statusCounts = {
    all: mockTrailers.length,
    active: mockTrailers.filter(t => t.status === 'Active').length,
    maintenance: mockTrailers.filter(t => t.status === 'Maintenance').length,
    inactive: mockTrailers.filter(t => t.status === 'Inactive').length
  };

  const filteredTrailers = mockTrailers.filter(trailer => {
    const matchesSearch = 
      trailer.trailerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trailer.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trailer.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trailer.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || 
      trailer.status.toLowerCase() === selectedStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  return (
    <PageHeader>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <PageHeader
        title="Trailers"
        subtitle="Manage trailer inventory and assignments"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Assets", href: "/equipment/dashboard" }, { label: "Trailers" }]}
        title="Trailers"
          subtitle={`${filteredTrailers.length} trailer${filteredTrailers.length !== 1 ? 's' : ''}`}
          actions={[
            {
              label: 'Export',
              icon: <Download className="w-4 h-4 mr-2" />,
              onClick: () => console.log('Export trailers'),
              variant: 'secondary',
            },
            {
              label: 'Add Trailer',
              icon: <Plus className="w-4 h-4 mr-2" />,
              onClick: () => console.log('Add trailer'),
              variant: 'primary',
            },
          ]}
        />

        {/* Compact Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 mb-4 mx-6 mt-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search trailers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="px-3 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex gap-2 mb-4 mx-6">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              selectedStatus === 'all'
                ? 'bg-[#3f72af] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All ({statusCounts.all})
          </button>
          <button
            onClick={() => setSelectedStatus('active')}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              selectedStatus === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Active ({statusCounts.active})
          </button>
          <button
            onClick={() => setSelectedStatus('maintenance')}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              selectedStatus === 'maintenance'
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Maintenance ({statusCounts.maintenance})
          </button>
          <button
            onClick={() => setSelectedStatus('inactive')}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              selectedStatus === 'inactive'
                ? 'bg-gray-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Inactive ({statusCounts.inactive})
          </button>
        </div>

        {/* Trailers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mx-6">
          {filteredTrailers.map((trailer) => (
            <div key={trailer.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{trailer.trailerNumber}</h3>
                  <p className="text-sm text-gray-600">{trailer.year} {trailer.make} {trailer.model}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  trailer.status === 'Active' 
                    ? 'bg-green-100 text-green-800'
                    : trailer.status === 'Maintenance'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {trailer.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type:</span>
                  <span className="text-gray-900 font-medium">{trailer.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Capacity:</span>
                  <span className="text-gray-900 font-medium">{trailer.capacity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Assigned To:</span>
                  <span className="text-gray-900 font-medium">{trailer.assignedTo || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Service:</span>
                  <span className="text-gray-900 font-medium">{trailer.lastService}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Next Service:</span>
                  <span className="text-gray-900 font-medium">{trailer.nextService}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button className="flex-1 px-3 py-1.5 text-sm bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282]">
                  View
                </button>
                <button className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTrailers.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center mx-6">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No trailers found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </PageHeader>
  );
}
