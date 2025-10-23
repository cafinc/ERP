'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  MapPin,
  User,
  Search,
  Building,
  FileText,
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email?: string;
  company_name?: string;
}

export default function CreateSitePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: '',
    name: '',
    site_reference: '',
    site_type: 'parking_lot',
    area_size: 0,
    location: {
      address: '',
      latitude: 0,
      longitude: 0,
    },
    notes: '',
    crew_notes: '',
    internal_notes: '',
    active: true,
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    customer.company_name?.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({ ...formData, customer_id: customer.id });
    setShowCustomerSearch(false);
    setCustomerSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id) {
      alert('Please select a customer');
      return;
    }

    if (!formData.name || !formData.location.address) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/sites', formData);
      alert('Site created successfully!');
      router.push(`/sites/${response.data.id}`);
    } catch (error) {
      console.error('Error creating site:', error);
      alert('Failed to create site');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <HybridNavigationTopBar>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/sites')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Site</h1>
            <p className="text-gray-600 mt-1">Create a new service location</p>
          </div>
        </div>

        {/* Customer Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer *</h2>

          {selectedCustomer ? (
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{selectedCustomer.name}</p>
                  {selectedCustomer.company_name && (
                    <p className="text-sm text-gray-600">{selectedCustomer.company_name}</p>
                  )}
                  <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setFormData({ ...formData, customer_id: '' });
                  }}
                  className="text-sm text-[#3f72af] hover:text-blue-800"
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <User className="w-5 h-5" />
                Select Customer
              </button>

              {showCustomerSearch && (
                <div className="mt-4 border border-gray-300 rounded-lg p-4">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors"
                      >
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        {customer.company_name && (
                          <p className="text-sm text-gray-600">{customer.company_name}</p>
                        )}
                        <p className="text-sm text-gray-600">{customer.email}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Site Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Site Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Main Office Parking Lot"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Reference (Optional)
              </label>
              <input
                type="text"
                value={formData.site_reference}
                onChange={(e) => setFormData({ ...formData, site_reference: e.target.value })}
                placeholder="e.g., LOT-001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Type *
              </label>
              <select
                value={formData.site_type}
                onChange={(e) => setFormData({ ...formData, site_type: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="parking_lot">Parking Lot</option>
                <option value="driveway">Driveway</option>
                <option value="sidewalk">Sidewalk</option>
                <option value="roadway">Roadway</option>
                <option value="loading_dock">Loading Dock</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area Size (sq ft)
              </label>
              <input
                type="number"
                value={formData.area_size}
                onChange={(e) => setFormData({ ...formData, area_size: parseFloat(e.target.value) || 0 })}
                placeholder="e.g., 5000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <input
                type="text"
                value={formData.location.address}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  location: { ...formData.location, address: e.target.value }
                })}
                required
                placeholder="123 Main Street, City, State ZIP"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude (Optional)
              </label>
              <input
                type="number"
                step="any"
                value={formData.location.latitude}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  location: { ...formData.location, latitude: parseFloat(e.target.value) || 0 }
                })}
                placeholder="40.7128"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude (Optional)
              </label>
              <input
                type="number"
                step="any"
                value={formData.location.longitude}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  location: { ...formData.location, longitude: parseFloat(e.target.value) || 0 }
                })}
                placeholder="-74.0060"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crew Notes (Visible to field crew)
              </label>
              <textarea
                value={formData.crew_notes}
                onChange={(e) => setFormData({ ...formData, crew_notes: e.target.value })}
                rows={3}
                placeholder="Special instructions for the crew..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes (Admin only)
              </label>
              <textarea
                value={formData.internal_notes}
                onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                rows={3}
                placeholder="Internal admin notes..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                General Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/sites')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Create Site
              </>
            )}
          </button>
        </div>
      </form>
    </HybridNavigationTopBar>
  );
}
