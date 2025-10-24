'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import { CheckSquare, Clock, AlertCircle } from 'lucide-react';

export default function CrewTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const userResponse = await api.get('/auth/me');
      const crewId = userResponse.data.id;
      
      const params = new URLSearchParams({ assigned_to: crewId });
      if (filter === 'active') {
        params.append('status', 'pending,in_progress');
      } else if (filter !== 'all') {
        params.append('status', filter);
      }
      
      const response = await api.get(`/tasks?${params.toString()}`);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Tasks"
        subtitle="Manage tasks"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Crew Portal", href: "/crew-portal" }, { label: "Tasks" }]}
        title="My Tasks"
        description="View and manage your assigned tasks"
          />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow shadow-sm border border-gray-200 p-4 mb-6 hover:shadow-md transition-shadow">
          <div className="flex gap-2">
            {['active', 'all', 'pending', 'in_progress', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow shadow-sm border border-gray-200 p-12 text-center hover:shadow-md transition-shadow">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow shadow-sm border border-gray-200 p-12 text-center hover:shadow-md transition-shadow">
            <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600">You don't have any {filter === 'all' ? '' : filter + ' '}tasks</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => router.push(`/tasks/${task.id}`)}
                className="bg-white rounded-lg shadow shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-1 h-full rounded-full ${getPriorityColor(task.priority)}`}></div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></span>
                        {task.priority.toUpperCase()}
                      </span>
                      <span>{task.type.replace('_', ' ')}</span>
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
