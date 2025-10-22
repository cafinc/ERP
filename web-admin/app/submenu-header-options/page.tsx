'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Home, 
  ChevronRight,
  Plus,
  Download,
  Settings,
  Filter,
  Search
} from 'lucide-react';

export default function SubmenuHeaderOptions() {
  const [selectedOption, setSelectedOption] = useState<string>('');

  const headerOptions = [
    {
      id: 'simple',
      name: 'Simple Title Only',
      description: 'Clean and minimal, just the page title',
      component: (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Employee Management</h1>
        </div>
      )
    },
    {
      id: 'with-subtitle',
      name: 'Title with Subtitle',
      description: 'Title with descriptive subtitle below',
      component: (
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <h1 className="text-2xl font-semibold text-gray-900">Employee Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your team members, roles, and access permissions</p>
        </div>
      )
    },
    {
      id: 'breadcrumb-simple',
      name: 'Breadcrumb Navigation (Simple)',
      description: 'Shows navigation path with simple separators',
      component: (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <nav className="flex items-center text-sm text-gray-500 mb-2">
            <Link href="/" className="hover:text-gray-700">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link href="/hr" className="hover:text-gray-700">HR Module</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-900 font-medium">Employees</span>
          </nav>
          <h1 className="text-2xl font-semibold text-gray-900">Employee Management</h1>
        </div>
      )
    },
    {
      id: 'breadcrumb-with-back',
      name: 'Breadcrumb with Back Button',
      description: 'Breadcrumb navigation with a prominent back button',
      component: (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4 mb-3">
            <button className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ChevronLeft className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <nav className="flex items-center text-sm text-gray-500">
              <Link href="/" className="hover:text-gray-700">Home</Link>
              <ChevronRight className="w-4 h-4 mx-2" />
              <Link href="/hr" className="hover:text-gray-700">HR Module</Link>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="text-gray-900 font-medium">Employees</span>
            </nav>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Employee Management</h1>
        </div>
      )
    },
    {
      id: 'with-actions',
      name: 'Title with Action Buttons',
      description: 'Page title with action buttons on the right',
      component: (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Employee Management</h1>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4 inline mr-2" />
                Export
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4 inline mr-2" />
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'full-featured',
      name: 'Full Featured Header',
      description: 'Breadcrumb, title, subtitle, and action buttons',
      component: (
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <nav className="flex items-center text-sm text-gray-500 mb-3">
            <Link href="/" className="hover:text-gray-700">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link href="/hr" className="hover:text-gray-700">HR Module</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-900 font-medium">Employees</span>
          </nav>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Employee Management</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your team members, roles, and access permissions</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4 inline mr-2" />
                Export
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4 inline mr-2" />
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'colored-background',
      name: 'Colored Background Header',
      description: 'Header with subtle colored background',
      component: (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-6 py-5">
          <nav className="flex items-center text-sm text-blue-700 mb-3">
            <Link href="/" className="hover:text-blue-900">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link href="/hr" className="hover:text-blue-900">HR Module</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-blue-900 font-medium">Employees</span>
          </nav>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Employee Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your team members, roles, and access permissions</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm">
                <Download className="w-4 h-4 inline mr-2" />
                Export
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm">
                <Plus className="w-4 h-4 inline mr-2" />
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'with-tabs',
      name: 'Header with Tab Navigation',
      description: 'Page header with horizontal tabs for sub-sections',
      component: (
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold text-gray-900">Employee Management</h1>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4 inline mr-2" />
                Add Employee
              </button>
            </div>
          </div>
          <div className="px-6">
            <div className="flex gap-6 border-b border-gray-200">
              <button className="pb-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                Active (24)
              </button>
              <button className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-700">
                Inactive (5)
              </button>
              <button className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-700">
                Pending (3)
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'with-search-filter',
      name: 'Header with Search & Filters',
      description: 'Header with integrated search bar and filter controls',
      component: (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Employee Management</h1>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4 inline mr-2" />
              Add Employee
            </button>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4 inline mr-2" />
              Filters
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'compact',
      name: 'Compact Header',
      description: 'Space-efficient design for data-dense pages',
      component: (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Employee Management</h1>
                <p className="text-xs text-gray-500">32 employees</p>
              </div>
            </div>
            <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4 inline mr-1" />
              Add
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'card-style',
      name: 'Card-Style Header',
      description: 'Header styled as an elevated card',
      component: (
        <div className="px-6 pt-6 pb-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <nav className="flex items-center text-sm text-gray-500 mb-3">
              <Link href="/" className="hover:text-gray-700">Home</Link>
              <ChevronRight className="w-4 h-4 mx-2" />
              <Link href="/hr" className="hover:text-gray-700">HR Module</Link>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="text-gray-900 font-medium">Employees</span>
            </nav>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Employee Management</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your team members, roles, and access permissions</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Download className="w-4 h-4 inline mr-2" />
                  Export
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submenu Page Header Options</h1>
          <p className="text-gray-600">Choose the header style for pages within submenus (HR, Integrations, etc.)</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Selection Summary */}
        {selectedOption && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900">
              ✓ Selected: <span className="font-bold">
                {headerOptions.find(opt => opt.id === selectedOption)?.name}
              </span>
            </p>
          </div>
        )}

        {/* Options Grid */}
        <div className="space-y-8">
          {headerOptions.map((option) => (
            <div key={option.id} className="bg-white rounded-lg shadow-sm border-2 border-gray-200 overflow-hidden hover:border-blue-300 transition-colors">
              {/* Option Info */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{option.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOption(option.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      selectedOption === option.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {selectedOption === option.id ? '✓ Selected' : 'Select'}
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-white">
                <div className="text-xs text-gray-500 px-4 pt-3 pb-1 bg-gray-100 border-b border-gray-200">
                  Preview:
                </div>
                {option.component}
                {/* Mock content below header */}
                <div className="p-6 bg-gray-50">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between items-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div>
            {selectedOption ? (
              <p className="text-sm text-gray-600">
                Selected: <span className="font-semibold text-gray-900">
                  {headerOptions.find(opt => opt.id === selectedOption)?.name}
                </span>
              </p>
            ) : (
              <p className="text-sm text-gray-500">Please select a header option above</p>
            )}
          </div>
          <div className="flex gap-3">
            <Link 
              href="/"
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              disabled={!selectedOption}
              className={`px-6 py-2 text-sm font-medium rounded-lg ${
                selectedOption
                  ? 'text-white bg-blue-600 hover:bg-blue-700'
                  : 'text-gray-400 bg-gray-200 cursor-not-allowed'
              }`}
            >
              Apply to All Pages
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
