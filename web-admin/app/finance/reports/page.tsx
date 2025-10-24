'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  DollarSign,
  Receipt,
  Calendar,
  Filter,
} from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');

  const reports = [
    {
      id: 1,
      title: 'Profit & Loss Statement',
      description: 'Comprehensive income statement showing revenue, expenses, and net profit',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      available: true,
    },
    {
      id: 2,
      title: 'Cash Flow Statement',
      description: 'Track cash inflows and outflows across operating, investing, and financing activities',
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-600',
      available: true,
    },
    {
      id: 3,
      title: 'Balance Sheet',
      description: 'Summary of assets, liabilities, and equity at a specific point in time',
      icon: <FileText className="w-4 h-4 mr-2" />,
      color: 'from-purple-500 to-pink-600',
      available: true,
    },
    {
      id: 4,
      title: 'Accounts Receivable Aging',
      description: 'Breakdown of outstanding invoices by age to manage collections',
      icon: Receipt,
      color: 'from-orange-500 to-yellow-600',
      available: true,
    },
    {
      id: 5,
      title: 'Expense Report by Category',
      description: 'Detailed breakdown of expenses across different categories',
      icon: BarChart3,
      color: 'from-red-500 to-orange-600',
      available: true,
    },
    {
      id: 6,
      title: 'Tax Summary Report',
      description: 'Summary of taxable income, deductions, and estimated tax liability',
      icon: <FileText className="w-4 h-4 mr-2" />,
      color: 'from-indigo-500 to-purple-600',
      available: true,
    },
    {
      id: 7,
      title: 'Project Profitability',
      description: 'Revenue vs expenses for each project to assess profitability',
      icon: TrendingUp,
      color: 'from-cyan-500 to-blue-600',
      available: true,
    },
    {
      id: 8,
      title: 'Customer Payment History',
      description: 'Track payment patterns and history for each customer',
      icon: Receipt,
      color: 'from-pink-500 to-rose-600',
      available: true,
    },
  ];

  const periods = [
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisQuarter', label: 'This Quarter' },
    { value: 'lastQuarter', label: 'Last Quarter' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'lastYear', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  return (
    <PageHeader>
      <PageHeader
        title="Financial Reports"
        subtitle="View financial analytics and reports"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Finance", href: "/finance/dashboard" }, { label: "Reports" }]}
        title="Financial Reports"
        subtitle="Generate and download comprehensive financial reports"
          />

      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        {/* Period Selector */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">Report Period:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {periods.map(period => (
                <option key={period.value} value={period.value}>{period.label}</option>
              ))}
            </select>
            {selectedPeriod === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${report.color} rounded-lg flex items-center justify-center mb-4`}>
                <report.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-[#3f72af] transition-colors">
                {report.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">{report.description}</p>
              
              <div className="flex gap-2">
                <button 
                  className="flex-1 px-3 py-1.5 text-sm bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  View
                </button>
                <button 
                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-sm p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
              <TrendingUp className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">$45,280</p>
            <p className="text-sm opacity-75 mt-1">This Month</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-sm p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Expenses</h3>
              <BarChart3 className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">$28,340</p>
            <p className="text-sm opacity-75 mt-1">This Month</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-sm p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Net Profit</h3>
              <DollarSign className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">$16,940</p>
            <p className="text-sm opacity-75 mt-1">This Month</p>
          </div>
        </div>
      </div>
    </PageHeader>
  );
}
