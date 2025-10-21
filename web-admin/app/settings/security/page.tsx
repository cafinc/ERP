'use client';

import { useState } from 'react';
import CompactHeader from '@/components/CompactHeader';
import { Key, Shield, Smartphone, Clock, CheckCircle } from 'lucide-react';

export default function SecuritySettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessions] = useState([
    { id: 1, device: 'Chrome on MacBook Pro', location: 'Toronto, ON', lastActive: '2 minutes ago', current: true },
    { id: 2, device: 'Safari on iPhone', location: 'Toronto, ON', lastActive: '1 hour ago', current: false },
  ]);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Password updated successfully!');
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <CompactHeader
        title="Security Settings"
        subtitle="Manage your password, 2FA, and active sessions"
        backUrl="/settings"
      />

      {/* Change Password */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginTop: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Key style={{ width: '20px', height: '20px', color: 'white' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#1e293b' }}>
              Change Password
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b' }}>Update your password regularly for security</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              required
            />
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              At least 8 characters with uppercase, lowercase, and numbers
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <button
            type="submit"
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
            Update Password
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Smartphone style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#1e293b' }}>
                Two-Factor Authentication
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Add an extra layer of security to your account</p>
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={(e) => setTwoFactorEnabled(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>
              {twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>

        {twoFactorEnabled && (
          <div style={{
            backgroundColor: '#dbeafe',
            border: '1px solid #93c5fd',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            gap: '12px'
          }}>
            <CheckCircle style={{ width: '20px', height: '20px', color: '#3b82f6', marginTop: '2px' }} />
            <div>
              <p style={{ fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>2FA is Active</p>
              <p style={{ fontSize: '14px', color: '#1e40af' }}>
                Your account is protected with two-factor authentication
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock style={{ width: '20px', height: '20px', color: 'white' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#1e293b' }}>
              Active Sessions
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b' }}>Manage devices with access to your account</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sessions.map((session) => (
            <div
              key={session.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Smartphone style={{ width: '24px', height: '24px', color: '#64748b' }} />
                </div>
                <div>
                  <p style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>{session.device}</p>
                  <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '2px' }}>{session.location}</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>Last active: {session.lastActive}</p>
                </div>
              </div>
              <div>
                {session.current ? (
                  <span style={{
                    padding: '6px 12px',
                    backgroundColor: '#dcfce7',
                    color: '#16a34a',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    Current
                  </span>
                ) : (
                  <button
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
