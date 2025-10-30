'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { Shield, CheckCircle, XCircle, Save, RotateCcw } from 'lucide-react';

const PERMISSION_CATEGORIES = {
  'System Access': [
    { id: 'view_dashboard', name: 'View Dashboard', description: 'Access main dashboard' },
    { id: 'view_reports', name: 'View Reports', description: 'Access reporting section' },
    { id: 'view_analytics', name: 'View Analytics', description: 'Access analytics data' },
    { id: 'system_settings', name: 'System Settings', description: 'Configure system-wide settings' },
  ],
  'User Management': [
    { id: 'create_users', name: 'Create Users', description: 'Add new users to system' },
    { id: 'edit_users', name: 'Edit Users', description: 'Modify user information' },
    { id: 'delete_users', name: 'Delete Users', description: 'Remove users from system' },
    { id: 'manage_roles', name: 'Manage Roles', description: 'Assign and modify user roles' },
  ],
  'Financial': [
    { id: 'view_invoices', name: 'View Invoices', description: 'Access invoice data' },
    { id: 'create_invoices', name: 'Create Invoices', description: 'Generate new invoices' },
    { id: 'approve_invoices', name: 'Approve Invoices', description: 'Approve invoices for payment' },
    { id: 'view_payments', name: 'View Payments', description: 'Access payment records' },
    { id: 'process_payments', name: 'Process Payments', description: 'Process and record payments' },
    { id: 'financial_reports', name: 'Financial Reports', description: 'Access financial reporting' },
  ],
  'Operations': [
    { id: 'create_projects', name: 'Create Projects', description: 'Start new projects' },
    { id: 'edit_projects', name: 'Edit Projects', description: 'Modify project details' },
    { id: 'delete_projects', name: 'Delete Projects', description: 'Remove projects' },
    { id: 'assign_tasks', name: 'Assign Tasks', description: 'Assign tasks to team members' },
    { id: 'manage_schedule', name: 'Manage Schedule', description: 'Control schedules and dispatch' },
  ],
  'Customer Management': [
    { id: 'view_customers', name: 'View Customers', description: 'Access customer list' },
    { id: 'create_customers', name: 'Create Customers', description: 'Add new customers' },
    { id: 'edit_customers', name: 'Edit Customers', description: 'Modify customer information' },
    { id: 'delete_customers', name: 'Delete Customers', description: 'Remove customers' },
  ],
  'Inventory & Assets': [
    { id: 'view_inventory', name: 'View Inventory', description: 'Access inventory data' },
    { id: 'manage_inventory', name: 'Manage Inventory', description: 'Add/edit inventory items' },
    { id: 'approve_orders', name: 'Approve Orders', description: 'Approve purchase orders' },
    { id: 'manage_equipment', name: 'Manage Equipment', description: 'Control equipment assignments' },
  ],
  'Communication': [
    { id: 'send_messages', name: 'Send Messages', description: 'Send messages to users' },
    { id: 'send_notifications', name: 'Send Notifications', description: 'Send system notifications' },
    { id: 'manage_email', name: 'Manage Email', description: 'Access email integration' },
    { id: 'emergency_alerts', name: 'Emergency Alerts', description: 'Send emergency alerts' },
  ],
};

const ROLE_DEFAULTS = {
  master: Object.values(PERMISSION_CATEGORIES).flat().map(p => p.id),
  admin: [
    'view_dashboard', 'view_reports', 'view_analytics',
    'create_users', 'edit_users', 'manage_roles',
    'view_invoices', 'create_invoices', 'view_payments', 'financial_reports',
    'create_projects', 'edit_projects', 'assign_tasks', 'manage_schedule',
    'view_customers', 'create_customers', 'edit_customers',
    'view_inventory', 'manage_inventory', 'manage_equipment',
    'send_messages', 'send_notifications', 'manage_email',
  ],
  crew: [
    'view_dashboard',
    'view_projects', 'view_customers',
    'view_inventory',
    'send_messages',
  ],
  subcontractor: [
    'view_dashboard',
    'view_projects',
    'view_invoices', 'create_invoices',
    'send_messages',
  ],
  customer: [
    'view_dashboard',
    'view_invoices', 'view_payments',
    'send_messages',
  ],
  vendor: [
    'view_dashboard',
    'view_inventory',
    'view_invoices', 'create_invoices',
    'send_messages',
  ],
};

export default function PermissionsMatrixPage() {
  const [selectedRole, setSelectedRole] = useState<keyof typeof ROLE_DEFAULTS>('admin');
  const [permissions, setPermissions] = useState<Set<string>>(new Set(ROLE_DEFAULTS.admin));

  const handleRoleChange = (role: keyof typeof ROLE_DEFAULTS) => {
    setSelectedRole(role);
    setPermissions(new Set(ROLE_DEFAULTS[role]));
  };

  const togglePermission = (permissionId: string) => {
    const newPermissions = new Set(permissions);
    if (newPermissions.has(permissionId)) {
      newPermissions.delete(permissionId);
    } else {
      newPermissions.add(permissionId);
    }
    setPermissions(newPermissions);
  };

  const selectAll = () => {
    const allPermissions = Object.values(PERMISSION_CATEGORIES).flat().map(p => p.id);
    setPermissions(new Set(allPermissions));
  };

  const deselectAll = () => {
    setPermissions(new Set());
  };

  const resetToDefaults = () => {
    setPermissions(new Set(ROLE_DEFAULTS[selectedRole]));
  };

  const handleSave = () => {
    alert(`Permissions for ${selectedRole} role saved successfully!\\n\\nActive Permissions: ${permissions.size}`);
  };

  const roleColors: { [key: string]: string } = {
    master: '#fbbf24',
    admin: '#3b82f6',
    crew: '#f59e0b',
    subcontractor: '#8b5cf6',
    customer: '#06b6d4',
    vendor: '#f97316',
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title="Permissions Matrix"
        subtitle="Configure role-based access control"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Permissions Matrix" }]}
        backUrl="/settings/roles-permissions"
      />

      {/* Role Selector */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginTop: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
          Select Role
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {Object.keys(ROLE_DEFAULTS).map((role) => (
            <button
              key={role}
              onClick={() => handleRoleChange(role as keyof typeof ROLE_DEFAULTS)}
              style={{
                padding: '12px 16px',
                backgroundColor: selectedRole === role ? roleColors[role] : '#f8fafc',
                color: selectedRole === role ? 'white' : '#64748b',
                border: `2px solid ${selectedRole === role ? roleColors[role] : '#e2e8f0'}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s'
              }}
            >
              {role}
            </button>
          ))}
        </div>

      {/* Bulk Actions */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '16px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginTop: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Shield style={{ width: '20px', height: '20px', color: '#64748b' }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
            {permissions.size} of {Object.values(PERMISSION_CATEGORIES).flat().length} permissions active
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={selectAll}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            style={{
              padding: '8px 16px',
              backgroundColor: '#64748b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Deselect All
          </button>
          <button
            onClick={resetToDefaults}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw style={{ width: '14px', height: '14px' }} />
            Reset
          </button>
        </div>

      {/* Permission Categories */}
      {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => (
        <div
          key={category}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginTop: '16px'
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
            {category}
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {perms.map((permission) => {
              const isActive = permissions.has(permission.id);
              return (
                <button
                  key={permission.id}
                  onClick={() => togglePermission(permission.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    backgroundColor: isActive ? '#f0fdf4' : '#f8fafc',
                    border: `2px solid ${isActive ? '#10b981' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                      {permission.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      {permission.description}
                    </div>
                  <div>
                    {isActive ? (
                      <CheckCircle style={{ width: '24px', height: '24px', color: '#10b981' }} />
                    ) : (
                      <XCircle style={{ width: '24px', height: '24px', color: '#cbd5e1' }} />
                    )}
              </div>
                  </div>
                </button>
              </div>
              );
            })}
          </div>
              </div>
      ))}

      {/* Save Button */}
      <div style={{
        position: 'sticky',
        bottom: '24px',
        marginTop: '24px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <button
          onClick={handleSave}
          style={{
            padding: '16px 48px',
            backgroundColor: roleColors[selectedRole],
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
        >
          <Save style={{ width: '20px', height: '20px' }} />
          Save Permissions for {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
        </button>
      </div>
    </div>
    </div>
  );
}
