'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';
import api from '@/lib/api';
import {
  Plus,
  Play,
  Edit,
  Trash2,
  Copy,
  Zap,
  Clock,
  Calendar,
  MousePointer,
  Bell,
  Mail,
  MessageSquare,
  FileText,
  Package,
  Wrench,
  CheckSquare,
  Webhook,
  Timer,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  useEffect(() => {
    loadWorkflows();
    loadTemplates();
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await api.get('/custom-workflows');
      setWorkflows(response.data);
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await api.get('/workflow-templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCreateWorkflow = () => {
    router.push('/automation/workflows/create');
  };

  const handleEditWorkflow = (workflowId: string) => {
    router.push(`/automation/workflows/edit/${workflowId}`);
  };

  const handleDuplicateWorkflow = async (workflow: any) => {
    try {
      const duplicate = {
        ...workflow,
        name: `${workflow.name} (Copy)`,
      };
      delete duplicate.id;
      delete duplicate.created_at;
      delete duplicate.updated_at;
      delete duplicate.execution_count;
      delete duplicate.last_execution;
      
      await api.post('/custom-workflows', duplicate);
      alert('Workflow duplicated successfully!');
      loadWorkflows();
    } catch (error) {
      console.error('Error duplicating workflow:', error);
      alert('Error duplicating workflow');
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) {
      return;
    }
    
    try {
      await api.delete(`/custom-workflows/${workflowId}`);
      alert('Workflow deleted successfully!');
      loadWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('Error deleting workflow');
    }
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      await api.post(`/custom-workflows/${workflowId}/execute`, {});
      alert('Workflow executed successfully!');
    } catch (error) {
      console.error('Error executing workflow:', error);
      alert('Error executing workflow. Check console for details.');
    }
  };

  const handleToggleWorkflow = async (workflowId: string, currentState: boolean) => {
    try {
      await api.put(`/custom-workflows/${workflowId}`, {
        enabled: !currentState
      });
      loadWorkflows();
    } catch (error) {
      console.error('Error toggling workflow:', error);
    }
  };

  const handleUseTemplate = async (template: any) => {
    try {
      const workflow = {
        ...template,
        name: `${template.name} (from template)`,
      };
      
      await api.post('/custom-workflows', workflow);
      alert('Workflow created from template!');
      loadWorkflows();
    } catch (error) {
      console.error('Error creating workflow from template:', error);
      alert('Error creating workflow from template');
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    const icons = {
      manual: MousePointer,
      scheduled: Calendar,
      event: Zap,
      webhook: Webhook,
    };
    return icons[triggerType] || Zap;
  };

  const getActionIcon = (actionType: string) => {
    const icons = {
      send_notification: Bell,
      send_email: Mail,
      send_sms: MessageSquare,
      update_dispatch: FileText,
      create_invoice: FileText,
      deduct_consumables: Package,
      update_equipment: Wrench,
      create_task: CheckSquare,
      call_webhook: Webhook,
      delay: Timer,
    };
    return icons[actionType] || Zap;
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
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <CompactHeader
          title="Workflow Builder"
          icon={Zap}
          badges={[
            { label: `${workflows.length} Workflows`, color: 'blue' },
            { label: `${workflows.filter(w => w.enabled).length} Active`, color: 'green' },
          ]}
          actions={[
            {
              label: 'Create Workflow',
              icon: Plus,
              onClick: handleCreateWorkflow,
              variant: 'primary',
            },
          ]}
        />

        {/* Info Banner */}
        <div className="mx-6 mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Custom Workflow Builder</p>
            <p className="text-xs text-blue-700 mt-1">
              Create, edit, and manage custom automation workflows. Choose from templates or build from scratch.
            </p>
          </div>
        </div>

        {/* Templates Section */}
        {templates.length > 0 && workflows.length === 0 && (
          <div className="mx-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Get Started with Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{template.name}</h4>
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{template.actions.length} actions</span>
                    <span className="capitalize">{template.trigger.trigger_type} trigger</span>
                  </div>
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-600/90 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Workflows List */}
        <div className="mx-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Custom Workflows</h3>
          
          {workflows.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
              <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Custom Workflows Yet</h3>
              <p className="text-gray-600 mb-4">Create your first workflow to automate your operations</p>
              <button
                onClick={handleCreateWorkflow}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-600/90 text-white rounded-lg font-medium transition-colors"
              >
                Create Workflow
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {workflows.map((workflow) => {
                const TriggerIcon = getTriggerIcon(workflow.trigger?.trigger_type);
                
                return (
                  <div key={workflow.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{workflow.name}</h4>
                          {workflow.enabled ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                              Disabled
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{workflow.description}</p>
                      </div>
                    </div>

                    {/* Trigger Info */}
                    <div className="flex items-center space-x-2 mb-3 p-2 bg-blue-50 rounded-lg">
                      <TriggerIcon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900 capitalize">
                        {workflow.trigger?.trigger_type || 'manual'} Trigger
                      </span>
                    </div>

                    {/* Actions Preview */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-2">{workflow.actions?.length || 0} Actions:</p>
                      <div className="flex flex-wrap gap-2">
                        {(workflow.actions || []).slice(0, 4).map((action, idx) => {
                          const ActionIcon = getActionIcon(action.action_type);
                          return (
                            <div key={idx} className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                              <ActionIcon className="w-3 h-3" />
                              <span className="truncate max-w-[100px]">{action.name}</span>
                            </div>
                          );
                        })}
                        {(workflow.actions?.length || 0) > 4 && (
                          <span className="px-2 py-1 text-xs text-gray-500">
                            +{workflow.actions.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3 pb-3 border-b border-gray-200">
                      <span>Executions: {workflow.execution_count || 0}</span>
                      {workflow.last_execution && (
                        <span>Last: {new Date(workflow.last_execution).toLocaleDateString()}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleExecuteWorkflow(workflow.id)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-600/90 text-white rounded-lg text-sm font-medium transition-colors"
                        disabled={!workflow.enabled}
                      >
                        <Play className="w-4 h-4" />
                        <span>Run</span>
                      </button>
                      <button
                        onClick={() => handleEditWorkflow(workflow.id)}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicateWorkflow(workflow)}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleWorkflow(workflow.id, workflow.enabled)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          workflow.enabled
                            ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                        }`}
                        title={workflow.enabled ? 'Disable' : 'Enable'}
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                        className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </HybridNavigationTopBar>
  );
}
