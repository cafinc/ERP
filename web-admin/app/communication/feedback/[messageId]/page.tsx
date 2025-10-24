'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import {
  ArrowLeft,
  Save,
  User,
  Calendar,
  AlertCircle,
  ArrowUpCircle,
  MinusCircle,
  ArrowDownCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Users,
} from 'lucide-react';

interface FeedbackMessage {
  id: string;
  type: string;
  status: 'pending' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  content: string;
  from_user_id: string;
  from_user_name: string;
  to_user_id?: string;
  assigned_crew_id?: string;
  assigned_crew_name?: string;
  admin_response?: string;
  crew_feedback?: string;
  resolution_notes?: string;
  created_at: string;
  admin_responded_at?: string;
  resolved_at?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  active: boolean;
}

export default function FeedbackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin, isCrew } = useAuth();
  const messageId = params.messageId as string;

  const [message, setMessage] = useState<FeedbackMessage | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Admin form fields
  const [adminResponse, setAdminResponse] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedCrewId, setSelectedCrewId] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');

  // Crew form fields
  const [crewFeedback, setCrewFeedback] = useState('');

  useEffect(() => {
    fetchMessage();
    if (isAdmin) {
      fetchTeamMembers();
    }
  }, [messageId]);

  const fetchMessage = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/messages/${messageId}`);
      const data = response.data;
      setMessage(data);
      setAdminResponse(data.admin_response || '');
      setResolutionNotes(data.resolution_notes || '');
      setSelectedCrewId(data.assigned_crew_id || '');
      setNewStatus(data.status);
    } catch (error) {
      console.error('Error fetching message:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await api.get('/users');
      setTeamMembers(response.data.filter((u: any) => u.role === 'crew' || u.role === 'admin'));
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleAdminUpdate = async () => {
    try {
      setSubmitting(true);
      await api.put(`/messages/${messageId}`, {
        status: newStatus,
        admin_response: adminResponse,
        resolution_notes: resolutionNotes,
        assigned_crew_id: selectedCrewId || undefined,
      });
      alert('Message updated successfully!');
      await fetchMessage();
    } catch (error) {
      console.error('Error updating message:', error);
      alert('Failed to update message');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCrewAcknowledge = async () => {
    try {
      setSubmitting(true);
      await api.post(`/messages/${messageId}/acknowledge`, {
        crew_feedback: crewFeedback,
      });
      alert('Task acknowledged successfully!');
      await fetchMessage();
    } catch (error) {
      console.error('Error acknowledging task:', error);
      alert('Failed to acknowledge task');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-gray-600 bg-gray-100';
      case 'low': return 'text-gray-500 bg-gray-50';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-6 h-6" />;
      case 'high': return <ArrowUpCircle className="w-6 h-6" />;
      case 'medium': return <MinusCircle className="w-6 h-6" />;
      case 'low': return <ArrowDownCircle className="w-6 h-6" />;
      default: return <MessageSquare className="w-6 h-6" />;
    }
  };

  if (loading) {
    return (
      <PageHeader
        title="Feedback Details"
        subtitle="View and manage details"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Communication", href: "/communication" }, { label: "Feedback", href: "/communication/feedback" }, { label: "Details" }]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f72af] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading feedback...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <PageHeader>
        <div className="p-8">
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Feedback not found</p>
            <button
              onClick={() => router.push('/communication')}
              className="mt-4 px-6 py-2 bg-[#3f72af] hover:bg-[#2c5282] text-white rounded-lg font-medium transition-colors"
            >
              Back to Communication Center
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageHeader>
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center space-x-4">
            <button
              onClick={() => router.push('/communication')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Feedback Details</h1>
              <p className="text-gray-600 mt-1">Review and respond to feedback</p>
            </div>
          </div>

          {/* Message Info Card */}
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-4 mb-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${getPriorityColor(message.priority)}`}>
                  {getPriorityIcon(message.priority)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{message.title}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>From: {message.from_user_name}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(message.created_at).toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(message.status)}`}>
                {message.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Message Content:</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>

          {/* Admin Response Section */}
          {isAdmin && (
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-4 mb-4 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Admin Response</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Crew Member
                  </label>
                  <select
                    value={selectedCrewId}
                    onChange={(e) => setSelectedCrewId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Not assigned</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response Message
                  </label>
                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    rows={4}
                    placeholder="Enter your response to the customer..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Notes (Internal)
                  </label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={3}
                    placeholder="Internal notes about how this was resolved..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleAdminUpdate}
                  disabled={submitting}
                  className="flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#2c5282] disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  <Save className="w-5 h-5" />
                  <span>{submitting ? 'Saving...' : 'Save Response'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Crew Acknowledgment Section */}
          {isCrew && message.assigned_crew_id === user?.id && (
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Crew Acknowledgment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Feedback
                  </label>
                  <textarea
                    value={crewFeedback}
                    onChange={(e) => setCrewFeedback(e.target.value)}
                    rows={4}
                    placeholder="Acknowledge this task and provide any feedback..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleCrewAcknowledge}
                  disabled={submitting}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>{submitting ? 'Submitting...' : 'Acknowledge Task'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Timeline */}
          {(message.admin_responded_at || message.resolved_at) && (
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-4 mt-6 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Created</p>
                    <p className="text-sm text-gray-600">{new Date(message.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {message.admin_responded_at && (
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-[#3f72af] mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Admin Responded</p>
                      <p className="text-sm text-gray-600">{new Date(message.admin_responded_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {message.resolved_at && (
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Resolved</p>
                      <p className="text-sm text-gray-600">{new Date(message.resolved_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
