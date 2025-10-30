'use client';

import PageHeader from '@/components/PageHeader';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  AlertTriangle,
  Send,
  Users,
  Info,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

const ALERT_TYPES = [
  { value: 'general', label: 'General Emergency', icon: '⚠️', color: 'orange' },
  { value: 'weather', label: 'Severe Weather', icon: '🌧️', color: 'blue' },
  { value: 'safety', label: 'Safety Alert', icon: '🛡️', color: 'red' },
  { value: 'equipment', label: 'Equipment Issue', icon: '🔧', color: 'purple' },
  { value: 'route', label: 'Route Change', icon: '🔄', color: 'green' },
];

export default function EmergencyAlertPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [alertType, setAlertType] = useState('general');
  const [message, setMessage] = useState('');
  const [activeShiftsCount, setActiveShiftsCount] = useState(0);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchActiveShifts();
  }, []);

  const fetchActiveShifts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/shifts/active');
      const uniqueUsers = new Set(response.data.map((shift: any) => shift.user_id));
      setActiveShiftsCount(uniqueUsers.size);
    } catch (error) {
      console.error('Error fetching active shifts:', error);
      setActiveShiftsCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAlert = async () => {
    if (!message.trim()) {
      alert('Please enter an alert message');
      return;
    }

    if (!confirm(
      `Send "${alertType}" alert to ${activeShiftsCount} team member${activeShiftsCount !== 1 ? 's' : ''} on shift?\n\nThis will send both EMAIL and SMS notifications.`
    )) {
      return;
    }

    try {
      setSending(true);
      const response = await api.post(
        `/emergency-alerts/send?alert_message=${encodeURIComponent(message)}&alert_type=${alertType}`
      );
      
      setResult(response.data);
      setMessage('');
      setShowSuccess(true);
      await fetchActiveShifts();
    } catch (error: any) {
      console.error('Error sending alert:', error);
      alert(error.response?.data?.detail || 'Failed to send emergency alert');
    } finally {
      setSending(false);
    }
  };

  const selectedType = ALERT_TYPES.find(t => t.value === alertType);

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: { border: string; bg: string; text: string } } = {
      orange: { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
      blue: { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
      red: { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700' },
      purple: { border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' },
      green: { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700' },
    };
    return colors[color] || colors.orange;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Emergency Alert"
        subtitle="Manage emergency alert"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Emergency Alert" }]}
      />
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
            <h1 className="text-3xl font-bold text-gray-900">Emergency Alert System</h1>
            <p className="text-gray-600 mt-1">Send urgent notifications to team members on shift</p>
          </div>
        </div>

        {/* Warning Card */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-12 h-12 text-red-600 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-red-900 mb-2">Emergency Alert System</h2>
              <p className="text-red-700">
                Send urgent notifications to all team members currently on shift via Email and SMS.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 rounded-lg p-4">
              <Users className="w-8 h-8 text-[#3f72af]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Team Members On Shift</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? 'Loading...' : `${activeShiftsCount} active`}
              </p>
            </div>
            <button
              onClick={fetchActiveShifts}
              className="ml-auto p-2 text-gray-600 hover:text-gray-900"
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Alert Type Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {ALERT_TYPES.map((type) => {
              const colors = getColorClasses(type.color);
              const isSelected = alertType === type.value;
              
              return (
                <button
                  key={type.value}
                  onClick={() => setAlertType(type.value)}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? `${colors.border} ${colors.bg}`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-2">{type.icon}</div>
                  <p className={`text-sm font-medium ${isSelected ? colors.text : 'text-gray-700'}`}>
                    {type.label}
                  </p>
                  {isSelected && (
                    <CheckCircle className={`absolute top-2 right-2 w-5 h-5 ${colors.text}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Message</h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your emergency alert message..."
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <p className="text-sm text-gray-600 mt-2">{message.length} characters</p>
        </div>

        {/* Preview Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-200 mb-3">
              <span className="text-2xl">{selectedType?.icon}</span>
              <span className="text-sm font-bold text-gray-700 uppercase">
                {selectedType?.label}
              </span>
            </div>
            <p className="text-gray-900">
              {message || 'Your alert message will appear here...'}
            </p>
          </div>

        {/* Send Button */}
        <button
          onClick={handleSendAlert}
          disabled={sending || !message.trim() || activeShiftsCount === 0}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-lg font-semibold transition-colors ${
            sending || !message.trim() || activeShiftsCount === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {sending ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send Emergency Alert to {activeShiftsCount} Team Members
            </>
          )}
        </button>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#3f72af] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            Alerts are sent via Email and SMS to all team members with active shifts. Recipients can manage their notification preferences in settings.
          </p>
        </div>

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Alert Sent!</h2>
                {result && (
                  <div className="text-gray-600 space-y-1">
                    <p>Emergency alert sent to {result.recipients_count} team members</p>
                    <p className="text-sm">Emails sent: {result.emails_sent}</p>
                    <p className="text-sm">SMS sent: {result.sms_sent}</p>
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowSuccess(false);
                    setResult(null);
                  }}
                  className="mt-6 w-full bg-[#3f72af] text-white py-3 rounded-lg font-semibold hover:bg-[#2c5282]"
                >
                  Close
                </button>
              </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
