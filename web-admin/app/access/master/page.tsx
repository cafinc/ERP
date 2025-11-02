'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import UserFormModal from '@/components/UserFormModal';
import { Crown, Plus, Edit, Trash2, Shield, AlertCircle, CheckCircle, XCircle, Lock } from 'lucide-react';

interface MasterUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  active: boolean;
  created_at: string;
  last_login?: string;
}

export default function MasterUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [masterUsers, setMasterUsers] = useState<MasterUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MasterUser | undefined>();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  // Check environment - block access in production/deployed environment
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                        process.env.NEXT_PUBLIC_ENABLE_MASTER_ACCESS === 'true';

  useEffect(() => {
    // Redirect if in production/deployed environment
    if (!isDevelopment) {
      router.push('/access');
      return;
    }
    fetchMasterUsers();
  }, [isDevelopment, router]);

  useEffect(() => {
    fetchMasterUsers();
  }, []);

  const fetchMasterUsers = async () => {
    try {
      const response = await api.get('/users?role=master');
      setMasterUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching master users:', error);
      // Mock data for demo
      setMasterUsers([
        {
          id: '1',
          name: user?.full_name || 'Platform Owner',
          email: user?.email || 'owner@platform.com',
          phone: '+1 (555) 123-4567',
          role: 'master',
          active: true,
          created_at: '2024-01-01',
          last_login: '2025-06-21'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setModalMode('add');
    setSelectedUser(undefined);
    setShowModal(true);
  };

  const handleEditUser = (user: MasterUser) => {
    setModalMode('edit');
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleSaveUser = async (userData: any) => {
    try {
      if (modalMode === 'add') {
        // Add new user
        const newUser: MasterUser = {
          id: Date.now().toString(),
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: 'master',
          active: userData.active,
          created_at: new Date().toISOString().split('T')[0],
          last_login: 'Never'
        };
        setMasterUsers([...masterUsers, newUser]);
        alert('Master user added successfully!');
      } else {
        // Edit existing user
        setMasterUsers(masterUsers.map(u => 
          u.id === selectedUser?.id 
            ? { ...u, name: userData.name, email: userData.email, phone: userData.phone, active: userData.active }
            : u
        ));
        alert('Master user updated successfully!');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user');
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (masterUsers.length <= 1) {
      alert('Cannot delete the last master user!');
      return;
    }
    
    if (confirm('Are you sure you want to remove this master user? This action cannot be undone.')) {
      setMasterUsers(masterUsers.filter(u => u.id !== userId));
      alert('Master user removed successfully');
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title="Master Users"
        subtitle="Manage master administrator accounts"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Access", href: "/access" }, { label: "Master Users" }]}
        title="Master Users"
        subtitle="Platform owners with full system control"
        backUrl="/access"
        action={{
          label: '+ Add Master User',
          onClick: handleAddUser
        }}
      />

      {/* User Form Modal */}
      <UserFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveUser}
        role="master"
        user={selectedUser}
        mode={modalMode}
      />

      {/* Warning Banner */}
      <div style={{
        backgroundColor: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '12px',
        padding: '16px',
        marginTop: '24px',
        display: 'flex',
        alignItems: 'start',
        gap: '12px'
      }}>
        <AlertCircle style={{ width: '20px', height: '20px', color: '#d97706', marginTop: '2px', flexShrink: 0 }} />
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
            Master Role - Highest Privilege Level
          </h3>
          <p style={{ fontSize: '13px', color: '#78350f' }}>
            Master users have unrestricted access to all features, settings, and data. They can manage all other user roles including admins. Only assign this role to trusted platform owners.
          </p>
        </div>
      </div>

      {/* Master Users Table */}
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
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Crown style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                Master Users ({masterUsers.length})
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b' }}>
                Users with complete platform control
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Loading master users...
          </div>
        ) : masterUsers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Crown style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '16px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>
              No Master Users
            </p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              Add your first master user to get started
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  User
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  Contact
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  Last Login
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {masterUsers.map((masterUser) => (
                <tr key={masterUser.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Crown style={{ width: '20px', height: '20px', color: 'white' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                          {masterUser.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Master • Full Access
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#1e293b', marginBottom: '2px' }}>
                      {masterUser.email}
                    </div>
                    {masterUser.phone && (
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {masterUser.phone}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {masterUser.active ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        backgroundColor: '#dcfce7',
                        color: '#16a34a',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        <CheckCircle style={{ width: '14px', height: '14px' }} />
                        Active
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        <XCircle style={{ width: '14px', height: '14px' }} />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>
                    {masterUser.last_login || 'Never'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleEditUser(masterUser)}
                        style={{
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
                        }}
                      >
                        <Edit style={{ width: '14px', height: '14px' }} />
                        Edit
                      </button>
                      {masterUsers.length > 1 && (
                        <button
                          onClick={() => handleDeleteUser(masterUser.id)}
                          style={{
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
                          }}
                        >
                          <Trash2 style={{ width: '14px', height: '14px' }} />
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Permissions Info */}
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
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield style={{ width: '20px', height: '20px', color: 'white' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
              Master Permissions
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              All permissions granted by default
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {[
            'Full System Access',
            'Manage All Users',
            'Configure Branding',
            'View All Data',
            'Export All Data',
            'System Settings',
            'Financial Access',
            'Delete Any Record',
            'API Access',
            'Audit Logs',
            'Backup & Restore',
            'Integration Settings'
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
              <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                {permission}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
