'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  ArrowLeft,
  TrendingDown,
  Package,
  DollarSign,
  RefreshCw,
  Calendar,
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

  if (loading) {
    return (
      <PageHeader
        title="Analytics"
        subtitle="Manage analytics"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Consumables", href: "/consumables" }, { label: "Analytics" }]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </div>
    );
  }

  return (
    <PageHeader>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Consumables Analytics</h1>
            <p className="text-gray-600 mt-1">Usage patterns and cost analysis</p>
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Time Period:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-3">
                <Package className="w-6 h-6 text-[#3f72af]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{usage.length}</p>
                <p className="text-sm text-gray-600">Items Tracked</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-lg p-3">
                <TrendingDown className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalUsed.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total Units Used</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-3">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${totalCost.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total Cost</p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Usage Breakdown</h2>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Used</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {usage.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{item.consumable_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {item.total_used.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        ${item.total_cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className="bg-[#3f72af] h-2 rounded-full"
                              style={{ width: `${(item.total_cost / totalCost) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
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
