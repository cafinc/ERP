'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';
import {
  CreditCard,
  Search,
  Filter,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  Receipt,
  DollarSign,
} from 'lucide-react';

interface Payment {
  id: string;
  date: string;
  invoice: string;
  customer: string;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
}

const mockPayments: Payment[] = [
  {
    id: 'PAY-001',
    date: '2025-01-20',
    invoice: 'INV-2025-042',
    customer: 'Acme Corp',
    amount: 1250,
    method: 'Credit Card',
    status: 'completed',
    reference: 'TXN-4829384729',
  },
  {
    id: 'PAY-002',
    date: '2025-01-18',
    invoice: 'INV-2025-038',
    customer: 'City Plaza Management',
    amount: 2100,
    method: 'Bank Transfer',
    status: 'completed',
    reference: 'WRE-3948573849',
  },
  {
    id: 'PAY-003',
    date: '2025-01-17',
    invoice: 'INV-2025-039',
    customer: 'Tech Park Inc',
    amount: 890,
    method: 'Check',
    status: 'pending',
    reference: 'CHK-8473',
  },
  {
    id: 'PAY-004',
    date: '2025-01-15',
    invoice: 'INV-2025-033',
    customer: 'Riverside Mall',
    amount: 1650,
    method: 'Credit Card',
    status: 'completed',
    reference: 'TXN-8374629847',
  },
  {
    id: 'PAY-005',
    date: '2025-01-14',
    invoice: 'INV-2025-031',
    customer: 'Downtown Office Complex',
    amount: 780,
    method: 'ACH',
    status: 'failed',
    reference: 'ACH-DECLINED',
  },
];

export default function PaymentsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const statusCounts = {
    all: mockPayments.length,
    completed: mockPayments.filter(p => p.status === 'completed').length,
    pending: mockPayments.filter(p => p.status === 'pending').length,
    failed: mockPayments.filter(p => p.status === 'failed').length,
  };

  const filteredPayments = mockPayments.filter(payment => {
    const matchesSearch = 
      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const totalPayments = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <HybridNavigationTopBar>
      <CompactHeader
        title="Payments"
        subtitle={`${filteredPayments.length} payment${filteredPayments.length !== 1 ? 's' : ''} • Total: $${totalPayments.toLocaleString()}`}
        icon={CreditCard}
        actions={
          <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        }
      />

      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              selectedStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All ({statusCounts.all})
          </button>
          <button
            onClick={() => setSelectedStatus('completed')}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              selectedStatus === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Completed ({statusCounts.completed})
          </button>
          <button
            onClick={() => setSelectedStatus('pending')}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              selectedStatus === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Pending ({statusCounts.pending})
          </button>
          <button
            onClick={() => setSelectedStatus('failed')}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              selectedStatus === 'failed'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Failed ({statusCounts.failed})
          </button>
        </div>

        {/* Payments List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                        onClick={() => router.push(`/invoices/${payment.invoice}`)}>
                      {payment.invoice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.customer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{payment.method}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 w-fit ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                        {payment.status === 'pending' && <Clock className="w-3 h-3" />}
                        {payment.status === 'failed' && <XCircle className="w-3 h-3" />}
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                      ${payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Total:</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                    ${totalPayments.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </HybridNavigationTopBar>
  );
}
