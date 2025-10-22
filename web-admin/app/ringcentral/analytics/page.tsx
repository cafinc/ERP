'use client';

import { useState, useEffect } from 'react';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import api from '@/lib/api';
import {
  BarChart3,
  TrendingUp,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  RefreshCw,
  Calendar,
  Users,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7);
  const [summary, setSummary] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ringcentral/analytics/summary', {
        params: { days: timeRange },
      });
      setSummary(response.data);

      // Fetch timeline data
      const today = new Date();
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - timeRange);

      const timelineResponse = await api.post('/ringcentral/analytics/timeline', {
        time_from: pastDate.toISOString(),
        time_to: today.toISOString(),
        time_frame: 'Day',
      });

      // Process timeline data for charts
      const processedData = timelineResponse.data.data?.map((item: any) => ({
        date: new Date(item.timeInterval?.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        calls: item.callsCount || 0,
      })) || [];

      setTimelineData(processedData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <HybridNavigationTopBar>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Call Analytics</h1>
            <p className="text-gray-600">View call statistics and performance metrics</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              onClick={fetchAnalytics}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Total Calls</p>
                <p className="text-3xl font-bold text-gray-900">
                  {summary?.total_calls || 0}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <PhoneIncoming className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Inbound Calls</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <PhoneOutgoing className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Outbound Calls</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Avg Duration</p>
                <p className="text-3xl font-bold text-gray-900">0:00</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Call Volume Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Call Volume Trend</span>
                </h3>
                {timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="calls" fill="#3B82F6" name="Calls" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-400">
                    <p>No data available</p>
                  </div>
                )}
              </div>

              {/* Call Distribution */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Call Distribution</span>
                </h3>
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  <p>No data available</p>
                </div>
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Indicators</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm text-gray-600 mb-1">Answer Rate</p>
                  <p className="text-2xl font-bold text-gray-900">0%</p>
                  <p className="text-sm text-gray-500 mt-1">Target: 85%</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm text-gray-600 mb-1">Service Level</p>
                  <p className="text-2xl font-bold text-gray-900">0%</p>
                  <p className="text-sm text-gray-500 mt-1">Target: 80%</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="text-sm text-gray-600 mb-1">Abandonment Rate</p>
                  <p className="text-2xl font-bold text-gray-900">0%</p>
                  <p className="text-sm text-gray-500 mt-1">Target: &lt; 5%</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </HybridNavigationTopBar>
  );
}
