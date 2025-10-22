'use client';

import { useState, useEffect } from 'react';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';
import { CheckSquare, Plus, Search, Calendar, User, Filter, Clock } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  const statuses = ['all', 'pending', 'in-progress', 'completed'];

  return (
    <HybridNavigationTopBar>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <CompactHeader
            title="Tasks"
            subtitle="Manage your team's tasks and assignments"
            icon={CheckSquare}
            actions={[
              {
                label: 'Create Task',
                onClick: () => {},
                icon: Plus,
                variant: 'primary' as const,
              },
            ]}
          />

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">0</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">0</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">0</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[250px] relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      filterStatus === status
                        ? 'bg-[#3f72af] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-xl shadow-lg p-12 border border-gray-200 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckSquare className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Tasks Yet</h3>
            <p className="text-gray-600 mb-6">Create your first task to start managing your team's work</p>
            <button className="px-6 py-3 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-all shadow-md hover:shadow-lg font-semibold">
              Create First Task
            </button>
          </div>
        </div>
      </div>
    </HybridNavigationTopBar>
  );
}
