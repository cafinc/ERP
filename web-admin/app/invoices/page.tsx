'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import CustomerQuickViewModal from '@/components/CustomerQuickViewModal';
import api from '@/lib/api';
import {
  Plus,
  Search,
  Eye,
  FileText,
  DollarSign,
  Calendar,
  User,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Download,
  FileDown,
} from 'lucide-react';

interface Invoice {
  _id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  status: 'unpaid' | 'partially_paid' | 'paid' | 'overdue';
  issue_date: string;
  due_date: string;
  payment_terms: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/invoices');
      const invoiceData = Array.isArray(response.data) ? response.data : (response.data?.invoices || []);
      const validInvoices = invoiceData.filter((i: any) => i._id || i.id);
      setInvoices(validInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Invoice Number', 'Customer', 'Amount', 'Paid', 'Due', 'Status', 'Issue Date', 'Due Date'];
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number,
      inv.customer_name,
      inv.total_amount,
      inv.amount_paid,
      inv.amount_due,
      inv.status,
      new Date(inv.issue_date).toLocaleDateString(),
      new Date(inv.due_date).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    try {
      // For now, we'll download invoice data that can be used with PDF generation
      // In production, you'd want to use a library like jsPDF or call a backend endpoint
      alert('PDF export will be implemented with jsPDF library. For now, use CSV export.');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export PDF');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'partially_paid': return 'bg-blue-100 text-blue-700';
      case 'unpaid': return 'bg-yellow-100 text-yellow-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'partially_paid': return <Clock className="w-4 h-4" />;
      case 'unpaid': return <AlertCircle className="w-4 h-4" />;
      case 'overdue': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || invoice.status?.toLowerCase() === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Calculate summary statistics
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.amount_due || 0), 0);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      );
  }

  return (
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        {/* Compact Header */}
        <PageHeader
        title="Invoices"
        subtitle="Manage customer invoices and billing"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Finance", href: "/finance/dashboard" }, { label: "Invoices" }]}
        title="Invoices"
          
          actions={[
            {
              label: 'New Invoice',
              icon: <Plus className="w-4 h-4 mr-2" />,
              onClick: () => router.push('/invoices/create'),
              variant: 'primary',
            },
          ]}
        />

        {/* Status Filter Buttons */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-[#3f72af] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              All ({invoices.length})
            </button>
            <button
              onClick={() => setFilterStatus('unpaid')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'unpaid'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Unpaid ({invoices.filter(i => i.status?.toLowerCase() === 'unpaid').length})
            </button>
            <button
              onClick={() => setFilterStatus('partially_paid')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'partially_paid'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Partially Paid ({invoices.filter(i => i.status?.toLowerCase() === 'partially_paid').length})
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'paid'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Paid ({invoices.filter(i => i.status?.toLowerCase() === 'paid').length})
            </button>
            <button
              onClick={() => setFilterStatus('overdue')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'overdue'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Overdue ({invoices.filter(i => i.status?.toLowerCase() === 'overdue').length})
            </button>
            <div className="flex-1"></div>
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg px-3 py-1.5 flex items-center space-x-2 hover:shadow-md transition-shadow">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Total Paid:</span>
              <span className="text-lg font-bold text-green-600">
                ${totalPaid.toLocaleString()}
              </span>
            </div>
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg px-3 py-1.5 flex items-center space-x-2 hover:shadow-md transition-shadow">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Outstanding:</span>
              <span className="text-lg font-bold text-orange-600">
                ${totalOutstanding.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-3 mb-4 mx-6 mt-6 hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice number or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              title="Export to CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              title="Export to PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={loadInvoices}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-100 transition-all text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Invoices List */}
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-12 text-center hover:shadow-md transition-shadow">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Invoices Found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Get started by creating your first invoice'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <button
                onClick={() => router.push('/invoices/create')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create First Invoice</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Invoice #</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Paid</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Due</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Due Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice, index) => (
                    <tr key={invoice._id || invoice.id || `invoice-${index}`} className="hover:bg-gray-50 transition-colors hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{invoice.invoice_number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{invoice.customer_name}</span>
                          </div>
                          {invoice.customer_id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCustomerId(invoice.customer_id);
                              }}
                              className="ml-2 p-1 text-[#3f72af] hover:bg-blue-50 rounded-md transition-colors"
                              title="Quick View Customer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">
                          ${invoice.total_amount?.toLocaleString() || '0.00'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-green-600 font-medium">
                          ${invoice.amount_paid?.toLocaleString() || '0.00'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-orange-600 font-medium">
                          ${invoice.amount_due?.toLocaleString() || '0.00'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          <span>{invoice.status?.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => router.push(`/invoices/${invoice._id}`)}
                          className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* Customer Quick View Modal */}
      {selectedCustomerId && (
        <CustomerQuickViewModal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
    );
}
