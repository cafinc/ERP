'use client';

import PageHeader from '@/components/PageHeader';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  Plus,
  Calendar,
  Clock,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Bell,
} from 'lucide-react';

interface InspectionSchedule {
  id: string;
  equipment_id: string;
  equipment_name: string;
  form_template_id: string;
  form_template_name: string;
  frequency: string;
  custom_interval_days?: number;
  assigned_inspector_id?: string;
  assigned_inspector_name?: string;
  next_due_date: string;
  last_completed_date?: string;
  auto_create: boolean;
  send_reminders: boolean;
  reminder_days_before: number;
  compliance_rules: Array<{
    rule_name: string;
    action: string;
    threshold_days?: number;
    description?: string;
    enabled: boolean;
  }>;
  active: boolean;
  created_at: string;
}

export default function InspectionSchedulesPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<InspectionSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterActive, setFilterActive] = useState<boolean | null>(true);

  useEffect(() => {
    loadSchedules();
  }, [filterActive]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterActive !== null) {
        params.append('active', String(filterActive));
      }
      const response = await api.get(`/inspection-schedules?${params}`);
      setSchedules(response.data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Delete this inspection schedule? Future inspections will not be auto-created.')) return;
    
    try {
      await api.delete(`/inspection-schedules/${scheduleId}`);
      alert('Schedule deleted successfully!');
      loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule');
    }
  };

  const toggleScheduleActive = async (scheduleId: string, currentStatus: boolean) => {
    try {
      await api.put(`/inspection-schedules/${scheduleId}`, { active: !currentStatus });
      loadSchedules();
    } catch (error) {
      console.error('Error toggling schedule:', error);
      alert('Failed to update schedule status');
    }
  };

  const getFrequencyLabel = (frequency: string, customDays?: number) => {
    const labels: { [key: string]: string } = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
      custom: customDays ? `Every ${customDays} days` : 'Custom',
    };
    return labels[frequency] || frequency;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'block_usage': return 'bg-red-100 text-red-700';
      case 'notify_only': return 'bg-blue-100 text-blue-700';
      case 'mark_warning': return 'bg-yellow-100 text-yellow-700';
      case 'auto_schedule': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      block_usage: 'Block Usage',
      notify_only: 'Notify Only',
      mark_warning: 'Mark Warning',
      auto_schedule: 'Auto Schedule',
    };
    return labels[action] || action;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Schedules"
        subtitle="Manage schedules"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Equipment", href: "/equipment" }, { label: "Inspections", href: "/equipment/inspections" }, { label: "Schedules" }]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
    
    </div>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Inspection Schedules"
        subtitle="Manage schedules"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Inspection Schedules" }]}
      />
      <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inspection Schedules</h1>
            <p className="text-gray-600 mt-1">Manage recurring equipment inspection schedules</p>
          </div>
          <button
            onClick={() => router.push('/equipment/inspections/schedules/create')}
            className="flex items-center gap-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md rounded-lg hover:bg-[#2c5282]"
          >
            <Plus className="w-5 h-5" />
            Create Schedule
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <button
              onClick={() => setFilterActive(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterActive === null
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Schedules
            </button>
            <button
              onClick={() => setFilterActive(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterActive === true
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active Only
            </button>
            <button
              onClick={() => setFilterActive(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterActive === false
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inactive Only
            </button>
          </div>

        {/* Schedules List */}
        <div className="space-y-4">
          {schedules.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center hover:shadow-md transition-shadow">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900">No inspection schedules found</p>
              <p className="text-sm text-gray-600 mb-4">Create your first inspection schedule to get started</p>
              <button
                onClick={() => router.push('/equipment/inspections/schedules/create')}
                className="inline-flex items-center gap-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md rounded-lg hover:bg-[#2c5282]"
              >
                <Plus className="w-4 h-4" />
                Create Schedule
              </button>
            </div>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`bg-white rounded-lg border ${
                  schedule.active ? 'border-gray-200' : 'border-gray-300 bg-gray-50'
                } p-6`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{schedule.equipment_name}</h3>
                      {schedule.active ? (
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{schedule.form_template_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/equipment/inspections/schedules/${schedule.id}/edit`)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Frequency</p>
                      <p className="text-sm font-medium text-gray-900">
                        {getFrequencyLabel(schedule.frequency, schedule.custom_interval_days)}
                      </p>
                    </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Next Due</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(schedule.next_due_date)}
                      </p>
                    </div>

                  {schedule.assigned_inspector_name && (
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Assigned Inspector</p>
                        <p className="text-sm font-medium text-gray-900">{schedule.assigned_inspector_name}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {schedule.auto_create && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Auto-Create
                    </span>
                  )}
                  {schedule.send_reminders && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                      <Bell className="w-3 h-3" />
                      Reminders ({schedule.reminder_days_before} days before)
                    </span>
                  )}
                  {schedule.last_completed_date && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                      Last completed: {formatDate(schedule.last_completed_date)}
                    </span>
                  )}
                </div>

                {/* Compliance Rules */}
                {schedule.compliance_rules && schedule.compliance_rules.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">Compliance Rules:</p>
                    <div className="space-y-2">
                      {schedule.compliance_rules.map((rule, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            rule.enabled ? 'bg-gray-50' : 'bg-gray-100 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {rule.enabled ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{rule.rule_name}</p>
                              {rule.description && (
                                <p className="text-xs text-gray-600">{rule.description}</p>
                              )}
                            </div>
                          <div className="flex items-center gap-2">
                            {rule.threshold_days && (
                              <span className="text-xs text-gray-600">{rule.threshold_days} days</span>
                            )}
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(rule.action)}`}>
                              {getActionLabel(rule.action)}
                            </span>
                          </div>
                      ))}
                    </div>
                  </div>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t border-gray-200 mt-4 pt-4">
                  <button
                    onClick={() => toggleScheduleActive(schedule.id, schedule.active)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      schedule.active
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {schedule.active ? 'Deactivate Schedule' : 'Activate Schedule'}
                  </button>
                </div>
            ))
          )}
        </div>
  );
}
