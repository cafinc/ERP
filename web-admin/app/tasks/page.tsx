'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Flame,
  ArrowUpCircle,
  FileText,
  Circle,
  CheckCircle2,
  AlertCircle,
  X,
  PlayCircle,
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  assigned_to: string[];
  assigned_by_name: string;
  created_at: string;
  due_date?: string;
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [filterStatus, priorityFilter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      
      const response = await api.get(`/tasks?${params.toString()}`);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statuses = ['all', 'pending', 'in_progress', 'completed', 'cancelled'];
  const priorities = ['all', 'urgent', 'high', 'medium', 'low'];

  const getStats = () => {
    return {
      total: tasks.length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => {
        if (!t.due_date) return false;
        return new Date(t.due_date) < new Date() && t.status !== 'completed';
      }).length,
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Tasks"
        subtitle={`${filteredTasks.length} ${filteredTasks.length === 1 ? 'task' : 'tasks'}`}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Tasks" }]}
        actions={[
          {
            label: 'Create Task',
            onClick: () => router.push('/tasks/create'),
            icon: <Plus className="w-4 h-4 mr-2" />,
            variant: 'primary' as const,
          },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#3f72af]" />
                <p className="text-xs font-medium text-gray-600">Total Tasks</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-medium text-gray-600">In Progress</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-xs font-medium text-gray-600">Completed</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-xs font-medium text-gray-600">Overdue</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Filters */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-gray-500" />
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-md font-medium text-xs transition-all ${
                    filterStatus === status
                      ? 'bg-[#3f72af] text-white shadow-sm'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-[#3f72af] hover:text-[#3f72af]'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Priority Filters */}
            <div className="flex items-center gap-1.5">
              {priorities.map((priority) => (
                <button
                  key={priority}
                  onClick={() => setPriorityFilter(priority)}
                  className={`px-3 py-1.5 rounded-md font-medium text-xs transition-all ${
                    priorityFilter === priority
                      ? 'bg-[#3f72af] text-white shadow-sm'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-[#3f72af] hover:text-[#3f72af]'
                  }`}
                >
                  {priority === 'all' ? '🎯' : priority === 'urgent' ? '🚨' : priority === 'high' ? '⚡' : priority === 'medium' ? '📋' : '📝'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f72af]"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
            <div className="w-20 h-20 bg-[#3f72af] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {searchTerm ? 'No tasks found' : 'No Tasks Yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search or filters' : "Create your first task to start managing your team's work"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => router.push('/tasks/create')}
                className="inline-flex items-center px-6 py-3 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors shadow-md font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Task
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={() => router.push(`/tasks/${task.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-700 bg-gray-50 border-gray-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-700 bg-green-50 border-green-200';
      case 'in_progress': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'pending': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'cancelled': return 'text-gray-700 bg-gray-50 border-gray-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Flame className="w-4 h-4" />;
      case 'high': return <ArrowUpCircle className="w-4 h-4" />;
      case 'medium': return <FileText className="w-4 h-4" />;
      case 'low': return <Circle className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'in_progress': return <PlayCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#3f72af] transition-colors mb-1.5 truncate">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-1">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
              {getPriorityIcon(task.priority)}
              <span className="ml-1 capitalize">{task.priority}</span>
            </span>
            
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(task.status)}`}>
              {getStatusIcon(task.status)}
              <span className="ml-1 capitalize">{task.status.replace('_', ' ')}</span>
            </span>

            <span className="inline-flex items-center text-xs text-gray-500">
              <FileText className="w-3 h-3 mr-1" />
              {task.type.replace('_', ' ')}
            </span>

            {task.due_date && (
              <span className="inline-flex items-center text-xs text-gray-500">
                <Calendar className="w-3 h-3 mr-1" />
                Due {formatDate(task.due_date)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
