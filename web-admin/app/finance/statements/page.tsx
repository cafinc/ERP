"use client";

import { useState, useEffect } from "react";
import { FileText, Download, Mail, Search, Calendar, User } from "lucide-react";
import axios from "axios";

interface Customer {
  _id: string;
  name: string;
  email: string;
}

interface StatementData {
  customer: {
    name: string;
    email: string;
    address: string;
  };
  statement_date: string;
  period_start: string;
  period_end: string;
  opening_balance: number;
  invoices: Array<{
    date: string;
    invoice_number: string;
    description: string;
    amount: number;
    balance: number;
  }>;
  payments: Array<{
    date: string;
    reference: string;
    amount: number;
    balance: number;
  }>;
  closing_balance: number;
  aging: {
    current: number;
    days_1_30: number;
    days_31_60: number;
    days_61_90: number;
    days_over_90: number;
  };
}

export default function CustomerStatementsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [periodStart, setPeriodStart] = useState(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  );
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split("T")[0]);
  const [statementData, setStatementData] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get("/api/customers");
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const generateStatement = async () => {
    if (!selectedCustomerId) {
      alert("Please select a customer");
      return;
    }

    try {
      setLoading(true);
      setGenerating(true);

      // Fetch customer details
      const customerResponse = await axios.get(`/api/customers/${selectedCustomerId}`);
      const customer = customerResponse.data;

      // Fetch invoices for the period
      const invoicesResponse = await axios.get("/api/invoices");
      const customerInvoices = invoicesResponse.data.filter(
        (inv: any) =>
          new Date(inv.date) >= new Date(periodStart) &&
          new Date(inv.date) <= new Date(periodEnd)
      );

      // Fetch payments for the period
      const paymentsResponse = await axios.get("/api/customer-payments");
      const customerPayments = (paymentsResponse.data || []).filter(
        (pay: any) =>
          pay.customer_id === selectedCustomerId &&
          new Date(pay.payment_date) >= new Date(periodStart) &&
          new Date(pay.payment_date) <= new Date(periodEnd)
      );

      // Calculate aging from current outstanding invoices
      const outstandingInvoices = invoicesResponse.data.filter(
        (inv: any) => ["sent", "overdue", "partial"].includes(inv.status) && inv.balance > 0
      );

      const aging = {
        current: 0,
        days_1_30: 0,
        days_31_60: 0,
        days_61_90: 0,
        days_over_90: 0,
      };

      const today = new Date();
      outstandingInvoices.forEach((inv: any) => {
        const dueDate = new Date(inv.due_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysOverdue < 0) {
          aging.current += inv.balance;
        } else if (daysOverdue <= 30) {
          aging.days_1_30 += inv.balance;
        } else if (daysOverdue <= 60) {
          aging.days_31_60 += inv.balance;
        } else if (daysOverdue <= 90) {
          aging.days_61_90 += inv.balance;
        } else {
          aging.days_over_90 += inv.balance;
        }
      });

      // Build statement data
      const statement: StatementData = {
        customer: {
          name: customer.name,
          email: customer.email,
          address: customer.address || "N/A",
        },
        statement_date: new Date().toISOString(),
        period_start: periodStart,
        period_end: periodEnd,
        opening_balance: 0, // Would calculate from previous period
        invoices: customerInvoices.map((inv: any) => ({
          date: inv.date,
          invoice_number: inv.invoice_number,
          description: `Invoice ${inv.invoice_number}`,
          amount: inv.total,
          balance: inv.balance || 0,
        })),
        payments: customerPayments.map((pay: any) => ({
          date: pay.payment_date,
          reference: pay.reference_number,
          amount: pay.amount,
          balance: 0, // Running balance would be calculated
        })),
        closing_balance: outstandingInvoices.reduce(
          (sum: number, inv: any) => sum + (inv.balance || 0),
          0
        ),
        aging,
      };

      setStatementData(statement);
    } catch (error) {
      console.error("Error generating statement:", error);
      alert("Failed to generate statement");
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const exportToPDF = () => {
    // In production, this would generate a PDF using a library like jsPDF
    alert("PDF export functionality would be implemented here");
  };

  const emailStatement = () => {
    if (!statementData) return;
    alert(`Statement would be emailed to ${statementData.customer.email}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-8 w-8 text-blue-600" />
          Customer Statements
        </h1>
        <p className="text-gray-600 mt-2">Generate account statements for customers</p>
      </div>

      {/* Statement Generator */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Statement</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Customer *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a customer...</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period Start */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Period Start *
            </label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Period End */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Period End *
            </label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <button
          onClick={generateStatement}
          disabled={!selectedCustomerId || generating}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? "Generating..." : "Generate Statement"}
        </button>
      </div>

      {/* Statement Preview */}
      {statementData && (
        <div className="bg-white rounded-lg shadow">
          {/* Actions Bar */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Statement Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              <button
                onClick={emailStatement}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
            </div>
          </div>

          {/* Statement Content */}
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Statement</h1>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-900">{statementData.customer.name}</p>
                  <p className="text-gray-600">{statementData.customer.email}</p>
                  <p className="text-gray-600">{statementData.customer.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600">
                    Statement Date: {new Date(statementData.statement_date).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600">
                    Period: {new Date(statementData.period_start).toLocaleDateString()} -{" "}
                    {new Date(statementData.period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Summary */}
            <div className="mb-8 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Opening Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${statementData.opening_balance.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Activity</p>
                  <p className="text-2xl font-bold text-blue-600">
                    $
                    {(
                      statementData.invoices.reduce((sum, inv) => sum + inv.amount, 0) -
                      statementData.payments.reduce((sum, pay) => sum + pay.amount, 0)
                    ).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Closing Balance</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${statementData.closing_balance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Transactions */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Transaction History</h3>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">
                      Charges
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">
                      Payments
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Invoices */}
                  {statementData.invoices.map((inv, index) => (
                    <tr key={`inv-${index}`}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {new Date(inv.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{inv.description}</td>
                      <td className="px-4 py-2 text-sm text-right font-semibold text-red-600">
                        ${inv.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2 text-sm text-right font-semibold text-gray-900">
                        ${inv.balance.toFixed(2)}
                      </td>
                    </tr>
                  ))}

                  {/* Payments */}
                  {statementData.payments.map((pay, index) => (
                    <tr key={`pay-${index}`}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {new Date(pay.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        Payment - {pay.reference}
                      </td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2 text-sm text-right font-semibold text-green-600">
                        ${pay.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-semibold text-gray-900">
                        ${pay.balance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Aging Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Aging Summary</h3>
              <div className="grid grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Current</p>
                  <p className="text-lg font-bold text-green-600">
                    ${statementData.aging.current.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">1-30 Days</p>
                  <p className="text-lg font-bold text-yellow-600">
                    ${statementData.aging.days_1_30.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">31-60 Days</p>
                  <p className="text-lg font-bold text-orange-600">
                    ${statementData.aging.days_31_60.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">61-90 Days</p>
                  <p className="text-lg font-bold text-red-600">
                    ${statementData.aging.days_61_90.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Over 90 Days</p>
                  <p className="text-lg font-bold text-purple-600">
                    ${statementData.aging.days_over_90.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
