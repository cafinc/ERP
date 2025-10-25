'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  Users,
  User,
  Plus,
  Search,
  Filter,
  TrendingUp,
  UserCheck,
  UserX,
  Clock,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Star,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowRight,
  Calendar,
  MessageSquare,
  Tag,
  BarChart3,
  RefreshCw,
  Download,
  Eye,
  Snowflake,
  Wrench,
  Hammer,
  Truck,
  Home,
  Briefcase,
  Upload,
  File,
  X,
  Image as ImageIcon,
  Paperclip,
} from 'lucide-react';
import AddressInput from '@/components/AddressInput';
import { formatPhoneNumber } from '@/lib/utils/formatters';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  company?: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiating' | 'won' | 'lost';
  source: string;
  estimated_value?: number;
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  assigned_to_name?: string;
  notes?: string;
  last_contact_date?: string;
  next_follow_up?: string;
  lost_reason?: string;
  created_at: string;
  converted_customer_id?: string;
}

const STATUS_CONFIG = {
  new: { label: 'New', color: 'blue', icon: Star },
  contacted: { label: 'Contacted', color: 'purple', icon: Phone },
  qualified: { label: 'Qualified', color: 'indigo', icon: CheckCircle },
  proposal_sent: { label: 'Proposal Sent', color: 'orange', icon: MessageSquare },
  negotiating: { label: 'Negotiating', color: 'yellow', icon: TrendingUp },
  won: { label: 'Won', color: 'green', icon: UserCheck },
  lost: { label: 'Lost', color: 'red', icon: UserX },
};

const LEAD_SOURCES = [
  'Website',
  'Referral',
  'Social Media',
  'Google Ads',
  'Cold Call',
  'Email Campaign',
  'Trade Show',
  'Walk-in',
  'Other',
];

// Service types with icons for lead requests
const SERVICE_TYPES = [
  { value: 'plowing', label: 'Snow Plowing', icon: '❄️', color: 'blue' },
  { value: 'sanding', label: 'Sanding', icon: '⚪', color: 'yellow' },
  { value: 'salting', label: 'Salting', icon: '🧂', color: 'orange' },
  { value: 'sidewalk_clear', label: 'Sidewalk Clear', icon: '🚶', color: 'green' },
  { value: 'hauling', label: 'Snow Hauling', icon: '🚛', color: 'purple' },
  { value: 'ice_management', label: 'Ice Management', icon: '🧊', color: 'cyan' },
  { value: 'site_checks', label: 'Site Checks', icon: '🔍', color: 'indigo' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧', color: 'gray' },
];

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'pipeline' | 'list' | 'analytics'>('pipeline');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    source: 'Website',
    estimated_value: '',
    priority: 'medium' as Lead['priority'],
    notes: '',
    next_follow_up: '',
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, type: string, size: number, data: string}>>([]);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    loadLeads();
    loadTeamMembers();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchQuery, statusFilter, priorityFilter]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leads');
      setLeads(response.data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const response = await api.get('/team-members');
      setTeamMembers(response.data || []);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const filterLeads = () => {
    let filtered = [...leads];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        (lead.company && lead.company.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(lead => lead.priority === priorityFilter);
    }

    setFilteredLeads(filtered);
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      setErrorMessage('Please fill in all required fields (Name, Email, Phone)');
      setShowErrorModal(true);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
        next_follow_up: formData.next_follow_up || null,
        services_requested: selectedServices,
        documents: uploadedFiles,
      };

      if (editingLead) {
        await api.put(`/leads/${editingLead.id}`, payload);
      } else {
        await api.post('/leads', payload);
      }

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowModal(false);
        setShowSuccessModal(false);
        resetForm();
        loadLeads();
      }, 2000);
    } catch (error: any) {
      console.error('Error saving lead:', error);
      const errorMsg = error?.response?.data?.detail || error?.message || 'Failed to save lead. Please try again.';
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: Lead['status']) => {
    try {
      await api.put(`/leads/${leadId}`, { status: newStatus });
      loadLeads();
    } catch (error) {
      console.error('Error updating lead status:', error);
      alert('Failed to update lead status');
    }
  };

  const handleConvertToCustomer = async (lead: Lead) => {
    if (!confirm(`Convert ${lead.name} to a customer?`)) {
      return;
    }

    try {
      const response = await api.post(`/leads/${lead.id}/convert`);
      alert('Lead converted to customer successfully!');
      router.push(`/customers/${response.data.customer_id}`);
    } catch (error) {
      console.error('Error converting lead:', error);
      alert('Failed to convert lead to customer');
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) {
      return;
    }

    try {
      await api.delete(`/leads/${leadId}`);
      alert('Lead deleted successfully!');
      loadLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Failed to delete lead');
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      address: lead.address || '',
      company: lead.company || '',
      source: lead.source,
      estimated_value: lead.estimated_value?.toString() || '',
      priority: lead.priority,
      notes: lead.notes || '',
      next_follow_up: lead.next_follow_up || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingLead(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      company: '',
      source: 'Website',
      estimated_value: '',
      priority: 'medium',
      notes: '',
      next_follow_up: '',
    });
    setSelectedServices([]);
    setUploadedFiles([]);
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData({ ...formData, phone: formatted });
  };

  const toggleService = (serviceValue: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceValue)
        ? prev.filter(s => s !== serviceValue)
        : [...prev, serviceValue]
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      // Limit file size to 500KB
      if (file.size > 500 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 500KB per file.`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          type: file.type,
          size: file.size,
          data: result
        }]);
      };
      reader.onerror = () => {
        alert(`Error reading file ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    event.target.value = '';
  };
  
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (type.includes('pdf')) return <File className="w-5 h-5 text-red-500" />;
    return <Paperclip className="w-5 h-5 text-gray-500" />;
  };

  const getStats = () => {
    const total = leads.length;
    const won = leads.filter(l => l.status === 'won').length;
    const lost = leads.filter(l => l.status === 'lost').length;
    const active = leads.filter(l => !['won', 'lost'].includes(l.status)).length;
    const totalValue = leads
      .filter(l => l.status !== 'lost')
      .reduce((sum, l) => sum + (l.estimated_value || 0), 0);
    const wonValue = leads
      .filter(l => l.status === 'won')
      .reduce((sum, l) => sum + (l.estimated_value || 0), 0);
    const conversionRate = total > 0 ? ((won / total) * 100).toFixed(1) : '0';

    return { total, won, lost, active, totalValue, wonValue, conversionRate };
  };

  const stats = getStats();

  if (loading) {
    return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leads...</p>
          </div>
        </div>
      );
  }

  return (
    <>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Compact Header */}
          <PageHeader
            title="Lead Management"
            subtitle="Track and convert potential customers"
            breadcrumbs={[
              { label: "Home", href: "/" },
              { label: "CRM", href: "/crm/dashboard" },
              { label: "Leads" }
            ]}
            backUrl="/customers"
            stats={[
              {
                label: 'Conversion Rate',
                value: `${stats.conversionRate}%`,
                icon: <TrendingUp className="w-4 h-4" />,
                trend: `${stats.won} won`,
              },
              {
                label: 'Pipeline Value',
                value: `$${(stats.totalValue / 1000).toFixed(1)}k`,
                icon: <DollarSign className="w-4 h-4" />,
                trend: 'Total potential',
              },
              {
                label: 'Won Value',
                value: `$${(stats.wonValue / 1000).toFixed(1)}k`,
                icon: <CheckCircle className="w-4 h-4" />,
                trend: 'Converted',
              },
            ]}
            actions={[
              {
                label: 'Export',
                icon: <Download className="w-4 h-4 mr-2" />,
                onClick: () => alert('Export functionality'),
                variant: 'secondary',
              },
              {
                label: 'Add Lead',
                icon: <Plus className="w-4 h-4 mr-2" />,
                onClick: () => {
                  resetForm();
                  setShowModal(true);
                },
                variant: 'primary',
              },
            ]}
          />

          {/* Status Filter Buttons */}
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() => setStatusFilter('new')}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all text-sm flex items-center gap-2 ${
                statusFilter === 'new'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-500 hover:text-blue-500'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${statusFilter === 'new' ? 'bg-white' : 'bg-blue-500'}`} />
              New
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                statusFilter === 'new' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
              }`}>
                {leads.filter(l => l.status === 'new').length}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('contacted')}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all text-sm flex items-center gap-2 ${
                statusFilter === 'contacted'
                  ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-yellow-500 hover:text-yellow-500'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${statusFilter === 'contacted' ? 'bg-white' : 'bg-yellow-500'}`} />
              Contacted
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                statusFilter === 'contacted' ? 'bg-white/20 text-white' : 'bg-yellow-100 text-yellow-600'
              }`}>
                {leads.filter(l => l.status === 'contacted').length}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('won')}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all text-sm flex items-center gap-2 ${
                statusFilter === 'won'
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-500 hover:text-green-500'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${statusFilter === 'won' ? 'bg-white' : 'bg-green-500'}`} />
              Converted
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                statusFilter === 'won' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-600'
              }`}>
                {leads.filter(l => l.status === 'won').length}
              </span>
            </button>

            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="px-4 py-2.5 rounded-xl font-semibold transition-all text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="mb-4 flex space-x-2">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                viewMode === 'pipeline'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline-block mr-2" />
              Pipeline
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                viewMode === 'list'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 inline-block mr-2" />
              List View
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                viewMode === 'analytics'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline-block mr-2" />
              Analytics
            </button>
          </div>

          {/* Search Bar with Advanced Filter */}
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-4 mb-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              {/* Search with Advanced Filter */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search leads by name, email, phone, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-24 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${
                    showFilterDropdown
                      ? 'bg-[#3f72af] text-white shadow-md'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {(statusFilter !== 'all' || priorityFilter !== 'all') && (
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {/* Advanced Filter Dropdown */}
                {showFilterDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 animate-slideUp">
                    <div className="p-5">
                      <div className="text-base font-bold text-gray-900 mb-4 flex items-center justify-between">
                        <span>Advanced Filters</span>
                        <button
                          onClick={() => setShowFilterDropdown(false)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {/* Status Filter */}
                      <div className="mb-4">
                        <label className="text-xs font-semibold text-gray-700 mb-2 block uppercase tracking-wide">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white text-sm transition-all"
                        >
                          <option value="all">All Status</option>
                          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>
                              {config.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Priority Filter */}
                      <div className="mb-4">
                        <label className="text-xs font-semibold text-gray-700 mb-2 block uppercase tracking-wide">Priority</label>
                        <select
                          value={priorityFilter}
                          onChange={(e) => setPriorityFilter(e.target.value)}
                          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white text-sm transition-all"
                        >
                          <option value="all">All Priorities</option>
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                        </select>
                      </div>

                      {/* Source Filter */}
                      <div className="mb-4">
                        <label className="text-xs font-semibold text-gray-700 mb-2 block uppercase tracking-wide">Source</label>
                        <select
                          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white text-sm transition-all"
                        >
                          <option value="all">All Sources</option>
                          {LEAD_SOURCES.map(source => (
                            <option key={source} value={source}>
                              {source}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* View Mode Toggle */}
                      <div className="mb-4">
                        <label className="text-xs font-semibold text-gray-700 mb-2 block uppercase tracking-wide">View Mode</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => {
                              setViewMode('pipeline');
                              setShowFilterDropdown(false);
                            }}
                            className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-lg transition-all ${
                              viewMode === 'pipeline'
                                ? 'bg-[#3f72af] text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <TrendingUp className="w-5 h-5" />
                            <span className="text-xs font-medium">Pipeline</span>
                          </button>
                          <button
                            onClick={() => {
                              setViewMode('list');
                              setShowFilterDropdown(false);
                            }}
                            className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-lg transition-all ${
                              viewMode === 'list'
                                ? 'bg-[#3f72af] text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <BarChart3 className="w-5 h-5" />
                            <span className="text-xs font-medium">List</span>
                          </button>
                          <button
                            onClick={() => {
                              setViewMode('analytics');
                              setShowFilterDropdown(false);
                            }}
                            className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-lg transition-all ${
                              viewMode === 'analytics'
                                ? 'bg-[#3f72af] text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <Eye className="w-5 h-5" />
                            <span className="text-xs font-medium">Analytics</span>
                          </button>
                        </div>
                      </div>

                      {/* Apply/Clear Buttons */}
                      <div className="flex gap-2 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setStatusFilter('all');
                            setPriorityFilter('all');
                            setSearchQuery('');
                            setShowFilterDropdown(false);
                          }}
                          className="flex-1 px-4 py-2.5 text-sm border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold"
                        >
                          Clear All
                        </button>
                        <button
                          onClick={() => setShowFilterDropdown(false)}
                          className="flex-1 px-4 py-2.5 text-sm bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-all font-semibold shadow-sm hover:shadow-md"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Refresh Button */}
              <button
                onClick={loadLeads}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Pipeline View */}
          {viewMode === 'pipeline' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {(['new', 'contacted', 'qualified', 'proposal_sent'] as const).map(status => {
                const statusLeads = filteredLeads.filter(l => l.status === status);
                const config = STATUS_CONFIG[status];
                const Icon = config.icon;
                const totalValue = statusLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);

                return (
                  <div key={status} className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className={`p-4 border-b border-gray-200 bg-${config.color}-50`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-5 h-5 text-${config.color}-600`} />
                          <h3 className="font-semibold text-gray-900">{config.label}</h3>
                        </div>
                        <span className="px-2 py-0.5 bg-white rounded-full text-xs font-medium text-gray-700">
                          {statusLeads.length}
                        </span>
                      </div>
                      {totalValue > 0 && (
                        <p className="text-xs text-gray-600 mt-2">
                          ${(totalValue / 1000).toFixed(1)}k value
                        </p>
                      )}
                    </div>

                    <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
                      {statusLeads.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 py-4">No leads</p>
                      ) : (
                        statusLeads.map(lead => (
                          <div
                            key={lead.id}
                            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => handleEdit(lead)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 text-sm truncate">
                                  {lead.name}
                                </h4>
                                {lead.company && (
                                  <p className="text-xs text-gray-600 truncate">{lead.company}</p>
                                )}
                              </div>
                              {lead.priority === 'high' && (
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                              )}
                            </div>

                            <div className="space-y-1 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span className="truncate">{lead.phone}</span>
                              </div>
                              {lead.estimated_value && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  <span>${lead.estimated_value.toLocaleString()}</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <select
                                value={lead.status}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(lead.id, e.target.value as Lead['status']);
                                }}
                                className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                  <option key={key} value={key}>
                                    {cfg.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              {filteredLeads.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No leads found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Add your first lead to start tracking potential customers'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredLeads.map(lead => {
                    const config = STATUS_CONFIG[lead.status] || { 
                      label: lead.status, 
                      color: 'gray', 
                      icon: Clock 
                    };
                    const Icon = config.icon;

                    return (
                      <div key={lead.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                              {lead.company && (
                                <span className="text-sm text-gray-600">({lead.company})</span>
                              )}
                              <span
                                className={`px-2 py-0.5 bg-${config.color}-100 text-${config.color}-700 text-xs font-medium rounded flex items-center gap-1`}
                              >
                                <Icon className="w-3 h-3" />
                                {config.label}
                              </span>
                              {lead.priority === 'high' && (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded flex items-center gap-1">
                                  <Star className="w-3 h-3" />
                                  High Priority
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span className="truncate">{lead.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{lead.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                <span>Source: {lead.source}</span>
                              </div>
                              {lead.estimated_value && (
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4" />
                                  <span>${lead.estimated_value.toLocaleString()}</span>
                                </div>
                              )}
                            </div>

                            {lead.notes && (
                              <p className="text-xs text-gray-500 mt-2 italic line-clamp-1">
                                {lead.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {lead.status === 'won' && !lead.converted_customer_id && (
                              <button
                                onClick={() => handleConvertToCustomer(lead)}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-1"
                              >
                                <ArrowRight className="w-4 h-4" />
                                Convert
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(lead)}
                              className="p-2 text-[#3f72af] hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(lead.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Analytics View */}
          {view === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Leads by Status</h3>
                    <div className="space-y-2">
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                        const count = leads.filter(l => l.status === key).length;
                        const percentage = leads.length > 0 ? ((count / leads.length) * 100).toFixed(0) : 0;
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{config.label}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`bg-${config.color}-500 h-2 rounded-full`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 w-12 text-right">
                                {count} ({percentage}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Leads by Source</h3>
                    <div className="space-y-2">
                      {LEAD_SOURCES.map(source => {
                        const count = leads.filter(l => l.source === source).length;
                        const percentage = leads.length > 0 ? ((count / leads.length) * 100).toFixed(0) : 0;
                        return count > 0 ? (
                          <div key={source} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{source}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-[#3f72af] h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 w-12 text-right">
                                {count} ({percentage}%)
                              </span>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-2xl w-full shadow-2xl border border-white/40 animate-slideUp my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-[#3f72af] to-[#2c5282] rounded-xl p-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingLead ? 'Edit' : 'Create'} Lead
                  </h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {editingLead ? 'Update lead information' : 'Add a new sales lead'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form className="p-6 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto">
              {/* Lead Details Card */}
              <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                  <User className="w-5 h-5 text-[#3f72af] mr-2" />
                  Lead Details
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                        placeholder="John Smith"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Company</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                        placeholder="ABC Corporation"
                      />
                    </div>
                  </div>

                  {/* Phone first, then Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                          placeholder="(555) 123-4567"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Use AddressInput component */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <MapPin className="w-4 h-4 inline-block mr-1 text-[#3f72af]" />
                      Address
                    </label>
                    <AddressInput
                      value={formData.address}
                      onChange={(address) => setFormData({ ...formData, address })}
                      placeholder="Start typing address..."
                      showCityProvincePostal={false}
                      label=""
                    />
                  </div>
                </div>
              </div>

              {/* Lead Qualification Card */}
              <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                  <TrendingUp className="w-5 h-5 text-[#3f72af] mr-2" />
                  Lead Qualification
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <Tag className="w-4 h-4 inline-block mr-1 text-[#3f72af]" />
                      Source
                    </label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white transition-all"
                    >
                      {LEAD_SOURCES.map(source => (
                        <option key={source} value={source}>
                          {source}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <Star className="w-4 h-4 inline-block mr-1 text-[#3f72af]" />
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as Lead['priority'] })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white transition-all"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Estimated Value</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={formData.estimated_value}
                        onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <Calendar className="w-4 h-4 inline-block mr-1 text-[#3f72af]" />
                    Next Follow-up
                  </label>
                  <input
                    type="date"
                    value={formData.next_follow_up}
                    onChange={(e) => setFormData({ ...formData, next_follow_up: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                  />
                </div>
              </div>

              {/* Services Requested Card */}
              <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                  <Briefcase className="w-5 h-5 text-[#3f72af] mr-2" />
                  Services Requested
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SERVICE_TYPES.map((service) => (
                    <button
                      key={service.value}
                      type="button"
                      onClick={() => toggleService(service.value)}
                      className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                        selectedServices.includes(service.value)
                          ? `border-${service.color}-500 bg-${service.color}-50 shadow-lg`
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{service.icon}</div>
                        <p className={`text-xs font-bold ${
                          selectedServices.includes(service.value)
                            ? `text-${service.color}-700`
                            : 'text-gray-700'
                        }`}>
                          {service.label}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                
                {selectedServices.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900">
                      Selected: {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedServices.map((serviceValue) => {
                        const service = SERVICE_TYPES.find(s => s.value === serviceValue);
                        return (
                          <span
                            key={serviceValue}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-blue-300 rounded-full text-xs font-medium text-blue-700"
                          >
                            {service?.icon} {service?.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Document Upload Card */}
              <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                  <Upload className="w-5 h-5 text-[#3f72af] mr-2" />
                  Documents & Attachments
                </h3>
                
                <div className="space-y-4">
                  {/* Upload Button */}
                  <div>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#3f72af] hover:bg-blue-50 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-600">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF, Images, Documents (Max 500KB per file)</p>
                      </div>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                      />
                    </label>
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700">
                        Uploaded Files ({uploadedFiles.length})
                      </p>
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {getFileIcon(file.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Card */}
              <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                  <MessageSquare className="w-5 h-5 text-[#3f72af] mr-2" />
                  Notes
                </h3>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all resize-none"
                  placeholder="Additional notes about this lead..."
                />
              </div>
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200/50">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-5 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateOrUpdate}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md font-semibold"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {editingLead ? 'Update Lead' : 'Create Lead'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-green-200 animate-slideUp">
            <div className="p-8 text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Success!
              </h3>
              <p className="text-gray-600">
                Lead {editingLead ? 'updated' : 'created'} successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-red-200 animate-slideUp">
            <div className="p-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Error
              </h3>
              <p className="text-gray-600 text-center mb-6">
                {errorMessage}
              </p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full px-5 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-sm hover:shadow-md font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
    );
}
