'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import CompactHeader from '@/components/CompactHeader';
import UserFormModal from '@/components/UserFormModal';
import { UserCog, Plus, Edit, Trash2, Shield, CheckCircle, XCircle, Settings } from 'lucide-react';

export default function AdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  useEffect(() => {
    // Mock data for demo
    setAdmins([
      { id: '1', name: 'John Admin', email: 'john@company.com', phone: '+1 (555) 234-5678', role: 'admin', active: true, created_at: '2025-01-15', last_login: '2025-06-21' },
      { id: '2', name: 'Sarah Manager', email: 'sarah@company.com', phone: '+1 (555) 345-6789', role: 'admin', active: true, created_at: '2025-02-10', last_login: '2025-06-20' }
    ]);
    setLoading(false);
  }, []);

  const handleAddUser = () => {
    setModalMode('add');
    setSelectedUser(undefined);
    setShowModal(true);
  };

  const handleEditUser = (user: any) => {
    setModalMode('edit');
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleSaveUser = async (userData: any) => {
    if (modalMode === 'add') {
      const newUser = {
        id: Date.now().toString(),
        ...userData,
        role: 'admin',
        created_at: new Date().toISOString().split('T')[0],
        last_login: 'Never'
      };
      setAdmins([...admins, newUser]);
      alert('Admin user added successfully!');
    } else {
      setAdmins(admins.map(u => 
        u.id === selectedUser?.id ? { ...u, ...userData } : u
      ));
      alert('Admin user updated successfully!');
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to remove this admin user?')) {
      setAdmins(admins.filter(u => u.id !== userId));
      alert('Admin user removed successfully');
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <CompactHeader
        title="Admin Users"
        subtitle="Administrative users with management access"
        backUrl="/access"
        action={{
          label: '+ Add Admin',
          onClick: handleAddUser
        }}
      />

      {/* User Form Modal */}
      <UserFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveUser}
        role="admin"
        user={selectedUser}
        mode={modalMode}
      />

      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginTop: '24px',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserCog style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Admin Users ({admins.length})</h2>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Users with administrative privileges</p>
            </div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>User</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Contact</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Last Login</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <UserCog style={{ width: '20px', height: '20px', color: 'white' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{admin.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Admin • Management</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#1e293b', marginBottom: '2px' }}>{admin.email}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{admin.phone}</div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    backgroundColor: admin.active ? '#dcfce7' : '#fee2e2',
                    color: admin.active ? '#16a34a' : '#dc2626',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {admin.active ? <CheckCircle style={{ width: '14px', height: '14px' }} /> : <XCircle style={{ width: '14px', height: '14px' }} />}
                    {admin.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{admin.last_login || 'Never'}</td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button style={{
                      padding: '8px 12px',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Edit style={{ width: '14px', height: '14px' }} />
                      Edit
                    </button>
                    <button style={{
                      padding: '8px 12px',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permissions */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginTop: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield style={{ width: '20px', height: '20px', color: 'white' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Admin Permissions</h2>
            <p style={{ fontSize: '14px', color: '#64748b' }}>Standard administrative access</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {[
            'Manage Operations',
            'Create/Edit Crew',
            'Manage Subcontractors',
            'Customer Management',
            'Vendor Management',
            'View Reports',
            'Financial Data (Limited)',
            'Team Scheduling',
            'Project Management',
            'Invoice Generation'
          ].map((permission, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px'
            }}>
              <CheckCircle style={{ width: '18px', height: '18px', color: '#16a34a' }} />
              <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{permission}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
