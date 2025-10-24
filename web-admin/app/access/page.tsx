'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  Shield,
  Users,
  UserPlus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Settings,
  Eye,
  Lock,
  Unlock,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';

interface UserAccess {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'internal' | 'subcontractor';
  access_group: 'Internal' | 'Subcontractor';
  status: 'active' | 'inactive';
  permissions: string[];
  created_at: string;
  last_login?: string;
}

interface AccessGroup {
  name: string;
  description: string;
  permissions: string[];
  color: string;
  icon: any;
}

export default function AccessDashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const accessGroups: AccessGroup[] = [
    {
      name: 'Internal',
      description: 'Full platform access for internal staff and administrators',
      permissions: [
        'view_all_customers',
        'manage_customers',
        'view_all_projects',
        'manage_projects',
        'view_all_invoices',
        'manage_invoices',
        'view_reports',
        'manage_users',
        'manage_settings',
        'view_analytics',
        'manage_estimates',
        'manage_dispatch',
      ],
      color: 'blue',
      icon: Shield,
    },
    {
      name: 'Subcontractor',
      description: 'Limited access for external subcontractors and field staff',
      permissions: [
        'view_assigned_projects',
        'update_project_status',
        'upload_photos',
        'view_assigned_tasks',
        'update_task_status',
        'view_assigned_dispatch',
        'submit_timesheets',
      ],
      color: 'orange',
      icon: Users,
    },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/access');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      alert('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = filterGroup === 'all' || user.access_group === filterGroup;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesGroup && matchesStatus;
  });

  const internalCount = users.filter(u => u.access_group === 'Internal').length;
  const subcontractorCount = users.filter(u => u.access_group === 'Subcontractor').length;
  const activeCount = users.filter(u => u.status === 'active').length;

  const getGroupColor = (group: string) => {
    return group === 'Internal' ? 'blue' : 'orange';
  };

  const getGroupBadgeColor = (group: string) => {
    return group === 'Internal' 
      ? 'bg-blue-100 text-blue-700 border-blue-200' 
      : 'bg-orange-100 text-orange-700 border-orange-200';
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      await api.patch(`/users/${userId}/toggle-status`);
      loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      loadUsers();
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        {/* Header */}
        <PageHeader
          title="Access Control Dashboard"
          
          actions={[
            {
              label: 'Add User',
              icon: UserPlus,
              onClick: () => alert('Add User feature coming soon!'),
              variant: 'primary',
            },
          ]}
        />

        {/* Access Groups Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-6 mt-6">
          {accessGroups.map((group) => (
            <div
              key={group.name}
              className={`bg-gradient-to-br ${
                group.color === 'blue' 
                  ? 'from-blue-500 to-blue-600' 
                  : 'from-orange-500 to-orange-600'
              } rounded-xl shadow-sm p-4 text-white`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <group.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{group.name}</h3>
                    <p className="text-sm opacity-90 mt-1">{group.description}</p>
                  </div>
                </div>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  {users.filter(u => u.access_group === group.name).length} users
                </span>
              </div>

              {/* Permissions List */}
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <h4 className="font-semibold mb-3 text-sm">Permissions:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {group.permissions.slice(0, 8).map((permission, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3 h-3" />
                      <span className="opacity-90">{permission.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
                {group.permissions.length > 8 && (
                  <p className="text-xs opacity-75 mt-2">
                    +{group.permissions.length - 8} more permissions
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="px-6 py-4 bg-white rounded-xl shadow-lg border border-gray-200 mt-6 mx-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Group Filter */}
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Groups</option>
              <option value="Internal">Internal</option>
              <option value="Subcontractor">Subcontractor</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="mx-6 mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Access Group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getGroupBadgeColor(user.access_group)}`}>
                          {user.access_group}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 w-fit ${getStatusBadge(user.status)}`}>
                          {user.status === 'active' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleString()
                          : 'Never'
                        }
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <button
                          onClick={() => alert(`Permissions:\n${user.permissions.join('\n')}`)}
                          className="text-[#3f72af] hover:text-[#2c5282] flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View ({user.permissions.length})
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            className="text-gray-600 hover:text-gray-900"
                            title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {user.status === 'active' ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => router.push(`/access/users/${user.id}/edit`)}
                            className="text-[#3f72af] hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No users found matching your filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Audit Log Notice */}
        <div className="mx-6 mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#3f72af] mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Audit Logging Enabled</h3>
              <p className="text-sm text-blue-700">
                All access changes and permission modifications are automatically logged for security and compliance purposes. 
                View audit logs in Settings → Security.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
}
