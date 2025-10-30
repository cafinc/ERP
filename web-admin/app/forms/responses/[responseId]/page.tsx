'use client';

import PageHeader from '@/components/PageHeader';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  ArrowLeft,
  Download,
  Calendar,
  User,
  CheckCircle,
  Star,
} from 'lucide-react';

export default function ViewResponsePage() {
  const params = useParams();
  const router = useRouter();
  const responseId = params.responseId as string;

  const [response, setResponse] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResponse();
  }, [responseId]);

  const loadResponse = async () => {
    try {
      const responsesRes = await api.get('/form-responses');
      const foundResponse = responsesRes.data.find((r: any) => r.id === responseId);
      
      if (foundResponse) {
        setResponse(foundResponse);
        
        // Load template
        const templateRes = await api.get(`/form-templates/${foundResponse.form_template_id}`);
        setTemplate(templateRes.data);
      }
    } catch (error) {
      console.error('Error loading response:', error);
      alert('Failed to load form response');
    } finally {
      setLoading(false);
    }
  };

  const renderFieldValue = (field: any, value: any) => {
    if (!value && value !== 0 && value !== false) {
      return <span className="text-gray-400 italic">No response</span>;
    }

    switch (field.type) {
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <CheckCircle className={`w-5 h-5 ${value ? 'text-green-600' : 'text-gray-300'}`} />
            <span>{value ? 'Checked' : 'Not checked'}</span>
          </div>
        );

      case 'rating':
        return (
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Star
                key={rating}
                className={`w-5 h-5 ${
                  value >= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
            <span className="ml-2 text-gray-600">({value}/5)</span>
          </div>
        );

      case 'pass_fail':
        return (
          <div className="inline-flex items-center space-x-2">
            <span
              className={`px-6 py-2 rounded-lg font-semibold ${
                value === 'Pass'
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : value === 'Fail'
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {value === 'Pass' ? '✓ Pass' : value === 'Fail' ? '✗ Fail' : value}
            </span>
          </div>
        );

      case 'yes_no':
        return (
          <div className="inline-flex items-center space-x-2">
            <span
              className={`px-6 py-2 rounded-lg font-semibold ${
                value === 'Yes'
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : value === 'No'
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {value}
            </span>
          </div>
        );

      case 'yes_no_na':
        return (
          <div className="inline-flex items-center space-x-2">
            <span
              className={`px-6 py-2 rounded-lg font-semibold ${
                value === 'Yes'
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : value === 'No'
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : value === 'N/A'
                  ? 'bg-gray-100 text-gray-700 border border-gray-300'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {value}
            </span>
          </div>
        );

      case 'condition':
        return (
          <div className="inline-flex items-center space-x-2">
            <span
              className={`px-6 py-2 rounded-lg font-semibold ${
                value === 'Excellent'
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : value === 'Good'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : value === 'Fair'
                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                  : value === 'Poor'
                  ? 'bg-orange-100 text-orange-700 border border-orange-300'
                  : value === 'Critical'
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {value}
            </span>
          </div>
        );

      case 'inspection_checklist':
        return (
          <div className="space-y-2">
            {field.options?.map((item: string, index: number) => {
              const checklistValue = value || {};
              const isChecked = checklistValue[item] || false;
              return (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-lg border ${
                    isChecked
                      ? 'bg-green-50 border-green-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <CheckCircle
                    className={`w-5 h-5 ${
                      isChecked ? 'text-green-600' : 'text-gray-300'
                    }`}
                  />
                  <span
                    className={`flex-1 ${
                      isChecked ? 'text-gray-900 font-medium' : 'text-gray-600'
                    }`}
                  >
                    {item}
                  </span>
                  {isChecked && (
                    <span className="text-green-600 text-sm font-semibold">
                      ✓ Checked
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'signature':
        return (
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <img src={value} alt="Signature" className="max-h-32" />
          </div>
        );

      case 'photo':
        return (
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <img src={value} alt="Photo" className="max-h-64" />
          </div>
        );

      case 'textarea':
        return <p className="whitespace-pre-wrap text-gray-900">{value}</p>;

      default:
        return <p className="text-gray-900">{String(value)}</p>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Responses Details"
        subtitle="View and manage details"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Forms", href: "/forms" }, { label: "Responses", href: "/forms/responses" }, { label: "Details" }]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f72af] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading response...</p>
          </div>
        </div>
          </div>
    </div>
    );
  }

  if (!response || !template) {
    return (
              <div className="text-center py-12">
          <p className="text-red-600">Response not found</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Form Response"
        subtitle="View submission"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Form Response" }]}
      />
      <div className="flex-1 overflow-auto p-6">
          <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/forms')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Form Response</h1>
                <p className="text-gray-600 mt-1">{template.name}</p>
              </div>
            <a
              href={`/api/form-responses/${responseId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#2c5282] text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Download PDF</span>
            </a>
          </div>

          {/* Response Info */}
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-4 mb-4 hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <User className="w-6 h-6 text-[#3f72af]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted By</p>
                  <p className="font-semibold text-gray-900">{response.submitted_by}</p>
                </div>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted On</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(response.submitted_at).toLocaleString()}
                  </p>
                </div>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold text-gray-900">Completed</p>
                </div>

          {/* Form Data */}
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Form Data</h2>
            <div className="space-y-6">
              {template.fields.map((field: any) => (
                <div key={field.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <div className="pl-4">
                    {renderFieldValue(field, response.data[field.id])}
                  </div>
                </div>
              ))}
            </div>
            </div>
    </div>
  );
}
