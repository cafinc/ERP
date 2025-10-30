'use client';

import PageHeader from '@/components/PageHeader';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  Plus,
  X,
  Save,
  ArrowLeft,
  GripVertical,
  Type,
  Hash,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckSquare,
  List,
  Image as ImageIcon,
  PenTool,
  Star,
  AlignLeft,
} from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

const FIELD_TYPES = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'textarea', label: 'Text Area', icon: AlignLeft },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'time', label: 'Time', icon: Clock },
  { type: 'select', label: 'Dropdown', icon: List },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'radio', label: 'Radio', icon: CheckSquare },
  { type: 'rating', label: 'Rating', icon: Star },
  { type: 'signature', label: 'Signature', icon: PenTool },
  { type: 'photo', label: 'Photo', icon: ImageIcon },
  // Inspection-specific fields
  { type: 'pass_fail', label: 'Pass/Fail', icon: CheckSquare },
  { type: 'yes_no', label: 'Yes/No', icon: CheckSquare },
  { type: 'yes_no_na', label: 'Yes/No/N/A', icon: CheckSquare },
  { type: 'condition', label: 'Condition Rating', icon: Star },
  { type: 'inspection_checklist', label: 'Inspection Checklist', icon: List },
];

export default function FormBuilderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('templateId');

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState('');
  const [formSubtype, setFormSubtype] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  const formTypeOptions = [
    { 
      id: 'crm', 
      label: 'CRM', 
      color: 'blue',
      subtypes: ['Customers', 'Estimates', 'Agreements', 'Projects', 'Invoices']
    },
    { 
      id: 'financials', 
      label: 'Financials', 
      color: 'green',
      subtypes: ['Invoices', 'Estimates', 'Expenses', 'Payments', 'Reports']
    },
    { 
      id: 'access', 
      label: 'Access', 
      color: 'cyan',
      subtypes: ['Team', 'Crew']
    },
    { 
      id: 'assets', 
      label: 'Assets', 
      color: 'orange',
      subtypes: ['Equipment', 'Vehicles', 'Trailers', 'Tools', 'Maintenance', 'Inspections']
    },
    { 
      id: 'dispatch', 
      label: 'Dispatch', 
      color: 'indigo',
      subtypes: ['Routes', 'Jobs', 'Schedules']
    },
    { 
      id: 'comms', 
      label: 'Comms', 
      color: 'pink',
      subtypes: ['Messages', 'Notifications']
    },
    { 
      id: 'safety', 
      label: 'Safety', 
      color: 'red',
      subtypes: ['Policies', 'Training', 'Incidents', 'Inspections', 'Hazards', 'PPE', 'Meetings', 'Emergency']
    },
    { 
      id: 'tasks', 
      label: 'Tasks', 
      color: 'yellow',
      subtypes: ['General', 'Projects', 'Maintenance']
    },
  ];

  const getTypeGradient = (color: string) => {
    const gradientMap: { [key: string]: string } = {
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

  const selectedTypeData = formTypeOptions.find(t => t.id === formType);

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      const response = await api.get(`/form-templates/${templateId}`);
      const template = response.data;
      setFormName(template.name);
      setFormDescription(template.description || '');
      
      // Parse form_type if it contains underscore (e.g., "crm_customers")
      if (template.form_type && template.form_type.includes('_')) {
        const [type, subtype] = template.form_type.split('_');
        setFormType(type);
        setFormSubtype(subtype);
      } else {
        setFormType(template.form_type || '');
      }
      
      setFields(template.fields || []);
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Failed to load template');
    }
  };

  const addField = (type: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: `New ${type} field`,
      type,
      required: false,
      placeholder: '',
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined,
    };
    setFields([...fields, newField]);
    setEditingField(newField.id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (editingField === id) setEditingField(null);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    
    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFields(newFields);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formType || !formSubtype) {
      alert('Please fill in form name, type, and subtype');
      return;
    }

    if (fields.length === 0) {
      alert('Please add at least one field');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formName,
        description: formDescription,
        form_type: `${formType}_${formSubtype.toLowerCase().replace(/\s+/g, '_')}`,
        fields: fields,
      };

      if (templateId) {
        await api.put(`/form-templates/${templateId}`, payload);
      } else {
        await api.post('/form-templates', payload);
      }

      alert('Form template saved successfully!');
      router.push('/forms');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Builder"
        subtitle="Manage builder"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Forms", href: "/forms" }, { label: "Builder" }]}
      />
      <div className="flex-1 overflow-auto p-6">
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/forms')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {templateId ? 'Edit' : 'Create'} Form Template
              </h1>
              <p className="text-gray-600">Design your custom form</p>
            </div></div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#2c5282] disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving...' : 'Save Template'}</span>
          </button></div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Field Types</h2>
            <div className="space-y-2">
              {FIELD_TYPES.map((fieldType) => {
                const Icon = fieldType.icon;
                return (
                  <button
                    key={fieldType.type}
                    onClick={() => addField(fieldType.type)}
                    className="w-full flex items-center space-x-3 p-3 bg-gray-50 hover:bg-blue-50 hover:text-[#3f72af] rounded-lg transition-colors text-left"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{fieldType.label}</span>
                  </button>
  );
              })}
            </div></div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Form Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Form Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Enter form name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description of this form"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Form Type *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {formTypeOptions.map(type => {
                      const gradient = getTypeGradient(type.color);
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => {
                            setFormType(type.id);
                            setFormSubtype(''); // Reset subtype when changing main type
                          }}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            formType === type.id
                              ? `border-transparent bg-gradient-to-br ${gradient} text-white shadow-md scale-105`
                              : `border-gray-200 bg-white hover:border-${type.color}-300 hover:shadow-sm`
                          }`}
                        >
                          <div className="text-sm font-semibold">{type.label}</div></button>
  );
                    })}
                  </div></div>

                {formType && selectedTypeData && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Subtype *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {selectedTypeData.subtypes.map(subtype => (
                        <button
                          key={subtype}
                          type="button"
                          onClick={() => setFormSubtype(subtype)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            formSubtype === subtype
                              ? `bg-gradient-to-r ${getTypeGradient(selectedTypeData.color).replace('500', '600').replace('600', '700')} text-white shadow-md`
                              : `bg-gray-100 text-gray-700 hover:bg-gray-200`
                          }`}
                        >
                          {subtype}
                        </button>
                      ))}
                    </div></div>
                )}
              </div></div>

            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Form Fields</h2>
              
              {fields.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <Plus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No fields added yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Click on field types to add them to your form
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex flex-col space-y-1 mt-2">
                          <button
                            onClick={() => moveField(index, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                          >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                          </button></div>

                        <div className="flex-1">
                          {editingField === field.id ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateField(field.id, { label: e.target.value })}
                                placeholder="Field label"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />

                              <input
                                type="text"
                                value={field.placeholder || ''}
                                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                placeholder="Placeholder text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />

                              {(field.type === 'select' || field.type === 'radio') && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Options (one per line)
                                  </label>
                                  <textarea
                                    value={field.options?.join('\n') || ''}
                                    onChange={(e) => updateField(field.id, { 
                                      options: e.target.value.split('\n').filter(o => o.trim()) 
                                    })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                  />
                                </div>
                              )}

                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                  className="w-4 h-4 text-[#3f72af] rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Required field</span>
                              </label>

                              <button
                                onClick={() => setEditingField(null)}
                                className="text-sm text-[#3f72af] hover:text-blue-700 font-medium"
                              >
                                Done Editing
                              </button></div>
                          ) : (
                            <div onClick={() => setEditingField(field.id)} className="cursor-pointer">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900">{field.label}</span>
                                {field.required && (
                                  <span className="text-red-500 text-sm">*</span>
                                )}
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  {field.type}
                                </span>
                              </div>
                              {field.placeholder && (
                                <p className="text-sm text-gray-500">{field.placeholder}</p>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => removeField(field.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button></div></div>
                  ))}
                </div>
              )}
            </div></div></div></div></div></div>);
}
