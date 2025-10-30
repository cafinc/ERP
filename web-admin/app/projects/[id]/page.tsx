'use client';

import PageHeader from '@/components/PageHeader';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  DollarSign,
  FileText,
  Plus,
  RefreshCw,
  AlertCircle,
  MapPin,
  Briefcase,
  CheckSquare,
  Square,
  Loader,
} from 'lucide-react';

interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  assignee_name?: string;
  due_date?: string;
  status: 'todo' | 'in_progress' | 'done';
  created_at: string;
  completed_at?: string;
}

interface Project {
  _id: string;
  project_number: string;
  name: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  estimate_id: string;
  estimate_number?: string;
  description?: string;
  tasks: ProjectTask[];
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  created_at: string;
  completed_at?: string;
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignee_id: '',
    due_date: '',
  });

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) {
      console.error('No project ID provided');
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data);
    } catch (error: any) {
      console.error('Error loading project:', error);
      
      // Handle different error types
      if (error.response?.status === 400) {
        alert('Invalid project ID. Redirecting to projects list...');
        router.push('/projects');
      } else if (error.response?.status === 404) {
        alert('Project not found. It may have been deleted.');
        router.push('/projects');
      } else {
        alert('Failed to load project. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title) {
      alert('Please enter a task title');
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/projects/${projectId}/tasks`, taskForm);
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assignee_id: '', due_date: '' });
      loadProject();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await api.put(`/projects/${projectId}/tasks/${taskId}`, { status: newStatus });
      loadProject();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;

    try {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`);
      loadProject();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const handleUpdateProjectStatus = async (newStatus: string) => {
    if (!confirm(`Change project status to ${newStatus}?`)) return;

    try {
      setActionLoading(true);
      await api.put(`/projects/${projectId}`, { status: newStatus });
      loadProject();
    } catch (error) {
      console.error('Error updating project status:', error);
      alert('Failed to update project status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'planning': return 'bg-blue-100 text-blue-700';
      case 'active': return 'bg-yellow-100 text-yellow-700';
      case 'on_hold': return 'bg-orange-100 text-orange-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'planning': return <Clock className="w-4 h-4" />;
      case 'active': return <RefreshCw className="w-4 h-4" />;
      case 'on_hold': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Briefcase className="w-4 h-4" />;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'done': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const calculateProgress = () => {
    if (!project || !project.tasks || project.tasks.length === 0) return 0;
    const completed = project.tasks.filter(t => t.status === 'done').length;
    return Math.round((completed / project.tasks.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Projects Details"
        subtitle="View and manage details"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Projects", href: "/projects" }, { label: "Details" }]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
    
        </div>
    </div>
    </div>
    );
  }

  if (!project) {
    return (
              <div className="p-8">
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-12 text-center hover:shadow-md transition-shadow">
            <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h3>
            <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/projects')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Projects</span>
            </button>
          </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Project Details"
        subtitle={project?.name || "View project"}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Projects", href: "/projects" }, { label: "Details" }]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="p-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/projects')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {project.project_number}
              </h1>
              <p className="text-gray-600 mt-1">{project.name}</p>
            </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`/projects/${projectId}/edit`)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Project</span>
            </button>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Relationship Map Card */}
            <div className="bg-gradient-to-br from-[#3f72af] to-[#2c5282] rounded-xl shadow-sm p-4 text-white">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Project Relationships
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Customer Link */}
                <button
                  onClick={() => router.push(`/customers/${project.customer_id}`)}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-4 text-left transition-all shadow-sm border border-white/20 hover:border-white/40 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <User className="w-5 h-5 opacity-75" />
                    <span className="text-xs opacity-75">View Details →</span>
                  </div>
                  <p className="text-xs opacity-75 mb-1">Customer</p>
                  <p className="font-semibold truncate">{project.customer_name || 'Unknown'}</p>
                  {project.customer_email && (
                    <p className="text-xs opacity-75 mt-1 truncate">{project.customer_email}</p>
                  )}
                </button>

                {/* Estimate Link */}
                <button
                  onClick={() => router.push(`/estimates/${project.estimate_id}`)}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-4 text-left transition-all shadow-sm border border-white/20 hover:border-white/40 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="w-5 h-5 opacity-75" />
                    <span className="text-xs opacity-75">View Estimate →</span>
                  </div>
                  <p className="text-xs opacity-75 mb-1">Source Estimate</p>
                  <p className="font-semibold truncate">#{project.estimate_number || project.estimate_id}</p>
                  <p className="text-xs opacity-75 mt-1">Converted to Project</p>
                </button>

                {/* Quick Stats */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-white/20 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <CheckSquare className="w-5 h-5 opacity-75" />
                    <span className="text-2xl font-bold">{calculateProgress()}%</span>
                  </div>
                  <p className="text-xs opacity-75 mb-1">Progress</p>
                  <p className="font-semibold">
                    {project.tasks?.filter(t => t.status === 'done').length || 0} / {project.tasks?.length || 0} Tasks
                  </p>
                </div>

            {/* Project Info */}
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Project Information</h2>
                <span className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                  {getStatusIcon(project.status)}
                  <span>{project.status?.replace('_', ' ')}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Customer</label>
                  <p className="text-base font-medium text-gray-900 mt-1 flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    {project.customer_name || 'Unknown'}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Start Date</label>
                  <p className="text-base font-medium text-gray-900 mt-1 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-600">End Date</label>
                  <p className="text-base font-medium text-gray-900 mt-1 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Estimate</label>
                  <p className="text-base font-medium text-gray-900 mt-1 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-gray-400" />
                    {project.estimate_number || project.estimate_id}
                  </p>
                </div>

              {project.description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="text-sm text-gray-600">Description</label>
                  <p className="text-base text-gray-900 mt-2">{project.description}</p>
                </div>
              )}

              {/* Progress Bar */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Overall Progress</span>
                  <span className="font-semibold">{calculateProgress()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-[#3f72af] h-3 rounded-full transition-all"
                    style={{ width: `${calculateProgress()}%` }}
                  />
                </div>

            {/* Tasks Section */}
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
              </div>

              {project.tasks && project.tasks.length > 0 ? (
                <div className="space-y-3">
                  {project.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => {
                                const newStatus = task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'done';
                                handleUpdateTaskStatus(task.id, newStatus);
                              }}
                              className="flex-shrink-0"
                            >
                              {task.status === 'done' ? (
                                <CheckSquare className="w-5 h-5 text-green-600" />
                              ) : task.status === 'in_progress' ? (
                                <Loader className="w-5 h-5 text-[#3f72af]" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                            <div className="flex-1">
                              <h3 className={`text-base font-medium ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                {task.assignee_name && (
                                  <span className="flex items-center">
                                    <User className="w-3 h-3 mr-1" />
                                    {task.assignee_name}
                                  </span>
                                )}
                                {task.due_date && (
                                  <span className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {new Date(task.due_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No tasks yet. Add your first task to get started.</p>
                </div>
              )}
            </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Actions</h3>
              <div className="space-y-2">
                {project.status !== 'active' && (
                  <button
                    onClick={() => handleUpdateProjectStatus('active')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Mark Active</span>
                  </button>
                )}
                {project.status !== 'on_hold' && (
                  <button
                    onClick={() => handleUpdateProjectStatus('on_hold')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Put On Hold</span>
                  </button>
                )}
                {project.status !== 'completed' && (
                  <button
                    onClick={() => handleUpdateProjectStatus('completed')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark Completed</span>
                  </button>
                )}
              </div>

            {/* Task Summary */}
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Tasks</span>
                  <span className="text-lg font-bold text-gray-900">{project.tasks?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">To Do</span>
                  <span className="text-lg font-bold text-gray-500">
                    {project.tasks?.filter(t => t.status === 'todo').length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <span className="text-lg font-bold text-[#3f72af]">
                    {project.tasks?.filter(t => t.status === 'in_progress').length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="text-lg font-bold text-green-600">
                    {project.tasks?.filter(t => t.status === 'done').length || 0}
                  </span>
                </div>

        {/* Task Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Task</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter task description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

              <div className="flex items-center space-x-3 mt-6">
                <button
                  onClick={handleCreateTask}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Add Task</span>
                </button>
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    setTaskForm({ title: '', description: '', assignee_id: '', due_date: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
          </div>
        </div>
        </div>
        )}
        </div>
        </div>
    </div>
  );
}
