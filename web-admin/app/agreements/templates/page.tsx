'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CompactHeader from '@/components/CompactHeader';
import api from '@/lib/api';
import {
  FileText,
  Plus,
  Edit,
  Archive,
  Trash2,
  Copy,
  Eye,
  Settings,
  ChevronRight,
  Folder,
  Clock,
} from 'lucide-react';

export default function AgreementTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active');

  useEffect(() => {
    loadTemplates();
  }, [filter]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/agreement-templates');
      let templatesData = Array.isArray(res.data) ? res.data : (res.data?.templates || []);
      
      // Filter based on active/archived status
      if (filter === 'active') {
        templatesData = templatesData.filter((t: any) => !t.is_archived);
      } else if (filter === 'archived') {
        templatesData = templatesData.filter((t: any) => t.is_archived);
      }
      
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (templateId: string) => {
    if (!confirm('Are you sure you want to archive this template?')) return;
    
    try {
      await api.put(`/agreement-templates/${templateId}`, { is_archived: true });
      loadTemplates();
    } catch (error) {
      console.error('Error archiving template:', error);
      alert('Failed to archive template');
    }
  };

  const handleRestore = async (templateId: string) => {
    try {
      await api.put(`/agreement-templates/${templateId}`, { is_archived: false });
      loadTemplates();
    } catch (error) {
      console.error('Error restoring template:', error);
      alert('Failed to restore template');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to permanently delete this template? This action cannot be undone.')) return;
    
    try {
      await api.delete(`/agreement-templates/${templateId}`);
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const handleDuplicate = async (templateId: string) => {
    try {
      const template = templates.find(t => t._id === templateId);
      if (!template) return;
      
      const duplicated = {
        ...template,
        template_name: `${template.template_name} (Copy)`,
        _id: undefined,
        created_at: undefined,
        updated_at: undefined,
      };
      
      await api.post('/agreement-templates', duplicated);
      loadTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Failed to duplicate template');
    }
  };

  const templatesByCategory = templates.reduce((acc: any, template: any) => {
    const category = template.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {});

  return (
    <HybridNavigationTopBar>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <CompactHeader
          title="Agreement Templates"
          backUrl="/contracts"
          icon={FileText}
          description="Create and manage reusable service agreement templates"
          actions={[
            {
              label: 'New Template',
              icon: Plus,
              onClick: () => router.push('/agreements/templates/create'),
              variant: 'primary',
            },
          ]}
        />

        {/* Filter Tabs */}
        <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-[#3f72af] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Active Templates ({templates.filter(t => !t.is_archived).length})
            </button>
            <button
              onClick={() => setFilter('archived')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'archived'
                  ? 'bg-[#3f72af] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Archived ({templates.filter(t => t.is_archived).length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-[#3f72af] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({templates.length})
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="mt-6 text-center py-12">
            <p className="text-gray-600">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'archived' ? 'No Archived Templates' : 'No Templates Yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === 'archived' 
                ? 'Archived templates will appear here'
                : 'Create your first agreement template to streamline your service agreements'
              }
            </p>
            {filter !== 'archived' && (
              <button
                onClick={() => router.push('/agreements/templates/create')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create First Template</span>
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {Object.entries(templatesByCategory).map(([category, categoryTemplates]: [string, any]) => (
              <div key={category} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Folder className="w-5 h-5 text-[#3f72af]" />
                    <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                    <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                      {categoryTemplates.length}
                    </span>
                  </div>
                </div>
                <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryTemplates.map((template: any) => (
                      <div
                        key={template._id}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          template.is_archived
                            ? 'border-gray-200 bg-gray-50'
                            : 'border-gray-200 hover:border-blue-500 hover:shadow-md cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {template.template_name}
                            </h4>
                            {template.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                            )}
                          </div>
                          {template.is_archived && (
                            <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium ml-2">
                              Archived
                            </span>
                          )}
                        </div>

                        {/* Template Info */}
                        <div className="space-y-2 mb-4">
                          {template.sections && (
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <FileText className="w-3 h-3" />
                              <span>{template.sections.length} Sections</span>
                            </div>
                          )}
                          {template.usage_count !== undefined && (
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <Copy className="w-3 h-3" />
                              <span>Used {template.usage_count} times</span>
                            </div>
                          )}
                          {template.updated_at && (
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => router.push(`/agreements/templates/${template._id}`)}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => router.push(`/agreements/templates/${template._id}/edit`)}
                            className="flex items-center justify-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(template._id)}
                            className="flex items-center justify-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {template.is_archived ? (
                            <button
                              onClick={() => handleRestore(template._id)}
                              className="flex items-center justify-center px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                              title="Restore"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleArchive(template._id)}
                              className="flex items-center justify-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                              title="Archive"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                          {template.is_archived && (
                            <button
                              onClick={() => handleDelete(template._id)}
                              className="flex items-center justify-center px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </HybridNavigationTopBar>
  );
}
