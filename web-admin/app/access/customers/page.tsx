'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { User, Plus, Edit, Shield, CheckCircle, Eye, DollarSign } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    setCustomers([
      { id: '1', name: 'Acme Corporation', email: 'billing@acme.com', phone: '+1 (555) 111-2222', active: true, projects: 8, totalSpend: 45000 },
      { id: '2', name: 'Tech Solutions Inc', email: 'accounts@techsol.com', phone: '+1 (555) 222-3333', active: true, projects: 5, totalSpend: 28000 },
      { id: '3', name: 'Retail Store LLC', email: 'manager@retail.com', phone: '+1 (555) 333-4444', active: true, projects: 3, totalSpend: 15000 }
    ]);
  }, []);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title="Customer Access"
        subtitle="Manage customer portal access"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Access", href: "/access" }, { label: "Customers" }]}
        title="Customers"
        subtitle="Client accounts and customer portal access"
        backUrl="/access"
        action={{
          label: '+ Add Customer',
          onClick: () => alert('Add customer modal')
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
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Customers ({customers.length})</h2>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Client accounts with portal access</p>
            </div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Customer</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Contact</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Projects</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Total Spend</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <User style={{ width: '20px', height: '20px', color: 'white' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{customer.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Customer</div></div></div>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#1e293b', marginBottom: '2px' }}>{customer.email}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{customer.phone}</div>
                </td>
                <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                  {customer.projects}
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign style={{ width: '16px', height: '16px', color: '#10b981' }} />
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                      {customer.totalSpend.toLocaleString()}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
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
                      <Eye style={{ width: '14px', height: '14px', display: 'inline' }} /> View
                    </button>
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
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Customer Permissions</h2>
            <p style={{ fontSize: '14px', color: '#64748b' }}>Client portal access</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {[
            'View Their Projects',
            'See Invoices',
            'Make Payments',
            'Submit Service Requests',
            'View Estimates',
            'Document Access',
            'Communication Portal',
            'Appointment Scheduling'
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
