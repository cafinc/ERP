'use client';

import PageHeader from '@/components/PageHeader';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  ArrowLeft,
  Truck,
  FileText,
  Link as LinkIcon,
  Plus,
  RefreshCw,
  Save,
} from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  unit_number: string;
  equipment_type: string;
  assigned_form_template_id?: string;
}

interface FormTemplate {
  id: string;
  name: string;
  form_type: string;
}

export default function EquipmentFormsPage() {
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignments, setAssignments] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [equipmentRes, templatesRes] = await Promise.all([
        api.get('/equipment'),
        api.get('/form-templates'),
      ]);

      setEquipment(equipmentRes.data || []);
      setFormTemplates(templatesRes.data || []);

      // Build initial assignments map
      const initialAssignments: { [key: string]: string } = {};
      (equipmentRes.data || []).forEach((eq: Equipment) => {
        if (eq.assigned_form_template_id) {
          initialAssignments[eq.id] = eq.assigned_form_template_id;
        }
      });
      setAssignments(initialAssignments);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignment = (equipmentId: string, templateId: string) => {
    setAssignments({ ...assignments, [equipmentId]: templateId });
  };

  const handleSave = async (equipmentId: string) => {
    try {
      setSaving(true);
      const templateId = assignments[equipmentId];
      
      await api.put(`/equipment/${equipmentId}`, {
        assigned_form_template_id: templateId || undefined,
      });

      alert('Form assignment saved successfully!');
      loadData();
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert('Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Equipment Forms"
        subtitle="Manage equipment forms"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Equipment Forms" }]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </div>
    </div>
  </div>
  );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Equipment Forms"
        subtitle="Form templates"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Equipment Forms" }]}
      />
      <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/settings')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Equipment Form Assignment</h1>
            <p className="text-gray-600 mt-1">Link inspection forms to equipment</p>
          </div>
        </div>
        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <LinkIcon className="w-5 h-5 text-[#3f72af] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900">
              Assign specific inspection form templates to equipment. This will automatically use the assigned form when creating inspections for this equipment.
            </p>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-3">
                <Truck className="w-6 h-6 text-[#3f72af]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{equipment.length}</p>
                <p className="text-sm text-gray-600">Total Equipment</p>
              </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-3">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formTemplates.length}</p>
                <p className="text-sm text-gray-600">Form Templates</p>
              </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-lg p-3">
                <LinkIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(assignments).length}</p>
                <p className="text-sm text-gray-600">Assignments</p>
              </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Form Assignments</h2>
          </div>

          {equipment.length === 0 ? (
            <div className="p-12 text-center">
              <Truck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900">No Equipment Found</p>
              <p className="text-sm text-gray-600 mt-2">Add equipment to assign forms</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Form</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {equipment.map((eq) => (
                    <tr key={eq.id} className="hover:bg-gray-50 transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{eq.name}</div>                          <div className="text-sm text-gray-500">{eq.unit_number}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded capitalize">
                          {eq.equipment_type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={assignments[eq.id] || ''}
                          onChange={(e) => handleAssignment(eq.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">No form assigned</option>
                          {formTemplates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleSave(eq.id)}
                          disabled={saving}
                          className="flex items-center gap-1 px-3 py-1 bg-[#3f72af] text-white rounded hover:bg-[#2c5282] disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
    </div>
  </div>
</div>
  );
}
