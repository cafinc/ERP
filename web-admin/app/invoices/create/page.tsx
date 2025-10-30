'use client';

import PageHeader from '@/components/PageHeader';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  User,
  FileText,
  DollarSign,
  Percent,
  Calendar,
} from 'lucide-react';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function InvoiceCreatePage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [invoiceForm, setInvoiceForm] = useState({
    customer_id: '',
    payment_terms: 'net_30',
    deposit_required: false,
    deposit_percentage: 0,
    late_fee_enabled: false,
    late_fee_percentage: 0,
    discount_amount: 0,
    notes: '',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0, total: 0 },
  ]);

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

  const addLineItem = () => {
    const newId = (Math.max(...lineItems.map(item => parseInt(item.id))) + 1).toString();
    setLineItems([...lineItems, { id: newId, description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: string, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updated.total = updated.quantity * updated.unit_price;
        }
        return updated;
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const discount = invoiceForm.discount_amount || 0;
    const pre_tax_total = subtotal - discount;
    const tax_amount = pre_tax_total * 0.05; // 5% GST
    const total = pre_tax_total + tax_amount;
    
    return { subtotal, discount, pre_tax_total, tax_amount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceForm.customer_id) {
      alert('Please select a customer');
      return;
    }

    if (lineItems.length === 0 || lineItems.every(item => !item.description)) {
      alert('Please add at least one line item');
      return;
    }

    try {
      setSaving(true);
      
      const invoiceData = {
        customer_id: invoiceForm.customer_id,
        line_items: lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        })),
        discount_amount: invoiceForm.discount_amount,
        payment_terms: invoiceForm.payment_terms,
        deposit_required: invoiceForm.deposit_required,
        deposit_percentage: invoiceForm.deposit_percentage,
        late_fee_enabled: invoiceForm.late_fee_enabled,
        late_fee_percentage: invoiceForm.late_fee_percentage,
        notes: invoiceForm.notes,
      };
      
      const response = await api.post('/invoices', invoiceData);
      
      alert('Invoice created successfully!');
      router.push(`/invoices/${response.data._id}`);
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      alert(error.response?.data?.detail || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Create Invoices"
        subtitle="Add new invoices"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Invoices", href: "/invoices" }, { label: "Create" }]}
      />
      <div className="flex-1 overflow-auto p-6">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center space-x-4">
          <button
            onClick={() => router.push('/invoices')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Invoice</h1>
            <p className="text-gray-600 mt-1">Fill in the details to create a new invoice</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer & Terms */}
              <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={invoiceForm.customer_id}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_id: e.target.value })}
                        required
                        className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">Select a customer</option>
                        {customers.map((customer) => (
                          <option key={customer._id} value={customer._id}>
                            {customer.name} - {customer.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Terms
                    </label>
                    <select
                      value={invoiceForm.payment_terms}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, payment_terms: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="due_on_receipt">Due on Receipt</option>
                      <option value="net_15">Net 15 (3% discount)</option>
                      <option value="net_30">Net 30</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Amount
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={invoiceForm.discount_amount}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, discount_amount: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Deposit */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="flex items-center space-x-2 mb-3">
                    <input
                      type="checkbox"
                      checked={invoiceForm.deposit_required}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, deposit_required: e.target.checked })}
                      className="rounded text-[#3f72af] focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Require Deposit</span>
                  </label>
                  
                  {invoiceForm.deposit_required && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deposit Percentage
                      </label>
                      <div className="relative max-w-xs">
                        <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={invoiceForm.deposit_percentage}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, deposit_percentage: parseInt(e.target.value) || 0 })}
                          className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="25"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Late Fees */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="flex items-center space-x-2 mb-3">
                    <input
                      type="checkbox"
                      checked={invoiceForm.late_fee_enabled}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, late_fee_enabled: e.target.checked })}
                      className="rounded text-[#3f72af] focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Late Fees</span>
                  </label>
                  
                  {invoiceForm.late_fee_enabled && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Late Fee Percentage
                      </label>
                      <div className="relative max-w-xs">
                        <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={invoiceForm.late_fee_percentage}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, late_fee_percentage: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="1.5"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items */}
              <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {lineItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-12 sm:col-span-5">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Description"
                            required
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Qty"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Price"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-2 flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            ${item.total.toFixed(2)}
                          </span>
                        </div>
                        <div className="col-span-1 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => removeLineItem(item.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            disabled={lineItems.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Add any additional notes or terms..."
                />
              </div>
            </div>

            {/* Sidebar - Totals */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-8 sticky top-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">${totals.subtotal.toFixed(2)}</span>
                  </div>
                  
                  {totals.discount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-red-600">-${totals.discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tax (5% GST)</span>
                    <span className="font-medium text-gray-900">${totals.tax_amount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-lg font-bold pt-3 border-t border-gray-200">
                    <span className="text-gray-900">Total</span>
                    <span className="text-[#3f72af]">${totals.total.toFixed(2)}</span>
                  </div>

                  {invoiceForm.deposit_required && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Deposit ({invoiceForm.deposit_percentage}%)</span>
                        <span className="font-medium text-orange-600">
                          ${(totals.total * (invoiceForm.deposit_percentage / 100)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full mt-6 flex items-center justify-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Create Invoice</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/invoices')}
                  className="w-full mt-3 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
}
