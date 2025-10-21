'use client';

import { useState, useEffect } from 'react';
import CompactHeader from '@/components/CompactHeader';
import { Users, Plus, Edit, Trash2, Shield, CheckCircle, XCircle, Briefcase } from 'lucide-react';

export default function SubcontractorsPage() {
  const [subcontractors, setSubcontractors] = useState([]);

  useEffect(() => {
    setSubcontractors([
      { id: '1', name: 'ABC Contractors Inc', email: 'contact@abc.com', phone: '+1 (555) 789-0123', role: 'subcontractor', active: true, projects: 5, rating: 4.8 },
      { id: '2', name: 'Pro Services LLC', email: 'info@proservices.com', phone: '+1 (555) 890-1234', role: 'subcontractor', active: true, projects: 12, rating: 4.9 },
      { id: '3', name: 'Quick Fix Co', email: 'hello@quickfix.com', phone: '+1 (555) 901-2345', role: 'subcontractor', active: false, projects: 3, rating: 4.2 }
    ]);
  }, []);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <CompactHeader
        title="Subcontractors"
        subtitle="External contractors and service providers"
        backUrl="/access"
        action={{
          label: '+ Add Subcontractor',
          onClick: () => alert('Add subcontractor modal')
        }}
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
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Briefcase style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Subcontractors ({subcontractors.length})</h2>
              <p style={{ fontSize: '14px', color: '#64748b' }}>External service providers</p>
            </div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Company</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Contact</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Projects</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Rating</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subcontractors.map((sub) => (
              <tr key={sub.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Briefcase style={{ width: '20px', height: '20px', color: 'white' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{sub.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Subcontractor</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#1e293b', marginBottom: '2px' }}>{sub.email}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{sub.phone}</div>
                </td>
                <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                  {sub.projects} active
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#fbbf24' }}>★</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{sub.rating}</span>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    backgroundColor: sub.active ? '#dcfce7' : '#fee2e2',
                    color: sub.active ? '#16a34a' : '#dc2626',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {sub.active ? <CheckCircle style={{ width: '14px', height: '14px' }} /> : <XCircle style={{ width: '14px', height: '14px' }} />}
                    {sub.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button style={{
                      padding: '8px 12px',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}>
                      <Edit style={{ width: '14px', height: '14px', display: 'inline' }} /> Edit
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
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Subcontractor Permissions</h2>
            <p style={{ fontSize: '14px', color: '#64748b' }}>Project-specific access</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {[
            'View Assigned Projects',
            'Submit Timesheets',
            'Upload Completion Photos',
            'Invoice Submission',
            'Material Requests',
            'Job Site Access',
            'Communication Portal',
            'Document Access'
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
