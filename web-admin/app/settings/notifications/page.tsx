'use client';

import { useState } from 'react';
import CompactHeader from '@/components/CompactHeader';

export default function NotificationsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <CompactHeader
        title="Notification Settings"
        subtitle="Manage your notification preferences"
      />

      <div style={{ marginTop: '24px', display: 'grid', gap: '24px' }}>
        {/* Email Notifications */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
            Email Notifications
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                style={{ marginRight: '12px', width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontWeight: '500', color: '#1e293b' }}>Email Notifications</div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Receive email notifications for important updates</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={weeklyReports}
                onChange={(e) => setWeeklyReports(e.target.checked)}
                style={{ marginRight: '12px', width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontWeight: '500', color: '#1e293b' }}>Weekly Reports</div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Get weekly summary reports via email</div>
              </div>
            </label>
          </div>
        </div>

        {/* SMS Notifications */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
            SMS Notifications
          </h2>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={smsNotifications}
              onChange={(e) => setSmsNotifications(e.target.checked)}
              style={{ marginRight: '12px', width: '18px', height: '18px' }}
            />
            <div>
              <div style={{ fontWeight: '500', color: '#1e293b' }}>SMS Alerts</div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Receive text message alerts for urgent updates</div>
            </div>
          </label>
        </div>

        {/* Push Notifications */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
            Push Notifications
          </h2>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={pushNotifications}
              onChange={(e) => setPushNotifications(e.target.checked)}
              style={{ marginRight: '12px', width: '18px', height: '18px' }}
            />
            <div>
              <div style={{ fontWeight: '500', color: '#1e293b' }}>Browser Push Notifications</div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Receive push notifications in your browser</div>
            </div>
          </label>
        </div>

        {/* Save Button */}
        <div>
          <button
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
