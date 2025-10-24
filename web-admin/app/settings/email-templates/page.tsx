'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';

export default function EmailTemplatesPage() {
  const [templates] = useState([
    { id: 1, name: 'Welcome Email', subject: 'Welcome to Snow Removal Services', lastModified: '2025-01-15' },
    { id: 2, name: 'Invoice Notification', subject: 'Your invoice is ready', lastModified: '2025-01-10' },
    { id: 3, name: 'Service Reminder', subject: 'Upcoming service scheduled', lastModified: '2025-01-08' },
    { id: 4, name: 'Payment Confirmation', subject: 'Payment received - Thank you', lastModified: '2025-01-05' },
  ]);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title="Email Templates"
        subtitle="Customize email templates"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Email Templates" }]}
        title="Email Templates"
        subtitle="Manage your email templates for automated communications"
        backUrl="/settings"
        action={{
          label: '+ New Template',
          onClick: () => alert('Create new template')
        }}
      />

      <div style={{ marginTop: '24px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>Template Name</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>Subject</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>Last Modified</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{template.name}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{template.subject}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{template.lastModified}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
