'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import CompactHeader from '@/components/CompactHeader';
import api from '@/lib/api';
import {
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Zap,
  Calendar,
  MousePointer,
  Webhook,
  Bell,
  Mail,
  MessageSquare,
  FileText,
  Package,
  Wrench,
  CheckSquare,
  Timer,
  AlertCircle,
  X,
} from 'lucide-react';

const triggerTypes = [
  { value: 'manual', label: 'Manual', icon: MousePointer, description: 'Trigger manually from UI' },
  { value: 'scheduled', label: 'Scheduled', icon: Calendar, description: 'Run on a schedule (cron)' },
  { value: 'event', label: 'Event', icon: Zap, description: 'Trigger on system events' },
  { value: 'webhook', label: 'Webhook', icon: Webhook, description: 'Trigger from external webhook' },
];

const actionTypes = [
  { value: 'send_notification', label: 'Send Notification', icon: Bell, color: 'blue' },
  { value: 'send_email', label: 'Send Email', icon: Mail, color: 'green' },
  { value: 'send_sms', label: 'Send SMS', icon: MessageSquare, color: 'purple' },
  { value: 'update_dispatch', label: 'Update Dispatch', icon: FileText, color: 'orange' },
  { value: 'create_invoice', label: 'Create Invoice', icon: FileText, color: 'red' },
  { value: 'deduct_consumables', label: 'Deduct Consumables', icon: Package, color: 'yellow' },
  { value: 'update_equipment', label: 'Update Equipment', icon: Wrench, color: 'gray' },
  { value: 'create_task', label: 'Create Task', icon: CheckSquare, color: 'teal' },
  { value: 'call_webhook', label: 'Call Webhook', icon: Webhook, color: 'indigo' },
  { value: 'delay', label: 'Delay', icon: Timer, color: 'pink' },
];

const systemEvents = [
  'dispatch_created',
  'dispatch_completed',
  'dispatch_cancelled',
  'geofence_entry',
  'geofence_exit',
  'estimate_sent',
  'project_started',
  'invoice_sent',
  'stock_below_threshold',
  'equipment_inspection_due',
];

export default function WorkflowEditorPage() {
  const router = useRouter();
  const params = useParams();
  const isEdit = params?.id;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Workflow data
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Trigger
  const [triggerType, setTriggerType] = useState('manual');
  const [triggerConfig, setTriggerConfig] = useState<any>({});
  
  // Actions
  const [actions, setActions] = useState<any[]>([]);
  const [showActionSelector, setShowActionSelector] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadWorkflow(isEdit as string);
    }
  }, [isEdit]);

  const loadWorkflow = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/custom-workflows/${id}`);
      const workflow = response.data;
      
      setName(workflow.name);
      setDescription(workflow.description);
      setEnabled(workflow.enabled);
      setTags(workflow.tags || []);
      setTriggerType(workflow.trigger.trigger_type);
      setTriggerConfig(workflow.trigger.config || {});
      setActions(workflow.actions || []);
    } catch (error) {
      console.error('Error loading workflow:', error);
      alert('Error loading workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a workflow name');
      return;
    }
    
    if (actions.length === 0) {
      alert('Please add at least one action');
      return;
    }
    
    try {
      setSaving(true);
      
      const workflowData = {
        name,
        description,
        enabled,
        tags,
        trigger: {
          trigger_type: triggerType,
          config: triggerConfig,
        },
        actions: actions.map((action, idx) => ({
          ...action,
          order: idx + 1,
        })),
      };
      
      if (isEdit) {
        await api.put(`/custom-workflows/${isEdit}`, workflowData);
        alert('Workflow updated successfully!');
      } else {
        await api.post('/custom-workflows', workflowData);
        alert('Workflow created successfully!');
      }
      
      router.push('/automation/workflows');
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Error saving workflow. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const addAction = (actionType: string) => {
    const actionDef = actionTypes.find(a => a.value === actionType);
    const newAction = {
      action_type: actionType,
      name: actionDef?.label || actionType,
      config: {},
      order: actions.length + 1,
      enabled: true,
    };
    setActions([...actions, newAction]);
    setShowActionSelector(false);
  };

  const updateAction = (index: number, field: string, value: any) => {
    const updated = [...actions];
    if (field.startsWith('config.')) {
      const configKey = field.replace('config.', '');
      updated[index].config[configKey] = value;
    } else {
      updated[index][field] = value;
    }
    setActions(updated);
  };

  const deleteAction = (index: number) => {
    setActions(actions.filter((_, idx) => idx !== index));
  };

  const moveAction = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= actions.length) return;
    
    const updated = [...actions];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setActions(updated);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const getActionIcon = (actionType: string) => {
    return actionTypes.find(a => a.value === actionType)?.icon || Bell;
  };

  const getActionColor = (actionType: string) => {
    return actionTypes.find(a => a.value === actionType)?.color || 'gray';
  };

  const colorClasses: any = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    teal: 'bg-teal-100 text-teal-700 border-teal-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    pink: 'bg-pink-100 text-pink-700 border-pink-200',
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading workflow...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
        <CompactHeader
          title={isEdit ? 'Edit Workflow' : 'Create Workflow'}
          icon={Zap}
          actions={[
            {
              label: 'Cancel',
              onClick: () => router.push('/automation/workflows'),
              variant: 'secondary',
            },
            {
              label: saving ? 'Saving...' : 'Save Workflow',
              icon: Save,
              onClick: handleSave,
              variant: 'primary',
              disabled: saving,
            },
          ]}
        />

        <div className="mx-6 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workflow Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Send customer arrival notification"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what this workflow does..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                  Enable workflow immediately
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add tags (press Enter)"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="ml-2">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trigger Configuration */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trigger Configuration</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {triggerTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => setTriggerType(type.value)}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      triggerType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${triggerType === type.value ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div className="text-sm font-medium text-gray-900">{type.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                  </button>
                );
              })}
            </div>

            {/* Trigger-specific config */}
            {triggerType === 'scheduled' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cron Schedule
                </label>
                <input
                  type="text"
                  value={triggerConfig.schedule || ''}
                  onChange={(e) => setTriggerConfig({ ...triggerConfig, schedule: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 0 7 * * * (7 AM daily)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use cron format: minute hour day month weekday
                </p>
              </div>
            )}

            {triggerType === 'event' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Event
                </label>
                <select
                  value={triggerConfig.event || ''}
                  onChange={(e) => setTriggerConfig({ ...triggerConfig, event: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select event...</option>
                  {systemEvents.map(event => (
                    <option key={event} value={event}>{event}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
              <button
                onClick={() => setShowActionSelector(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-600/90 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Action</span>
              </button>
            </div>

            {actions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <Zap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No actions added yet</p>
                <p className="text-sm text-gray-500">Click "Add Action" to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actions.map((action, index) => {
                  const Icon = getActionIcon(action.action_type);
                  const color = getActionColor(action.action_type);
                  
                  return (
                    <div key={index} className={`border-2 rounded-lg p-4 ${colorClasses[color]}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={action.name}
                              onChange={(e) => updateAction(index, 'name', e.target.value)}
                              className="font-medium text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-400 focus:outline-none"
                            />
                            <p className="text-xs opacity-75 capitalize">{action.action_type.replace('_', ' ')}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => moveAction(index, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-white rounded disabled:opacity-30"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveAction(index, 'down')}
                            disabled={index === actions.length - 1}
                            className="p-1 hover:bg-white rounded disabled:opacity-30"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteAction(index)}
                            className="p-1 hover:bg-white rounded text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Action Configuration */}
                      <div className="space-y-2 bg-white rounded p-3">
                        {action.action_type === 'send_notification' && (
                          <>
                            <input
                              type="text"
                              value={action.config.title || ''}
                              onChange={(e) => updateAction(index, 'config.title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              placeholder="Notification title"
                            />
                            <textarea
                              value={action.config.message || ''}
                              onChange={(e) => updateAction(index, 'config.message', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              rows={2}
                              placeholder="Message (use {{variable}} for dynamic content)"
                            />
                          </>
                        )}

                        {action.action_type === 'send_email' && (
                          <>
                            <input
                              type="email"
                              value={action.config.to_email || ''}
                              onChange={(e) => updateAction(index, 'config.to_email', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              placeholder="To email address"
                            />
                            <input
                              type="text"
                              value={action.config.subject || ''}
                              onChange={(e) => updateAction(index, 'config.subject', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              placeholder="Email subject"
                            />
                            <textarea
                              value={action.config.body || ''}
                              onChange={(e) => updateAction(index, 'config.body', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              rows={3}
                              placeholder="Email body"
                            />
                          </>
                        )}

                        {action.action_type === 'send_sms' && (
                          <>
                            <input
                              type="tel"
                              value={action.config.phone || ''}
                              onChange={(e) => updateAction(index, 'config.phone', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              placeholder="Phone number or {{variable}}"
                            />
                            <textarea
                              value={action.config.message || ''}
                              onChange={(e) => updateAction(index, 'config.message', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              rows={2}
                              placeholder="SMS message"
                            />
                          </>
                        )}

                        {action.action_type === 'delay' && (
                          <input
                            type="number"
                            value={action.config.seconds || 1}
                            onChange={(e) => updateAction(index, 'config.seconds', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            placeholder="Delay in seconds"
                            min="1"
                          />
                        )}

                        <p className="text-xs opacity-75">
                          💡 Use {`{{variable}}`} syntax for dynamic content
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Variable Syntax</p>
              <p>Use <code className="bg-blue-100 px-1 rounded">{`{{variable_name}}`}</code> in any text field to insert dynamic values like customer names, dispatch IDs, etc.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Selector Modal */}
      {showActionSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Select Action Type</h3>
                <button
                  onClick={() => setShowActionSelector(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {actionTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => addAction(type.value)}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-all"
                    >
                      <Icon className="w-6 h-6 text-gray-700 mb-2" />
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-xs text-gray-500 mt-1">Click to add</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
