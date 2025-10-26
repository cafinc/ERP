'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  Package,
  DollarSign,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  Download,
} from 'lucide-react';

interface UsageData {
  consumable_name: string;
  total_used: number;
  unit: string;
  total_cost: number;
}

export default function ConsumablesAnalyticsPage() {
  const router = useRouter();
  const [usage, setUsage] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/consumable-usage');
      const usageData = response.data || [];
      
      // Group by consumable
      const grouped = usageData.reduce((acc: any, item: any) => {
        const key = item.consumable_id;
        if (!acc[key]) {
          acc[key] = {
            consumable_name: item.consumable_name || 'Unknown',
            total_used: 0,
            unit: item.unit || 'units',
            total_cost: 0,
          };
        }
        acc[key].total_used += item.quantity_used || 0;
        acc[key].total_cost += (item.quantity_used || 0) * (item.unit_cost || 0);
        return acc;
      }, {});
      
      setUsage(Object.values(grouped));
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalUsed = usage.reduce((sum, item) => sum + item.total_used, 0);
  const totalCost = usage.reduce((sum, item) => sum + item.total_cost, 0);
  const topItems = [...usage].sort((a, b) => b.total_cost - a.total_cost).slice(0, 5);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Consumable', 'Total Used', 'Unit', 'Total Cost', '% of Total Cost'];
    const rows = usage.map(item => [
      item.consumable_name,
      item.total_used.toFixed(2),
      item.unit,
      item.total_cost.toFixed(2),
      ((item.total_cost / totalCost) * 100).toFixed(1) + '%',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `consumables_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <PageHeader
          title="Consumables Analytics"
          subtitle="Usage patterns and cost analysis"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Consumables", href: "/consumables" },
            { label: "Analytics" }
          ]}
        />
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <PageHeader
        title="Consumables Analytics"
        subtitle="Usage patterns and cost analysis"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Consumables", href: "/consumables" },
          { label: "Analytics" }
        ]}
        actions={[
          {
            label: 'Export',
            icon: <Download className="w-4 h-4 mr-2" />,
            onClick: exportToCSV,
            variant: 'secondary',
          },
          {
            label: 'Back',
            icon: <ArrowLeft className="w-4 h-4 mr-2" />,
            onClick: () => router.back(),
            variant: 'secondary',
          },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Date Filter */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-[#3f72af]" />
            <span className="text-sm font-medium text-gray-700">Time Period:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-xl p-3">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{usage.length}</p>
            <p className="text-sm text-gray-600">Items Tracked</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-xl p-3">
                <TrendingDown className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-green-600 text-sm font-semibold flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                12%
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{totalUsed.toFixed(0)}</p>
            <p className="text-sm text-gray-600">Total Units Used</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-xl p-3">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-green-600 text-sm font-semibold flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                8%
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">${totalCost.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Cost</p>
          </div>
        </div>

        {/* Top 5 Consumables Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PieChart className="w-6 h-6 text-[#3f72af]" />
              Top 5 Consumables by Cost
            </h2>
          </div>
          
          {topItems.length > 0 ? (
            <div className="space-y-4">
              {topItems.map((item, index) => {
                const percentage = (item.total_cost / totalCost) * 100;
                const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'];
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">{item.consumable_name}</span>
                      <span className="text-sm font-bold text-gray-900">${item.total_cost.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${colors[index]} h-3 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{item.total_used.toFixed(1)} {item.unit}</span>
                      <span>{percentage.toFixed(1)}% of total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">No usage data available</p>
            </div>
          )}
        </div>

        {/* Usage Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Detailed Usage Breakdown</h2>
          </div>

          {usage.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900">No Usage Data</p>
              <p className="text-sm text-gray-600 mt-2">Usage data will appear here once consumables are tracked</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Total Used</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Unit</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Total Cost</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {usage.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{item.consumable_name}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        {item.total_used.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {item.unit}
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-semibold">
                        ${item.total_cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2.5 max-w-[120px]">
                            <div
                              className="bg-gradient-to-r from-[#3f72af] to-[#2c5282] h-2.5 rounded-full transition-all"
                              style={{ width: `${(item.total_cost / totalCost) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 min-w-[45px]">
                            {((item.total_cost / totalCost) * 100).toFixed(1)}%
                          </span>
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
    </div>
  );
}
