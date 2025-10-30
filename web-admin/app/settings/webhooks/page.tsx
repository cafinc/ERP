'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';

export default function WebhooksPage() {
  const [webhooks] = useState([
    { id: 1, name: 'Slack Notifications', url: 'https://hooks.slack.com/services/...', events: ['invoice.paid', 'project.completed'], status: 'active' },
    { id: 2, name: 'Custom Integration', url: 'https://api.example.com/webhook', events: ['customer.created', 'estimate.sent'], status: 'inactive' },
  ]);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title="Webhooks"
        subtitle="Manage webhook endpoints"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Webhooks" }]}
        title="Webhooks"
        subtitle="Configure webhook endpoints for real-time event notifications"
        backUrl="/settings"
        action={{
          label: '+ Add Webhook',
          onClick: () => alert('Add new webhook')
        }}
      />

      <div style={{ marginTop: '24px', display: 'grid', gap: '16px' }}>
        {webhooks.map((webhook) => (
          <div
            key={webhook.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                    {webhook.name}
                  </h3>
                  <span
                    style={{
                      padding: '4px 12px',
                      backgroundColor: webhook.status === 'active' ? '#dcfce7' : '#fee2e2',
                      color: webhook.status === 'active' ? '#16a34a' : '#dc2626',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}
                  >
                    {webhook.status}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', fontFamily: 'monospace', marginBottom: '12px' }}>
                  {webhook.url}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Events:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {webhook.events.map((event, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontFamily: 'monospace'
                        }}
                      >
                        {event}
                      </span>
                    ))}
                  </div></div></div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
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
                  Test
                </button>
                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#64748b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Edit
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
                  Delete
                </button></div></div></div>
        ))}
      </div></div>
  );
}
