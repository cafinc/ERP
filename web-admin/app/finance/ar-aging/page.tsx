"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Download, FileText } from "lucide-react";
import axios from "axios";

interface AgingInvoice {
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  balance: number;
  due_date: string;
  days_overdue: number;
}

interface AgingBucket {
  count: number;
  amount: number;
  invoices: AgingInvoice[];
}

interface AgingData {
  current: AgingBucket;
  "1-30": AgingBucket;
  "31-60": AgingBucket;
  "61-90": AgingBucket;
  "90+": AgingBucket;
}

export default function ARAgingReport() {
  const [aging, setAging] = useState<AgingData | null>(null);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [asOfDate, setAsOfDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedBucket, setExpandedBucket] = useState<string | null>(null);

  useEffect(() => {
    fetchAgingReport();
  }, []);

  const fetchAgingReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/ar/aging");
      
      if (response.data.success) {
        setAging(response.data.aging);
        setTotalOutstanding(response.data.total_outstanding);
        setAsOfDate(response.data.as_of_date);
      }
    } catch (error) {
      console.error("Error fetching aging report:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!aging) return;

    let csv = "Aging Bucket,Customer,Invoice Number,Days Overdue,Balance\n";
    
    Object.entries(aging).forEach(([bucket, data]) => {
      data.invoices.forEach((inv) => {
        csv += `"${bucket}","${inv.customer_name}","${inv.invoice_number}",${inv.days_overdue},${inv.balance}\n`;
      });
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ar-aging-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const buckets = [
    { key: "current", label: "Current", color: "bg-green-100 border-green-300 text-green-800" },
    { key: "1-30", label: "1-30 Days", color: "bg-yellow-100 border-yellow-300 text-yellow-800" },
    { key: "31-60", label: "31-60 Days", color: "bg-orange-100 border-orange-300 text-orange-800" },
    { key: "61-90", label: "61-90 Days", color: "bg-red-100 border-red-300 text-red-800" },
    { key: "90+", label: "90+ Days", color: "bg-purple-100 border-purple-300 text-purple-800" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="h-8 w-8 text-red-600" />
            Accounts Receivable Aging Report
          </h1>
          <p className="text-gray-600 mt-2">
            As of {new Date(asOfDate).toLocaleDateString()} | Total Outstanding: ${totalOutstanding.toFixed(2)}
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {buckets.map((bucket) => {
          const data = aging?.[bucket.key as keyof AgingData];
          const percentage = totalOutstanding > 0 
            ? ((data?.amount || 0) / totalOutstanding * 100).toFixed(1)
            : "0.0";

          return (
            <div
              key={bucket.key}
              className={`${bucket.color} rounded-lg shadow p-4 border-2`}
            >
              <p className="text-sm font-semibold mb-2">{bucket.label}</p>
              <p className="text-2xl font-bold">${data?.amount.toFixed(2) || "0.00"}</p>
              <p className="text-xs mt-1">
                {data?.count || 0} invoices ({percentage}%)
              </p>
            </div>
          );
        })}
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Detailed Breakdown</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {buckets.map((bucket) => {
            const data = aging?.[bucket.key as keyof AgingData];
            const isExpanded = expandedBucket === bucket.key;

            return (
              <div key={bucket.key}>
                {/* Bucket Header */}
                <button
                  onClick={() => setExpandedBucket(isExpanded ? null : bucket.key)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${bucket.color}`}></div>
                    <span className="font-semibold text-gray-900">{bucket.label}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-sm text-gray-600">{data?.count || 0} invoices</span>
                    <span className="text-lg font-bold text-gray-900">
                      ${data?.amount.toFixed(2) || "0.00"}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {/* Expanded Invoice List */}
                {isExpanded && data && data.invoices.length > 0 && (
                  <div className="bg-gray-50 p-4">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-600">
                          <th className="pb-2">Invoice #</th>
                          <th className="pb-2">Customer</th>
                          <th className="pb-2">Due Date</th>
                          <th className="pb-2">Days Overdue</th>
                          <th className="pb-2 text-right">Balance</th>
                          <th className="pb-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.invoices.map((invoice) => (
                          <tr key={invoice.invoice_id} className="text-sm">
                            <td className="py-2">{invoice.invoice_number}</td>
                            <td className="py-2">{invoice.customer_name}</td>
                            <td className="py-2">
                              {new Date(invoice.due_date).toLocaleDateString()}
                            </td>
                            <td className="py-2">
                              {invoice.days_overdue > 0 ? (
                                <span className="text-red-600 font-semibold">
                                  {invoice.days_overdue} days
                                </span>
                              ) : (
                                <span className="text-green-600">Current</span>
                              )}
                            </td>
                            <td className="py-2 text-right font-semibold">
                              ${invoice.balance.toFixed(2)}
                            </td>
                            <td className="py-2">
                              <a
                                href={`/finance/invoices/${invoice.invoice_id}`}
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <FileText className="h-4 w-4" />
                                View
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
