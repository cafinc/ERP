'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  FileSignature,
  Plus,
  Eye,
  Edit,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
  User,
  Building,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Settings,
  RefreshCw,
  Download,
} from 'lucide-react';

interface Agreement {
  _id: string;
  agreement_number: string;
  customer_id: string;
  customer_name?: string;
  agreement_type: string;
  status: string;
  start_date: string;
  end_date?: string;
  agreement_value: number;
  payment_terms: string;
  created_at: string;
}

interface Template {
  _id: string;
  template_name: string;
  category: string;
  description?: string;
  usage_count?: number;
}

export default function AgreementsPage() {
  const router = useRouter();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  useEffect(() => {
    loadAgreements();
    loadTemplates();
  }, []);

  const loadAgreements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contracts');
      let agreementsData = Array.isArray(res.data) ? res.data : (res.data?.contracts || []);
      setAgreements(agreementsData);
    } catch (error) {
      console.error('Error loading agreements:', error);
      setAgreements([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await api.get('/agreement-templates');
      const templatesData = Array.isArray(res.data) ? res.data : (res.data?.templates || []);
      // Filter out archived templates
      const activeTemplates = templatesData.filter((t: any) => !t.is_archived);
      setTemplates(activeTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
  };

  const handleDelete = async (agreementId: string) => {
    if (!confirm('Are you sure you want to delete this agreement?')) return;
    
    try {
      await api.delete(`/contracts/${agreementId}`);
      loadAgreements();
    } catch (error) {
      console.error('Error deleting agreement:', error);
      alert('Failed to delete agreement');
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === 'manage') {
      router.push('/agreements/templates');
    } else if (templateId === 'new') {
      router.push('/agreements/templates/create');
    } else if (templateId) {
      // Navigate to create agreement with selected template
      router.push(`/agreements/create?template_id=${templateId}`);
    }
    setShowTemplateDropdown(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3 mr-1" />
            Draft
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            {status}
          </span>
        );
    }
  };

  // Filter agreements based on active tab and search
  const filteredAgreements = agreements.filter(agreement => {
    const matchesTab = activeTab === 'all' || agreement.status === activeTab;
    const matchesSearch = searchQuery === '' || 
      agreement.agreement_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agreement.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agreement.agreement_type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PageHeader
          title="Agreements"
          subtitle="Manage your service agreements and contracts"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'CRM', href: '/crm/dashboard' },
            { label: 'Agreements' }
          ]}
        />
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Agreements"
        subtitle="Manage your service agreements and contracts"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'CRM', href: '/crm/dashboard' },
          { label: 'Agreements' }
        ]}
        actions={[
          {
            label: (
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Templates</span>
              </div>
            ),
            onClick: () => {},
            variant: 'secondary' as const,
            dropdown: (
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  setSelectedTemplate(e.target.value);
                  handleTemplateSelect(e.target.value);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value="">Select Template...</option>
                <optgroup label="Quick Actions">
                  <option value="new">+ Create New Template</option>
                  <option value="manage">⚙ Manage Templates</option>
                </optgroup>
                {templates.length > 0 && (
                  <optgroup label="Use Template">
                    {templates.map((template) => (
                      <option key={template._id} value={template._id}>
                        {template.template_name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            ),
          },
          {
            label: 'New Agreement',
            icon: <Plus className="w-4 h-4 mr-2" />,
            onClick: () => router.push('/agreements/create'),
            variant: 'primary',
          },
        ]}
      />

      {/* Main Content */}
      <div className="h-full bg-gray-50 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Filter Tabs */}
          <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-4 backdrop-blur-sm mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-[#3f72af] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All Agreements ({agreements.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'active'
                    ? 'bg-[#3f72af] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('draft')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'draft'
                    ? 'bg-[#3f72af] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Draft
              </button>
              <button
                onClick={() => setFilter('expired')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'expired'
                    ? 'bg-[#3f72af] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Expired
              </button>
            </div>
          </div>

          {/* Agreements List */}
          {loading ? (
            <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-12 backdrop-blur-sm text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f72af] mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading agreements...</p>
            </div>
          ) : agreements.length === 0 ? (
            <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-12 backdrop-blur-sm text-center">
              <FileSignature className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === 'all' ? 'No Agreements Yet' : `No ${filter} Agreements`}
              </h3>
              <p className="text-gray-600 mb-4">
                {filter === 'all'
                  ? 'Create your first service agreement to manage contracts with customers'
                  : `There are no ${filter} agreements at the moment`
                }
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => router.push('/agreements/create')}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create First Agreement</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {agreements.map((agreement) => (
                <div
                  key={agreement._id}
                  className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-6 backdrop-blur-sm hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {agreement.agreement_number || 'Unnamed Agreement'}
                        </h3>
                        {getStatusBadge(agreement.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div className="flex items-start space-x-2">
                          <User className="w-4 h-4 text-[#3f72af] mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Customer</p>
                            <p className="text-sm font-medium text-gray-900">
                              {agreement.customer_name || 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <FileText className="w-4 h-4 text-[#3f72af] mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Type</p>
                            <p className="text-sm font-medium text-gray-900">
                              {agreement.agreement_type}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <DollarSign className="w-4 h-4 text-[#3f72af] mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Value</p>
                            <p className="text-sm font-medium text-gray-900">
                              ${agreement.agreement_value?.toLocaleString() || '0'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <Calendar className="w-4 h-4 text-[#3f72af] mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Start Date</p>
                            <p className="text-sm font-medium text-gray-900">
                              {agreement.start_date
                                ? new Date(agreement.start_date).toLocaleDateString()
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => router.push(`/agreements/${agreement._id}`)}
                        className="p-2 text-[#3f72af] hover:bg-blue-50 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => router.push(`/agreements/${agreement._id}/edit`)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(agreement._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
