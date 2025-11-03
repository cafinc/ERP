'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Calendar,
  RefreshCw,
  Download
} from 'lucide-react';

interface AgingBucket {
  count: number;
  amount: number;
  bills: Array<{
    bill_id: string;
    bill_number: string;
    vendor_name: string;
    amount_due: number;
    due_date: string;
    days_overdue: number;
  }>;
}

interface AgingData {
  current: AgingBucket;
  '1-30': AgingBucket;
  '31-60': AgingBucket;
  '61-90': AgingBucket;
  '90+': AgingBucket;
}

export default function AgingReportPage() {
  const router = useRouter();
  const [agingData, setAgingData] = useState<AgingData | null>(null);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);

  useEffect(() => {
    fetchAgingReport();
  }, []);

  const fetchAgingReport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/bills/aging');
      
      if (response.data.success) {
        setAgingData(response.data.aging);
        setTotalDue(response.data.total_due);
      }
    } catch (error) {
      console.error('Error fetching aging report:', error);
    } finally {
      setLoading(false);
    }
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

  const getChartData = () => {
    if (!agingData) return [];
    
    return [
      { name: 'Current', value: agingData.current.amount, count: agingData.current.count, color: '#10b981' },
      { name: '1-30 Days', value: agingData['1-30'].amount, count: agingData['1-30'].count, color: '#f59e0b' },
      { name: '31-60 Days', value: agingData['31-60'].amount, count: agingData['31-60'].count, color: '#ef4444' },
      { name: '61-90 Days', value: agingData['61-90'].amount, count: agingData['61-90'].count, color: '#dc2626' },
      { name: '90+ Days', value: agingData['90+'].amount, count: agingData['90+'].count, color: '#991b1b' }
    ].filter(item => item.value > 0);
  };

  const getBarChartData = () => {
    if (!agingData) return [];
    
    return [
      { name: 'Current', amount: agingData.current.amount, count: agingData.current.count },
      { name: '1-30', amount: agingData['1-30'].amount, count: agingData['1-30'].count },
      { name: '31-60', amount: agingData['31-60'].amount, count: agingData['31-60'].count },
      { name: '61-90', amount: agingData['61-90'].amount, count: agingData['61-90'].count },
      { name: '90+', amount: agingData['90+'].amount, count: agingData['90+'].count }
    ];
  };

  const getBucketBills = (bucketKey: string) => {
    if (!agingData) return [];
    return agingData[bucketKey as keyof AgingData]?.bills || [];
  };

  if (loading || !agingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
      </div>
    );
  }

  const chartData = getChartData();
  const barChartData = getBarChartData();

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Accounts Payable Aging Report"
        subtitle="Analyze outstanding bills by age"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Finance", href: "/finance" },
          { label: "Bills", href: "/finance/bills" },
          { label: "Aging Report" }
        ]}
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-xs text-gray-600 mb-1">Current</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(agingData.current.amount)}</p>
            <p className="text-xs text-gray-500 mt-1">{agingData.current.count} bills</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <p className="text-xs text-gray-600 mb-1">1-30 Days</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(agingData['1-30'].amount)}</p>
            <p className="text-xs text-gray-500 mt-1">{agingData['1-30'].count} bills</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
            <p className="text-xs text-gray-600 mb-1">31-60 Days</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(agingData['31-60'].amount)}</p>
            <p className="text-xs text-gray-500 mt-1">{agingData['31-60'].count} bills</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <p className="text-xs text-gray-600 mb-1">61-90 Days</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(agingData['61-90'].amount)}</p>
            <p className="text-xs text-gray-500 mt-1">{agingData['61-90'].count} bills</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-700">
            <p className="text-xs text-gray-600 mb-1">90+ Days</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(agingData['90+'].amount)}</p>
            <p className="text-xs text-gray-500 mt-1">{agingData['90+'].count} bills</p>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Total Outstanding</p>
              <p className="text-4xl font-bold">{formatCurrency(totalDue)}</p>
              <p className="text-sm opacity-90 mt-2">
                {Object.values(agingData).reduce((sum, bucket) => sum + bucket.count, 0)} total bills
              </p>
            </div>
            <DollarSign className="w-16 h-16 opacity-20" />
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aging Distribution</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No aging data available
              </div>
            )}
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Amount by Age</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="amount" fill="#3f72af" name="Amount ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Breakdown</h3>
          </div>
          
          <div className="p-6 space-y-6">
            {Object.entries(agingData).map(([key, bucket]) => {
              if (bucket.count === 0) return null;
              
              const bucketNames = {
                'current': 'Current (Not Yet Due)',
                '1-30': '1-30 Days Overdue',
                '31-60': '31-60 Days Overdue',
                '61-90': '61-90 Days Overdue',
                '90+': '90+ Days Overdue'
              };

              return (
                <div key={key} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setSelectedBucket(selectedBucket === key ? null : key)}
                    className="w-full p-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`w-5 h-5 ${
                        key === 'current' ? 'text-green-500' :
                        key === '1-30' ? 'text-yellow-500' :
                        key === '31-60' ? 'text-orange-500' :
                        'text-red-500'
                      }`} />
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">{bucketNames[key as keyof typeof bucketNames]}</p>
                        <p className="text-sm text-gray-600">{bucket.count} bills</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(bucket.amount)}</p>
                  </button>
                  
                  {selectedBucket === key && (
                    <div className="border-t">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bill #</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {bucket.bills.map((bill) => (
                            <tr key={bill.bill_id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">
                                <button
                                  onClick={() => router.push(`/finance/bills/${bill.bill_id}`)}
                                  className="text-[#3f72af] hover:text-[#2c5282] font-medium"
                                >
                                  {bill.bill_number}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{bill.vendor_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{formatDate(bill.due_date)}</td>
                              <td className="px-4 py-3 text-sm">
                                {bill.days_overdue > 0 ? (
                                  <span className="text-red-600">{bill.days_overdue} overdue</span>
                                ) : (
                                  <span className="text-green-600">Current</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {formatCurrency(bill.amount_due)}
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

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.push('/finance/bills')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back to Bills
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282]"
          >
            <Download className="w-5 h-5" />
            Print Report
          </button>
        </div>
      </div>
    </div>
  );
}
