"use client";

import { useState, useEffect } from "react";
import { DollarSign, Plus, Trash2, Search, Save } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface Customer {
  _id: string;
  name: string;
  email: string;
}

interface Invoice {
  _id: string;
  invoice_number: string;
  date: string;
  balance: number;
}

interface InvoicePayment {
  invoice_id: string;
  invoice_number: string;
  amount_applied: number;
  balance: number;
}

export default function RecordPaymentPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("cheque");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [depositTo, setDepositTo] = useState("undeposited_funds");
  const [memo, setMemo] = useState("");
  const [invoicesPayments, setInvoicesPayments] = useState<InvoicePayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerInvoices();
    } else {
      setCustomerInvoices([]);
      setInvoicesPayments([]);
    }
  }, [selectedCustomerId]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get("/api/customers");
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchCustomerInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/invoices");
      
      // Filter invoices for selected customer with outstanding balance
      const filtered = response.data.filter(
        (inv: Invoice) =>
          inv._id && // Has valid ID
          ["sent", "overdue", "partial"].includes(
            (inv as any).status
          ) &&
          inv.balance > 0
      );
      
      setCustomerInvoices(filtered);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const addInvoice = (invoice: Invoice) => {
    if (invoicesPayments.find((ip) => ip.invoice_id === invoice._id)) {
      alert("Invoice already added!");
      return;
    }

    setInvoicesPayments([
      ...invoicesPayments,
      {
        invoice_id: invoice._id,
        invoice_number: invoice.invoice_number,
        amount_applied: invoice.balance,
        balance: invoice.balance,
      },
    ]);
  };

  const removeInvoice = (invoiceId: string) => {
    setInvoicesPayments(invoicesPayments.filter((ip) => ip.invoice_id !== invoiceId));
  };

  const updateAmountApplied = (invoiceId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    
    setInvoicesPayments(
      invoicesPayments.map((ip) =>
        ip.invoice_id === invoiceId
          ? { ...ip, amount_applied: numAmount }
          : ip
      )
    );
  };

  const totalApplied = invoicesPayments.reduce((sum, ip) => sum + ip.amount_applied, 0);
  const unappliedAmount = parseFloat(totalAmount) - totalApplied || 0;

  const handleSave = async () => {
    if (!selectedCustomerId) {
      alert("Please select a customer");
      return;
    }

    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    if (!referenceNumber.trim()) {
      alert("Please enter a reference number");
      return;
    }

    if (invoicesPayments.length === 0) {
      alert("Please apply payment to at least one invoice");
      return;
    }

    try {
      setSaving(true);

      const paymentData = {
        customer_id: selectedCustomerId,
        payment_date: new Date(paymentDate).toISOString(),
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        amount: parseFloat(totalAmount),
        invoices_paid: invoicesPayments.map((ip) => ({
          invoice_id: ip.invoice_id,
          amount_applied: ip.amount_applied,
        })),
        deposit_to: depositTo,
        memo: memo,
      };

      await axios.post("/api/ar/payments", paymentData);

      alert("Payment recorded successfully!");
      router.push("/finance/payments");
    } catch (error: any) {
      console.error("Error recording payment:", error);
      alert(error.response?.data?.detail || "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="h-8 w-8 text-green-600" />
          Record Customer Payment
        </h1>
        <p className="text-gray-600 mt-2">Apply payment to one or more invoices</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Details Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a customer...</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="cheque">Cheque</option>
                  <option value="eft">EFT</option>
                  <option value="ach">ACH</option>
                  <option value="e_transfer">E-Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number *
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Cheque #, Transaction ID, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Total Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Payment Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Deposit To */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit To
                </label>
                <select
                  value={depositTo}
                  onChange={(e) => setDepositTo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="undeposited_funds">Undeposited Funds</option>
                  <option value="checking_account">Checking Account</option>
                  <option value="savings_account">Savings Account</option>
                </select>
              </div>

              {/* Memo */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Memo (Optional)
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={2}
                  placeholder="Additional notes..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Apply to Invoices */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Apply to Invoices</h2>

            {!selectedCustomerId ? (
              <p className="text-gray-500 text-center py-8">
                Please select a customer to view their outstanding invoices
              </p>
            ) : loading ? (
              <p className="text-gray-500 text-center py-8">Loading invoices...</p>
            ) : (
              <>
                {/* Available Invoices */}
                {customerInvoices.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Available Invoices
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {customerInvoices.map((invoice) => (
                        <div
                          key={invoice._id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {invoice.invoice_number}
                            </p>
                            <p className="text-sm text-gray-600">
                              Balance: ${invoice.balance.toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() => addInvoice(invoice)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            <Plus className="h-4 w-4" />
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Applied Payments */}
                {invoicesPayments.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Payment Application
                    </h3>
                    <div className="space-y-3">
                      {invoicesPayments.map((ip) => (
                        <div
                          key={ip.invoice_id}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{ip.invoice_number}</p>
                            <p className="text-sm text-gray-600">
                              Balance: ${ip.balance.toFixed(2)}
                            </p>
                          </div>
                          <div className="w-32">
                            <input
                              type="number"
                              step="0.01"
                              value={ip.amount_applied}
                              onChange={(e) =>
                                updateAmountApplied(ip.invoice_id, e.target.value)
                              }
                              max={ip.balance}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                          <button
                            onClick={() => removeInvoice(ip.invoice_id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No invoices selected. Add invoices from the available list above.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !selectedCustomerId || invoicesPayments.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              {saving ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Summary</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Amount:</span>
                <span className="font-semibold text-gray-900">
                  ${parseFloat(totalAmount || "0").toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Applied to Invoices:</span>
                <span className="font-semibold text-green-600">
                  ${totalApplied.toFixed(2)}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Unapplied Amount:</span>
                  <span
                    className={`font-bold text-lg ${
                      Math.abs(unappliedAmount) < 0.01
                        ? "text-green-600"
                        : unappliedAmount > 0
                        ? "text-orange-600"
                        : "text-red-600"
                    }`}
                  >
                    ${unappliedAmount.toFixed(2)}
                  </span>
                </div>
                {Math.abs(unappliedAmount) > 0.01 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {unappliedAmount > 0
                      ? "This amount will be held as customer credit"
                      : "Applied amount exceeds payment total"}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2">Invoices Selected:</p>
                <p className="text-2xl font-bold text-blue-600">
                  {invoicesPayments.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
