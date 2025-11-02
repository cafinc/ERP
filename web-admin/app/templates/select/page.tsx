'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { getStarterTemplates } from '@/lib/starterTemplates';

const TEMPLATE_TYPES = [
  { id: 'invoice', label: 'Invoice', color: 'bg-blue-500', description: 'Create professional invoices' },
  { id: 'estimate', label: 'Estimate', color: 'bg-green-500', description: 'Generate project estimates' },
  { id: 'agreement', label: 'Agreement', color: 'bg-purple-500', description: 'Service agreements & contracts' },
  { id: 'work_order', label: 'Work Order', color: 'bg-orange-500', description: 'Field work orders' },
];

export default function TemplateSelectPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'invoice' | 'estimate' | 'agreement' | 'work_order'>('invoice');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const starterTemplates = getStarterTemplates(selectedType);

  const handleCreateTemplate = () => {
    if (selectedTemplate === 'blank') {
      // Create blank template
      router.push(`/templates/builder?type=${selectedType}`);
    } else if (selectedTemplate) {
      // Load starter template
      const template = starterTemplates.find(t => t.id === selectedTemplate);
      if (template) {
        router.push(`/templates/builder?starter=${selectedTemplate}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push('/templates')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Templates</span>
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Template</h1>
          <p className="text-lg text-gray-600">
            Choose a document type and start from scratch or use a pre-designed template
          </p>
        </div>

        {/* Type Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Select Document Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {TEMPLATE_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedType(type.id as any);
                  setSelectedTemplate(null);
                }}
                className={`p-6 rounded-xl border-2 transition-all ${
                  selectedType === type.id
                    ? 'border-[#3f72af] bg-blue-50 ring-2 ring-[#3f72af]/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`w-12 h-12 ${type.color} rounded-lg flex items-center justify-center mb-4`}>
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{type.label}</h3>
                <p className="text-sm text-gray-600">{type.description}</p>
                {selectedType === type.id && (
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#3f72af] text-white rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Selected
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Template Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Step 2: Choose Starting Point
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Blank Template Option */}
            <button
              onClick={() => setSelectedTemplate('blank')}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                selectedTemplate === 'blank'
                  ? 'border-[#3f72af] bg-blue-50 ring-2 ring-[#3f72af]/20'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-center h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">Start from Scratch</p>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Blank Template</h3>
              <p className="text-sm text-gray-600">
                Build your own custom design from the ground up
              </p>
              {selectedTemplate === 'blank' && (
                <div className="mt-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#3f72af] text-white rounded-full text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Selected
                  </span>
                </div>
              )}
            </button>

            {/* Starter Templates */}
            {starterTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  selectedTemplate === template.id
                    ? 'border-[#3f72af] bg-blue-50 ring-2 ring-[#3f72af]/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                {/* Preview Placeholder */}
                <div className="h-48 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 p-4">
                    <div className="bg-white h-full rounded shadow-sm p-3 space-y-2">
                      <div className="h-4 bg-blue-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      <div className="mt-4 space-y-1">
                        <div className="h-2 bg-gray-200 rounded"></div>
                        <div className="h-2 bg-gray-200 rounded"></div>
                        <div className="h-2 bg-gray-200 rounded w-4/5"></div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 bg-[#3f72af] text-white px-2 py-1 rounded text-xs font-medium">
                    Professional
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600">{template.description}</p>
                {selectedTemplate === template.id && (
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#3f72af] text-white rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Selected
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={() => router.push('/templates')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleCreateTemplate}
            disabled={!selectedTemplate}
            className={`px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              selectedTemplate
                ? 'bg-[#3f72af] text-white hover:bg-[#3f72af]/90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span>
              {selectedTemplate === 'blank' ? 'Start Building' : 'Use This Template'}
            </span>
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
