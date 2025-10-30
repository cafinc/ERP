'use client';

import PageHeader from '@/components/PageHeader';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon, CheckIcon, SparklesIcon, TrashIcon } from '@heroicons/react/24/outline';
import PlaceholderBrowser from '@/components/PlaceholderBrowser';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateType = params.type as string;
  const templateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPlaceholderBrowser, setShowPlaceholderBrowser] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    tags: '',
    content: '{}',
    is_public: false,
  });

  useEffect(() => {
    fetchTemplate();
  }, [templateType, templateId]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/templates/${templateType}/${templateId}`);
      const data = await response.json();
      
      if (data.success && data.template) {
        const template = data.template;
        setFormData({
          name: template.name,
          description: template.description || '',
          category: template.category || 'general',
          tags: template.tags?.join(', ') || '',
          content: JSON.stringify(template.content, null, 2),
          is_public: template.is_public || false,
        });
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      alert('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      setSaving(true);
      
      // Parse content JSON
      let parsedContent;
      try {
        parsedContent = JSON.parse(formData.content);
      } catch (err) {
        alert('Invalid JSON in content field. Please check your syntax.');
        return;
      }

      // Parse tags
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        tags: tagsArray,
        content: parsedContent,
        is_public: formData.is_public,
      };

      const response = await fetch(`${BACKEND_URL}/api/templates/${templateType}/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Template updated successfully!');
        router.push('/templates');
      } else {
        alert(data.message || 'Failed to update template');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Failed to update template');
    } finally {
      setSaving(false);
    }
  };

  const handlePlaceholderInsert = (placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    const newContent = before + placeholder + after;
    setFormData({ ...formData, content: newContent });
    
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
      textarea.focus();
    }, 0);
    
    setShowPlaceholderBrowser(false);
  };

  if (loading) {
    return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Edit"
        subtitle="Manage edit"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Templates", href: "/templates" }, { label: "[Type]", href: "/templates/[type]" }, { label: "[Id]", href: "/templates/[type]/[id]" }, { label: "Edit" }]}
      />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600">
        </div></div>
      </div>
          );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/templates')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Templates
        </button>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Template</h1>
              <p className="text-gray-600 mt-1">Modify your template content and settings</p>
            </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Residential Snow Removal Estimate"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this template"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category & Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., snow_removal, general"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., residential, snow, seasonal"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

          {/* Template Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Template Content (JSON) *
              </label>
              <button
                type="button"
                onClick={() => setShowPlaceholderBrowser(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <SparklesIcon className="w-4 h-4" />
                Browse Placeholders
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Use {`{{variable_name}}`} for placeholders. Click "Browse Placeholders" to see 70+ system variables.
            </p>
            <textarea
              ref={textareaRef}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder='{"title": "{{title}}", "content": "{{content}}"}'
              rows={15}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              required
            />
          </div>

          {/* Public Template */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_public" className="ml-2 text-sm text-gray-700">
              Make this template available to all users
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.push('/templates')}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button></div>
          </div></div>
        </div></div>
      </div></div>
    </div></div>
  </form>
      {/* Placeholder Browser Modal */}
      {showPlaceholderBrowser && (
        <PlaceholderBrowser
          templateType={templateType}
          onSelect={handlePlaceholderInsert}
          onClose={() => setShowPlaceholderBrowser(false)}
        />
      )}
    </div>
        </div>
      </div>
    </div>
          );
}
