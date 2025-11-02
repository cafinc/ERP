'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import {
  FileText,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Filter,
  Download,
  Archive,
  ClipboardList,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Copy,
  Star,
  TrendingUp,
  Clock,
  Users,
  BarChart3,
  CheckSquare,
  Square,
  Calendar,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';

interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  form_type: string;
  fields: any[];
  created_at: string;
  created_by: string;
  usage_count?: number;
  is_featured?: boolean;
  is_archived?: boolean;
  last_used?: string;
}

interface FormResponse {
  id: string;
  form_template_id: string;
  submitted_by: string;
  submitted_at: string;
  data: any;
  status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  site_id?: string;
  equipment_id?: string;
  customer_id?: string;
}

type SortField = 'name' | 'created_at' | 'usage_count' | 'last_used';
type SortOrder = 'asc' | 'desc';

export default function FormsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'templates' | 'responses'>('templates');
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Search States
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Bulk Actions States
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [selectedResponses, setSelectedResponses] = useState<string[]>([]);
  
  // Submission Filters
  const [submissionFilterStatus, setSubmissionFilterStatus] = useState<string>('all');
  const [submissionSearchQuery, setSubmissionSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [templatesRes, responsesRes] = await Promise.all([
        api.get('/form-templates'),
        api.get('/form-responses'),
      ]);
      
      // Add mock usage data for demonstration
      const templatesWithUsage = (templatesRes.data || []).map((t: any) => ({
        ...t,
        usage_count: Math.floor(Math.random() * 100),
        is_featured: Math.random() > 0.7,
        is_archived: false,
        last_used: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      }));
      
      // Add mock status to responses
      const responsesWithStatus = (responsesRes.data || []).map((r: any) => ({
        ...r,
        status: ['submitted', 'under_review', 'approved', 'rejected'][Math.floor(Math.random() * 4)],
      }));
      
      setTemplates(templatesWithUsage);
      setResponses(responsesWithStatus);
    } catch (error) {
      console.error('Error fetching forms data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to archive this form template?')) return;
    
    try {
      await api.delete(`/form-templates/${id}`);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const handleDuplicateTemplate = async (template: FormTemplate) => {
    try {
      const duplicated = {
        ...template,
        name: `${template.name} (Copy)`,
        id: undefined,
      };
      const response = await api.post('/form-templates', duplicated);
      alert('Template duplicated successfully!');
      fetchData();
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Failed to duplicate template');
    }
  };

  const handleToggleFeatured = async (id: string) => {
    setTemplates(templates.map(t => 
      t.id === id ? { ...t, is_featured: !t.is_featured } : t
    ));
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Archive ${selectedTemplates.length} template(s)?`)) return;
    
    try {
      await Promise.all(selectedTemplates.map(id => api.delete(`/form-templates/${id}`)));
      setTemplates(templates.filter(t => !selectedTemplates.includes(t.id)));
      setSelectedTemplates([]);
      alert('Templates archived successfully');
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('Failed to archive some templates');
    }
  };

  const handleBulkExport = () => {
    const selected = templates.filter(t => selectedTemplates.includes(t.id));
    const data = selected.map(t => ({
      Name: t.name,
      Type: t.form_type,
      Fields: t.fields?.length || 0,
      'Created At': new Date(t.created_at).toLocaleDateString(),
      'Usage Count': t.usage_count || 0,
    }));
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form_templates_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    alert(`Exported ${selectedTemplates.length} template(s)`);
  };

  const handleExportSubmissions = () => {
    const filtered = filteredResponses;
    const data = filtered.map(r => {
      const template = templates.find(t => t.id === r.form_template_id);
      return {
        'Form Name': template?.name || 'Unknown',
        'Submitted By': r.submitted_by,
        'Submitted At': new Date(r.submitted_at).toLocaleString(),
        'Status': r.status || 'submitted',
      };
    });
    
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form_submissions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    alert(`Exported ${filtered.length} submission(s)`);
  };

  const formTypes = [
    { 
      id: 'all', 
      label: 'All', 
      color: 'purple', 
      count: templates.filter(t => !t.is_archived).length 
    },
    { 
      id: 'crm', 
      label: 'CRM', 
      color: 'blue',
      subtypes: ['Customers', 'Estimates', 'Agreements', 'Projects', 'Invoices'],
      count: templates.filter(t => t.form_type?.startsWith('crm') && !t.is_archived).length 
    },
    { 
      id: 'financials', 
      label: 'Financials', 
      color: 'green',
      subtypes: ['Invoices', 'Estimates', 'Expenses', 'Payments', 'Reports'],
      count: templates.filter(t => t.form_type?.startsWith('financials') && !t.is_archived).length 
    },
    { 
      id: 'access', 
      label: 'Access', 
      color: 'cyan',
      subtypes: ['Team', 'Crew'],
      count: templates.filter(t => t.form_type?.startsWith('access') && !t.is_archived).length 
    },
    { 
      id: 'assets', 
      label: 'Assets', 
      color: 'orange',
      subtypes: ['Equipment', 'Vehicles', 'Trailers', 'Tools', 'Maintenance', 'Inspections'],
      count: templates.filter(t => t.form_type?.startsWith('assets') && !t.is_archived).length 
    },
    { 
      id: 'dispatch', 
      label: 'Dispatch', 
      color: 'indigo',
      subtypes: ['Routes', 'Jobs', 'Schedules'],
      count: templates.filter(t => t.form_type?.startsWith('dispatch') && !t.is_archived).length 
    },
    { 
      id: 'comms', 
      label: 'Comms', 
      color: 'pink',
      subtypes: ['Messages', 'Notifications'],
      count: templates.filter(t => t.form_type?.startsWith('comms') && !t.is_archived).length 
    },
    { 
      id: 'safety', 
      label: 'Safety', 
      color: 'red',
      subtypes: ['Policies', 'Training', 'Incidents', 'Inspections', 'Hazards', 'PPE', 'Meetings', 'Emergency'],
      count: templates.filter(t => t.form_type?.startsWith('safety') && !t.is_archived).length 
    },
    { 
      id: 'tasks', 
      label: 'Tasks', 
      color: 'yellow',
      subtypes: ['General', 'Projects', 'Maintenance'],
      count: templates.filter(t => t.form_type?.startsWith('tasks') && !t.is_archived).length 
    },
  ];

  const getFormTypeBadgeColor = (type: string) => {
    if (type.startsWith('crm')) return 'bg-blue-100 text-blue-700';
    if (type.startsWith('financials')) return 'bg-green-100 text-green-700';
    if (type.startsWith('access')) return 'bg-cyan-100 text-cyan-700';
    if (type.startsWith('assets')) return 'bg-orange-100 text-orange-700';
    if (type.startsWith('dispatch')) return 'bg-indigo-100 text-indigo-700';
    if (type.startsWith('comms')) return 'bg-pink-100 text-pink-700';
    if (type.startsWith('safety')) return 'bg-red-100 text-red-700';
    if (type.startsWith('tasks')) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'submitted': return 'bg-blue-100 text-blue-700';
      case 'under_review': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'submitted': return 'Submitted';
      case 'under_review': return 'Under Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  // Filter and sort templates
  const filteredAndSortedTemplates = templates
    .filter(t => !t.is_archived)
    .filter(t => {
      const matchesSearch = !searchQuery || 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || t.form_type?.startsWith(filterType);
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'created_at':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case 'usage_count':
          aVal = a.usage_count || 0;
          bVal = b.usage_count || 0;
          break;
        case 'last_used':
          aVal = a.last_used ? new Date(a.last_used).getTime() : 0;
          bVal = b.last_used ? new Date(b.last_used).getTime() : 0;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

  // Filter responses
  const filteredResponses = responses.filter(r => {
    const template = templates.find(t => t.id === r.form_template_id);
    const matchesSearch = !submissionSearchQuery ||
      template?.name.toLowerCase().includes(submissionSearchQuery.toLowerCase()) ||
      r.submitted_by.toLowerCase().includes(submissionSearchQuery.toLowerCase());
    const matchesStatus = submissionFilterStatus === 'all' || r.status === submissionFilterStatus;
    const matchesDateRange = (!dateRange.start || new Date(r.submitted_at) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(r.submitted_at) <= new Date(dateRange.end));
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Analytics
  const stats = {
    totalTemplates: templates.filter(t => !t.is_archived).length,
    totalSubmissions: responses.length,
    mostUsedForm: templates.reduce((max, t) => 
      (t.usage_count || 0) > (max.usage_count || 0) ? t : max
    , templates[0] || {}),
    pendingReviews: responses.filter(r => r.status === 'under_review').length,
    completionRate: responses.length > 0 
      ? Math.round((responses.filter(r => r.status === 'approved').length / responses.length) * 100)
      : 0,
  };

  // Recently used templates
  const recentlyUsed = [...templates]
    .filter(t => t.last_used && !t.is_archived)
    .sort((a, b) => new Date(b.last_used!).getTime() - new Date(a.last_used!).getTime())
    .slice(0, 3);

  // Featured templates
  const featuredTemplates = templates.filter(t => t.is_featured && !t.is_archived).slice(0, 3);

  const toggleSelectAllTemplates = () => {
    if (selectedTemplates.length === filteredAndSortedTemplates.length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(filteredAndSortedTemplates.map(t => t.id));
    }
  };

  const toggleSelectTemplate = (id: string) => {
    setSelectedTemplates(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
      {/* Header */}
      <PageHeader
        title="Forms Management"
        icon={<ClipboardList size={28} />}
        subtitle="Create and manage custom forms with advanced analytics"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Forms" }]}
        actions={[
          {
            label: 'Create Form',
            icon: <Plus className="w-4 h-4" />,
            onClick: () => window.location.href = '/forms/builder',
            variant: 'primary',
          },
        ]}
      />

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mx-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTemplates}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Most Used</p>
              <p className="text-lg font-bold text-gray-900 truncate">{stats.mostUsedForm?.name || '-'}</p>
              <p className="text-xs text-gray-500">{stats.mostUsedForm?.usage_count || 0} uses</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Recently Used & Featured */}
      {(recentlyUsed.length > 0 || featuredTemplates.length > 0) && (
        <div className="mx-6 mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recently Used */}
          {recentlyUsed.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  Recently Used
                </h3>
              </div>
              <div className="space-y-2">
                {recentlyUsed.map(template => (
                  <Link
                    key={template.id}
                    href={`/forms/${template.id}/fill`}
                    className="block p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{template.name}</p>
                        <p className="text-xs text-gray-500">
                          Last used: {new Date(template.last_used!).toLocaleDateString()}
                        </p>
                      </div>
                      <FileText className="w-4 h-4 text-gray-400 ml-2" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Featured Templates */}
          {featuredTemplates.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Featured Templates
                </h3>
              </div>
              <div className="space-y-2">
                {featuredTemplates.map(template => (
                  <Link
                    key={template.id}
                    href={`/forms/${template.id}/fill`}
                    className="block p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{template.name}</p>
                        <p className="text-xs text-gray-500">
                          {template.usage_count} uses
                        </p>
                      </div>
                      <FileText className="w-4 h-4 text-gray-400 ml-2" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 mt-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'templates'
                ? 'bg-[#3f72af] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Form Templates ({stats.totalTemplates})
          </button>
          <button
            onClick={() => setActiveTab('responses')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'responses'
                ? 'bg-[#3f72af] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Submissions ({stats.totalSubmissions})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      ) : (
        <div className="mx-6 mt-6">
          {activeTab === 'templates' ? (
            <>
              {/* Category Filters */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex flex-wrap gap-2">
                  {formTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setFilterType(type.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        filterType === type.id
                          ? `bg-${type.color}-100 text-${type.color}-700 border-2 border-${type.color}-300`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                      }`}
                    >
                      {type.label} ({type.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Search & Sort Bar */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search forms by name or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Sort */}
                  <div className="flex gap-2">
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as SortField)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="created_at">Sort by Date Created</option>
                      <option value="usage_count">Sort by Most Used</option>
                      <option value="last_used">Sort by Recently Used</option>
                    </select>

                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    >
                      {sortOrder === 'asc' ? (
                        <ArrowUp className="w-5 h-5" />
                      ) : (
                        <ArrowDown className="w-5 h-5" />
                      )}
                    </button>

                    <button
                      onClick={fetchData}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Clear Filters */}
                {(searchQuery || filterType !== 'all' || sortField !== 'name') && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterType('all');
                        setSortField('name');
                        setSortOrder('asc');
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-2 text-sm"
                    >
                      <X className="w-4 h-4" />
                      <span>Clear Filters</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Bulk Actions Toolbar */}
              {selectedTemplates.length > 0 && (
                <div className="bg-[#3f72af] text-white rounded-lg p-4 mb-4 shadow-lg">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-5 h-5" />
                      <span className="font-medium">{selectedTemplates.length} template(s) selected</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handleBulkExport}
                        className="px-4 py-2 bg-white text-[#3f72af] rounded-lg font-medium transition-colors hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                      </button>
                      
                      <button
                        onClick={handleBulkDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium transition-colors hover:bg-red-700 flex items-center space-x-2"
                      >
                        <Archive className="w-4 h-4" />
                        <span>Archive</span>
                      </button>
                      
                      <button
                        onClick={() => setSelectedTemplates([])}
                        className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium transition-colors hover:bg-white/30 flex items-center space-x-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Clear</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Count & Select All */}
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{filteredAndSortedTemplates.length}</span> of <span className="font-semibold">{templates.filter(t => !t.is_archived).length}</span> templates
                </p>
                {filteredAndSortedTemplates.length > 0 && (
                  <button
                    onClick={toggleSelectAllTemplates}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#3f72af] transition-colors"
                  >
                    {selectedTemplates.length === filteredAndSortedTemplates.length ? (
                      <CheckSquare className="w-5 h-5 text-[#3f72af]" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                    <span>Select All</span>
                  </button>
                )}
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedTemplates.map((template) => {
                  const isSelected = selectedTemplates.includes(template.id);
                  return (
                    <div
                      key={template.id}
                      className={`bg-white rounded-xl shadow-sm border-2 p-4 hover:shadow-md transition-all relative ${
                        isSelected ? 'border-[#3f72af] ring-2 ring-[#3f72af]/20' : 'border-gray-200'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <div className="absolute top-3 left-3 z-10">
                        <button
                          onClick={() => toggleSelectTemplate(template.id)}
                          className="bg-white rounded border-2 border-gray-300 hover:border-[#3f72af] transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-6 h-6 text-[#3f72af]" />
                          ) : (
                            <Square className="w-6 h-6 text-gray-400" />
                          )}
                        </button>
                      </div>

                      {/* Featured Star */}
                      {template.is_featured && (
                        <div className="absolute top-3 right-3 z-10">
                          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-4 pl-9">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <FileText className="w-6 h-6 text-[#3f72af]" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{template.name}</h3>
                            <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                              getFormTypeBadgeColor(template.form_type)
                            }`}>
                              {template.form_type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {template.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {template.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span>{template.fields?.length || 0} fields</span>
                        <span>{template.usage_count || 0} uses</span>
                        <span>{new Date(template.created_at).toLocaleDateString()}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <Link
                          href={`/forms/${template.id}/fill`}
                          className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#3f72af] rounded-lg font-medium transition-colors text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Fill</span>
                        </Link>
                        <Link
                          href={`/forms/builder?templateId=${template.id}`}
                          className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </Link>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDuplicateTemplate(template)}
                          className="flex-1 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => handleToggleFeatured(template.id)}
                          className={`flex-1 p-2 rounded-lg transition-colors ${
                            template.is_featured
                              ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                          title="Toggle Featured"
                        >
                          <Star className={`w-4 h-4 mx-auto ${template.is_featured ? 'fill-yellow-500' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="flex-1 p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredAndSortedTemplates.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No form templates found</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {searchQuery || filterType !== 'all' ? 'Try adjusting your search or filters' : 'Create your first form template to get started'}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Submissions Filters */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by form name or submitter..."
                      value={submissionSearchQuery}
                      onChange={(e) => setSubmissionSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={submissionFilterStatus}
                    onChange={(e) => setSubmissionFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  {/* Export Button */}
                  <button
                    onClick={handleExportSubmissions}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>

                {/* Date Range */}
                <div className="mt-4 flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Results Count */}
              <div className="mb-3">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{filteredResponses.length}</span> of <span className="font-semibold">{responses.length}</span> submissions
                </p>
              </div>

              {/* Responses List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {filteredResponses.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No submissions found</p>
                    <p className="text-gray-400 text-sm mt-2">
                      {submissionSearchQuery || submissionFilterStatus !== 'all' || dateRange.start || dateRange.end
                        ? 'Try adjusting your filters'
                        : 'Form responses will appear here once submitted'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredResponses.map((response) => {
                      const template = templates.find(t => t.id === response.form_template_id);
                      return (
                        <div
                          key={response.id}
                          className="p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900">
                                  {template?.name || 'Unknown Form'}
                                </h3>
                                <div className="flex items-center gap-3 mt-1">
                                  <p className="text-sm text-gray-500">
                                    {new Date(response.submitted_at).toLocaleString()}
                                  </p>
                                  <span className="text-gray-300">•</span>
                                  <p className="text-sm text-gray-500">
                                    By: {response.submitted_by}
                                  </p>
                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                    getStatusColor(response.status || 'submitted')
                                  }`}>
                                    {getStatusLabel(response.status || 'submitted')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Link
                                href={`/forms/responses/${response.id}`}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#3f72af] rounded-lg font-medium transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                <span>View</span>
                              </Link>
                              <a
                                href={`/api/form-responses/${response.id}/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
