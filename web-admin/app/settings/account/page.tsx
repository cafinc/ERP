'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import CompactHeader from '@/components/CompactHeader';
import { Key, Shield, Smartphone, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function SecuritySettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Chrome on MacBook Pro', location: 'Toronto, ON', lastActive: '2 minutes ago', current: true },
    { id: 2, device: 'Safari on iPhone', location: 'Toronto, ON', lastActive: '1 hour ago', current: false },
  ]);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Password updated successfully!');
  };

  return (
    <DashboardLayout>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <CompactHeader
            title="Security Settings"
            subtitle="Manage your password, 2FA, and active sessions"
            icon={Shield}
            backUrl="/settings"
          />

          {/* Change Password */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
                <p className="text-sm text-gray-500">Update your password regularly for security</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">At least 8 characters with uppercase, lowercase, and numbers</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-semibold"
              >
                Update Password
              </button>
            </form>
          </div>

          {/* Two-Factor Authentication */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={twoFactorEnabled}
                    onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className="text-sm font-medium text-gray-700">{twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>

            {twoFactorEnabled && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">2FA is Active</p>
                    <p className="text-sm text-blue-700 mt-1">Your account is protected with two-factor authentication</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Sessions */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Active Sessions</h2>
                <p className="text-sm text-gray-500">Manage devices with access to your account</p>
              </div>
            </div>

            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{session.device}</p>
                      <p className="text-sm text-gray-600">{session.location}</p>
                      <p className="text-xs text-gray-500 mt-1">Last active: {session.lastActive}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {session.current ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 border border-green-200 rounded-full text-xs font-semibold">Current</span>
                    ) : (
                      <button className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all font-medium text-sm">
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
