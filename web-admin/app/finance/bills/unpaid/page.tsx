'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  AlertTriangle,
  CreditCard,
  Calendar,
  DollarSign,
  CheckSquare,
  Square,
  RefreshCw
} from 'lucide-react';

interface UnpaidBill {
  _id: string;
  bill_number: string;
  vendor_id: string;
  vendor_name: string;
  due_date: string;
  amount_due: number;
  total: number;
  status: string;
}

export default function UnpaidBillsPage() {
  const router = useRouter();
  const [bills, setBills] = useState<UnpaidBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set());
  const [totalDue, setTotalDue] = useState(0);
  const [showBatchPayment, setShowBatchPayment] = useState(false);

  useEffect(() => {
    fetchUnpaidBills();
  }, []);

  const fetchUnpaidBills = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/bills/unpaid');
      
      if (response.data.success) {
        setBills(response.data.bills);
        setTotalDue(response.data.total_due);
      }
    } catch (error) {
      console.error('Error fetching unpaid bills:', error);
    } finally {
      setLoading(false);
    }
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
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const toggleBillSelection = (billId: string) => {
    const newSelected = new Set(selectedBills);
    if (newSelected.has(billId)) {
      newSelected.delete(billId);
    } else {
      newSelected.add(billId);
    }
    setSelectedBills(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedBills.size === bills.length) {
      setSelectedBills(new Set());
    } else {
      setSelectedBills(new Set(bills.map(b => b._id)));
    }
  };

  const getSelectedTotal = () => {
    return bills
      .filter(b => selectedBills.has(b._id))
      .reduce((sum, b) => sum + b.amount_due, 0);
  };

  const handleBatchPayment = () => {
    if (selectedBills.size === 0) {
      alert('Please select bills to pay');
      return;
    }
    setShowBatchPayment(true);
  };

  const processBatchPayment = async () => {
    try {
      const payments = Array.from(selectedBills).map(billId => {
        const bill = bills.find(b => b._id === billId);
        return {
          bill_id: billId,
          amount: bill?.amount_due || 0
        };
      });

      await api.post('/api/bills/batch-payment', payments);
      
      alert(`Successfully processed ${payments.length} payments`);
      setShowBatchPayment(false);
      setSelectedBills(new Set());
      fetchUnpaidBills();
    } catch (error: any) {
      console.error('Error processing batch payment:', error);
      alert(error.response?.data?.detail || 'Error processing batch payment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Unpaid Bills"
        subtitle="Bills awaiting payment"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Finance", href: "/finance" },
          { label: "Bills", href: "/finance/bills" },
          { label: "Unpaid" }
        ]}
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Outstanding</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(totalDue)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unpaid Bills</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{bills.length}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue Bills</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {bills.filter(b => getDaysOverdue(b.due_date) > 0).length}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>

        {/* Batch Actions Bar */}
        {selectedBills.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {selectedBills.size} bill{selectedBills.size !== 1 ? 's' : ''} selected
                </p>
                <p className="text-lg font-bold text-blue-900 mt-1">
                  Total: {formatCurrency(getSelectedTotal())}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedBills(new Set())}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white"
                >
                  Clear Selection
                </button>
                <button
                  onClick={handleBatchPayment}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282]"
                >
                  <CreditCard className="w-5 h-5" />
                  Pay Selected Bills
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unpaid Bills Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                      {selectedBills.size === bills.length ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Overdue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <AlertTriangle className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p>No unpaid bills found</p>
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => {
                    const daysOverdue = getDaysOverdue(bill.due_date);
                    const isOverdue = daysOverdue > 0;

                    return (
                      <tr 
                        key={bill._id} 
                        className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleBillSelection(bill._id)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            {selectedBills.has(bill._id) ? (
                              <CheckSquare className="w-5 h-5 text-[#3f72af]" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{bill.bill_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{bill.vendor_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(bill.due_date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isOverdue ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <AlertTriangle className="w-3 h-3" />
                              {daysOverdue} days
                            </span>
                          ) : (
                            <span className="text-sm text-green-600">
                              Due in {Math.abs(daysOverdue)} days
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-red-600">
                            {formatCurrency(bill.amount_due)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => router.push(`/finance/bills/${bill._id}`)}
                            className="text-[#3f72af] hover:text-[#2c5282] font-medium text-sm"
                          >
                            Pay Now
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Batch Payment Confirmation Modal */}
      {showBatchPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Confirm Batch Payment</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Bills to pay:</span>
                <span className="font-medium">{selectedBills.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900 font-medium">Total Amount:</span>
                <span className="text-xl font-bold text-[#3f72af]">
                  {formatCurrency(getSelectedTotal())}
                </span>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This will mark all selected bills as paid with the full amount due.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBatchPayment(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={processBatchPayment}
                className="flex-1 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282]"
              >
                Process Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
