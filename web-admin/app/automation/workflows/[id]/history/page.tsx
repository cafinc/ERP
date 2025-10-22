'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import CompactHeader from '@/components/CompactHeader';
import api from '@/lib/api';
import {
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Zap,
  RefreshCw,
  Eye,
} from 'lucide-react';

interface ExecutionStep {
  step_name: string;
  status: 'success' | 'failed' | 'running' | 'pending';
  started_at?: string;
  completed_at?: string;
  duration?: number;
  input?: any;
  output?: any;
  error?: string;
}

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  workflow_name: string;
  status: 'success' | 'failed' | 'running';
  started_at: string;
  completed_at?: string;
  duration?: number;
  trigger: string;
  steps: ExecutionStep[];
  result?: any;
  error?: string;
  metadata?: any;
}

export default function WorkflowHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const workflowId = params.id as string;

  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [expandedExecution, setExpandedExecution] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [workflowName, setWorkflowName] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadExecutions();
  }, [workflowId, dateRange]);

  const loadExecutions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/automation/workflows/${workflowId}/executions`, {
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end,
          limit: 100,
        }
      });

      setExecutions(response.data.executions || []);
      setWorkflowName(response.data.workflow_name || 'Workflow');
    } catch (error) {
      console.error('Error loading executions:', error);
      setExecutions([]);
      setWorkflowName('Workflow');
      alert('Failed to load execution history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running': return <PlayCircle className="w-5 h-5 text-[#3f72af]" />;
      case 'pending': return <Clock className="w-5 h-5 text-gray-400" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-700 border-green-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      case 'running': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getTriggerBadge = (trigger: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-700',
      manual: 'bg-purple-100 text-purple-700',
      webhook: 'bg-green-100 text-green-700',
      event: 'bg-orange-100 text-orange-700',
    };
    return colors[trigger as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <HybridNavigationTopBar>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </HybridNavigationTopBar>
    );
  }

  return (
    <HybridNavigationTopBar>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        {/* Header */}
        <CompactHeader
          title={`${workflowName} - Execution History`}
          icon={Activity}
          badges={[
            { label: `${executions.length} Executions`, color: 'blue' },
            { label: `${executions.filter(e => e.status === 'success').length} Successful`, color: 'green' },
            { label: `${executions.filter(e => e.status === 'failed').length} Failed`, color: 'red' },
          ]}
          actions={[
            {
              label: 'Back to Analytics',
              icon: ArrowLeft,
              onClick: () => router.push('/automation/analytics'),
              variant: 'secondary',
            },
            {
              label: 'Refresh',
              icon: RefreshCw,
              onClick: loadExecutions,
              variant: 'secondary',
            },
          ]}
        />

        {/* Date Range Filter */}
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
            </div>
          </div>
        </div>

        {/* Execution Timeline */}
        <div className="mx-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Execution Timeline</h2>
          
          {executions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No executions found for the selected period</p>
            </div>
          ) : (
            <div className="space-y-4">
              {executions.map((execution) => (
                <div
                  key={execution.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Execution Header */}
                  <div
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedExecution(expandedExecution === execution.id ? null : execution.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Expand Icon */}
                        <button className="mt-1 text-gray-400 hover:text-gray-600">
                          {expandedExecution === execution.id ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>

                        {/* Status Icon */}
                        <div className="mt-1">
                          {getStatusIcon(execution.status)}
                        </div>

                        {/* Execution Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Execution #{execution.id.substring(0, 8)}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                              {execution.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTriggerBadge(execution.trigger)}`}>
                              {execution.trigger}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(execution.started_at).toLocaleString()}</span>
                            </div>
                            {execution.duration && (
                              <div className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                <span>{execution.duration.toFixed(2)}s</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Activity className="w-4 h-4" />
                              <span>{execution.steps.length} steps</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedExecution === execution.id && (
                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                      {/* Steps Timeline */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Execution Steps</h4>
                        
                        {execution.steps.map((step, index) => (
                          <div key={index} className="relative pl-8">
                            {/* Timeline Line */}
                            {index < execution.steps.length - 1 && (
                              <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gray-300" />
                            )}

                            {/* Step Card */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                              <div className="flex items-start gap-3">
                                {/* Step Status Icon */}
                                <div className="absolute left-0 top-4">
                                  {getStatusIcon(step.status)}
                                </div>

                                {/* Step Content */}
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-semibold text-gray-900">{step.step_name}</h5>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                                      {step.status}
                                    </span>
                                  </div>

                                  {step.duration && (
                                    <p className="text-sm text-gray-600 mb-2">
                                      Duration: {step.duration.toFixed(2)}s
                                    </p>
                                  )}

                                  {step.error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                                      <p className="text-sm text-red-700 font-medium">Error:</p>
                                      <p className="text-sm text-red-600 mt-1">{step.error}</p>
                                    </div>
                                  )}

                                  {step.output && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                      <p className="text-sm text-green-700 font-medium mb-1">Output:</p>
                                      <pre className="text-xs text-green-600 overflow-x-auto">
                                        {JSON.stringify(step.output, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Final Result or Error */}
                      {execution.error && (
                        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                              <p className="font-semibold text-red-900 mb-1">Execution Failed</p>
                              <p className="text-sm text-red-700">{execution.error}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {execution.result && execution.status === 'success' && (
                        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-semibold text-green-900 mb-2">Execution Completed Successfully</p>
                              <pre className="text-xs text-green-700 overflow-x-auto">
                                {JSON.stringify(execution.result, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </HybridNavigationTopBar>
  );
}
