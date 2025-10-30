'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import { Receipt, Eye, Download, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

export default function CustomerInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadInvoices();
  }, [filter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const userResponse = await api.get('/auth/me');
      const customerId = userResponse.data.id;
      
      const params = new URLSearchParams({ customer_id: customerId });
      if (filter !== 'all') params.append('status', filter);
      
      const response = await api.get(`/invoices?${params.toString()}`);
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string, isOverdue: boolean) => {
    if (isOverdue) return 'bg-red-100 text-red-800 border-red-200';
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'unpaid': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'paid' || status === 'cancelled') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Invoices"
        subtitle="Manage invoices"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Customer Portal", href: "/customer-portal" }, { label: "Invoices" }]}
        title="My Invoices"
        description="View and pay your invoices"
          />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow shadow-sm border border-gray-200 p-4 mb-6 hover:shadow-md transition-shadow">
          <div className="flex gap-2">
            {['all', 'unpaid', 'paid', 'overdue'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div></div>

        {/* Invoices List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow shadow-sm border border-gray-200 p-12 text-center hover:shadow-md transition-shadow">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow shadow-sm border border-gray-200 p-12 text-center hover:shadow-md transition-shadow">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-600">You don't have any invoices yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {invoices.map((invoice) => {
              const overdue = isOverdue(invoice.due_date, invoice.status);
              return (
                <div
                  key={invoice._id || invoice.id}
                  className="bg-white rounded-lg shadow shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Receipt className="w-5 h-5" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {invoice.invoice_number || `INV-${(invoice._id || invoice.id)?.slice(-6)}`}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Issued: {new Date(invoice.created_at).toLocaleDateString()}
                      </p>
                      {invoice.due_date && (
                        <p className={`text-sm ${
                          overdue ? 'text-red-600 font-semibold' : 'text-gray-600'
                        }`}>
                          Due: {new Date(invoice.due_date).toLocaleDateString()}
                          {overdue && ' (OVERDUE)'}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      getStatusColor(invoice.status, overdue)
                    }`}>
                      {overdue ? 'OVERDUE' : invoice.status?.toUpperCase() || 'UNPAID'}
                    </span>
                  </div>

                  {invoice.description && (
                    <p className="text-gray-600 text-sm mb-4">{invoice.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-gray-900">
                        ${invoice.total_amount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => router.push(`/invoices/${invoice._id || invoice.id}`)}
                        className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      {invoice.status === 'unpaid' && (
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Pay Now
                        </button>
                      )}
                    </div></div></div>
              );
            })}
          </div>
        )}
      </div></div>
  );
}
