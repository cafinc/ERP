'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import api from '@/lib/api';
import {
  ArrowLeft,
  Save,
  User,
  Search,
  RefreshCw,
  FileText,
  Calendar,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
}

interface Estimate {
  id: string;
  estimate_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
}

interface ContractTemplate {
  id: string;
  template_name: string;
  contract_type: string;
  content: string;
}

export default function CreateContractPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    template_id: '',
    estimate_id: '',
    contract_type: 'seasonal',
    title: '',
    service_description: '',
    service_start_date: '',
    service_end_date: '',
    contract_value: 0,
    payment_terms: 'net_30',
    terms_and_conditions: '',
    notes: '',
    auto_renew: false,
    renewal_terms: '',
  });

  useEffect(() => {
    loadCustomers();
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      loadEstimatesForCustomer(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (selectedEstimate) {
      setFormData(prev => ({
        ...prev,
        contract_value: selectedEstimate.total_amount,
        title: `Service Agreement - ${selectedEstimate.estimate_number}`,
      }));
    }
  }, [selectedEstimate]);

  const loadCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadEstimatesForCustomer = async (customerId: string) => {
    try {
      const response = await api.get(`/estimates?customer_id=${customerId}&status=accepted`);
      setEstimates(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading estimates:', error);
      setEstimates([]);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await api.get('/contract-templates');
      setTemplates(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
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

  const handleSelectEstimate = (estimateId: string) => {
    const estimate = estimates.find(e => e.id === estimateId);
    setSelectedEstimate(estimate || null);
    setFormData({ ...formData, estimate_id: estimateId });
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setFormData(prev => ({
      ...prev,
      template_id: templateId,
      contract_type: template?.contract_type || prev.contract_type,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_id) {
      alert('Please select a customer');
      return;
    }

    if (!formData.title || !formData.service_description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/contracts', formData);
      alert('Contract created successfully!');
      router.push(`/contracts/${response.data.id}`);
    } catch (error) {
      console.error('Error creating contract:', error);
      alert('Failed to create contract');
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
            onClick={() => router.push('/contracts')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Contract</h1>
            <p className="text-gray-600 mt-1">Create a new service agreement</p>
          </div>
        </div>

        {/* Customer Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
          
          {selectedCustomer ? (
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{selectedCustomer.name}</p>
                  {selectedCustomer.company_name && (
                    <p className="text-sm text-gray-600">{selectedCustomer.company_name}</p>
                  )}
                  <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                  {selectedCustomer.phone && (
                    <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setSelectedEstimate(null);
                    setFormData({ ...formData, customer_id: '', estimate_id: '' });
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
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

          {/* Link to Estimate (Optional) */}
          {selectedCustomer && estimates.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link to Estimate (Optional)
              </label>
              <select
                value={formData.estimate_id}
                onChange={(e) => handleSelectEstimate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No estimate</option>
                {estimates.map((estimate) => (
                  <option key={estimate.id} value={estimate.id}>
                    {estimate.estimate_number} - ${estimate.total_amount.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Contract Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template (Optional)
              </label>
              <select
                value={formData.template_id}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No template - Start from scratch</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.template_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Type *
              </label>
              <select
                value={formData.contract_type}
                onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="seasonal">Seasonal Contract</option>
                <option value="one_time">One-Time Agreement</option>
                <option value="recurring">Recurring Service</option>
                <option value="custom">Custom Agreement</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., 2024-2025 Winter Snow Removal Agreement"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Start Date
              </label>
              <input
                type="date"
                value={formData.service_start_date}
                onChange={(e) => setFormData({ ...formData, service_start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service End Date
              </label>
              <input
                type="date"
                value={formData.service_end_date}
                onChange={(e) => setFormData({ ...formData, service_end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Value
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  step="0.01"
                  value={formData.contract_value}
                  onChange={(e) => setFormData({ ...formData, contract_value: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Terms
              </label>
              <select
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="net_15">Net 15</option>
                <option value="net_30">Net 30</option>
                <option value="net_60">Net 60</option>
                <option value="due_on_receipt">Due on Receipt</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Description *
              </label>
              <textarea
                value={formData.service_description}
                onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
                required
                rows={4}
                placeholder="Describe the services to be provided..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terms & Conditions
              </label>
              <textarea
                value={formData.terms_and_conditions}
                onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
                rows={4}
                placeholder="Enter terms and conditions..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Internal)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Internal notes..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Auto-Renewal */}
            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.auto_renew}
                  onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable Auto-Renewal</span>
              </label>
              
              {formData.auto_renew && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Renewal Terms
                  </label>
                  <input
                    type="text"
                    value={formData.renewal_terms}
                    onChange={(e) => setFormData({ ...formData, renewal_terms: e.target.value })}
                    placeholder="e.g., Auto-renews annually unless cancelled 30 days prior"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/contracts')}
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
                Create Contract
              </>
            )}
          </button>
        </div>
      </form>
    </HybridNavigationTopBar>
  );
}
