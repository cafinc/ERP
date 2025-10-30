'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import {
  ArrowLeft,
  Mail,
  Save,
  TestTube2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export default function EmailConfigPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  
  const [config, setConfig] = useState({
    enabled: false,
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
    use_tls: true,
    test_email: '',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    const saved = localStorage.getItem('email_config');
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  };

  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem('email_config', JSON.stringify(config));
      alert('Email configuration saved successfully!');
    } catch (error) {
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.test_email) {
      alert('Please enter a test email address');
      return;
    }

    setTesting(true);
    setTestResult(null);

    setTimeout(() => {
      if (config.smtp_host && config.smtp_user && config.smtp_password) {
        setTestResult({
          success: true,
          message: `Test email would be sent to ${config.test_email}`
        });
      } else {
        setTestResult({
          success: false,
          message: 'Please configure all SMTP settings first'
        });
      }
      setTesting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Email Config"
        subtitle="Manage email config"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Email Config" }]}
      />
      <div className="flex-1 overflow-auto p-6">
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
            <h1 className="text-3xl font-bold text-gray-900">Email Configuration</h1>
            <p className="text-gray-600 mt-1">Configure SMTP settings for email notifications</p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Mail className="w-5 h-5 text-[#3f72af] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900">
              Configure your SMTP server to enable email notifications for estimates, invoices, reports, and emergency alerts.
              Common providers: Gmail, Outlook, SendGrid, AWS SES.
            </p>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900">SMTP Settings</h2>

          {/* Enable/Disable */}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="w-5 h-5 text-[#3f72af] rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-900">Enable Email Notifications</span>
              <p className="text-sm text-gray-600">Turn on/off email functionality</p>
            </div>
          </label>

          {/* SMTP Host */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host *</label>
              <input
                type="text"
                value={config.smtp_host}
                onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port *</label>
              <input
                type="number"
                value={config.smtp_port}
                onChange={(e) => setConfig({ ...config, smtp_port: e.target.value })}
                placeholder="587"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* SMTP User */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Username *</label>
            <input
              type="text"
              value={config.smtp_user}
              onChange={(e) => setConfig({ ...config, smtp_user: e.target.value })}
              placeholder="your-email@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* SMTP Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password *</label>
            <input
              type="password"
              value={config.smtp_password}
              onChange={(e) => setConfig({ ...config, smtp_password: e.target.value })}
              placeholder="Enter your SMTP password or app password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* From Email & Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Email *</label>
              <input
                type="email"
                value={config.from_email}
                onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
                placeholder="noreply@yourcompany.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
              <input
                type="text"
                value={config.from_name}
                onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
                placeholder="SnowTrack"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Use TLS */}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.use_tls}
              onChange={(e) => setConfig({ ...config, use_tls: e.target.checked })}
              className="w-5 h-5 text-[#3f72af] rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-900">Use TLS/SSL</span>
              <p className="text-sm text-gray-600">Recommended for secure connections</p>
            </div>
          </label>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md rounded-lg hover:bg-[#2c5282] disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

        {/* Test Email */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-gray-900">Test Email</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Email Address</label>
            <input
              type="email"
              value={config.test_email}
              onChange={(e) => setConfig({ ...config, test_email: e.target.value })}
              placeholder="test@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <TestTube2 className="w-5 h-5" />
            {testing ? 'Testing...' : 'Send Test Email'}
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
    </div>
  </div>
  );
}
