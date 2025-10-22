'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';
import api from '@/lib/api';
import {
  Users,
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
} from 'lucide-react';

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

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [view, setView] = useState<'pipeline' | 'list' | 'analytics'>('pipeline');
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
  const [saving, setSaving] = useState(false);
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
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
        next_follow_up: formData.next_follow_up || null,
      };

      if (editingLead) {
        await api.put(`/leads/${editingLead.id}`, payload);
      } else {
        await api.post('/leads', payload);
      }

      alert(`Lead ${editingLead ? 'updated' : 'created'} successfully!`);
      setShowModal(false);
      resetForm();
      loadLeads();
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Failed to save lead');
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
      <HybridNavigationTopBar>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leads...</p>
          </div>
        </div>
      </HybridNavigationTopBar>
    );
  }

  return (
    <HybridNavigationTopBar>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Compact Header */}
          <CompactHeader
            title="Lead Management"
            subtitle="Track and convert potential customers"
            backUrl="/customers"
            icon={Users}
            actions={[
              {
                label: 'Export',
                icon: Download,
                onClick: () => alert('Export functionality'),
                variant: 'secondary',
              },
              {
                label: 'Add Lead',
                icon: Plus,
                onClick: () => {
                  resetForm();
                  setShowModal(true);
                },
                variant: 'primary',
              },
            ]}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.active} active</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.conversionRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.won} won</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pipeline Value</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    ${(stats.totalValue / 1000).toFixed(1)}k
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total potential</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Won Value</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    ${(stats.wonValue / 1000).toFixed(1)}k
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Converted</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="mb-6 flex space-x-2">
            <button
              onClick={() => setView('pipeline')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                view === 'pipeline'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline-block mr-2" />
              Pipeline
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                view === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 inline-block mr-2" />
              List View
            </button>
            <button
              onClick={() => setView('analytics')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                view === 'analytics'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline-block mr-2" />
              Analytics
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search leads by name, email, phone, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Status</option>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Priority</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              <button
                onClick={loadLeads}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Pipeline View */}
          {view === 'pipeline' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {(['new', 'contacted', 'qualified', 'proposal_sent'] as const).map(status => {
                const statusLeads = filteredLeads.filter(l => l.status === status);
                const config = STATUS_CONFIG[status];
                const Icon = config.icon;
                const totalValue = statusLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);

                return (
                  <div key={status} className="bg-white rounded-xl shadow-sm border border-gray-200">
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
          {view === 'list' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
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
                    const config = STATUS_CONFIG[lead.status];
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
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                  className="bg-blue-600 h-2 rounded-full"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingLead ? 'Edit' : 'Create'} Lead
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {LEAD_SOURCES.map(source => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Lead['priority'] })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Est. Value</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.estimated_value}
                      onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Next Follow-up</label>
                <input
                  type="date"
                  value={formData.next_follow_up}
                  onChange={(e) => setFormData({ ...formData, next_follow_up: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes about this lead..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrUpdate}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-[#2c5282] disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
              >
                {saving ? 'Saving...' : editingLead ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </HybridNavigationTopBar>
  );
}
