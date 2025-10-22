'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import api from '@/lib/api';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react';

export default function CustomerEditPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    active: true,
  });

  useEffect(() => {
    if (customerId) {
      loadCustomer();
    }
  }, [customerId]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/customers/${customerId}`);
      setCustomerForm({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        notes: response.data.notes || '',
        active: response.data.active !== false,
      });
    } catch (error) {
      console.error('Error loading customer:', error);
      alert('Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerForm.name || !customerForm.email || !customerForm.phone || !customerForm.address) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await api.put(`/customers/${customerId}`, customerForm);
      alert('Customer updated successfully!');
      router.push(`/customers/${customerId}`);
    } catch (error: any) {
      console.error('Error saving customer:', error);
      alert(error.response?.data?.detail || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <HybridNavigationTopBar>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </HybridNavigationTopBar>
    );
  }

  return (
    <HybridNavigationTopBar>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center space-x-4">
          <button
            onClick={() => router.push(`/customers/${customerId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Customer</h1>
            <p className="text-gray-600 mt-1">Update customer information</p>
          </div>
        </div>

        <div className="max-w-3xl">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Customer Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter customer name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="customer@example.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="(123) 456-7890"
                />
              </div>
            </div>

            {/* Address */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  rows={3}
                  placeholder="Enter full address"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={customerForm.notes}
                  onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                  className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  rows={4}
                  placeholder="Add any additional notes about this customer..."
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="mb-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={customerForm.active}
                  onChange={(e) => setCustomerForm({ ...customerForm, active: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Active Customer</span>
              </label>
              <p className="text-sm text-gray-500 ml-6 mt-1">
                Inactive customers won't appear in customer selection dropdowns
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-600/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Update Customer</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/customers/${customerId}`)}
                className="flex-1 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Customer Information:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• All contact information is required for proper communication</li>
              <li>• Customer records are linked to estimates, projects, and invoices</li>
              <li>• Use notes to track special requirements or preferences</li>
              <li>• Deactivating a customer hides them from selection lists but preserves all data</li>
            </ul>
          </div>
        </div>
      </div>
    </HybridNavigationTopBar>
  );
}
