'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  Zap,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Play,
  Pause,
  Settings,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

interface Workflow {
  name: string;
  description: string;
  required_context: string[];
  steps?: string[];
  trigger_types?: string[];
}

interface WorkflowStatus {
  workflow_name: string;
  last_execution: string;
  status: 'success' | 'error' | 'running';
  executions_today: number;
  success_rate: number;
}

export default function AutomationDashboardPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Record<string, Workflow>>({});
  const [automationStatus, setAutomationStatus] = useState<any>(null);
  const [workflowStats, setWorkflowStats] = useState<WorkflowStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<{name: string; data: Workflow} | null>(null);

  useEffect(() => {
    loadAutomationData();
  }, []);

  const loadAutomationData = async () => {
    try {
      setLoading(true);
      
      // Load workflows
      const workflowsRes = await api.get('/automation/workflows');
      setWorkflows(workflowsRes.data);
      
      // Load automation status
      const statusRes = await api.get('/automation/status');
      setAutomationStatus(statusRes.data);
      
      // Generate mock stats (in production, these would come from database)
      const stats: WorkflowStatus[] = Object.keys(workflowsRes.data).map(name => ({
        workflow_name: name,
        last_execution: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        status: Math.random() > 0.1 ? 'success' : 'error',
        executions_today: Math.floor(Math.random() * 50),
        success_rate: 85 + Math.random() * 15,
      }));
      setWorkflowStats(stats);
      
    } catch (error) {
      console.error('Error loading automation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerWorkflow = async (workflowName: string) => {
    try {
      // For demo, use empty context
      const context = {};
      await api.post(`/automation/trigger/${workflowName}`, context);
      alert(`Workflow "${workflowName}" triggered successfully!`);
      loadAutomationData();
    } catch (error) {
      console.error('Error triggering workflow:', error);
      alert('Error triggering workflow. Check console for details.');
    }
  };

  const getWorkflowIcon = (name: string) => {
    const icons: Record<string, any> = {
      service_completion: CheckCircle,
      customer_communication: Activity,
      equipment_maintenance: Settings,
      weather_operations: TrendingUp,
      safety_compliance: AlertCircle,
      inventory_management: BarChart3,
    };
    return icons[name] || Zap;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'running': return 'text-[#3f72af] bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      );
  }

  const totalExecutions = workflowStats.reduce((sum, w) => sum + w.executions_today, 0);
  const avgSuccessRate = workflowStats.reduce((sum, w) => sum + w.success_rate, 0) / workflowStats.length;

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <PageHeader
        title="Automation Dashboard"
        subtitle="Configure automated workflows and triggers"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Automation" }]}
          
          actions={[
            {
              label: 'Analytics',
              icon: <BarChart3 className="w-4 h-4 mr-2" />,
              onClick: () => router.push('/automation/analytics'),
              variant: 'primary',
            },
            {
              label: 'Manage Workflows',
              icon: Settings,
              onClick: () => router.push('/automation/workflows'),
              variant: 'secondary',
            },
            {
              label: 'Refresh',
              icon: RefreshCw,
              onClick: loadAutomationData,
              variant: 'secondary',
            },
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 mx-6">
          <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Workflows</p>
                <p className="text-2xl font-bold text-gray-900">{automationStatus?.workflows_registered || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Zap className="w-6 h-6 text-[#3f72af]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Executions Today</p>
                <p className="text-2xl font-bold text-gray-900">{totalExecutions}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{avgSuccessRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Time Saved Today</p>
                <p className="text-2xl font-bold text-gray-900">5.2h</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mx-6">
          {Object.entries(workflows).map(([name, workflow]) => {
            const Icon = getWorkflowIcon(name);
            const stats = workflowStats.find(s => s.workflow_name === name);
            
            return (
              <div key={name} className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="w-5 h-5 text-[#3f72af]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                {stats && (
                  <div className="grid grid-cols-3 gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600">Executions</p>
                      <p className="text-lg font-semibold text-gray-900">{stats.executions_today}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Success Rate</p>
                      <p className="text-lg font-semibold text-gray-900">{stats.success_rate.toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Status</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(stats.status)}`}>
                        {stats.status}
                      </span>
                    </div>
                  </div>
                )}

                {/* Steps/Triggers */}
                <div className="mb-3">
                  {workflow.steps && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{workflow.steps.length} automated steps:</span>
                      <ul className="mt-1 ml-4 space-y-0.5">
                        {workflow.steps.slice(0, 3).map((step, idx) => (
                          <li key={idx} className="text-xs">• {step}</li>
                        ))}
                        {workflow.steps.length > 3 && (
                          <li className="text-xs text-[#3f72af]">+ {workflow.steps.length - 3} more...</li>
                        )}
                      </ul>
                    </div>
                  )}
                  {workflow.trigger_types && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{workflow.trigger_types.length} trigger types</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => triggerWorkflow(name)}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Trigger Now</span>
                  </button>
                  <button
                    onClick={() => setSelectedWorkflow({name: workflowName, data: workflow})}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Activity className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="mt-6 mx-6">
          <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Recent Activity</span>
            </h3>
            <div className="space-y-3">
              {workflowStats.slice(0, 5).map((stat, idx) => {
                const workflow = workflows[stat.workflow_name];
                const Icon = getWorkflowIcon(stat.workflow_name);
                const timeAgo = Math.floor((Date.now() - new Date(stat.last_execution).getTime()) / 60000);
                
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getStatusColor(stat.status)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{workflow?.name}</p>
                        <p className="text-xs text-gray-600">{timeAgo} minutes ago</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stat.status)}`}>
                      {stat.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
}
