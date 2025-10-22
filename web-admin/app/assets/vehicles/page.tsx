'use client';

import React, { useState } from 'react';
import { Truck, Plus, Search, Filter, Download, ChevronDown } from 'lucide-react';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';

// Mock data
const mockVehicles = [
  {
    id: 1,
    vehicleNumber: 'VEH-001',
    type: 'Pickup Truck',
    make: 'Ford',
    model: 'F-250',
    year: 2022,
    licensePlate: 'ABC-1234',
    status: 'Active',
    assignedTo: 'John Smith',
    mileage: 45230,
    lastService: '2024-05-15',
    nextService: '2024-08-15'
  },
  {
    id: 2,
    vehicleNumber: 'VEH-002',
    type: 'Plow Truck',
    make: 'Chevrolet',
    model: 'Silverado 3500',
    year: 2021,
    licensePlate: 'XYZ-5678',
    status: 'Active',
    assignedTo: 'Mike Johnson',
    mileage: 62100,
    lastService: '2024-04-20',
    nextService: '2024-07-20'
  },
  {
    id: 3,
    vehicleNumber: 'VEH-003',
    type: 'Salt Truck',
    make: 'GMC',
    model: 'Sierra 3500HD',
    year: 2020,
    licensePlate: 'DEF-9012',
    status: 'Maintenance',
    assignedTo: null,
    mileage: 78450,
    lastService: '2024-06-01',
    nextService: '2024-06-10'
  },
  {
    id: 4,
    vehicleNumber: 'VEH-004',
    type: 'Pickup Truck',
    make: 'Ram',
    model: '2500',
    year: 2023,
    licensePlate: 'GHI-3456',
    status: 'Active',
    assignedTo: 'Sarah Williams',
    mileage: 23100,
    lastService: '2024-05-28',
    nextService: '2024-08-28'
  }
];

export default function VehiclesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const statusCounts = {
    all: mockVehicles.length,
    active: mockVehicles.filter(v => v.status === 'Active').length,
    maintenance: mockVehicles.filter(v => v.status === 'Maintenance').length,
    inactive: mockVehicles.filter(v => v.status === 'Inactive').length
  };

  const filteredVehicles = mockVehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || 
      vehicle.status.toLowerCase() === selectedStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  return (
    <HybridNavigationTopBar>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <CompactHeader
          title="Vehicles"
          subtitle={`${filteredVehicles.length} vehicle${filteredVehicles.length !== 1 ? 's' : ''}`}
          icon={Truck}
          actions={[
            {
              label: 'Export',
              icon: Download,
              onClick: () => console.log('Export vehicles'),
              variant: 'secondary',
            },
            {
              label: 'Add Vehicle',
              icon: Plus,
              onClick: () => console.log('Add vehicle'),
              variant: 'primary',
            },
          ]}
        />

        {/* Compact Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search vehicles..."
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

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mx-6">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{vehicle.vehicleNumber}</h3>
                  <p className="text-sm text-gray-600">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  vehicle.status === 'Active' 
                    ? 'bg-green-100 text-green-800'
                    : vehicle.status === 'Maintenance'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {vehicle.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type:</span>
                  <span className="text-gray-900 font-medium">{vehicle.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">License Plate:</span>
                  <span className="text-gray-900 font-medium">{vehicle.licensePlate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Assigned To:</span>
                  <span className="text-gray-900 font-medium">{vehicle.assignedTo || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Mileage:</span>
                  <span className="text-gray-900 font-medium">{vehicle.mileage.toLocaleString()} mi</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Service:</span>
                  <span className="text-gray-900 font-medium">{vehicle.lastService}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Next Service:</span>
                  <span className="text-gray-900 font-medium">{vehicle.nextService}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button className="flex-1 px-3 py-1.5 text-sm bg-[#3f72af] text-white rounded-lg hover:bg-blue-700">
                  View
                </button>
                <button className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredVehicles.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center mx-6">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No vehicles found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </HybridNavigationTopBar>
  );
}
