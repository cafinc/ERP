"use client";

import { useState, useEffect } from "react";
import { 
  DollarSign, 
  FileText, 
  AlertCircle, 
  TrendingUp, 
  Clock,
  Send,
  CreditCard
} from "lucide-react";
import axios from "axios";

interface ARMetrics {
  total_outstanding: number;
  invoices_count: number;
  overdue: {
    amount: number;
    count: number;
  };
  due_soon: {
    amount: number;
    count: number;
  };
  month_revenue: number;
  avg_days_to_pay: number;
}

export default function ARDashboard() {
  const [metrics, setMetrics] = useState<ARMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/ar/dashboard/metrics");
      
      if (response.data.success) {
        setMetrics(response.data.metrics);
      }
    } catch (error) {
      console.error("Error fetching AR metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="h-8 w-8 text-blue-600" />
          Accounts Receivable Dashboard
        </h1>
        <p className="text-gray-600 mt-2">Monitor outstanding invoices and collections</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Outstanding */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Outstanding</p>
              <p className="text-3xl font-bold">
                ${metrics?.total_outstanding.toFixed(2) || "0.00"}
              </p>
              <p className="text-blue-100 text-sm mt-2">
                {metrics?.invoices_count || 0} invoices
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-blue-200 opacity-80" />
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium mb-1">Overdue</p>
              <p className="text-3xl font-bold">
                ${metrics?.overdue.amount.toFixed(2) || "0.00"}
              </p>
              <p className="text-red-100 text-sm mt-2">
                {metrics?.overdue.count || 0} invoices
              </p>
            </div>
            <AlertCircle className="h-12 w-12 text-red-200 opacity-80" />
          </div>
        </div>

        {/* Due Soon */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium mb-1">Due in 7 Days</p>
              <p className="text-3xl font-bold">
                ${metrics?.due_soon.amount.toFixed(2) || "0.00"}
              </p>
              <p className="text-orange-100 text-sm mt-2">
                {metrics?.due_soon.count || 0} invoices
              </p>
            </div>
            <Clock className="h-12 w-12 text-orange-200 opacity-80" />
          </div>
        </div>

        {/* This Month Revenue */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">This Month Revenue</p>
              <p className="text-3xl font-bold">
                ${metrics?.month_revenue.toFixed(2) || "0.00"}
              </p>
              <p className="text-green-100 text-sm mt-2">Payments received</p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-200 opacity-80" />
          </div>
        </div>

        {/* Average Days to Pay */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">Avg Days to Pay</p>
              <p className="text-3xl font-bold">
                {metrics?.avg_days_to_pay.toFixed(1) || "0.0"}
              </p>
              <p className="text-purple-100 text-sm mt-2">days</p>
            </div>
            <Clock className="h-12 w-12 text-purple-200 opacity-80" />
          </div>
        </div>

        {/* Total Invoices */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium mb-1">Outstanding Invoices</p>
              <p className="text-3xl font-bold">
                {metrics?.invoices_count || 0}
              </p>
              <p className="text-indigo-100 text-sm mt-2">require attention</p>
            </div>
            <FileText className="h-12 w-12 text-indigo-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/finance/invoices"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all"
          >
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">View Invoices</p>
              <p className="text-sm text-gray-500">All invoices</p>
            </div>
          </a>

          <a
            href="/finance/ar-aging"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all"
          >
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <p className="font-medium text-gray-900">Aging Report</p>
              <p className="text-sm text-gray-500">View aging</p>
            </div>
          </a>

          <a
            href="/finance/payments"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all"
          >
            <DollarSign className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Record Payment</p>
              <p className="text-sm text-gray-500">New payment</p>
            </div>
          </a>

          <a
            href="/finance/collections"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all"
          >
            <Send className="h-6 w-6 text-orange-600" />
            <div>
              <p className="font-medium text-gray-900">Collections</p>
              <p className="text-sm text-gray-500">Overdue invoices</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
