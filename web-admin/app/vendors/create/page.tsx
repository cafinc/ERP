'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import { ArrowLeft, Save, Building } from 'lucide-react';

export default function CreateVendorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [vendorData, setVendorData] = useState({
    vendor_name: '',
    vendor_code: '',
    vendor_type: 'supplier',
    primary_contact: {
      name: '',
      email: '',
      phone: '',
      title: ''
    },
    billing_address: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'Canada'
    },
    shipping_address: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'Canada'
    },
    payment_terms: 'Net 30',
    tax_id: '',
    w9_on_file: false,
    insurance_on_file: false,
    insurance_expiry: '',
    notes: ''
  });

  const [sameAsBilling, setSameAsBilling] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      const payload = {
        ...vendorData,
        shipping_address: sameAsBilling ? vendorData.billing_address : vendorData.shipping_address,
        insurance_expiry: vendorData.insurance_expiry ? new Date(vendorData.insurance_expiry).toISOString() : null
      };

      const response = await api.post('/api/vendors', payload);

      if (response.data.success) {
        alert('Vendor created successfully');
        router.push('/vendors');
      }
    } catch (error: any) {
      console.error('Error creating vendor:', error);
      alert(error.response?.data?.detail || 'Error creating vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Create Vendor"
        subtitle="Add a new vendor to your system"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Vendors", href: "/vendors" },
          { label: "Create" }
        ]}
      />

      <div className="p-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.push('/vendors')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Vendors
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                Create Vendor
              </button>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorData.vendor_name}
                    onChange={(e) => setVendorData({ ...vendorData, vendor_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Code
                  </label>
                  <input
                    type="text"
                    value={vendorData.vendor_code}
                    onChange={(e) => setVendorData({ ...vendorData, vendor_code: e.target.value })}
                    placeholder="Auto-generated if left blank"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Type *
                  </label>
                  <select
                    required
                    value={vendorData.vendor_type}
                    onChange={(e) => setVendorData({ ...vendorData, vendor_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  >
                    <option value="supplier">Supplier</option>
                    <option value="subcontractor">Subcontractor</option>
                    <option value="service_provider">Service Provider</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Terms *
                  </label>
                  <select
                    required
                    value={vendorData.payment_terms}
                    onChange={(e) => setVendorData({ ...vendorData, payment_terms: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  >
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax ID
                  </label>
                  <input
                    type="text"
                    value={vendorData.tax_id}
                    onChange={(e) => setVendorData({ ...vendorData, tax_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Primary Contact */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorData.primary_contact.name}
                    onChange={(e) => setVendorData({
                      ...vendorData,
                      primary_contact: { ...vendorData.primary_contact, name: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={vendorData.primary_contact.title}
                    onChange={(e) => setVendorData({
                      ...vendorData,
                      primary_contact: { ...vendorData.primary_contact, title: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={vendorData.primary_contact.email}
                    onChange={(e) => setVendorData({
                      ...vendorData,
                      primary_contact: { ...vendorData.primary_contact, email: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={vendorData.primary_contact.phone}
                    onChange={(e) => setVendorData({
                      ...vendorData,
                      primary_contact: { ...vendorData.primary_contact, phone: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street
                  </label>
                  <input
                    type="text"
                    value={vendorData.billing_address.street}
                    onChange={(e) => setVendorData({
                      ...vendorData,
                      billing_address: { ...vendorData.billing_address, street: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={vendorData.billing_address.city}
                    onChange={(e) => setVendorData({
                      ...vendorData,
                      billing_address: { ...vendorData.billing_address, city: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Province/State
                  </label>
                  <input
                    type="text"
                    value={vendorData.billing_address.state}
                    onChange={(e) => setVendorData({
                      ...vendorData,
                      billing_address: { ...vendorData.billing_address, state: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal/Zip Code
                  </label>
                  <input
                    type="text"
                    value={vendorData.billing_address.zip_code}
                    onChange={(e) => setVendorData({
                      ...vendorData,
                      billing_address: { ...vendorData.billing_address, zip_code: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    value={vendorData.billing_address.country}
                    onChange={(e) => setVendorData({
                      ...vendorData,
                      billing_address: { ...vendorData.billing_address, country: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  >
                    <option value="Canada">Canada</option>
                    <option value="United States">United States</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Shipping Address</h3>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sameAsBilling}
                    onChange={(e) => setSameAsBilling(e.target.checked)}
                    className="rounded border-gray-300 text-[#3f72af] focus:ring-[#3f72af]"
                  />
                  <span className="text-sm text-gray-600">Same as billing</span>
                </label>
              </div>

              {!sameAsBilling && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street
                    </label>
                    <input
                      type="text"
                      value={vendorData.shipping_address.street}
                      onChange={(e) => setVendorData({
                        ...vendorData,
                        shipping_address: { ...vendorData.shipping_address, street: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={vendorData.shipping_address.city}
                      onChange={(e) => setVendorData({
                        ...vendorData,
                        shipping_address: { ...vendorData.shipping_address, city: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Province/State
                    </label>
                    <input
                      type="text"
                      value={vendorData.shipping_address.state}
                      onChange={(e) => setVendorData({
                        ...vendorData,
                        shipping_address: { ...vendorData.shipping_address, state: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal/Zip Code
                    </label>
                    <input
                      type="text"
                      value={vendorData.shipping_address.zip_code}
                      onChange={(e) => setVendorData({
                        ...vendorData,
                        shipping_address: { ...vendorData.shipping_address, zip_code: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <select
                      value={vendorData.shipping_address.country}
                      onChange={(e) => setVendorData({
                        ...vendorData,
                        shipping_address: { ...vendorData.shipping_address, country: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    >
                      <option value="Canada">Canada</option>
                      <option value="United States">United States</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={vendorData.w9_on_file}
                      onChange={(e) => setVendorData({ ...vendorData, w9_on_file: e.target.checked })}
                      className="rounded border-gray-300 text-[#3f72af] focus:ring-[#3f72af]"
                    />
                    <span className="text-sm text-gray-700">W9 on file</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={vendorData.insurance_on_file}
                      onChange={(e) => setVendorData({ ...vendorData, insurance_on_file: e.target.checked })}
                      className="rounded border-gray-300 text-[#3f72af] focus:ring-[#3f72af]"
                    />
                    <span className="text-sm text-gray-700">Insurance on file</span>
                  </label>
                </div>

                {vendorData.insurance_on_file && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Expiry Date
                    </label>
                    <input
                      type="date"
                      value={vendorData.insurance_expiry}
                      onChange={(e) => setVendorData({ ...vendorData, insurance_expiry: e.target.value })}
                      className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={vendorData.notes}
                    onChange={(e) => setVendorData({ ...vendorData, notes: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
