'use client';

import PageHeader from '@/components/PageHeader';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  Shield,
  Truck,
  AlertCircle,
  RefreshCw,
  User,
  Calendar,
  FileText,
  Bell,
  Heart,
  MapPin,
  Clock,
  Download,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  title?: string;
  status: string;
  active: boolean;
  is_driver: boolean;
  messaging_enabled: boolean;
  driver_license_photo?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  documents?: Array<{
    name: string;
    url: string;
    type: string;
    uploaded_at: string;
  }>;
  notification_preferences?: any;
  created_at: string;
}

export default function TeamMemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = (Array.isArray(params?.id) ? params.id[0] : params?.id) as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (userId && userId !== 'undefined') {
      loadUser();
    }
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${userId}`);
      setUser(response.data);
    } catch (error) {
      console.error('Error loading user:', error);
      alert('Failed to load team member');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!confirm(`${user?.active ? 'Deactivate' : 'Activate'} this team member?`)) return;
    
    try {
      setActionLoading(true);
      await api.put(`/users/${userId}`, { active: !user?.active });
      alert(`Team member ${user?.active ? 'deactivated' : 'activated'} successfully!`);
      loadUser();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update team member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this team member? This action cannot be undone.')) return;
    
    try {
      setActionLoading(true);
      await api.delete(`/users/${userId}`);
      alert('Team member deleted successfully!');
      router.push('/team');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete team member');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'admin': 'Admin',
      'crew': 'Crew',
      'subcontractor': 'Subcontractor',
      'customer': 'Customer'
    };
    return roleMap[role] || role;
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'crew': return 'bg-blue-100 text-blue-700';
      case 'subcontractor': return 'bg-orange-100 text-orange-700';
      case 'customer': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'on_shift': 'On Shift',
      'busy': 'Busy',
      'off_shift': 'Off Shift',
      'offline': 'Offline'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Team Details"
        subtitle="View and manage details"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Team", href: "/team" }, { label: "Details" }]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
    
    </div>
    </div>
    );
  }

  if (!user) {
    return (
              <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Team member not found</h2>
          <button
            onClick={() => router.push('/team')}
            className="mt-4 text-[#3f72af] hover:text-blue-800"
          >
            Return to Team
          </button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Team Member"
        subtitle="View member details"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Team Member" }]}
      />
      <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/team')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                {user.title && <p className="text-gray-600 mt-1">{user.title}</p>}
              </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/team/${userId}/edit`)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={actionLoading}
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleToggleActive}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                user.active
                  ? 'border border-orange-300 text-orange-600 hover:bg-orange-50'
                  : 'border border-green-300 text-green-600 hover:bg-green-50'
              }`}
              disabled={actionLoading}
            >
              {user.active ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              disabled={actionLoading}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getRoleColor(user.role)}`}>
            {getRoleLabel(user.role)}
          </span>
          <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
            user.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {user.active ? 'ACTIVE' : 'INACTIVE'}
          </span>
          <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
            {getStatusLabel(user.status)}
          </span>
        </div>

        {/* Main Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                </div>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{user.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Messaging</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user.messaging_enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>

          {/* Account Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="text-sm font-medium text-gray-900">{getRoleLabel(user.role)}</p>
                </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Driver Status</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user.is_driver ? 'Certified Driver' : 'Not a Driver'}
                  </p>
                </div>

        {/* Emergency Contact */}
        {(user.emergency_contact_name || user.emergency_contact_phone) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Emergency Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {user.emergency_contact_name && (
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="text-sm font-medium text-gray-900">{user.emergency_contact_name}</p>
                </div>
              )}
              {user.emergency_contact_phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{user.emergency_contact_phone}</p>
                </div>
              )}
              {user.emergency_contact_relationship && (
                <div>
                  <p className="text-sm text-gray-600">Relationship</p>
                  <p className="text-sm font-medium text-gray-900">{user.emergency_contact_relationship}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Driver License */}
        {user.is_driver && user.driver_license_photo && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#3f72af]" />
              Driver's License
            </h2>
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <img 
                src={user.driver_license_photo} 
                alt="Driver's License"
                className="max-w-md mx-auto rounded"
              />
            </div>
          </div>
        )}

        {/* Documents */}
        {user.documents && user.documents.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              Documents
            </h2>
            <div className="space-y-2">
              {user.documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-600">
                        Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3f72af] hover:text-blue-800"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
