'use client';

import PageHeader from '@/components/PageHeader';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import SignaturePad from '@/components/SignaturePad';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Star,
} from 'lucide-react';

export default function FillFormPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const templateId = params.templateId as string;
  
  const [template, setTemplate] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentSignatureField, setCurrentSignatureField] = useState<string | null>(null);

  // Context from URL params
  const siteId = searchParams.get('siteId');
  const equipmentId = searchParams.get('equipmentId');
  const customerId = searchParams.get('customerId');
  const dispatchId = searchParams.get('dispatchId');

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      const response = await api.get(`/form-templates/${templateId}`);
      setTemplate(response.data);
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Failed to load form template');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData({ ...formData, [fieldId]: value });
  };

  const handleFileUpload = async (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      handleInputChange(fieldId, reader.result);
    };
    reader.readAsDataURL(file);
  };

  const openSignaturePad = (fieldId: string) => {
    setCurrentSignatureField(fieldId);
    setShowSignatureModal(true);
  };

  const handleSignatureSave = (signature: string) => {
    if (currentSignatureField) {
      handleInputChange(currentSignatureField, signature);
    }
    setShowSignatureModal(false);
    setCurrentSignatureField(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const requiredFields = template.fields.filter((f: any) => f.required);
    for (const field of requiredFields) {
      if (!formData[field.id] || formData[field.id] === '') {
        alert(`Please fill in required field: ${field.label}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      await api.post('/form-responses', {
        form_template_id: templateId,
        data: formData,
        site_id: siteId || undefined,
        equipment_id: equipmentId || undefined,
        customer_id: customerId || undefined,
        dispatch_id: dispatchId || undefined,
      });

      alert('Form submitted successfully!');
      router.push('/forms');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'time':
        return (
          <input
            type="time"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select an option</option>
            {field.options?.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => handleInputChange(field.id, e.target.checked)}
              className="w-4 h-4 text-[#3f72af] rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">{field.placeholder || 'Check this box'}</span>
          </label>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option: string, index: number) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-4 h-4 text-[#3f72af] focus:ring-blue-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
  );

      case 'rating':
        return (
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleInputChange(field.id, rating)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  className={`w-8 h-8 ${
                    value >= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
  );

      case 'signature':
        return (
          <div>
            {value ? (
              <div className="relative border border-gray-300 rounded-lg p-2">
                <img src={value} alt="Signature" className="max-h-32" />
                <button
                  type="button"
                  onClick={() => handleInputChange(field.id, '')}
                  className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openSignaturePad(field.id)}
                className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-600 hover:text-[#3f72af] font-medium"
              >
                Click to Sign
              </button>
            )}
          </div>
  );

      case 'photo':
        return (
          <div>
            {value ? (
              <div className="relative border border-gray-300 rounded-lg p-2">
                <img src={value} alt="Upload" className="max-h-64 mx-auto" />
                <button
                  type="button"
                  onClick={() => handleInputChange(field.id, '')}
                  className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="block w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
                <div className="flex flex-col items-center space-y-2 text-gray-600 hover:text-[#3f72af]">
                  <Upload className="w-8 h-8" />
                  <span className="font-medium">Click to upload photo</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(field.id, e)}
                  className="hidden"
                />
              </label>
            )}
          </div>
  );

      // Inspection Field Types
      case 'pass_fail':
        return (
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => handleInputChange(field.id, 'Pass')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                value === 'Pass'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✓ Pass
            </button>
            <button
              type="button"
              onClick={() => handleInputChange(field.id, 'Fail')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                value === 'Fail'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✗ Fail
            </button>
          </div>
  );

      case 'yes_no':
        return (
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => handleInputChange(field.id, 'Yes')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                value === 'Yes'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleInputChange(field.id, 'No')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                value === 'No'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              No
            </button>
          </div>
  );

      case 'yes_no_na':
        return (
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => handleInputChange(field.id, 'Yes')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                value === 'Yes'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleInputChange(field.id, 'No')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                value === 'No'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => handleInputChange(field.id, 'N/A')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                value === 'N/A'
                  ? 'bg-gray-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              N/A
            </button>
          </div>
  );

      case 'condition':
        return (
          <div className="space-y-2">
            {['Excellent', 'Good', 'Fair', 'Poor', 'Critical'].map((condition) => (
              <button
                key={condition}
                type="button"
                onClick={() => handleInputChange(field.id, condition)}
                className={`w-full px-6 py-3 rounded-lg font-medium text-left transition-all ${
                  value === condition
                    ? condition === 'Excellent'
                      ? 'bg-green-600 text-white shadow-lg'
                      : condition === 'Good'
                      ? 'bg-[#3f72af] text-white shadow-lg'
                      : condition === 'Fair'
                      ? 'bg-yellow-600 text-white shadow-lg'
                      : condition === 'Poor'
                      ? 'bg-orange-600 text-white shadow-lg'
                      : 'bg-red-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {condition}
              </button>
            ))}
          </div>
  );

      case 'inspection_checklist':
        return (
          <div className="space-y-3">
            {field.options?.map((item: string, index: number) => {
              const checklistValue = value || {};
              return (
                <label
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checklistValue[item] || false}
                    onChange={(e) => {
                      const newValue = { ...checklistValue, [item]: e.target.checked };
                      handleInputChange(field.id, newValue);
                    }}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-gray-900 font-medium flex-1">{item}</span>
                  {checklistValue[item] && (
                    <span className="text-green-600 text-sm font-semibold">✓ Checked</span>
                  )}
                </label>
              );
            })}
          </div>
  );

      default:
        return <p className="text-gray-500">Unsupported field type: {field.type}</p>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Fill"
        subtitle="Manage fill"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Forms", href: "/forms" }, { label: "Details" }]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f72af] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading form...</p>
          </div>
        </div>
      </div>
    </div>
  );
  }

  if (!template) {
    return (
              <div className="text-center py-12">
          <p className="text-red-600">Form template not found</p>
        </div>
  );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Fill Form"
        subtitle="Complete form template"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Fill Form" }]}
      />
      <div className="flex-1 overflow-auto p-6">
          <div className="p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center space-x-4">
            <button
              onClick={() => router.push('/forms')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
              {template.description && (
                <p className="text-gray-600 mt-1">{template.description}</p>
              )}
            </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="space-y-6">
              {template.fields.map((field: any) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/forms')}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#2c5282] disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                <Save className="w-5 h-5" />
                <span>{submitting ? 'Submitting...' : 'Submit Form'}</span>
              </button>
            </div>
          </form>
        </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-4 w-full max-w-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Add Signature</h3>
            <SignaturePad
              onSave={handleSignatureSave}
              onCancel={() => setShowSignatureModal(false)}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  </div>
</div>
  );
}
