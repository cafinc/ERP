'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar,
  RefreshCw,
  Trash2
} from 'lucide-react';

interface Bill {
  _id: string;
  bill_number: string;
  vendor_id: string;
  vendor_name: string;
  bill_date: string;
  due_date: string;
  payment_terms: string;
  total: number;
  amount_paid: number;
  amount_due: number;
  status: string;
  created_at: string;
}

export default function BillsPage() {
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({start: '', end: ''});

  useEffect(() => {
    fetchBills();
  }, [statusFilter]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status_filter', statusFilter);
      }
      
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);
      
      const response = await api.get(`/api/bills?${params.toString()}`);
      
      if (response.data.success) {
        setBills(response.data.bills);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
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
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
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
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = 
      bill.bill_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.vendor_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const totalOutstanding = filteredBills.reduce((sum, bill) => sum + bill.amount_due, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PageHeader
          title="Bills"
          subtitle="Manage vendor bills and payments"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Finance", href: "/finance" },
            { label: "Bills" }
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Bills"
        subtitle="Manage vendor bills and payments"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Finance", href: "/finance" },
          { label: "Bills" }
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Outstanding</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalOutstanding)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bills</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{filteredBills.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved Bills</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {filteredBills.filter(b => b.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue Bills</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {filteredBills.filter(b => b.status === 'overdue').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search bills by number or vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>

              <button
                onClick={() => router.push('/finance/bills/create')}
                className="flex items-center gap-2 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Bill
              </button>

              <button
                onClick={fetchBills}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p>No bills found</p>
                      <button
                        onClick={() => router.push('/finance/bills/create')}
                        className="mt-4 text-[#3f72af] hover:text-[#2c5282] font-medium"
                      >
                        Create your first bill
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => {
                    const daysUntilDue = getDaysUntilDue(bill.due_date);
                    const isOverdue = daysUntilDue < 0;
                    const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 7;

                    return (
                      <tr key={bill._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{bill.bill_number}</div>
                          <div className="text-xs text-gray-500">{bill.payment_terms}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{bill.vendor_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(bill.bill_date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900">{formatDate(bill.due_date)}</span>
                            {isOverdue && bill.status !== 'paid' && (
                              <span className="text-xs text-red-600 font-medium">
                                {Math.abs(daysUntilDue)} days overdue
                              </span>
                            )}
                            {isDueSoon && bill.status === 'approved' && (
                              <span className="text-xs text-orange-600 font-medium">
                                Due in {daysUntilDue} days
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(bill.total)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(bill.amount_due)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(bill.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => router.push(`/finance/bills/${bill._id}`)}
                            className="text-[#3f72af] hover:text-[#2c5282] mr-3"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
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

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/finance/bills/unpaid')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Unpaid Bills</h3>
            <p className="text-sm text-gray-600">View all bills awaiting payment</p>
          </button>

          <button
            onClick={() => router.push('/finance/bills/aging')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Aging Report</h3>
            <p className="text-sm text-gray-600">View accounts payable aging analysis</p>
          </button>

          <button
            onClick={() => router.push('/finance/ap-dashboard')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">AP Dashboard</h3>
            <p className="text-sm text-gray-600">View comprehensive AP metrics</p>
          </button>
        </div>
      </div>
    </div>
  );
}
