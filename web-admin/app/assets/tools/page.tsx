'use client';

import React, { useState } from 'react';
import { Wrench, Plus, Search, Filter, Download } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

// Mock data
const mockTools = [
  {
    id: 1,
    toolNumber: 'TOOL-001',
    name: 'Snow Shovel - Heavy Duty',
    category: 'Hand Tools',
    make: 'True Temper',
    model: 'Arctic Blast',
    status: 'Active',
    assignedTo: 'John Smith',
    location: 'Truck VEH-001',
    purchaseDate: '2023-11-15',
    lastInspection: '2024-05-20'
  },
  {
    id: 2,
    toolNumber: 'TOOL-002',
    name: 'Ice Chipper',
    category: 'Hand Tools',
    make: 'Bully Tools',
    model: '92813',
    status: 'Active',
    assignedTo: 'Mike Johnson',
    location: 'Truck VEH-002',
    purchaseDate: '2023-10-10',
    lastInspection: '2024-05-15'
  },
  {
    id: 3,
    toolNumber: 'TOOL-003',
    name: 'Cordless Impact Wrench',
    category: 'Power Tools',
    make: 'Milwaukee',
    model: 'M18 FUEL',
    status: 'Maintenance',
    assignedTo: null,
    location: 'Maintenance Shop',
    purchaseDate: '2022-08-20',
    lastInspection: '2024-05-28'
  },
  {
    id: 4,
    toolNumber: 'TOOL-004',
    name: 'Snow Broom',
    category: 'Hand Tools',
    make: 'Hopkins',
    model: 'SubZero',
    status: 'Active',
    assignedTo: 'Sarah Williams',
    location: 'Truck VEH-004',
    purchaseDate: '2024-01-05',
    lastInspection: '2024-05-25'
  },
  {
    id: 5,
    toolNumber: 'TOOL-005',
    name: 'Portable Generator',
    category: 'Power Equipment',
    make: 'Honda',
    model: 'EU2200i',
    status: 'Active',
    assignedTo: null,
    location: 'Equipment Trailer TRL-002',
    purchaseDate: '2023-09-15',
    lastInspection: '2024-05-10'
  },
  {
    id: 6,
    toolNumber: 'TOOL-006',
    name: 'Salt Spreader (Walk-behind)',
    category: 'Power Equipment',
    make: 'Buyers Products',
    model: 'WBS50G',
    status: 'Active',
    assignedTo: null,
    location: 'Warehouse A',
    purchaseDate: '2022-11-20',
    lastInspection: '2024-05-18'
  },
  {
    id: 7,
    toolNumber: 'TOOL-007',
    name: 'Pressure Washer',
    category: 'Power Equipment',
    make: 'Simpson',
    model: 'MSH3125',
    status: 'Active',
    assignedTo: null,
    location: 'Maintenance Shop',
    purchaseDate: '2023-03-10',
    lastInspection: '2024-05-12'
  },
  {
    id: 8,
    toolNumber: 'TOOL-008',
    name: 'Pry Bar Set',
    category: 'Hand Tools',
    make: 'Craftsman',
    model: '3-Piece',
    status: 'Active',
    assignedTo: 'John Smith',
    location: 'Truck VEH-001',
    purchaseDate: '2023-12-01',
    lastInspection: '2024-05-20'
  }
];

export default function ToolsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'hand tools', 'power tools', 'power equipment'];
  
  const categoryCounts = {
    all: mockTools.length,
    'hand tools': mockTools.filter(t => t.category === 'Hand Tools').length,
    'power tools': mockTools.filter(t => t.category === 'Power Tools').length,
    'power equipment': mockTools.filter(t => t.category === 'Power Equipment').length
  };

  const filteredTools = mockTools.filter(tool => {
    const matchesSearch = 
      tool.toolNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      tool.category.toLowerCase() === selectedCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  return (
    <PageHeader>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <PageHeader
        title="Tools"
        subtitle="Track tools and small equipment"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Assets", href: "/equipment/dashboard" }, { label: "Tools" }]}
        title="Tools"
          subtitle={`${filteredTools.length} tool${filteredTools.length !== 1 ? 's' : ''}`}
          actions={[
            {
              label: 'Export',
              icon: <Download className="w-4 h-4 mr-2" />,
              onClick: () => console.log('Export tools'),
              variant: 'secondary',
            },
            {
              label: 'Add Tool',
              icon: <Plus className="w-4 h-4 mr-2" />,
              onClick: () => console.log('Add tool'),
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
                placeholder="Search tools..."
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

        {/* Category Filter Buttons */}
        <div className="flex gap-2 mb-4 flex-wrap mx-6">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors capitalize ${
                selectedCategory === category
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category} ({categoryCounts[category]})
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mx-6">
          {filteredTools.map((tool) => (
            <div key={tool.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{tool.toolNumber}</h3>
                  <p className="text-sm text-gray-600">{tool.name}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  tool.status === 'Active' 
                    ? 'bg-green-100 text-green-800'
                    : tool.status === 'Maintenance'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {tool.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Category:</span>
                  <span className="text-gray-900 font-medium">{tool.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Make/Model:</span>
                  <span className="text-gray-900 font-medium">{tool.make} {tool.model}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Location:</span>
                  <span className="text-gray-900 font-medium">{tool.location}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Assigned To:</span>
                  <span className="text-gray-900 font-medium">{tool.assignedTo || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Purchase Date:</span>
                  <span className="text-gray-900 font-medium">{tool.purchaseDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Inspection:</span>
                  <span className="text-gray-900 font-medium">{tool.lastInspection}</span>
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

        {filteredTools.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center mx-6">
            <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tools found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </PageHeader>
  );
}
