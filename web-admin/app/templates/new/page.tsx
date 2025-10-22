'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const TEMPLATE_TYPES = [
  { id: 'estimate', label: 'Estimate', description: 'Service estimate templates' },
  { id: 'invoice', label: 'Invoice', description: 'Invoice and billing templates' },
  { id: 'proposal', label: 'Proposal', description: 'Business proposal templates' },
  { id: 'contract', label: 'Contract', description: 'Service agreement templates' },
  { id: 'work_order', label: 'Work Order', description: 'Work order and checklist templates' },
  { id: 'project', label: 'Project', description: 'Project workflow templates' },
  { id: 'notification', label: 'Notification', description: 'Email and SMS notification templates' },
  { id: 'email', label: 'Email', description: 'Email message templates' },
];

export default function CreateTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'estimate',
    name: '',
    description: '',
    category: 'general',
    tags: '',
    content: '{}',
    is_public: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      setLoading(true);
      
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
        type: formData.type,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        tags: tagsArray,
        content: parsedContent,
        is_public: formData.is_public,
      };

      const response = await fetch(`${BACKEND_URL}/api/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Template created successfully!');
        router.push('/templates');
      } else {
        alert(data.message || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (value: string) => {
    setFormData({ ...formData, content: value });
  };

  // Example content for each type
  const getExampleContent = (type: string) => {
    const examples: Record<string, any> = {
      estimate: {
        title: 'Service Estimate',
        customer_name: '{{customer_name}}',
        estimate_number: '{{estimate_number}}',
        date: '{{date}}',
        line_items: [
          {
            description: '{{service_description}}',
            quantity: 1,
            unit_price: '{{price}}',
            total: '{{total}}'
          }
        ],
        subtotal: '{{subtotal}}',
        tax_rate: '{{tax_rate}}',
        total: '{{total}}',
        notes: 'Thank you for your business!'
      },
      invoice: {
        title: 'Invoice',
        invoice_number: '{{invoice_number}}',
        invoice_date: '{{date}}',
        customer_name: '{{customer_name}}',
        line_items: [
          {
            description: '{{item_description}}',
            quantity: '{{quantity}}',
            unit_price: '{{price}}',
            total: '{{total}}'
          }
        ],
        subtotal: '{{subtotal}}',
        total: '{{total}}',
        payment_terms: 'Net 30'
      },
      notification: {
        subject: '{{subject}}',
        message: 'Dear {{customer_name}},\n\n{{message_body}}\n\nBest regards,\n{{company_name}}'
      }
    };

    return examples[type] || { title: '{{title}}', content: '{{content}}' };
  };

  const insertExample = () => {
    const example = getExampleContent(formData.type);
    setFormData({ ...formData, content: JSON.stringify(example, null, 2) });
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Create New Template</h1>
              <p className="text-gray-600 mt-1">Build a custom template for your business documents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Template Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TEMPLATE_TYPES.map(type => (
                <option key={type.id} value={type.id}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>

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
          </div>

          {/* Template Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Template Content (JSON) *
              </label>
              <button
                type="button"
                onClick={insertExample}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Insert Example
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Use {`{{variable_name}}`} for placeholders. Example: {`{{customer_name}}`}, {`{{total}}`}
            </p>
            <textarea
              value={formData.content}
              onChange={(e) => handleContentChange(e.target.value)}
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
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <SaveIcon className="w-5 h-5" />
                  Create Template
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
