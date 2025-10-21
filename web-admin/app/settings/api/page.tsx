'use client';

import { useState } from 'react';
import CompactHeader from '@/components/CompactHeader';

export default function ApiSettingsPage() {
  const [apiKeys] = useState([
    { id: 1, name: 'Production API Key', key: 'sk_prod_••••••••••••••••', created: '2025-01-01', lastUsed: '2025-01-20' },
    { id: 2, name: 'Development API Key', key: 'sk_dev_••••••••••••••••', created: '2024-12-15', lastUsed: '2025-01-19' },
  ]);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <CompactHeader
        title="API Settings"
        subtitle="Manage your API keys and access tokens"
        backUrl="/settings"
        action={{
          label: '+ Generate New Key',
          onClick: () => alert('Generate new API key')
        }}
      />

      <div style={{ marginTop: '24px' }}>
        {/* API Documentation Link */}
        <div style={{
          backgroundColor: '#dbeafe',
          border: '1px solid #93c5fd',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: '#1e40af' }}>API Documentation</h3>
            <p style={{ fontSize: '14px', color: '#1e40af' }}>Learn how to integrate with our API</p>
          </div>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            View Docs
          </button>
        </div>

        {/* API Keys List */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>API Keys</h2>
          </div>
          {apiKeys.map((apiKey) => (
            <div
              key={apiKey.id}
              style={{
                padding: '20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>
                  {apiKey.name}
                </h3>
                <div style={{ fontSize: '14px', color: '#64748b', fontFamily: 'monospace', marginBottom: '8px' }}>
                  {apiKey.key}
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Created: {apiKey.created} • Last used: {apiKey.lastUsed}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Copy
                </button>
                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
