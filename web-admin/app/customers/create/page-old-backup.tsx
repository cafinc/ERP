'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
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
  Home,
  Building2,
  X,
} from 'lucide-react';

export default function CustomerFormPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const customerId = params?.id as string;
  const isEdit = !!customerId && customerId !== 'create';
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(!isEdit);
  const [customerType, setCustomerType] = useState<'residential' | 'commercial' | null>(null);
  
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    customer_type: 'residential',
    company_name: '',
    notes: '',
    active: true,
  });

  useEffect(() => {
    if (isEdit) {
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
        customer_type: response.data.customer_type || 'residential',
        company_name: response.data.company_name || '',
        notes: response.data.notes || '',
        active: response.data.active !== false,
      });
      setCustomerType(response.data.customer_type || 'residential');
      setShowTypeModal(false);
    } catch (error) {
      console.error('Error loading customer:', error);
      alert('Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelection = (type: 'residential' | 'commercial') => {
    setCustomerType(type);
    setCustomerForm({ ...customerForm, customer_type: type });
    setShowTypeModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerForm.name || !customerForm.email || !customerForm.phone || !customerForm.address) {
      alert('Please fill in all required fields');
      return;
    }

    if (!customerType) {
      alert('Please select customer type');
      return;
    }

    try {
      setSaving(true);
      
      if (isEdit) {
        await api.put(`/customers/${customerId}`, customerForm);
        alert('Customer updated successfully!');
        router.push(`/customers/${customerId}`);
      } else {
        const response = await api.post('/customers', customerForm);
        alert('Customer created successfully!');
        router.push(`/customers/${response.data._id}`);
      }
    } catch (error: any) {
      console.error('Error saving customer:', error);
      alert(error.response?.data?.detail || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center space-x-4">
          <button
            onClick={() => router.push(isEdit ? `/customers/${customerId}` : '/customers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? 'Edit Customer' : 'New Customer'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit ? 'Update customer information' : 'Add a new customer to your database'}
            </p>
          </div>
        </div>

        <div className="max-w-3xl">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Customer Name */}
            <div className="mb-4">
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
                  className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent text-sm"
                  placeholder="Enter customer name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="mb-4">
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
                  className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent text-sm"
                  placeholder="customer@example.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="mb-4">
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
                  className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent text-sm"
                  placeholder="(123) 456-7890"
                />
              </div>
            </div>

            {/* Company Name (Commercial Only) */}
            {customerType === 'commercial' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name {customerType === 'commercial' && '*'}
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={customerForm.company_name}
                    onChange={(e) => setCustomerForm({ ...customerForm, company_name: e.target.value })}
                    required={customerType === 'commercial'}
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent text-sm"
                    placeholder="Enter company name"
                  />
                </div>
              </div>
            )}

            {/* Address */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent text-sm"
                  rows={3}
                  placeholder="Enter full address"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={customerForm.notes}
                  onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                  className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent text-sm"
                  rows={4}
                  placeholder="Add any additional notes about this customer..."
                />
              </div>
            </div>

            {/* Active Status */}
            {isEdit && (
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={customerForm.active}
                    onChange={(e) => setCustomerForm({ ...customerForm, active: e.target.checked })}
                    className="rounded text-[#3f72af] focus:ring-[#3f72af]"
                  />
                  <span className="text-sm font-medium text-gray-700">Active Customer</span>
                </label>
                <p className="text-sm text-gray-500 ml-6 mt-1">
                  Inactive customers won't appear in customer selection dropdowns
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{isEdit ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>{isEdit ? 'Update Customer' : 'Create Customer'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push(isEdit ? `/customers/${customerId}` : '/customers')}
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
              {isEdit && <li>• Deactivating a customer hides them from selection lists but preserves all data</li>}
            </ul>
          </div>
        </div>

        {/* Customer Type Selection Modal */}
        {showTypeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Select Customer Type</h2>
              <p className="text-gray-600 mb-8 text-center">Choose the type of customer you're adding</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Residential Option */}
                <button
                  onClick={() => handleTypeSelection('residential')}
                  className="group relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-[#3f72af] p-8 transition-all hover:shadow-lg"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-blue-100 group-hover:bg-[#3f72af] flex items-center justify-center mb-4 transition-colors">
                      <Home className="w-10 h-10 text-[#3f72af] group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Residential Customer</h3>
                    <p className="text-sm text-gray-600">Individual homeowners and residential properties</p>
                  </div>
                </button>

                {/* Commercial Option */}
                <button
                  onClick={() => handleTypeSelection('commercial')}
                  className="group relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-[#3f72af] p-8 transition-all hover:shadow-lg"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-green-100 group-hover:bg-[#3f72af] flex items-center justify-center mb-4 transition-colors">
                      <Building2 className="w-10 h-10 text-green-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Commercial Customer</h3>
                    <p className="text-sm text-gray-600">Businesses, offices, and commercial properties</p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => router.push('/customers')}
                className="mt-6 w-full px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
