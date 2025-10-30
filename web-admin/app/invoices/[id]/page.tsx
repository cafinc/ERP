'use client';

import PageHeader from '@/components/PageHeader';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import {
  ArrowLeft,
  Download,
  DollarSign,
  Calendar,
  User,
  FileText,
  Clock,
  CreditCard,
  Plus,
  CheckCircle,
  RefreshCw,
  X,
} from 'lucide-react';

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface InvoicePayment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id?: string;
  notes?: string;
}

interface Invoice {
  _id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  project_id?: string;
  line_items: InvoiceLineItem[];
  subtotal: number;
  discount_amount: number;
  pre_tax_total: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  payment_terms: string;
  deposit_required: boolean;
  deposit_amount: number;
  deposit_paid: boolean;
  payments: InvoicePayment[];
  amount_paid: number;
  amount_due: number;
  status: string;
  issue_date: string;
  due_date: string;
  notes?: string;
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id as string;
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'helcim_card',
    transaction_id: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/invoices/${invoiceId}`);
      setInvoice(response.data);
    } catch (error) {
      console.error('Error loading invoice:', error);
      alert('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/invoices/${invoiceId}/payments`, {
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        transaction_id: paymentForm.transaction_id || undefined,
        notes: paymentForm.notes || undefined,
      });
      
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', payment_method: 'helcim_card', transaction_id: '', notes: '' });
      loadInvoice();
      alert('Payment recorded successfully!');
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'partially_paid': return 'bg-blue-100 text-blue-700';
      case 'unpaid': return 'bg-yellow-100 text-yellow-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Invoices Details"
        subtitle="View and manage details"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Invoices", href: "/invoices" }, { label: "Details" }]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
    
    </div>
    </div>
    );
  }

  if (!invoice) {
    return (
              <div className="p-8">
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-12 text-center hover:shadow-md transition-shadow">
            <FileText className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Invoice Not Found</h3>
            <p className="text-gray-600 mb-4">The invoice you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/invoices')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Invoices</span>
            </button>
          </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Invoice Details"
        subtitle="View and manage invoice"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Invoices", href: "/invoices" }, { label: "Details" }]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="p-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/invoices')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{invoice.invoice_number}</h1>
              <p className="text-gray-600 mt-1">Invoice Details</p>
            </div>
          <div className="flex items-center space-x-3">
            {invoice.status !== 'paid' && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Record Payment</span>
              </button>
            )}
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors">
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Info */}
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Invoice Information</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                  {invoice.status?.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Customer</label>
                  <p className="text-base font-medium text-gray-900 mt-1 flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    {invoice.customer_name}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Payment Terms</label>
                  <p className="text-base font-medium text-gray-900 mt-1">
                    {invoice.payment_terms?.replace('_', ' ').toUpperCase()}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Issue Date</label>
                  <p className="text-base font-medium text-gray-900 mt-1 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {new Date(invoice.issue_date).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Due Date</label>
                  <p className="text-base font-medium text-gray-900 mt-1 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </p>
                </div>

              {invoice.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="text-sm text-gray-600">Notes</label>
                  <p className="text-base text-gray-900 mt-2">{invoice.notes}</p>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Line Items</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="pb-3 text-left text-sm font-semibold text-gray-900">Description</th>
                      <th className="pb-3 text-right text-sm font-semibold text-gray-900">Quantity</th>
                      <th className="pb-3 text-right text-sm font-semibold text-gray-900">Unit Price</th>
                      <th className="pb-3 text-right text-sm font-semibold text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoice.line_items.map((item, index) => (
                      <tr key={index}>
                        <td className="py-3 text-sm text-gray-900">{item.description}</td>
                        <td className="py-3 text-right text-sm text-gray-600">{item.quantity}</td>
                        <td className="py-3 text-right text-sm text-gray-600">${item.unit_price.toFixed(2)}</td>
                        <td className="py-3 text-right text-sm font-medium text-gray-900">${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">${invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.discount_amount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-red-600">-${invoice.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tax ({invoice.tax_rate}%)</span>
                  <span className="font-medium text-gray-900">${invoice.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-[#3f72af]">${invoice.total_amount.toFixed(2)}</span>
                </div>

            {/* Payment History */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h2>
                
                <div className="space-y-4">
                  {invoice.payments.map((payment) => (
                    <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              ${payment.amount.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {payment.payment_method.replace('_', ' ')}
                              {payment.transaction_id && ` • ${payment.transaction_id}`}
                            </p>
                          </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </p>
                        </div>
                      {payment.notes && (
                        <p className="text-sm text-gray-600 mt-2 ml-11">{payment.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Amount</span>
                  <span className="text-lg font-bold text-gray-900">${invoice.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Amount Paid</span>
                  <span className="text-lg font-bold text-green-600">${invoice.amount_paid.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-900">Amount Due</span>
                  <span className="text-xl font-bold text-[#3f72af]">${invoice.amount_due.toFixed(2)}</span>
                </div>

              {invoice.deposit_required && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Deposit Required</span>
                    <span className="text-sm font-medium text-gray-900">${invoice.deposit_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {invoice.deposit_paid ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-orange-600" />
                    )}
                    <span className={`text-sm font-medium ${invoice.deposit_paid ? 'text-green-600' : 'text-orange-600'}`}>
                      {invoice.deposit_paid ? 'Deposit Paid' : 'Deposit Pending'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Payments Received</span>
                  <span className="text-lg font-bold text-gray-900">{invoice.payments?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Days Until Due</span>
                  <span className="text-lg font-bold text-gray-900">
                    {Math.ceil((new Date(invoice.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Record Payment</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="0.00"
                      max={invoice.amount_due}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Amount due: ${invoice.amount_due.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="helcim_card">Helcim Card</option>
                    <option value="helcim_ach">Helcim ACH</option>
                    <option value="check">Check</option>
                    <option value="cash">Cash</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentForm.transaction_id}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter transaction ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Add any notes about this payment"
                  />
                </div>

              <div className="flex items-center space-x-3 mt-6">
                <button
                  onClick={handleAddPayment}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  <span>Record Payment</span>
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
          </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
