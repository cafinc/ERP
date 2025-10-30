'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  FileText,
  Save,
  X,
  Plus,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

// Default 15 sections for snow removal agreement
const DEFAULT_SECTIONS = [
  { id: 1, title: 'Service Overview', content: '', required: true },
  { id: 2, title: 'Scope of Services', content: '', required: true },
  { id: 3, title: 'Service Areas & Locations', content: '', required: true },
  { id: 4, title: 'Pricing & Payment Terms', content: '', required: true },
  { id: 5, title: 'Service Schedule & Response Time', content: '', required: true },
  { id: 6, title: 'Weather Triggers & Thresholds', content: '', required: false },
  { id: 7, title: 'Equipment & Materials', content: '', required: false },
  { id: 8, title: 'Insurance & Liability', content: '', required: true },
  { id: 9, title: 'Term & Renewal', content: '', required: true },
  { id: 10, title: 'Termination Clause', content: '', required: true },
  { id: 11, title: 'Safety & Compliance', content: '', required: false },
  { id: 12, title: 'Communication Protocol', content: '', required: false },
  { id: 13, title: 'Dispute Resolution', content: '', required: false },
  { id: 14, title: 'Special Conditions', content: '', required: false },
  { id: 15, title: 'Signatures & Acceptance', content: '', required: true },
];

export default function CreateAgreementTemplatePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(1);
  const [saving, setSaving] = useState(false);
  
  const [template, setTemplate] = useState({
    template_name: '',
    category: 'Snow Removal Services',
    description: '',
    pricing_structure: 'seasonal',
    payment_terms: 'Net 30',
    auto_renew: false,
    sections: DEFAULT_SECTIONS,
  });

  const handleSectionUpdate = (sectionId: number, content: string) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, content } : s
      ),
    }));
  };

  const handleAddCustomSection = () => {
    const newId = Math.max(...template.sections.map(s => s.id)) + 1;
    setTemplate(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        { id: newId, title: 'Custom Section', content: '', required: false }
      ],
    }));
    setActiveTab(newId);
  };

  const handleRemoveSection = (sectionId: number) => {
    if (!confirm('Remove this section?')) return;
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
    }));
    if (activeTab === sectionId) {
      setActiveTab(1);
    }
  };

  const handleSave = async () => {
    if (!template.template_name.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      setSaving(true);
      await api.post('/agreement-templates', template);
      alert('Template created successfully!');
      router.push('/agreements/templates');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const currentSection = template.sections.find(s => s.id === activeTab);

  return (
    <>
      {/* Page Header */}
      <PageHeader
        title="Create Agreement Template"
        breadcrumbs={[
          { label: 'Agreements', href: '/agreements' },
          { label: 'Templates', href: '/agreements/templates' },
          { label: 'Create' }
        ]}
        actions={[
          {
            label: 'Cancel',
            onClick: () => router.push('/agreements/templates'),
            variant: 'secondary' as const,
          },
          {
            label: saving ? 'Saving...' : 'Save Template',
            icon: <Save className="w-4 h-4 mr-2" />,
            onClick: handleSave,
            variant: 'primary',
          },
        ]}
      />

      {/* Main Content */}
      <div className="h-full bg-gray-50 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Template Info */}
          <div className="bg-white/60 rounded-2xl shadow-lg shadow-sm border border-white/40 p-8 backdrop-blur-sm mb-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={template.template_name}
                  onChange={(e) => setTemplate({ ...template, template_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Standard Snow Removal Agreement"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={template.category}
                  onChange={(e) => setTemplate({ ...template, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Snow Removal Services">Snow Removal Services</option>
                  <option value="Lawn Care Services">Lawn Care Services</option>
                  <option value="Parking Lot Services">Parking Lot Services</option>
                  <option value="Master Service Agreement">Master Service Agreement</option>
                  <option value="Seasonal Contract">Seasonal Contract</option>
                  <option value="One-Time Service">One-Time Service</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={template.description}
                  onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of this agreement template..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing Structure
                </label>
                <select
                  value={template.pricing_structure}
                  onChange={(e) => setTemplate({ ...template, pricing_structure: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="seasonal">Seasonal</option>
                  <option value="per_occurrence">Per Occurrence</option>
                  <option value="hourly">Hourly</option>
                  <option value="monthly">Monthly</option>
                  <option value="fixed">Fixed Price</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Terms
                </label>
                <select
                  value={template.payment_terms}
                  onChange={(e) => setTemplate({ ...template, payment_terms: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Net 30">Net 30</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="50% Deposit">50% Deposit</option>
                  <option value="Monthly Installments">Monthly Installments</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={template.auto_renew}
                    onChange={(e) => setTemplate({ ...template, auto_renew: e.target.checked })}
                    className="w-4 h-4 text-[#3f72af] border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Auto-renew agreement</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sections Editor */}
          <div className="bg-white/60 rounded-2xl shadow-lg shadow-sm border border-white/40 backdrop-blur-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Agreement Sections</h3>
              <button
                onClick={handleAddCustomSection}
                className="flex items-center space-x-2 px-3 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Section</span>
              </button>
            </div>
            
            <div className="flex">
              {/* Sections Sidebar */}
              <div className="w-80 border-r border-gray-200 overflow-y-auto" style={{ maxHeight: '600px' }}>
                {template.sections.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveTab(section.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left border-b border-gray-100 transition-colors ${
                      activeTab === section.id
                        ? 'bg-[#3f72af] text-white'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Section {index + 1}</span>
                        {section.required && (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                      <p className="text-xs mt-1 opacity-90">{section.title}</p>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ))}
              </div>

              {/* Section Content Editor */}
              <div className="flex-1 p-6" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {currentSection && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <input
                          type="text"
                          value={currentSection.title}
                          onChange={(e) => {
                            setTemplate(prev => ({
                              ...prev,
                              sections: prev.sections.map(s =>
                                s.id === currentSection.id ? { ...s, title: e.target.value } : s
                              ),
                            }));
                          }}
                          className="text-xl font-semibold text-gray-900 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none transition-colors"
                        />
                        {currentSection.required && (
                          <span className="inline-block ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                            Required
                          </span>
                        )}
                      </div>
                      {!currentSection.required && (
                        <button
                          onClick={() => handleRemoveSection(currentSection.id)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <textarea
                      value={currentSection.content}
                      onChange={(e) => handleSectionUpdate(currentSection.id, e.target.value)}
                      rows={15}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="Enter section content here...\n\nYou can use placeholders like:\n{{customer_name}}\n{{service_address}}\n{{start_date}}\n{{contract_value}}"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      💡 Tip: Use {{placeholders}} for dynamic content that will be filled in when creating agreements
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
