'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  FileText,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export default function FinanceDashboardPage() {
  const router = useRouter();
  
  // Mock financial data
  const [stats, setStats] = useState({
    revenue: {
      thisMonth: 45280,
      lastMonth: 38950,
      change: 16.3,
    },
    expenses: {
      thisMonth: 28340,
      lastMonth: 25120,
      change: 12.8,
    },
    profit: {
      thisMonth: 16940,
      lastMonth: 13830,
      change: 22.5,
    },
    outstanding: {
      total: 12450,
      overdue: 3200,
    },
    invoices: {
      paid: 24,
      pending: 8,
      overdue: 3,
    },
    cashFlow: 42890,
  });

  const recentTransactions = [
    {
      id: 'TXN-001',
      type: 'income',
      description: 'Invoice Payment - INV-2025-042',
      amount: 1250,
      date: '2025-01-20',
      customer: 'Acme Corp',
    },
    {
      id: 'TXN-002',
      type: 'expense',
      description: 'Fuel Purchase - Fleet',
      amount: -340,
      date: '2025-01-19',
      vendor: 'Shell Gas Station',
    },
    {
      id: 'TXN-003',
      type: 'income',
      description: 'Invoice Payment - INV-2025-038',
      amount: 2100,
      date: '2025-01-18',
      customer: 'City Plaza Management',
    },
    {
      id: 'TXN-004',
      type: 'expense',
      description: 'Equipment Maintenance',
      amount: -580,
      date: '2025-01-18',
      vendor: 'Heavy Duty Repairs',
    },
    {
      id: 'TXN-005',
      type: 'expense',
      description: 'Salt & De-icer Supply',
      amount: -1200,
      date: '2025-01-17',
      vendor: 'Winter Supplies Inc',
    },
  ];

  const upcomingPayments = [
    {
      id: 'PAY-001',
      invoice: 'INV-2025-045',
      customer: 'Riverside Mall',
      amount: 1850,
      dueDate: '2025-01-25',
      status: 'pending',
    },
    {
      id: 'PAY-002',
      invoice: 'INV-2025-041',
      customer: 'Downtown Office Complex',
      amount: 980,
      dueDate: '2025-01-23',
      status: 'pending',
    },
    {
      id: 'PAY-003',
      invoice: 'INV-2025-032',
      customer: 'Tech Park Inc',
      amount: 1370,
      dueDate: '2025-01-22',
      status: 'overdue',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Finance Dashboard"
        icon={<DollarSign size={28} />}
        subtitle="Financial overview, revenue tracking, and expense management"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Finance Dashboard" },
        ]}
      />
      
      <div className="p-6 space-y-6">

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mx-6 mt-6">
          {/* Revenue */}
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stats.revenue.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.revenue.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(stats.revenue.change)}%
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">${stats.revenue.thisMonth.toLocaleString()}</h3>
            <p className="text-sm text-gray-600 mt-1">Revenue This Month</p>
            <p className="text-xs text-gray-500 mt-2">vs ${stats.revenue.lastMonth.toLocaleString()} last month</p>
          </div>

          {/* Expenses */}
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stats.expenses.change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.expenses.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(stats.expenses.change)}%
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">${stats.expenses.thisMonth.toLocaleString()}</h3>
            <p className="text-sm text-gray-600 mt-1">Expenses This Month</p>
            <p className="text-xs text-gray-500 mt-2">vs ${stats.expenses.lastMonth.toLocaleString()} last month</p>
          </div>

          {/* Net Profit */}
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stats.profit.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.profit.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(stats.profit.change)}%
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">${stats.profit.thisMonth.toLocaleString()}</h3>
            <p className="text-sm text-gray-600 mt-1">Net Profit This Month</p>
            <p className="text-xs text-gray-500 mt-2">vs ${stats.profit.lastMonth.toLocaleString()} last month</p>
          </div>

          {/* Outstanding */}
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm font-medium text-orange-600">
                {stats.invoices.overdue} Overdue
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">${stats.outstanding.total.toLocaleString()}</h3>
            <p className="text-sm text-gray-600 mt-1">Accounts Receivable</p>
            <p className="text-xs text-red-600 mt-2">${stats.outstanding.overdue.toLocaleString()} overdue</p>
          </div>
        </div>

        {/* Quick Actions & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mx-6 mt-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/invoices')}
                className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
              >
                <Receipt className="w-5 h-5 text-[#3f72af]" />
                <span className="text-sm font-medium text-gray-900">View All Invoices</span>
              </button>
              <button
                onClick={() => router.push('/finance/expenses')}
                className="w-full flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left"
              >
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-gray-900">Track Expenses</span>
              </button>
              <button
                onClick={() => router.push('/finance/payments')}
                className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
              >
                <CreditCard className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Payment History</span>
              </button>
              <button
                onClick={() => router.push('/finance/reports')}
                className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
              >
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-900">Financial Reports</span>
              </button>
            </div>
          </div>

          {/* Invoice Status */}
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.invoices.paid}</p>
                    <p className="text-sm text-gray-600">Paid</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#3f72af]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.invoices.pending}</p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.invoices.overdue}</p>
                    <p className="text-sm text-gray-600">Overdue</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Payments */}
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Payments</h3>
            <div className="space-y-3">
              {upcomingPayments.map((payment) => (
                <div key={payment.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{payment.customer}</p>
                    <p className="text-xs text-gray-600">{payment.invoice}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      Due: {typeof window !== 'undefined' ? new Date(payment.dueDate).toLocaleDateString() : payment.dueDate}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-sm font-bold text-gray-900">${payment.amount}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      payment.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 mx-6 mt-6 hover:shadow-md transition-shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <button className="text-sm text-[#3f72af] hover:text-blue-700 font-medium">
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-600">
                        {transaction.type === 'income' ? transaction.customer : transaction.vendor}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
