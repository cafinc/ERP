'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Bell,
  Mail,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Calendar,
  Users,
  Truck,
  DollarSign,
} from 'lucide-react';

export default function NotificationsSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [preferences, setPreferences] = useState({
    email: {
      newCustomer: true,
      newEstimate: true,
      estimateAccepted: true,
      estimateDeclined: false,
      projectStarted: true,
      projectCompleted: true,
      invoicePaid: true,
      invoiceOverdue: true,
      teamMemberAdded: false,
      equipmentMaintenance: true,
      lowConsumables: true,
      weeklyReport: true,
      monthlyReport: true,
    },
    sms: {
      emergencyAlerts: true,
      projectStarted: false,
      teamCheckIn: false,
      customerMessages: true,
    },
    push: {
      enabled: true,
      newMessages: true,
      assignments: true,
      updates: true,
    }
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      if (response.data.notification_preferences) {
        setPreferences(response.data.notification_preferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await api.get('/auth/me');
      await api.put(`/users/${response.data.id}`, {
        notification_preferences: preferences
      });
      alert('Notification preferences updated successfully!');
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      alert(error?.response?.data?.detail || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/settings')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
            <p className="text-gray-600 mt-1">Choose when and how you want to be notified</p>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 rounded-lg p-3">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
              <p className="text-sm text-gray-600">Receive updates via email</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Customer & Sales */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Customer & Sales
              </h3>
              <div className="space-y-3 ml-6">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.email.newCustomer}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      email: { ...preferences.email, newCustomer: e.target.checked }
                    })}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New Customer</p>
                    <p className="text-xs text-gray-600">When a new customer is added</p>
                  </div>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.email.newEstimate}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      email: { ...preferences.email, newEstimate: e.target.checked }
                    })}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New Estimate Created</p>
                    <p className="text-xs text-gray-600">When an estimate is created</p>
                  </div>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.email.estimateAccepted}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      email: { ...preferences.email, estimateAccepted: e.target.checked }
                    })}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Estimate Accepted</p>
                    <p className="text-xs text-gray-600">When a customer accepts an estimate</p>
                  </div>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.email.estimateDeclined}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      email: { ...preferences.email, estimateDeclined: e.target.checked }
                    })}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Estimate Declined</p>
                    <p className="text-xs text-gray-600">When a customer declines an estimate</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Project Updates */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Projects
              </h3>
              <div className="space-y-3 ml-6">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.email.projectStarted}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      email: { ...preferences.email, projectStarted: e.target.checked }
                    })}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Project Started</p>
                    <p className="text-xs text-gray-600">When a project begins</p>
                  </div>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.email.projectCompleted}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      email: { ...preferences.email, projectCompleted: e.target.checked }
                    })}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Project Completed</p>
                    <p className="text-xs text-gray-600">When a project is marked complete</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Financial */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Financial
              </h3>
              <div className="space-y-3 ml-6">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.email.invoicePaid}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      email: { ...preferences.email, invoicePaid: e.target.checked }
                    })}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Invoice Paid</p>
                    <p className="text-xs text-gray-600">When an invoice is marked as paid</p>
                  </div>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.email.invoiceOverdue}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      email: { ...preferences.email, invoiceOverdue: e.target.checked }
                    })}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Invoice Overdue</p>
                    <p className="text-xs text-gray-600">When an invoice becomes overdue</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Operations */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Operations
              </h3>
              <div className="space-y-3 ml-6">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.email.equipmentMaintenance}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      email: { ...preferences.email, equipmentMaintenance: e.target.checked }
                    })}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Equipment Maintenance Due</p>
                    <p className="text-xs text-gray-600">When equipment maintenance is due soon</p>
                  </div>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.email.lowConsumables}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      email: { ...preferences.email, lowConsumables: e.target.checked }
                    })}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Low Consumables</p>
                    <p className="text-xs text-gray-600">When salt, sand, or other supplies run low</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Reports */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Reports
              </h3>
              <div className="space-y-3 ml-6">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.email.weeklyReport}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      email: { ...preferences.email, weeklyReport: e.target.checked }
                    })}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Weekly Summary</p>
                    <p className="text-xs text-gray-600">Receive a weekly business summary</p>
                  </div>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.email.monthlyReport}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      email: { ...preferences.email, monthlyReport: e.target.checked }
                    })}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Monthly Report</p>
                    <p className="text-xs text-gray-600">Receive a monthly performance report</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SMS Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-100 rounded-lg p-3">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">SMS Notifications</h2>
              <p className="text-sm text-gray-600">Receive urgent updates via text message</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={preferences.sms.emergencyAlerts}
                onChange={(e) => setPreferences({
                  ...preferences,
                  sms: { ...preferences.sms, emergencyAlerts: e.target.checked }
                })}
                className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Emergency Alerts</p>
                <p className="text-xs text-gray-600">Critical system alerts and emergencies</p>
              </div>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={preferences.sms.customerMessages}
                onChange={(e) => setPreferences({
                  ...preferences,
                  sms: { ...preferences.sms, customerMessages: e.target.checked }
                })}
                className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Customer Messages</p>
                <p className="text-xs text-gray-600">When customers send you messages</p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/settings')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
