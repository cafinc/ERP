'use client';

import PageHeader from '@/components/PageHeader';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  CheckIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function TemplateViewPage() {
  const router = useRouter();
  const params = useParams();
  const templateType = params.type as string;
  const templateId = params.id as string;

  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [sampleData, setSampleData] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTemplate();
  }, [templateType, templateId]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/templates/${templateType}/${templateId}`);
      const data = await response.json();
      
      if (data.success) {
        setTemplate(data.template);
        
        // Initialize sample data for all variables
        const initialData: Record<string, string> = {};
        data.template.variables?.forEach((v: string) => {
          initialData[v] = '';
        });
        setSampleData(initialData);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async () => {
    try {
      setApplying(true);
      const response = await fetch(
        `${BACKEND_URL}/api/templates/${templateType}/${templateId}/apply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: sampleData })
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert('Template applied successfully! Check console for result.');
        console.log('Applied template result:', result);
      }
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Failed to apply template');
    } finally {
      setApplying(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/templates/${templateType}/${templateId}/duplicate`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        router.push('/templates');
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="[Id]"
        subtitle="Manage [id]"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Templates", href: "/templates" }, { label: "[Type]", href: "/templates/[type]" }, { label: "[Id]" }]}
      />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div></div>
  );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Template not found</h2>
          <button
            onClick={() => router.push('/templates')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Templates
          </button>
        </div>
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
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
                {template.is_default && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm rounded">
                    Default Template
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-4">{template.description}</p>
              
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">Type: <strong>{template.type}</strong></span>
                <span className="text-gray-500">Category: <strong>{template.category}</strong></span>
                <span className="text-gray-500">Used: <strong>{template.usage_count || 0} times</strong></span>
              </div>

              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {template.tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDuplicate}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <DocumentDuplicateIcon className="w-5 h-5" />
                Duplicate
              </button>
              <button
                onClick={() => router.push(`/templates/${templateType}/${templateId}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PencilIcon className="w-5 h-5" />
                Edit
              </button>
            </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Template Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Template Content</h2>
            <button
              onClick={() => copyToClipboard(JSON.stringify(template.content, null, 2))}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ClipboardDocumentIcon className="w-4 h-4" />
              Copy JSON
            </button>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">
              {JSON.stringify(template.content, null, 2)}
            </pre>
          </div>
        </div>

        {/* Variables & Preview */}
        <div className="space-y-6">
          {/* Variables */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Variables ({template.variables?.length || 0})
            </h2>
            
            {template.variables && template.variables.length > 0 ? (
              <div className="space-y-3">
                {template.variables.map((variable: string) => (
                  <div key={variable}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {variable}
                    </label>
                    <input
                      type="text"
                      value={sampleData[variable] || ''}
                      onChange={(e) => setSampleData({
                        ...sampleData,
                        [variable]: e.target.value
                      })}
                      placeholder={`Enter ${variable}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}

                <button
                  onClick={handleApplyTemplate}
                  disabled={applying}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                >
                  {applying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Applying...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-5 h-5" />
                      Apply Template
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No variables defined in this template</p>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Metadata</h2>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Version:</span>
                <span className="font-medium">{template.version || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Public:</span>
                <span className="font-medium">{template.is_public ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">
                  {new Date(template.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">
                  {new Date(template.updated_at).toLocaleDateString()}
                </span>
              </div>
              {template.last_used && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Used:</span>
                  <span className="font-medium">
                    {new Date(template.last_used).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</div>
  );
}
