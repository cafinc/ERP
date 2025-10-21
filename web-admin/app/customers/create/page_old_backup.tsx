'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import CompactHeader from '@/components/CompactHeader';
import api from '@/lib/api';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Briefcase,
  Users,
  Building,
  CreditCard,
  AlertCircle,
  Plus,
  X,
  ClipboardList,
  Send,
  MessageSquare,
} from 'lucide-react';

export default function CustomerFormPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string;
  const isEdit = !!customerId && customerId !== 'create';
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(!isEdit);
  const [customerType, setCustomerType] = useState<'individual' | 'company' | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  
  // Form attachment feature
  const [availableForms, setAvailableForms] = useState<any[]>([]);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [showFormSelector, setShowFormSelector] = useState(false);
  const [showSendLinkModal, setShowSendLinkModal] = useState(false);
  const [sendLinkMethod, setSendLinkMethod] = useState<'sms' | 'email'>('email');
  const [recipientContact, setRecipientContact] = useState({ phone: '', email: '' });
  
  // Sites management for companies
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [customerSites, setCustomerSites] = useState<any[]>([]);
  
  // Custom fields
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  
  const [customerForm, setCustomerForm] = useState({
    // For individuals
    first_name: '',
    last_name: '',
    // For both
    email: '',
    phone: '',
    mobile: '', // NEW: Optional mobile number
    // Address broken out
    street_address: '',
    city: '',
    province: 'AB',
    postal_code: '',
    country: 'Canada',
    // Company fields
    company_name: '',
    customer_type: 'individual',
    company_id: '',
    // Main contact for companies
    main_contact: {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      position: 'Manager',
    },
    notes: '',
    active: true,
    // Company-specific accounting fields
    accounting: {
      tax_id: '',
      billing_email: '',
      billing_phone: '',
      payment_terms: 'net_30',
      credit_limit: '',
      preferred_payment_method: '',
      po_required: false,
      billing_address: '',
      notes: '',
    },
  });

  useEffect(() => {
    loadCompanies();
    loadForms();
    if (isEdit) {
      loadCustomer();
    }
  }, [customerId]);

  const loadForms = async () => {
    try {
      const response = await api.get('/form-templates');
      setAvailableForms(response.data || []);
    } catch (error) {
      console.error('Error loading forms:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await api.get('/customers');
      const companyList = response.data.filter((c: any) => c.customer_type === 'company');
      setCompanies(companyList);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/customers/${customerId}`);
      setCustomerForm({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        customer_type: response.data.customer_type || 'individual',
        company_id: response.data.company_id || '',
        company_name: response.data.company_name || '',
        notes: response.data.notes || '',
        active: response.data.active !== false,
        accounting: response.data.accounting || {
          tax_id: '',
          billing_email: '',
          billing_phone: '',
          payment_terms: 'net_30',
          credit_limit: '',
          preferred_payment_method: '',
          po_required: false,
          billing_address: '',
          notes: '',
        },
      });
      setCustomFields(response.data.custom_fields || []);
      setCustomerType(response.data.customer_type || 'individual');
      setShowTypeModal(false);
    } catch (error) {
      console.error('Error loading customer:', error);
      alert('Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelection = (type: 'individual' | 'company') => {
    setCustomerType(type);
    setCustomerForm({ ...customerForm, customer_type: type });
    setShowTypeModal(false);
  };

  const handleAddCustomField = () => {
    if (newFieldName.trim() && newFieldValue.trim()) {
      setCustomFields([
        ...customFields,
        {
          name: newFieldName.trim(),
          value: newFieldValue.trim(),
          type: newFieldType,
        },
      ]);
      // Reset input fields
      setNewFieldName('');
      setNewFieldValue('');
      setNewFieldType('text');
    }
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
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
      
      const submitData: any = {
        name: customerForm.name,
        email: customerForm.email,
        phone: customerForm.phone,
        address: customerForm.address,
        customer_type: customerForm.customer_type,
        notes: customerForm.notes,
        active: customerForm.active,
      };

      // Add company_id for individuals if selected
      if (customerForm.customer_type === 'individual' && customerForm.company_id) {
        submitData.company_id = customerForm.company_id;
        const selectedCompany = companies.find(c => c._id === customerForm.company_id);
        if (selectedCompany) {
          submitData.company_name = selectedCompany.name;
        }
      }

      // Add accounting for companies
      if (customerForm.customer_type === 'company') {
        const accounting: any = {};
        if (customerForm.accounting.tax_id) accounting.tax_id = customerForm.accounting.tax_id;
        if (customerForm.accounting.billing_email) accounting.billing_email = customerForm.accounting.billing_email;
        if (customerForm.accounting.billing_phone) accounting.billing_phone = customerForm.accounting.billing_phone;
        if (customerForm.accounting.payment_terms) accounting.payment_terms = customerForm.accounting.payment_terms;
        if (customerForm.accounting.credit_limit) accounting.credit_limit = parseFloat(customerForm.accounting.credit_limit);
        if (customerForm.accounting.preferred_payment_method) accounting.preferred_payment_method = customerForm.accounting.preferred_payment_method;
        accounting.po_required = customerForm.accounting.po_required;
        if (customerForm.accounting.billing_address) accounting.billing_address = customerForm.accounting.billing_address;
        if (customerForm.accounting.notes) accounting.notes = customerForm.accounting.notes;
        
        if (Object.keys(accounting).length > 0) {
          submitData.accounting = accounting;
        }
      }

      // Add custom fields
      if (customFields.length > 0) {
        submitData.custom_fields = customFields;
      }
      
      if (isEdit) {
        await api.put(`/customers/${customerId}`, submitData);
        alert('Customer updated successfully!');
        router.push(`/customers/${customerId}`);
      } else {
        const response = await api.post('/customers', submitData);
        alert('Customer created successfully!');
        router.push(`/customers/${response.data._id || response.data.id}`);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          {/* Compact Header */}
          <CompactHeader
            title={isEdit ? 'Edit Customer' : 'Create Customer'}
            backUrl="/customers"
            icon={User}
            badges={isEdit && customerType ? [
              { label: customerType === 'company' ? 'Company' : 'Individual', color: customerType === 'company' ? 'blue' : 'gray' }
            ] : []}
            actions={[
              ...(!isEdit ? [{
                label: 'Send Form Link',
                icon: Send,
                onClick: () => setShowSendLinkModal(true),
                variant: 'purple' as const,
              }] : []),
              {
                label: 'Cancel',
                onClick: () => router.push('/customers'),
                variant: 'secondary' as const,
              },
              {
                label: saving ? 'Saving...' : (isEdit ? 'Update' : 'Create'),
                icon: Save,
                onClick: () => {
                  const form = document.querySelector('form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                },
                variant: 'primary',
                disabled: saving,
              },
            ]}
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>Basic Information</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Type *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleTypeSelection('individual')}
                      disabled={isEdit}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        customerForm.customer_type === 'individual'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      } ${isEdit ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    >
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                      <p className="font-semibold text-gray-900">Individual</p>
                      <p className="text-xs text-gray-600 mt-1">Person or homeowner</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeSelection('company')}
                      disabled={isEdit}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        customerForm.customer_type === 'company'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      } ${isEdit ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    >
                      <Briefcase className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                      <p className="font-semibold text-gray-900">Company</p>
                      <p className="text-xs text-gray-600 mt-1">Business or organization</p>
                    </button>
                  </div>
                  {isEdit && (
                    <p className="text-xs text-gray-500 mt-2">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      Customer type cannot be changed after creation
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name / Company Name *
                  </label>
                  <input
                    type="text"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={customerForm.customer_type === 'company' ? 'ABC Corporation' : 'John Smith'}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={customerForm.address}
                      onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123 Main St, City, State 12345"
                      required
                    />
                  </div>
                </div>

                {/* Link to Company (for individuals) */}
                {customerForm.customer_type === 'individual' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link to Company (Optional)
                    </label>
                    <select
                      value={customerForm.company_id}
                      onChange={(e) => setCustomerForm({ ...customerForm, company_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">No company affiliation</option>
                      {companies.map((company) => (
                        <option key={company._id} value={company._id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select if this person is a contact for a company
                    </p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={customerForm.notes}
                    onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes or special instructions..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customerForm.active}
                      onChange={(e) => setCustomerForm({ ...customerForm, active: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active Customer</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Company Accounting (for companies only) */}
            {customerForm.customer_type === 'company' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <span>Accounting Information</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax ID / EIN
                    </label>
                    <input
                      type="text"
                      value={customerForm.accounting.tax_id}
                      onChange={(e) => setCustomerForm({
                        ...customerForm,
                        accounting: { ...customerForm.accounting, tax_id: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="12-3456789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Terms
                    </label>
                    <select
                      value={customerForm.accounting.payment_terms}
                      onChange={(e) => setCustomerForm({
                        ...customerForm,
                        accounting: { ...customerForm.accounting, payment_terms: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="due_on_receipt">Due on Receipt</option>
                      <option value="net_15">Net 15</option>
                      <option value="net_30">Net 30</option>
                      <option value="net_60">Net 60</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Credit Limit
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={customerForm.accounting.credit_limit}
                      onChange={(e) => setCustomerForm({
                        ...customerForm,
                        accounting: { ...customerForm.accounting, credit_limit: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="10000.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Payment Method
                    </label>
                    <select
                      value={customerForm.accounting.preferred_payment_method}
                      onChange={(e) => setCustomerForm({
                        ...customerForm,
                        accounting: { ...customerForm.accounting, preferred_payment_method: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select method</option>
                      <option value="check">Check</option>
                      <option value="ach">ACH</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="invoice">Invoice</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Billing Address
                    </label>
                    <input
                      type="text"
                      value={customerForm.accounting.billing_address}
                      onChange={(e) => setCustomerForm({
                        ...customerForm,
                        accounting: { ...customerForm.accounting, billing_address: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Leave blank to use primary address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Billing Email
                    </label>
                    <input
                      type="email"
                      value={customerForm.accounting.billing_email}
                      onChange={(e) => setCustomerForm({
                        ...customerForm,
                        accounting: { ...customerForm.accounting, billing_email: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="billing@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Billing Phone
                    </label>
                    <input
                      type="tel"
                      value={customerForm.accounting.billing_phone}
                      onChange={(e) => setCustomerForm({
                        ...customerForm,
                        accounting: { ...customerForm.accounting, billing_phone: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customerForm.accounting.po_required}
                        onChange={(e) => setCustomerForm({
                          ...customerForm,
                          accounting: { ...customerForm.accounting, po_required: e.target.checked }
                        })}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Purchase Order Required</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Fields */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <ClipboardList className="w-5 h-5 text-purple-600" />
                <span>Custom Fields</span>
              </h2>

              {/* Existing Custom Fields */}
              {customFields.length > 0 && (
                <div className="space-y-4 mb-6">
                  {customFields.map((field, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={field.field_name}
                          onChange={(e) => handleUpdateCustomField(index, 'field_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Field name"
                        />
                      </div>
                      <div className="flex-1">
                        {field.field_type === 'text' && (
                          <input
                            type="text"
                            value={field.field_value}
                            onChange={(e) => handleUpdateCustomField(index, 'field_value', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Field value"
                          />
                        )}
                        {field.field_type === 'number' && (
                          <input
                            type="number"
                            value={field.field_value}
                            onChange={(e) => handleUpdateCustomField(index, 'field_value', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Field value"
                          />
                        )}
                        {field.field_type === 'date' && (
                          <input
                            type="date"
                            value={field.field_value}
                            onChange={(e) => handleUpdateCustomField(index, 'field_value', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        )}
                        {field.field_type === 'boolean' && (
                          <select
                            value={field.field_value}
                            onChange={(e) => handleUpdateCustomField(index, 'field_value', e.target.value === 'true')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                          </select>
                        )}
                      </div>
                      <div className="w-24">
                        <select
                          value={field.field_type}
                          onChange={(e) => handleUpdateCustomField(index, 'field_type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="boolean">Yes/No</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Custom Field */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Field</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Field Name
                    </label>
                    <input
                      type="text"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Service Area"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Field Type
                    </label>
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="boolean">Yes/No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Value
                    </label>
                    {newFieldType === 'text' && (
                      <input
                        type="text"
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Field value"
                      />
                    )}
                    {newFieldType === 'number' && (
                      <input
                        type="number"
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    )}
                    {newFieldType === 'date' && (
                      <input
                        type="date"
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                    {newFieldType === 'boolean' && (
                      <select
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value === 'true')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    )}
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddCustomField}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Field</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>


            {/* Attach Forms Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Attach Forms</span>
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Select forms to collect additional information from this customer
              </p>

              {/* Selected Forms */}
              {selectedForms.length > 0 && (
                <div className="mb-4 space-y-2">
                  {selectedForms.map((formId) => {
                    const form = availableForms.find(f => f._id === formId);
                    if (!form) return null;
                    return (
                      <div key={formId} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">{form.name}</span>
                          <span className="text-xs text-gray-500">({form.fields?.length || 0} fields)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedForms(selectedForms.filter(id => id !== formId))}
                          className="p-1 hover:bg-blue-100 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowFormSelector(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Form</span>
              </button>
            </div>


            {/* Action Buttons - Moved to header */}
          </form>

          {/* Form Selector Modal */}
          {showFormSelector && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                  <h3 className="text-xl font-semibold text-gray-900">Select Forms</h3>
                  <button
                    onClick={() => setShowFormSelector(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  {availableForms.length === 0 ? (
                    <p className="text-center text-gray-600 py-8">No forms available</p>
                  ) : (
                    <div className="space-y-3">
                      {availableForms.map((form) => {
                        const isSelected = selectedForms.includes(form._id);
                        return (
                          <div
                            key={form._id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedForms(selectedForms.filter(id => id !== form._id));
                              } else {
                                setSelectedForms([...selectedForms, form._id]);
                              }
                            }}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-blue-600 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{form.name}</h4>
                                {form.description && (
                                  <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                                )}
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                  <span>{form.fields?.length || 0} fields</span>
                                  {form.category && <span className="capitalize">{form.category}</span>}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="ml-4">
                                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowFormSelector(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Send Form Link Modal */}
          {showSendLinkModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">Send Customer Registration Link</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Send a link to the customer to fill out their information
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  {/* Method Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Send Via
                    </label>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setSendLinkMethod('email')}
                        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                          sendLinkMethod === 'email'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Mail className="w-5 h-5" />
                        <span className="font-medium">Email</span>
                      </button>
                      <button
                        onClick={() => setSendLinkMethod('sms')}
                        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                          sendLinkMethod === 'sms'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span className="font-medium">SMS</span>
                      </button>
                    </div>
                  </div>

                  {/* Contact Input */}
                  {sendLinkMethod === 'email' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={recipientContact.email}
                        onChange={(e) => setRecipientContact({ ...recipientContact, email: e.target.value })}
                        placeholder="customer@example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={recipientContact.phone}
                        onChange={(e) => setRecipientContact({ ...recipientContact, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> The customer will receive a secure link to fill out their information. Once submitted, a new customer record will be created automatically.
                    </p>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowSendLinkModal(false);
                      setRecipientContact({ phone: '', email: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Implement send link functionality
                      alert(`Form link will be sent via ${sendLinkMethod} to ${sendLinkMethod === 'email' ? recipientContact.email : recipientContact.phone}`);
                      setShowSendLinkModal(false);
                      setRecipientContact({ phone: '', email: '' });
                    }}
                    disabled={sendLinkMethod === 'email' ? !recipientContact.email : !recipientContact.phone}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Link</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
