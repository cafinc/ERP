'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import api from '@/lib/api';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  equipment_type: string;
}

interface FormTemplate {
  id: string;
  name: string;
  form_type: string;
}

interface User {
  id: string;
  name: string;
  role: string;
}

interface ComplianceRule {
  rule_name: string;
  action: string;
  threshold_days?: number;
  description?: string;
  enabled: boolean;
}

export default function CreateInspectionSchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    equipment_id: '',
    form_template_id: '',
    frequency: 'monthly',
    custom_interval_days: 30,
    assigned_inspector_id: '',
    next_due_date: '',
    auto_create: true,
    send_reminders: true,
    reminder_days_before: 3,
  });

  const [complianceRules, setComplianceRules] = useState<ComplianceRule[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [equipmentRes, templatesRes, usersRes] = await Promise.all([
        api.get('/equipment'),
        api.get('/form-templates'),
        api.get('/users?role=admin'),
      ]);
      
      setEquipment(equipmentRes.data || []);
      setFormTemplates(templatesRes.data || []);
      setUsers(usersRes.data || []);
      
      // Set default next due date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData(prev => ({
        ...prev,
        next_due_date: tomorrow.toISOString().split('T')[0],
      }));
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const addComplianceRule = () => {
    setComplianceRules([
      ...complianceRules,
      {
        rule_name: '',
        action: 'notify_only',
        threshold_days: 0,
        description: '',
        enabled: true,
      },
    ]);
  };

  const updateComplianceRule = (index: number, field: string, value: any) => {
    const updated = [...complianceRules];
    updated[index] = { ...updated[index], [field]: value };
    setComplianceRules(updated);
  };

  const removeComplianceRule = (index: number) => {
    setComplianceRules(complianceRules.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.equipment_id || !formData.form_template_id) {
      alert('Please select equipment and form template');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        custom_interval_days: formData.frequency === 'custom' ? Number(formData.custom_interval_days) : undefined,
        assigned_inspector_id: formData.assigned_inspector_id || undefined,
        next_due_date: new Date(formData.next_due_date).toISOString(),
        compliance_rules: complianceRules.filter(rule => rule.rule_name.trim() !== ''),
      };

      await api.post('/inspection-schedules', payload);
      alert('Inspection schedule created successfully!');
      router.push('/equipment/inspections/schedules');
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <HybridNavigationTopBar>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </HybridNavigationTopBar>
    );
  }

  return (
    <HybridNavigationTopBar>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Inspection Schedule</h1>
            <p className="text-gray-600 mt-1">Set up recurring equipment inspections</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment *
                </label>
                <select
                  value={formData.equipment_id}
                  onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Equipment</option>
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.equipment_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspection Form Template *
                </label>
                <select
                  value={formData.form_template_id}
                  onChange={(e) => setFormData({ ...formData, form_template_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Form Template</option>
                  {formTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {formData.frequency === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Interval (Days) *
                  </label>
                  <input
                    type="number"
                    value={formData.custom_interval_days}
                    onChange={(e) => setFormData({ ...formData, custom_interval_days: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Due Date *
                </label>
                <input
                  type="date"
                  value={formData.next_due_date}
                  onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Inspector (Optional)
                </label>
                <select
                  value={formData.assigned_inspector_id}
                  onChange={(e) => setFormData({ ...formData, assigned_inspector_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No specific inspector</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.auto_create}
                  onChange={(e) => setFormData({ ...formData, auto_create: e.target.checked })}
                  className="w-5 h-5 text-[#3f72af] rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Auto-Create Inspections</span>
                  <p className="text-sm text-gray-600">Automatically create inspections based on this schedule</p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.send_reminders}
                  onChange={(e) => setFormData({ ...formData, send_reminders: e.target.checked })}
                  className="w-5 h-5 text-[#3f72af] rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Send Reminders</span>
                  <p className="text-sm text-gray-600">Notify inspector and admin before inspection is due</p>
                </div>
              </label>

              {formData.send_reminders && (
                <div className="ml-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Send Reminder (Days Before Due Date)
                  </label>
                  <input
                    type="number"
                    value={formData.reminder_days_before}
                    onChange={(e) => setFormData({ ...formData, reminder_days_before: Number(e.target.value) })}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="30"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Compliance Rules */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Compliance Rules</h2>
                <p className="text-sm text-gray-600">Define actions when inspections are overdue</p>
              </div>
              <button
                type="button"
                onClick={addComplianceRule}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
              >
                <Plus className="w-4 h-4" />
                Add Rule
              </button>
            </div>

            {complianceRules.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">No compliance rules added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {complianceRules.map((rule, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={(e) => updateComplianceRule(index, 'enabled', e.target.checked)}
                          className="w-4 h-4 text-[#3f72af] rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Enabled</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeComplianceRule(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Rule Name
                        </label>
                        <input
                          type="text"
                          value={rule.rule_name}
                          onChange={(e) => updateComplianceRule(index, 'rule_name', e.target.value)}
                          placeholder="e.g., Weekly Safety Check"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Action
                        </label>
                        <select
                          value={rule.action}
                          onChange={(e) => updateComplianceRule(index, 'action', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="notify_only">Notify Only</option>
                          <option value="mark_warning">Mark Warning</option>
                          <option value="block_usage">Block Equipment Usage</option>
                          <option value="auto_schedule">Auto-Schedule Maintenance</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Threshold (Days Overdue)
                        </label>
                        <input
                          type="number"
                          value={rule.threshold_days || 0}
                          onChange={(e) => updateComplianceRule(index, 'threshold_days', Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description (Optional)
                        </label>
                        <input
                          type="text"
                          value={rule.description || ''}
                          onChange={(e) => updateComplianceRule(index, 'description', e.target.value)}
                          placeholder="e.g., Critical safety requirement"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#3f72af] text-white px-6 py-3 rounded-lg hover:bg-[#2c5282] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Schedule
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </HybridNavigationTopBar>
  );
}
