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

            {/* Status Workflow */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['pending', 'in_progress', 'review', 'completed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={task.status === status}
                    className={`px-4 py-3 rounded-lg border font-medium text-sm transition-colors ${
                      task.status === status
                        ? 'bg-[#3f72af] text-white border-[#3f72af] cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-[#3f72af] hover:text-[#3f72af]'
                    }`}
                  >
                    {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Checklist */}
            {task.checklist && task.checklist.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Checklist ({task.checklist.filter(i => i.completed).length}/{task.checklist.length})
                </h3>
                <div className="space-y-3">
                  {task.checklist.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        item.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleChecklistToggle(item.id)}
                        className="w-5 h-5 text-[#3f72af] border-gray-300 rounded focus:ring-[#3f72af]"
                      />
                      <span className={`flex-1 ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {item.text}
                      </span>
                      {item.required && (
                        <span className="text-xs text-red-600 font-medium">Required</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comments ({comments.length})
              </h3>

              <div className="space-y-4 mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-10 h-10 bg-[#3f72af] rounded-full flex items-center justify-center text-white font-semibold">
                      {comment.user_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{comment.user_name}</span>
                        <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-gray-700">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                />
                <button
                  onClick={handleAddComment}
                  disabled={sendingComment || !newComment.trim()}
                  className="px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Photos */}
            {task.photos && task.photos.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Photos & Files ({task.photos.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {task.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo.url}
                        alt={photo.caption || 'Task photo'}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                        <a
                          href={photo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-full"
                        >
                          <Download className="w-4 h-4 text-gray-700" />
                        </a>
                      </div>
                      {photo.caption && (
                        <p className="text-xs text-gray-600 mt-1 truncate">{photo.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Time Tracking */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Time Tracking
              </h3>

              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#3f72af] mb-2">
                    {formatTime(elapsedTime)}
                  </div>
                  {!isTimerRunning ? (
                    <button
                      onClick={startTimer}
                      className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <PlayCircle className="w-5 h-5" />
                      Start Timer
                    </button>
                  ) : (
                    <button
                      onClick={stopTimer}
                      className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Pause className="w-5 h-5" />
                      Stop Timer
                    </button>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Estimated:</span>
                    <span className="font-semibold text-gray-900">
                      {task.estimated_hours || 0} hrs
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Actual:</span>
                    <span className="font-semibold text-gray-900">
                      {task.actual_hours || 0} hrs
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900">{formatDate(task.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Updated:</span>
                  <span className="text-gray-900">{formatDate(task.updated_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span className="text-gray-900">{formatDate(task.due_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Assigned By:</span>
                  <span className="text-gray-900">{task.assigned_by_name}</span>
                </div>
              </div>
            </div>

            {/* Assigned To */}
            {task.assigned_to && task.assigned_to.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Assigned To
                </h3>
                <div className="space-y-2">
                  {task.assigned_to.map((assignment, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-[#3f72af] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {assignment.name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-gray-900">{assignment.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Relations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Records</h3>
              <div className="space-y-2 text-sm">
                {task.site_id && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Building2 className="w-4 h-4" />
                    <span>Site linked</span>
                  </div>
                )}
                {task.customer_id && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="w-4 h-4" />
                    <span>Customer linked</span>
                  </div>
                )}
                {task.service_ids && task.service_ids.length > 0 && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Wrench className="w-4 h-4" />
                    <span>{task.service_ids.length} service(s)</span>
                  </div>
                )}
                {task.equipment_ids && task.equipment_ids.length > 0 && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Package className="w-4 h-4" />
                    <span>{task.equipment_ids.length} equipment item(s)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Log */}
            {task.activities && task.activities.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activity Log
                </h3>
                <div className="space-y-3">
                  {task.activities.slice(0, 5).map((activity, index) => (
                    <div key={index} className="text-sm">
                      <p className="text-gray-900 font-medium">{activity.user_name}</p>
                      <p className="text-gray-600">{activity.action}</p>
                      <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
