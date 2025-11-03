"use client";

import { useState, useEffect } from "react";
import { FileText, Search, Filter, Download, Mail, Plus, DollarSign } from "lucide-react";
import axios from "axios";

interface Invoice {
  _id: string;
  invoice_number: string;
  customer_name: string;
  customer_id: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
  status: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      // Using existing invoices endpoint
      const response = await axios.get("/api/invoices");
      setInvoices(response.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices
    .filter((inv) => {
      const matchesSearch =
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus =
        statusFilter === "all" || inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === "amount") {
        return b.total - a.total;
      }
      if (sortBy === "due_date") {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return 0;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-300";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-300";
      case "partial":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "sent":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const statusCounts = {
    all: invoices.length,
    draft: invoices.filter((i) => i.status === "draft").length,
    sent: invoices.filter((i) => i.status === "sent").length,
    partial: invoices.filter((i) => i.status === "partial").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
    paid: invoices.filter((i) => i.status === "paid").length,
  };

  const totalOutstanding = invoices
    .filter((i) => ["sent", "overdue", "partial"].includes(i.status))
    .reduce((sum, i) => sum + (i.balance || 0), 0);

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            Invoices
          </h1>
          <p className="text-gray-600 mt-2">
            {invoices.length} total invoices | Outstanding: ${totalOutstanding.toFixed(2)}
          </p>
        </div>
        <a
          href="/invoices/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          New Invoice
        </a>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6 bg-white rounded-lg shadow p-2 flex flex-wrap gap-2">
        {[
          { value: "all", label: "All", count: statusCounts.all },
          { value: "draft", label: "Draft", count: statusCounts.draft },
          { value: "sent", label: "Sent", count: statusCounts.sent },
          { value: "partial", label: "Partial", count: statusCounts.partial },
          { value: "overdue", label: "Overdue", count: statusCounts.overdue },
          { value: "paid", label: "Paid", count: statusCounts.paid },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="mb-6 bg-white rounded-lg shadow p-4 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice # or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="due_date">Sort by Due Date</option>
          </select>

          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No invoices found</p>
            <p className="text-sm">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first invoice to get started"}
            </p>
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
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <a
                        href={`/invoices/${invoice._id}`}
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
                      {new Date(invoice.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-gray-900">
                      ${invoice.total?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-gray-900">
                      ${invoice.balance?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(
                          invoice.status
                        )}`}
                      >
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={`/invoices/${invoice._id}`}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Invoice"
                        >
                          <FileText className="h-5 w-5" />
                        </a>
                        {["sent", "overdue", "partial"].includes(invoice.status) && (
                          <button
                            className="text-green-600 hover:text-green-800"
                            title="Record Payment"
                          >
                            <DollarSign className="h-5 w-5" />
                          </button>
                        )}
                        {["draft", "sent", "overdue"].includes(invoice.status) && (
                          <button
                            className="text-gray-600 hover:text-gray-800"
                            title="Email Invoice"
                          >
                            <Mail className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
