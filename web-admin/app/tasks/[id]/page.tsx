'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  CheckCircle2,
  Clock,
  PlayCircle,
  Pause,
  MessageSquare,
  Paperclip,
  Building2,
  Users,
  Wrench,
  FileText,
  Package,
  Calendar,
  DollarSign,
  Activity,
  Send,
  Image as ImageIcon,
  Download,
  Trash2,
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  billable: boolean;
  
  site_id?: string;
  customer_id?: string;
  work_order_id?: string;
  service_ids: string[];
  form_ids: string[];
  equipment_ids: string[];
  
  assigned_to: any[];
  assigned_by_name: string;
  
  checklist: any[];
  photos: any[];
  time_entries: any[];
  activities: any[];
  
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Edit form data
  const [editForm, setEditForm] = useState<any>({});
  
  // Comments
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  
  // Time tracking
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (taskId) {
      fetchTask();
      fetchComments();
    }
  }, [taskId]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStartTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerStartTime]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tasks/${taskId}`);
      setTask(response.data);
      setEditForm(response.data);
    } catch (error) {
      console.error('Error fetching task:', error);
      alert('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/tasks/${taskId}/comments`);
      setComments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;
    
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTask({ ...task, status: newStatus });
      fetchTask(); // Refresh to get updated activities
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/tasks/${taskId}`, editForm);
      setTask(editForm);
      setEditing(false);
      fetchTask(); // Refresh to get updated activities
    } catch (error: any) {
      console.error('Error saving task:', error);
      alert(error.response?.data?.detail || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleChecklistToggle = async (itemId: string) => {
    if (!task) return;
    
    const updatedChecklist = task.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    
    try {
      await api.put(`/tasks/${taskId}`, { checklist: updatedChecklist });
      setTask({ ...task, checklist: updatedChecklist });
    } catch (error) {
      console.error('Error updating checklist:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setSendingComment(true);
      await api.post(`/tasks/${taskId}/comments`, {
        text: newComment,
        user_name: 'Current User', // TODO: Get from auth context
      });
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setSendingComment(false);
    }
  };

  const startTimer = () => {
    setTimerStartTime(new Date());
    setIsTimerRunning(true);
    setElapsedTime(0);
  };

  const stopTimer = async () => {
    if (!timerStartTime) return;
    
    const hours = elapsedTime / 3600;
    
    try {
      await api.post(`/tasks/${taskId}/time-entry`, {
        start_time: timerStartTime.toISOString(),
        end_time: new Date().toISOString(),
        hours,
        billable: task?.billable || true,
      });
      
      setIsTimerRunning(false);
      setTimerStartTime(null);
      setElapsedTime(0);
      fetchTask(); // Refresh to get updated time entries
    } catch (error) {
      console.error('Error saving time entry:', error);
      alert('Failed to save time entry');
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-700 bg-gray-50 border-gray-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-700 bg-green-50 border-green-200';
      case 'in_progress': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'pending': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'review': return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'cancelled': return 'text-gray-700 bg-gray-50 border-gray-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f72af]"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Task Not Found</h2>
          <button
            onClick={() => router.push('/tasks')}
            className="px-6 py-3 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={task.title}
        subtitle={`Task #${task.id.slice(0, 8)}`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Tasks', href: '/tasks' },
          { label: task.title.substring(0, 30) + '...' },
        ]}
        actions={[
          {
            label: editing ? 'Cancel' : 'Edit',
            onClick: () => {
              if (editing) {
                setEditForm(task);
              }
              setEditing(!editing);
            },
            icon: editing ? <X className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />,
            variant: 'secondary' as const,
          },
          {
            label: 'Back',
            onClick: () => router.push('/tasks'),
            icon: <ArrowLeft className="w-4 h-4 mr-2" />,
            variant: 'secondary' as const,
          },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
                {editing && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                    <p className="text-gray-900">{task.description || 'No description provided'}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${getPriorityColor(task.priority)}`}>
                      Priority: {task.priority}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${getStatusColor(task.status)}`}>
                      Status: {task.status.replace('_', ' ')}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border border-gray-200 bg-gray-50 text-gray-700">
                      Type: {task.type.replace('_', ' ')}
                    </span>
                    {task.billable && (
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border border-green-200 bg-green-50 text-green-700">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Billable
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status Workflow - Continued in next message */}
          </div>
        </div>
      </div>
    </div>
  );
}
