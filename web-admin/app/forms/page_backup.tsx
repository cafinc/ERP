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
} from 'lucide-react';

interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  form_type: string;
  fields: any[];
  created_at: string;
  created_by: string;
}

interface FormResponse {
  id: string;
  form_template_id: string;
  submitted_by: string;
  submitted_at: string;
  data: any;
  site_id?: string;
  equipment_id?: string;
  customer_id?: string;
}

export default function FormsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'templates' | 'responses'>('templates');
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

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
      setTemplates(templatesRes.data);
      setResponses(responsesRes.data);
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

  const formTypes = [
    { id: 'all', label: 'All', color: 'purple', count: templates.length },
    { 
      id: 'crm', 
      label: 'CRM', 
      color: 'blue',
      subtypes: ['Customers', 'Estimates', 'Agreements', 'Projects', 'Invoices'],
      count: templates.filter(t => t.form_type?.startsWith('crm')).length 
    },
    { 
      id: 'financials', 
      label: 'Financials', 
      color: 'green',
      subtypes: ['Invoices', 'Estimates', 'Expenses', 'Payments', 'Reports'],
      count: templates.filter(t => t.form_type?.startsWith('financials')).length 
    },
    { 
      id: 'access', 
      label: 'Access', 
      color: 'cyan',
      subtypes: ['Team', 'Crew'],
      count: templates.filter(t => t.form_type?.startsWith('access')).length 
    },
    { 
      id: 'assets', 
      label: 'Assets', 
      color: 'orange',
      subtypes: ['Equipment', 'Vehicles', 'Trailers', 'Tools', 'Maintenance', 'Inspections'],
      count: templates.filter(t => t.form_type?.startsWith('assets')).length 
    },
    { 
      id: 'dispatch', 
      label: 'Dispatch', 
      color: 'indigo',
      subtypes: ['Routes', 'Jobs', 'Schedules'],
      count: templates.filter(t => t.form_type?.startsWith('dispatch')).length 
    },
    { 
      id: 'comms', 
      label: 'Comms', 
      color: 'pink',
      subtypes: ['Messages', 'Notifications'],
      count: templates.filter(t => t.form_type?.startsWith('comms')).length 
    },
    { 
      id: 'safety', 
      label: 'Safety', 
      color: 'red',
      subtypes: ['Policies', 'Training', 'Incidents', 'Inspections', 'Hazards', 'PPE', 'Meetings', 'Emergency'],
      count: templates.filter(t => t.form_type?.startsWith('safety')).length 
    },
    { 
      id: 'tasks', 
      label: 'Tasks', 
      color: 'yellow',
      subtypes: ['General', 'Projects', 'Maintenance'],
      count: templates.filter(t => t.form_type?.startsWith('tasks')).length 
    },
  ];

  const getFormTypeGradient = (color: string) => {
    const gradientMap: { [key: string]: string } = {
      purple: 'from-purple-500 to-purple-600',
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      cyan: 'from-cyan-500 to-cyan-600',
      orange: 'from-orange-500 to-orange-600',
      indigo: 'from-indigo-500 to-indigo-600',
      pink: 'from-pink-500 to-pink-600',
      red: 'from-red-500 to-red-600',
      yellow: 'from-yellow-500 to-yellow-600',
    };
    return gradientMap[color] || 'from-gray-500 to-gray-600';
  };

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

  const filteredTemplates = filterType === 'all' 
    ? templates 
    : templates.filter(t => t.form_type?.startsWith(filterType));

  return (
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        {/* Compact Header */}
        <PageHeader
          title="Forms Management"
          icon={<ClipboardList size={28} />}
          subtitle="Create and manage custom forms"
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

        {/* Tabs */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'templates'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Form Templates ({templates.length})
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'responses'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Submissions ({responses.length})
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
                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
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

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>{template.fields?.length || 0} fields</span>
                        <span>{new Date(template.created_at).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/forms/${template.id}/fill`}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#3f72af] rounded-lg font-medium transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Fill</span>
                        </Link>
                        <Link
                          href={`/forms/builder?templateId=${template.id}`}
                          className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredTemplates.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No form templates found</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Create your first form template to get started
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Responses List */}
                <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  {responses.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No submissions yet</p>
                      <p className="text-gray-400 text-sm mt-2">
                        Form responses will appear here once submitted
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {responses.map((response) => {
                        const template = templates.find(t => t.id === response.form_template_id);
                        return (
                          <div
                            key={response.id}
                            className="p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="p-3 bg-green-100 rounded-lg">
                                  <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">
                                    {template?.name || 'Unknown Form'}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    Submitted on {new Date(response.submitted_at).toLocaleString()}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    By: {response.submitted_by}
                                  </p>
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
