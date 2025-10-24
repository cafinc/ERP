'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { Palette, Upload, Image as ImageIcon, Eye, RotateCcw } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Ocean Blue', value: '#3f72af' },
  { name: 'Forest Green', value: '#16a34a' },
  { name: 'Royal Purple', value: '#9333ea' },
  { name: 'Sunset Orange', value: '#ea580c' },
  { name: 'Deep Red', value: '#dc2626' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Slate Gray', value: '#475569' },
  { name: 'Amber', value: '#d97706' },
];

export default function BrandingSettingsPage() {
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [headerColor, setHeaderColor] = useState('#3f72af');
  const [customColor, setCustomColor] = useState('#3f72af');
  const [uploading, setUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    // Load branding settings from localStorage
    const savedBranding = localStorage.getItem('branding_settings');
    if (savedBranding) {
      try {
        const branding = JSON.parse(savedBranding);
        setCompanyName(branding.company_name || '');
        setLogoUrl(branding.logo_url || '');
        setHeaderColor(branding.header_color || '#3f72af');
        setCustomColor(branding.header_color || '#3f72af');
      } catch (error) {
        console.error('Error loading branding settings:', error);
      }
    }
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoUrl(base64String);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo');
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const brandingData = {
        company_name: companyName,
        logo_url: logoUrl,
        header_color: headerColor,
      };

      localStorage.setItem('branding_settings', JSON.stringify(brandingData));
      
      alert('Branding settings saved successfully! Please refresh the page to see all changes.');
    } catch (error) {
      console.error('Error saving branding:', error);
      alert('Failed to save branding settings');
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to default branding? This will reload the page.')) {
      setCompanyName('');
      setLogoUrl('');
      setHeaderColor('#3f72af');
      setCustomColor('#3f72af');
      localStorage.removeItem('branding_settings');
      window.location.reload();
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title="Branding Settings"
        subtitle="Customize your platform's appearance and branding"
        backUrl="/settings"
      />

      <div style={{ marginTop: '24px', display: 'grid', gap: '24px' }}>
        {/* Preview Header */}
        {previewMode && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '2px solid #3b82f6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Live Preview</h3>
              <button
                onClick={() => setPreviewMode(false)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Close Preview
              </button>
            </div>
            <div style={{
              backgroundColor: headerColor,
              padding: '16px 24px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Company Logo"
                    style={{
                      height: '48px',
                      width: 'auto',
                      maxWidth: '200px',
                      objectFit: 'contain'
                    }}
                  />
                ) : (
                  <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
                    {companyName || 'Your Company'}
                  </div>
                )}
              </div>
              <div style={{ color: 'white', fontSize: '14px' }}>
                Preview Header
              </div>
            </div>
          </div>
        )}

        {/* Company Information */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
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
              <ImageIcon style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Company Information</h2>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Set your company name and logo</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter your company name"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                This will appear in the header if no logo is uploaded
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
                Company Logo
              </label>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
                {logoUrl && (
                  <div style={{
                    width: '120px',
                    height: '120px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8fafc'
                  }}>
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="logo-upload"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <Upload style={{ width: '16px', height: '16px' }} />
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                  </label>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                    Recommended: PNG or SVG with transparent background<br />
                    Max size: 2MB • Ideal dimensions: 200x60px
                  </p>
                  {logoUrl && (
                    <button
                      onClick={() => setLogoUrl('')}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove Logo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header Color Customization */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Palette style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Header Color</h2>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Choose your brand color for the header</p>
            </div>
          </div>

          {/* Preset Colors */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: '#64748b' }}>
              Preset Colors
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    setHeaderColor(color.value);
                    setCustomColor(color.value);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    border: headerColor === color.value ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                    borderRadius: '8px',
                    backgroundColor: headerColor === color.value ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: color.value,
                    borderRadius: '6px',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }} />
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>
                    {color.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color Picker */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#64748b' }}>
              Custom Color
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="color"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setHeaderColor(e.target.value);
                }}
                style={{
                  width: '60px',
                  height: '40px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    setHeaderColor(e.target.value);
                  }
                }}
                placeholder="#3f72af"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setPreviewMode(!previewMode)}
              style={{
                padding: '12px 24px',
                backgroundColor: previewMode ? '#f1f5f9' : '#3b82f6',
                color: previewMode ? '#64748b' : 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Eye style={{ width: '16px', height: '16px' }} />
              {previewMode ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: '12px 24px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <RotateCcw style={{ width: '16px', height: '16px' }} />
              Reset to Default
            </button>
          </div>
          <button
            onClick={handleSave}
            style={{
              padding: '12px 32px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Save Branding
          </button>
        </div>
      </div>
    </div>
  );
}
