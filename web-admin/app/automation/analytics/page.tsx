'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';
import api from '@/lib/api';
import {
  Activity,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  BarChart3,
  Calendar,
  RefreshCw,
  AlertCircle,
  PlayCircle,
  PauseCircle,
} from 'lucide-react';

interface WorkflowMetrics {
  workflow_id: string;
  workflow_name: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  average_duration: number;
  last_execution: string;
  success_rate: number;
}

interface ExecutionHistory {
  id: string;
  workflow_id: string;
  workflow_name: string;
  status: 'success' | 'failed' | 'running';
  started_at: string;
  completed_at?: string;
  duration?: number;
  result?: any;
  error?: string;
}

export default function AutomationAnalyticsPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<WorkflowMetrics[]>([]);
  const [executions, setExecutions] = useState<ExecutionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('all');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, selectedWorkflow]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [metricsRes, executionsRes] = await Promise.all([
        api.get('/automation/analytics/metrics', {
          params: {
            start_date: dateRange.start,
            end_date: dateRange.end,
            workflow_id: selectedWorkflow !== 'all' ? selectedWorkflow : undefined,
          }
        }),
        api.get('/automation/analytics/executions', {
          params: {
            start_date: dateRange.start,
            end_date: dateRange.end,
            workflow_id: selectedWorkflow !== 'all' ? selectedWorkflow : undefined,
            limit: 50,
          }
        })
      ]);

      setMetrics(metricsRes.data || []);
      setExecutions(executionsRes.data || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setMetrics([]);
      setExecutions([]);
      alert('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalExecutions = metrics.reduce((sum, m) => sum + m.total_executions, 0);
  const totalSuccessful = metrics.reduce((sum, m) => sum + m.successful_executions, 0);
  const totalFailed = metrics.reduce((sum, m) => sum + m.failed_executions, 0);
  const overallSuccessRate = totalExecutions > 0 ? (totalSuccessful / totalExecutions * 100).toFixed(1) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'running': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'running': return <PlayCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <HybridNavigationTopBar>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </HybridNavigationTopBar>
    );
  }

  return (
    <HybridNavigationTopBar>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        {/* Compact Header */}
        <CompactHeader
          title="Automation Analytics"
          icon={Activity}
          badges={[
            { label: `${totalExecutions} Total Runs`, color: 'blue' },
            { label: `${overallSuccessRate}% Success`, color: 'green' },
            { label: `${metrics.length} Workflows`, color: 'purple' },
          ]}
        />

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mx-6 mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Executions</p>
                <p className="text-3xl font-bold text-gray-900">{totalExecutions}</p>
                <p className="text-sm text-gray-500 mt-1">Last 7 days</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-xl">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Successful</p>
                <p className="text-3xl font-bold text-green-600">{totalSuccessful}</p>
                <p className="text-sm text-green-600 mt-1">↑ {overallSuccessRate}% rate</p>
              </div>
              <div className="bg-green-100 p-4 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-600">{totalFailed}</p>
                <p className="text-sm text-red-600 mt-1">{totalFailed > 0 ? 'Needs attention' : 'All clear'}</p>
              </div>
              <div className="bg-red-100 p-4 rounded-xl">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Duration</p>
                <p className="text-3xl font-bold text-purple-600">
                  {metrics.length > 0 ? (metrics.reduce((sum, m) => sum + m.average_duration, 0) / metrics.length).toFixed(1) : 0}s
                </p>
                <p className="text-sm text-gray-500 mt-1">Per execution</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-xl">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 bg-white rounded-xl shadow-lg border border-gray-200 mt-6 mx-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Date Range:</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <select
                value={selectedWorkflow}
                onChange={(e) => setSelectedWorkflow(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Workflows</option>
                {metrics.map((m) => (
                  <option key={m.workflow_id} value={m.workflow_id}>{m.workflow_name}</option>
                ))}
              </select>
              <button
                onClick={loadAnalytics}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Performance */}
        <div className="mx-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Workflow Performance</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <div
                key={metric.workflow_id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{metric.workflow_name}</h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    metric.success_rate >= 95 ? 'bg-green-100 text-green-700' :
                    metric.success_rate >= 80 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {metric.success_rate.toFixed(1)}%
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Runs:</span>
                    <span className="font-semibold text-gray-900">{metric.total_executions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Successful:</span>
                    <span className="font-semibold text-green-600">{metric.successful_executions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Failed:</span>
                    <span className="font-semibold text-red-600">{metric.failed_executions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Avg Duration:</span>
                    <span className="font-semibold text-gray-900">{metric.average_duration.toFixed(2)}s</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Run:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(metric.last_execution).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${metric.success_rate}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/automation/workflows/${metric.workflow_id}`)}
                  className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                >
                  View Details
                </button>
                
                <button
                  onClick={() => router.push(`/automation/workflows/${metric.workflow_id}/history`)}
                  className="mt-2 w-full px-4 py-2 bg-[#3f72af] hover:bg-[#2c5282] text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  Execution History
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Executions */}
        <div className="mx-6 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Executions</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {executions.length === 0 ? (
              <div className="p-8 text-center">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No execution history available for selected period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Workflow
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Started
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Result
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {executions.map((execution) => (
                      <tr key={execution.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{execution.workflow_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(execution.status)}`}>
                            {getStatusIcon(execution.status)}
                            {execution.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(execution.started_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {execution.duration ? `${execution.duration.toFixed(2)}s` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {execution.error ? (
                            <span className="text-red-600 truncate max-w-xs block">{execution.error}</span>
                          ) : execution.result ? (
                            <span className="text-green-600">Success</span>
                          ) : (
                            <span className="text-gray-400">Running...</span>
                          )}
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
    </HybridNavigationTopBar>
  );
}
