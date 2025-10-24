'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';

export default function AppIntegrationPage() {
  const [integrations] = useState([
    { id: 1, name: 'QuickBooks Online', status: 'connected', icon: '💼' },
    { id: 2, name: 'Google Calendar', status: 'disconnected', icon: '📅' },
    { id: 3, name: 'Slack', status: 'disconnected', icon: '💬' },
    { id: 4, name: 'Zapier', status: 'disconnected', icon: '⚡' },
  ]);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title="App Integrations"
        subtitle="Connect and manage third-party integrations"
        backUrl="/settings"
      />

      <div style={{ marginTop: '24px', display: 'grid', gap: '16px' }}>
        {integrations.map((integration) => (
          <div
            key={integration.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '32px' }}>{integration.icon}</div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: '#1e293b' }}>
                  {integration.name}
                </h3>
                <span
                  style={{
                    fontSize: '14px',
                    color: integration.status === 'connected' ? '#10b981' : '#64748b',
                    fontWeight: '500'
                  }}
                >
                  {integration.status === 'connected' ? '✓ Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: integration.status === 'connected' ? '#ef4444' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
