'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  FileText,
  User,
  Clock,
  AlertTriangle,
  Download,
  Trash2,
  CreditCard
} from 'lucide-react';

interface Bill {
  _id: string;
  bill_number: string;
  vendor_id: string;
  vendor_name: string;
  bill_date: string;
  due_date: string;
  payment_terms: string;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    tax: number;
    total: number;
  }>;
  reference_number: string;
  memo: string;
  subtotal: number;
  tax_total: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  status: string;
  approval_status: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Payment {
  _id: string;
  payment_date: string;
  payment_method: string;
  reference_number: string;
  amount: number;
  memo: string;
  status: string;
}

export default function BillDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  // Payment form
  const [paymentData, setPaymentData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cheque',
    reference_number: '',
    amount: 0,
    memo: '',
    bank_account: ''
  });

  // Approval form
  const [approvalData, setApprovalData] = useState({
    approver_id: 'current_user', // Would come from auth context
    comments: ''
  });

  useEffect(() => {
    fetchBillDetails();
  }, [params.id]);

  const fetchBillDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/bills/${params.id}`);
      
      if (response.data.success) {
        setBill(response.data.bill);
        setPayments(response.data.payments || []);
        setPaymentData(prev => ({
          ...prev,
          amount: response.data.bill.amount_due
        }));
      }
    } catch (error) {
      console.error('Error fetching bill:', error);
      alert('Error loading bill details');
      router.push('/finance/bills');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async () => {
    if (!actionType) return;

    try {
      const endpoint = actionType === 'approve' ? 'approve' : 'reject';
      await api.post(`/api/bills/${params.id}/${endpoint}`, approvalData);
      
      alert(`Bill ${actionType}d successfully`);
      setShowApprovalModal(false);
      fetchBillDetails();
    } catch (error: any) {
      console.error(`Error ${actionType}ing bill:`, error);
      alert(error.response?.data?.detail || `Error ${actionType}ing bill`);
    }
  };

  const handleRecordPayment = async () => {
    try {
      if (paymentData.amount <= 0 || paymentData.amount > (bill?.amount_due || 0)) {
        alert('Invalid payment amount');
        return;
      }

      await api.post(`/api/bills/${params.id}/payment`, {
        ...paymentData,
        payment_date: new Date(paymentData.payment_date).toISOString()
      });

      alert('Payment recorded successfully');
      setShowPaymentModal(false);
      fetchBillDetails();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      alert(error.response?.data?.detail || 'Error recording payment');
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      await api.post(`/api/bills/${params.id}/submit`);
      alert('Bill submitted for approval');
      fetchBillDetails();
    } catch (error: any) {
      console.error('Error submitting bill:', error);
      alert(error.response?.data?.detail || 'Error submitting bill');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock, label: 'Draft' },
      pending_approval: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Pending' },
      approved: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle, label: 'Approved' },
      paid: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Paid' },
      overdue: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle, label: 'Overdue' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', icon: Trash2, label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading || !bill) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f72af] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bill details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={`Bill ${bill.bill_number}`}
        subtitle={bill.vendor_name}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Finance", href: "/finance" },
          { label: "Bills", href: "/finance/bills" },
          { label: bill.bill_number }
        ]}
      />

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header with Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/finance/bills')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Bills
            </button>
            <div className="flex items-center gap-3">
              {bill.status === 'draft' && (
                <>
                  <button
                    onClick={() => router.push(`/finance/bills/${params.id}/edit`)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Edit className="w-5 h-5" />
                    Edit
                  </button>
                  <button
                    onClick={handleSubmitForApproval}
                    className="flex items-center gap-2 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282]"
                  >
                    Submit for Approval
                  </button>
                </>
              )}
              {bill.status === 'pending_approval' && (
                <>
                  <button
                    onClick={() => { setActionType('reject'); setShowApprovalModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject
                  </button>
                  <button
                    onClick={() => { setActionType('approve'); setShowApprovalModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve
                  </button>
                </>
              )}
              {bill.status === 'approved' && bill.amount_due > 0 && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282]"
                >
                  <CreditCard className="w-5 h-5" />
                  Record Payment
                </button>
              )}
            </div>
          </div>

          {/* Bill Status and Key Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              {getStatusBadge(bill.status)}
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(bill.total)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(bill.amount_paid)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Amount Due</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(bill.amount_due)}</p>
            </div>
          </div>
        </div>

        {/* Bill Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-600">Vendor</label>
              <p className="text-gray-900 font-medium">{bill.vendor_name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Bill Number</label>
              <p className="text-gray-900 font-medium">{bill.bill_number}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Bill Date</label>
              <p className="text-gray-900">{formatDate(bill.bill_date)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Due Date</label>
              <p className="text-gray-900">{formatDate(bill.due_date)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Payment Terms</label>
              <p className="text-gray-900">{bill.payment_terms}</p>
            </div>
            {bill.reference_number && (
              <div>
                <label className="text-sm text-gray-600">Reference Number</label>
                <p className="text-gray-900">{bill.reference_number}</p>
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bill.line_items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(item.unit_price)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(item.tax)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-700">Subtotal:</td>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{formatCurrency(bill.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-700">Tax:</td>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{formatCurrency(bill.tax_total)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-right text-lg font-bold text-gray-900">Total:</td>
                  <td className="px-6 py-3 text-lg font-bold text-gray-900">{formatCurrency(bill.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Payment History */}
        {payments.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-gray-600">
                        {payment.payment_method.toUpperCase()} - {payment.reference_number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{formatDate(payment.payment_date)}</p>
                    <p className="text-xs text-gray-500">{payment.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Memo */}
        {bill.memo && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
            <p className="text-gray-700">{bill.memo}</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Record Payment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                <input
                  type="date"
                  value={paymentData.payment_date}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af]"
                >
                  <option value="cheque">Cheque</option>
                  <option value="eft">EFT</option>
                  <option value="ach">ACH</option>
                  <option value="e_transfer">E-Transfer</option>
                  <option value="credit_card">Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                <input
                  type="text"
                  value={paymentData.reference_number}
                  onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })}
                  placeholder="Cheque #, Transaction ID, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (Max: {formatCurrency(bill.amount_due)})
                </label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                  max={bill.amount_due}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Memo (Optional)</label>
                <textarea
                  value={paymentData.memo}
                  onChange={(e) => setPaymentData({ ...paymentData, memo: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                className="flex-1 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282]"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {actionType === 'approve' ? 'Approve Bill' : 'Reject Bill'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments {actionType === 'reject' && '(Required)'}
                </label>
                <textarea
                  value={approvalData.comments}
                  onChange={(e) => setApprovalData({ ...approvalData, comments: e.target.value })}
                  rows={4}
                  placeholder={actionType === 'approve' ? 'Optional comments...' : 'Reason for rejection...'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveReject}
                className={`flex-1 px-4 py-2 rounded-lg text-white ${
                  actionType === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
