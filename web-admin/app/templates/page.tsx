'use client';

import PageHeader from '@/components/PageHeader';

import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  DocumentIcon,
  BriefcaseIcon,
  ClipboardDocumentCheckIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface Template {
  _id: string;
  type: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  usage_count: number;
  is_default: boolean;
  is_public: boolean;
}

const TEMPLATE_TYPES = [
  { id: 'estimate', label: 'Estimates', icon: DocumentTextIcon, color: 'bg-blue-100 text-blue-600' },
  { id: 'invoice', label: 'Invoices', icon: ClipboardDocumentListIcon, color: 'bg-green-100 text-green-600' },
  { id: 'proposal', label: 'Proposals', icon: DocumentIcon, color: 'bg-purple-100 text-purple-600' },
  { id: 'contract', label: 'Contracts', icon: ClipboardDocumentCheckIcon, color: 'bg-indigo-100 text-indigo-600' },
  { id: 'work_order', label: 'Work Orders', icon: BriefcaseIcon, color: 'bg-orange-100 text-orange-600' },
  { id: 'email', label: 'Emails', icon: EnvelopeIcon, color: 'bg-red-100 text-red-600' },
  { id: 'message', label: 'Messages', icon: ChatBubbleLeftRightIcon, color: 'bg-teal-100 text-teal-600' },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchTemplates();
  }, [selectedType, selectedCategory]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedType) params.append('type', selectedType);
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`${BACKEND_URL}/api/templates?${params}`);
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchTemplates();
  };

  const handleDuplicate = async (template: Template) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/templates/${template.type}/${template._id}/duplicate`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const handleDelete = async (template: Template) => {
    if (!confirm(`Delete template "${template.name}"?`)) return;

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/templates/${template.type}/${template._id}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = TEMPLATE_TYPES.find(t => t.id === type);
    if (!typeConfig) return DocumentIcon;
    return typeConfig.icon;
  };

  const getTypeColor = (type: string) => {
    const typeConfig = TEMPLATE_TYPES.find(t => t.id === type);
    return typeConfig?.color || 'bg-gray-100 text-gray-600';
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Group by type
  const templatesByType = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.type]) {
      acc[template.type] = [];
    }
    acc[template.type].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Templates"
        subtitle="Manage templates"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Templates" }]}
      />
      <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Template Library</h1>
        <p className="text-gray-600 mt-2">
          Manage and organize your business document templates
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
          <div className="text-sm text-gray-600">Total Templates</div></div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">
            {templates.filter(t => t.type === 'estimate').length}
          </div>
          <div className="text-sm text-gray-600">Estimates</div></div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">
            {templates.filter(t => t.type === 'invoice').length}
          </div>
          <div className="text-sm text-gray-600">Invoices</div></div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-purple-600">
            {templates.filter(t => t.is_default).length}
          </div>
          <div className="text-sm text-gray-600">Default Templates</div></div></div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType || ''}
            onChange={(e) => setSelectedType(e.target.value || null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {TEMPLATE_TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>

          {/* View Mode */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
            >
              List
            </button></div>

          {/* Create Button */}
          <button
            onClick={() => router.push('/templates/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5" />
            New Template
          </button></div></div>

      {/* Templates Grid/List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <DocumentIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first template</p>
          <button
            onClick={() => router.push('/templates/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Template
          </button></div>
      ) : (
        <div className="space-y-8">
          {Object.entries(templatesByType).map(([type, typeTemplates]) => {
            const TypeIcon = getTypeIcon(type);
            const typeConfig = TEMPLATE_TYPES.find(t => t.id === type);
            
            return (
              <div key={type}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${getTypeColor(type)}`}>
                    <TypeIcon className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {typeConfig?.label || type} ({typeTemplates.length})
                  </h2>
                </div>

                <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-4' : 'space-y-3'}>
                  {typeTemplates.map((template) => (
                    <div
                      key={template._id}
                      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{template.name}</h3>
                            {template.is_default && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                        </div></div>

                      {/* Tags */}
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {template.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <span>Used {template.usage_count || 0} times</span>
                        <span>{template.category}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-3 border-t">
                        <button
                          onClick={() => router.push(`/templates/${template.type}/${template._id}`)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                        >
                          <EyeIcon className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleDuplicate(template)}
                          className="flex items-center justify-center p-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
                          title="Duplicate"
                        >
                          <DocumentDuplicateIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/templates/${template.type}/${template._id}/edit`)}
                          className="flex items-center justify-center p-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        {!template.is_default && (
                          <button
                            onClick={() => handleDelete(template)}
                            className="flex items-center justify-center p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div></div>
                  ))}
                </div></div>
  );
          })}
        </div>
      )}
    </div></div>
  );
}
