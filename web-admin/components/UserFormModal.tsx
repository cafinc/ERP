'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: any) => void;
  role: 'master' | 'admin' | 'crew' | 'subcontractor' | 'customer' | 'vendor';
  user?: any;
  mode: 'add' | 'edit';
}

const ROLE_CONFIGS = {
  master: {
    title: 'Master User',
    icon: '👑',
    color: '#fbbf24',
    description: 'Platform owner with full control'
  },
  admin: {
    title: 'Admin User',
    icon: '⚙️',
    color: '#3b82f6',
    description: 'Administrative access'
  },
  crew: {
    title: 'Crew Member',
    icon: '🔨',
    color: '#f59e0b',
    description: 'Field worker'
  },
  subcontractor: {
    title: 'Subcontractor',
    icon: '👥',
    color: '#8b5cf6',
    description: 'External contractor'
  },
  customer: {
    title: 'Customer',
    icon: '👤',
    color: '#06b6d4',
    description: 'Client account'
  },
  vendor: {
    title: 'Vendor',
    icon: '📦',
    color: '#f97316',
    description: 'Supplier account'
  }
};

export default function UserFormModal({ isOpen, onClose, onSave, role, user, mode }: UserFormModalProps) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: role,
    active: user?.active ?? true,
    // Role-specific fields
    team: user?.team || '',
    rating: user?.rating || '',
    category: user?.category || '',
    projects: user?.projects || 0
  });

  const [errors, setErrors] = useState<any>({});
  const config = ROLE_CONFIGS[role];

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%)`,
          color: 'white',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '32px' }}>{config.icon}</div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                {mode === 'add' ? 'Add' : 'Edit'} {config.title}
              </h2>
              <p style={{ fontSize: '14px', opacity: 0.9 }}>{config.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X style={{ width: '24px', height: '24px', color: 'white' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 160px)' }}>
          {/* Basic Information */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
              Basic Information
            </h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${errors.name ? '#ef4444' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                {errors.name && (
                  <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{errors.name}</p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${errors.email ? '#ef4444' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                {errors.email && (
                  <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{errors.email}</p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${errors.phone ? '#ef4444' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                {errors.phone && (
                  <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Role-specific fields */}
          {role === 'crew' && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
                Crew Details
              </h3>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
                  Team Assignment
                </label>
                <select
                  name="team"
                  value={formData.team}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="">Select Team</option>
                  <option value="Team A">Team A</option>
                  <option value="Team B">Team B</option>
                  <option value="Team C">Team C</option>
                </select>
              </div>
            </div>
          )}

          {role === 'vendor' && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
                Vendor Details
              </h3>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="">Select Category</option>
                  <option value="Materials">Materials</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Parts">Parts</option>
                  <option value="Services">Services</option>
                </select>
              </div>
            </div>
          )}

          {/* Status */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
              Status
            </h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>Active User</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>User can log in and access the system</div>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 24px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px 24px',
                backgroundColor: config.color,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Save style={{ width: '18px', height: '18px' }} />
              {mode === 'add' ? 'Add User' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
