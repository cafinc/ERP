'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';

export default function RolesPermissionsPage() {
  const [roles] = useState([
    { id: 1, name: 'Admin', users: 3, permissions: ['All Access'] },
    { id: 2, name: 'Manager', users: 5, permissions: ['View Reports', 'Manage Teams', 'Edit Sites'] },
    { id: 3, name: 'Operator', users: 12, permissions: ['View Sites', 'Update Status', 'Upload Photos'] },
    { id: 4, name: 'Viewer', users: 8, permissions: ['View Only'] },
  ]);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Configure user access levels"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Roles & Permissions" }]}
        title="Roles & Permissions"
        subtitle="Manage user roles and access permissions"
        backUrl="/settings"
        action={{
          label: '+ New Role',
          onClick: () => alert('Create new role')
        }}
      />

      <div style={{ marginTop: '24px', display: 'grid', gap: '16px' }}>
        {roles.map((role) => (
          <div
            key={role.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#1e293b' }}>
                  {role.name}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b' }}>
                  {role.users} users assigned
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
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
                </button></div></div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#64748b' }}>Permissions:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {role.permissions.map((permission, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#e0f2fe',
                      color: '#0369a1',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    {permission}
                  </span>
                ))}
              </div></div></div>
        ))}
      </div></div>
  );
}
