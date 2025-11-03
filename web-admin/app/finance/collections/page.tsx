"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Send, Mail, Phone, FileText, Clock } from "lucide-react";
import axios from "axios";

interface OverdueInvoice {
  _id: string;
  invoice_number: string;
  customer_name: string;
  customer_id: string;
  balance: number;
  due_date: string;
  days_overdue: number;
  status: string;
}

export default function CollectionsPage() {
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([]);
  const [totalOverdue, setTotalOverdue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<OverdueInvoice | null>(null);
  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [showReminderModal, setShowReminderModal] = useState(false);

  useEffect(() => {
    fetchOverdueInvoices();
  }, []);

  const fetchOverdueInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/ar/overdue-invoices");
      
      if (response.data.success) {
        setOverdueInvoices(response.data.overdue_invoices);
        setTotalOverdue(response.data.total_overdue);
      }
    } catch (error) {
      console.error("Error fetching overdue invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const openReminderModal = (invoice: OverdueInvoice) => {
    setSelectedInvoice(invoice);
    setReminderEmail("");
    setReminderMessage(
      `This is a friendly reminder that Invoice ${invoice.invoice_number} is now ${invoice.days_overdue} days overdue. Please remit payment at your earliest convenience.`
    );
    setShowReminderModal(true);
  };

  const sendReminder = async () => {
    if (!selectedInvoice || !reminderEmail) return;

    try {
      setSendingReminder(selectedInvoice._id);
      
      await axios.post(`/api/ar/invoices/${selectedInvoice._id}/send-reminder`, {
        to_email: reminderEmail,
        message: reminderMessage
      });

      alert("Payment reminder sent successfully!");
      setShowReminderModal(false);
      fetchOverdueInvoices();
    } catch (error) {
      console.error("Error sending reminder:", error);
      alert("Failed to send reminder. Please try again.");
    } finally {
      setSendingReminder(null);
    }
  };

  const getSeverityColor = (daysOverdue: number) => {
    if (daysOverdue >= 90) return "bg-red-100 border-red-500 text-red-800";
    if (daysOverdue >= 60) return "bg-orange-100 border-orange-500 text-orange-800";
    if (daysOverdue >= 30) return "bg-yellow-100 border-yellow-500 text-yellow-800";
    return "bg-gray-100 border-gray-500 text-gray-800";
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <AlertCircle className="h-8 w-8 text-red-600" />
          Collections - Overdue Invoices
        </h1>
        <p className="text-gray-600 mt-2">
          {overdueInvoices.length} overdue invoices | Total: ${totalOverdue.toFixed(2)}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
          <p className="text-sm font-semibold text-red-800 mb-2">Total Overdue</p>
          <p className="text-3xl font-bold text-red-900">${totalOverdue.toFixed(2)}</p>
        </div>
        
        <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6">
          <p className="text-sm font-semibold text-orange-800 mb-2">Invoices Count</p>
          <p className="text-3xl font-bold text-orange-900">{overdueInvoices.length}</p>
        </div>

        <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6">
          <p className="text-sm font-semibold text-purple-800 mb-2">Avg Days Overdue</p>
          <p className="text-3xl font-bold text-purple-900">
            {overdueInvoices.length > 0
              ? Math.round(
                  overdueInvoices.reduce((sum, inv) => sum + inv.days_overdue, 0) /
                    overdueInvoices.length
                )
              : 0}
          </p>
        </div>
      </div>

      {/* Overdue Invoices Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Overdue Invoices Requiring Action</h2>
        </div>

        {overdueInvoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No overdue invoices!</p>
            <p className="text-sm">All invoices are current or paid.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Days Overdue
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {overdueInvoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <a
                        href={`/finance/invoices/${invoice._id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {invoice.invoice_number}
                      </a>
                    </td>
                    <td className="px-4 py-4">
                      <a
                        href={`/customers/${invoice.customer_id}`}
                        className="text-gray-900 hover:text-blue-600"
                      >
                        {invoice.customer_name}
                      </a>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border-2 ${getSeverityColor(
                          invoice.days_overdue
                        )}`}
                      >
                        <Clock className="h-3 w-3" />
                        {invoice.days_overdue} days
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-gray-900">
                      ${invoice.balance.toFixed(2)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openReminderModal(invoice)}
                          disabled={sendingReminder === invoice._id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                          <Send className="h-4 w-4" />
                          {sendingReminder === invoice._id ? "Sending..." : "Remind"}
                        </button>
                        
                        <a
                          href={`/finance/invoices/${invoice._id}`}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                        >
                          <FileText className="h-4 w-4" />
                          View
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reminder Modal */}
      {showReminderModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Send Payment Reminder
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Invoice {selectedInvoice.invoice_number} - {selectedInvoice.customer_name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Recipient Email *
                </label>
                <input
                  type="email"
                  value={reminderEmail}
                  onChange={(e) => setReminderEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Invoice Details:</strong>
                </p>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>• Amount Due: ${selectedInvoice.balance.toFixed(2)}</p>
                  <p>• Days Overdue: {selectedInvoice.days_overdue}</p>
                  <p>• Original Due Date: {new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowReminderModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={sendReminder}
                disabled={!reminderEmail || sendingReminder === selectedInvoice._id}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {sendingReminder === selectedInvoice._id ? "Sending..." : "Send Reminder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
