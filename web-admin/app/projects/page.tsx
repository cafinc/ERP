'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import CustomerQuickViewModal from '@/components/CustomerQuickViewModal';
import api from '@/lib/api';
import {
  Plus,
  Search,
  Eye,
  Edit,
  FolderOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  User,
  Calendar,
  RefreshCw,
  DollarSign,
  MapPin,
} from 'lucide-react';

interface Project {
  _id: string;
  project_number: string;
  name: string;
  customer_id: string;
  customer_name?: string;
  status: string;
  start_date: string;
  end_date?: string;
  total_amount: number;
  completion_percentage: number;
  site_address?: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'planning': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'on_hold': return 'bg-orange-100 text-orange-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'planning': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <RefreshCw className="w-4 h-4" />;
      case 'on_hold': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <FolderOpen className="w-4 h-4" />;
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.project_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || project.status?.toLowerCase() === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const statsData = {
    total: projects.length,
    inProgress: projects.filter(p => p.status?.toLowerCase() === 'in_progress').length,
    completed: projects.filter(p => p.status?.toLowerCase() === 'completed').length,
    totalValue: projects.reduce((sum, p) => sum + (p.total_amount || 0), 0),
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      );
  }

  return (
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        {/* Compact Header */}
        <PageHeader
        title="Projects"
        subtitle="Manage your service projects and milestones"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "CRM", href: "/crm/dashboard" }, { label: "Projects" }]}
        title="Projects"
          
          actions={[
            {
              label: 'New Project',
              icon: <Plus className="w-4 h-4 mr-2" />,
              onClick: () => router.push('/projects/create'),
              variant: 'primary',
            },
          ]}
        />

        {/* Status Filter Buttons */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-[#3f72af] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
                }`}
              >
                All ({projects.length})
              </button>
              <button
                onClick={() => setFilterStatus('planning')}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  filterStatus === 'planning'
                    ? 'bg-[#3f72af] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
                }`}
              >
                Planning ({projects.filter(p => p.status?.toLowerCase() === 'planning').length})
              </button>
              <button
                onClick={() => setFilterStatus('in_progress')}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  filterStatus === 'in_progress'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
                }`}
              >
                In Progress ({projects.filter(p => p.status?.toLowerCase() === 'in_progress').length})
              </button>
              <button
                onClick={() => setFilterStatus('on_hold')}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  filterStatus === 'on_hold'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
                }`}
              >
                On Hold ({projects.filter(p => p.status?.toLowerCase() === 'on_hold').length})
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  filterStatus === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
                }`}
              >
                Completed ({projects.filter(p => p.status?.toLowerCase() === 'completed').length})
              </button>
              <button
                onClick={() => setFilterStatus('cancelled')}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  filterStatus === 'cancelled'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
                }`}
              >
                Cancelled ({projects.filter(p => p.status?.toLowerCase() === 'cancelled').length})
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="List View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Grid View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg px-3 py-1.5 flex items-center space-x-2 hover:shadow-md transition-shadow">
              <DollarSign className="w-4 h-4 text-[#3f72af]" />
              <span className="text-xs font-medium text-gray-700">Total Value:</span>
              <span className="text-lg font-bold text-[#3f72af]">
                ${projects.reduce((sum, p) => sum + (p.total_amount || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-3 mb-4 mx-6 mt-6 hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by project number, name, or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <button
              onClick={loadProjects}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-100 transition-all text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Projects Display */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-12 text-center mx-6 hover:shadow-md transition-shadow">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Get started by creating your first project'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <button
                onClick={() => router.push('/projects/create')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create First Project</span>
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mx-6">
            {filteredProjects.map((project, index) => {
              const statusColor = getStatusColor(project.status);
              const statusIcon = getStatusIcon(project.status);
              
              return (
                <div
                  key={project._id || `project-${index}`}
                  className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer overflow-hidden hover:shadow-md transition-shadow"
                  onClick={() => project._id && router.push(`/projects/${project._id}`)}
                >
                  {/* Card Header */}
                  <div className={`p-4 bg-gradient-to-br relative ${statusColor.includes('blue') ? 'from-blue-500 to-blue-600' : statusColor.includes('green') ? 'from-green-500 to-green-600' : statusColor.includes('yellow') ? 'from-yellow-500 to-yellow-600' : statusColor.includes('orange') ? 'from-orange-500 to-orange-600' : statusColor.includes('red') ? 'from-red-500 to-red-600' : 'from-gray-500 to-gray-600'}`}>
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusColor} bg-white`}>
                        {statusIcon}
                        {project.status}
                      </span>
                    </div>
                    <div className="text-white mt-8">
                      <p className="text-xs opacity-90 mb-1">#{project.project_number}</p>
                      <h3 className="text-lg font-bold truncate">{project.name}</h3>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
                    {/* Customer */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{project.customer_name || 'No customer'}</span>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>{new Date(project.start_date).toLocaleDateString()}</span>
                      {project.end_date && (
                        <>
                          <span>→</span>
                          <span>{new Date(project.end_date).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>

                    {/* Location */}
                    {project.site_address && (
                      <div className="flex items-start gap-2 text-xs text-gray-600 mb-3">
                        <MapPin className="w-3 h-3 text-gray-400 mt-0.5" />
                        <span className="line-clamp-1">{project.site_address}</span>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span className="font-medium">{project.completion_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#3f72af] h-2 rounded-full transition-all"
                          style={{ width: `${project.completion_percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-600">Total Value</span>
                      <span className="text-lg font-bold text-[#3f72af]">
                        ${project.total_amount?.toLocaleString() || '0'}
                      </span>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (project._id) {
                            router.push(`/projects/${project._id}`);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 bg-[#3f72af] hover:bg-[#2c5282] text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (project._id) {
                            router.push(`/projects/${project._id}/edit`);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-100 transition-all text-gray-700 text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="mx-6 space-y-3">
            {filteredProjects.map((project, index) => {
              const statusColor = getStatusColor(project.status);
              const statusIcon = getStatusIcon(project.status);
              
              return (
                <div
                  key={project._id || `project-${index}`}
                  className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-500 transition-all cursor-pointer p-4 hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/projects/${project._id}`)}
                >
                  <div className="flex items-center gap-4">
                    {/* Status Indicator */}
                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${statusColor}`}>
                      {statusIcon}
                    </div>

                    {/* Project Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">#{project.project_number}</span>
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {project.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusColor}`}>
                          {statusIcon}
                          {project.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{project.customer_name || 'No customer'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{new Date(project.start_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">${project.total_amount?.toLocaleString() || '0'}</span>
                        </div>
                        {/* Progress */}
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[#3f72af] h-2 rounded-full"
                              style={{ width: `${project.completion_percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{project.completion_percentage}%</span>
                        </div>
                      </div>

                      {project.site_address && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{project.site_address}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/projects/${project._id}`);
                        }}
                        className="px-4 py-2 bg-[#3f72af] hover:bg-[#2c5282] text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/projects/${project._id}/edit`);
                        }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-100 transition-all text-gray-700 text-sm rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Customer Quick View Modal */}
      {selectedCustomerId && (
        <CustomerQuickViewModal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
    </div>
  );
}
