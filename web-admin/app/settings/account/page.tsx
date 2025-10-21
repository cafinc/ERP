'use client';

import { useState } from 'react';
import CompactHeader from '@/components/CompactHeader';
import { User, Mail, Phone, MapPin, Calendar, Building } from 'lucide-react';

export default function AccountSettingsPage() {
  const [formData, setFormData] = useState({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    phone: '+1 (555) 123-4567',
    company: 'CAF Property Services',
    address: '123 Main Street',
    city: 'Toronto',
    province: 'Ontario',
    postalCode: 'M5V 1A1',
    timezone: 'America/Toronto',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Account settings updated successfully!');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <CompactHeader
        title="Account Settings"
        subtitle="Manage your personal information and preferences"
      />

      <form onSubmit={handleSubmit} style={{ marginTop: '24px' }}>
        {/* Profile Information */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Profile Information</h2>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Update your personal details</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
                <Mail style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
                <Phone style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Company & Address</h2>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Your business information</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
                Company Name
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
                <MapPin style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} />
                Street Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
                  Province
                </label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Regional Settings</h2>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Your timezone and locale</p>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
              Timezone
            </label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="America/Toronto">Eastern Time (Toronto)</option>
              <option value="America/New_York">Eastern Time (New York)</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        <div>
          <button
            type="submit"
            style={{
              padding: '12px 32px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
