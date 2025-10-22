'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import {
  ArrowLeft,
  MessageSquare,
  Save,
  TestTube2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export default function SMSConfigPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  
  const [config, setConfig] = useState({
    enabled: false,
    account_sid: '',
    auth_token: '',
    from_number: '',
    test_number: '',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    // Load from localStorage or API
    const saved = localStorage.getItem('sms_config');
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  };

  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem('sms_config', JSON.stringify(config));
      alert('SMS configuration saved successfully!');
    } catch (error) {
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.test_number) {
      alert('Please enter a test phone number');
      return;
    }

    setTesting(true);
    setTestResult(null);

    // Simulate test SMS
    setTimeout(() => {
      if (config.account_sid && config.auth_token && config.from_number) {
        setTestResult({
          success: true,
          message: `Test SMS would be sent to ${config.test_number}`
        });
      } else {
        setTestResult({
          success: false,
          message: 'Please configure all Twilio settings first'
        });
      }
      setTesting(false);
    }, 1500);
  };

  return (
    <HybridNavigationTopBar>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/settings')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SMS Configuration</h1>
            <p className="text-gray-600 mt-1">Configure Twilio settings for SMS notifications</p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900">
              Configure your Twilio account to enable SMS notifications for emergency alerts, shift reminders, and customer communications.
              Get your credentials from <a href="https://console.twilio.com" target="_blank" className="underline">Twilio Console</a>.
            </p>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Twilio Settings</h2>

          {/* Enable/Disable */}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-900">Enable SMS Notifications</span>
              <p className="text-sm text-gray-600">Turn on/off SMS functionality</p>
            </div>
          </label>

          {/* Account SID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account SID *</label>
            <input
              type="text"
              value={config.account_sid}
              onChange={(e) => setConfig({ ...config, account_sid: e.target.value })}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Auth Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Auth Token *</label>
            <input
              type="password"
              value={config.auth_token}
              onChange={(e) => setConfig({ ...config, auth_token: e.target.value })}
              placeholder="Enter your Twilio auth token"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* From Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Phone Number *</label>
            <input
              type="tel"
              value={config.from_number}
              onChange={(e) => setConfig({ ...config, from_number: e.target.value })}
              placeholder="+1234567890"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Your Twilio phone number in E.164 format</p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-[#2c5282] disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

        {/* Test SMS */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Test SMS</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Phone Number</label>
            <input
              type="tel"
              value={config.test_number}
              onChange={(e) => setConfig({ ...config, test_number: e.target.value })}
              placeholder="+1234567890"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <TestTube2 className="w-5 h-5" />
            {testing ? 'Testing...' : 'Send Test SMS'}
          </button>

          {testResult && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <p className={`text-sm ${
                testResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {testResult.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
