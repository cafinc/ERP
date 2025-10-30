'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  Plus,
  Search,
  Eye,
  Users,
  Shield,
  Truck,
  UserCheck,
  UserX,
  RefreshCw,
  Phone,
  Mail,
  Circle,
  Edit,
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
  created_at: string;
}

export default function TeamPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'on_shift': return 'text-green-600';
      case 'busy': return 'text-yellow-600';
      case 'off_shift': return 'text-gray-600';
      case 'offline': return 'text-red-600';
      default: return 'text-gray-600';
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.active) ||
      (filterStatus === 'inactive' && !user.active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      );
  }

  return (
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        {/* Compact Header */}
        <PageHeader
        title="Team"
        subtitle="Manage your team members and staff"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Team" }]}
        title="Team Members"
          icon={Users}
          badges={[
            { label: `${users.length} Total`, color: 'blue' },
            { label: `${users.filter(u => u.role === 'admin').length} Admins`, color: 'purple' },
            { label: `${users.filter(u => u.status === 'on_shift').length} On Shift`, color: 'green' },
          ]}
          actions={[
            {
              label: 'Add Team Member',
              icon: Plus,
              onClick: () => router.push('/team/create'),
              variant: 'primary',
            },
          ]}
        />

        {/* Filter Buttons */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => setFilterRole('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterRole === 'all'
                  ? 'bg-[#3f72af] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              All Roles ({users.length})
            </button>
            <button
              onClick={() => setFilterRole('admin')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterRole === 'admin'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Admin ({users.filter(u => u.role === 'admin').length})
            </button>
            <button
              onClick={() => setFilterRole('crew')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterRole === 'crew'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Crew ({users.filter(u => u.role === 'crew').length})
            </button>
            <button
              onClick={() => setFilterRole('subcontractor')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterRole === 'subcontractor'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Subcontractor ({users.filter(u => u.role === 'subcontractor').length})
            </button>
            <div className="flex-1"></div>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Active ({users.filter(u => u.active).length})
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'inactive'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Inactive ({users.filter(u => !u.active).length})
            </button></div></div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-3 mb-4 mx-6 mt-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              onClick={loadUsers}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-100 transition-all text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button></div></div>

        {/* Team Grid */}
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-12 text-center mx-6 hover:shadow-md transition-shadow">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Team Members Found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterRole !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filters' 
                : 'Get started by adding your first team member'}
            </p>
            {!searchQuery && filterRole === 'all' && filterStatus === 'all' && (
              <button
                onClick={() => router.push('/team/create')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add First Team Member</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mx-6">
            {filteredUsers.map((user, index) => (
              <div
                key={user.id}
                className="bg-white rounded-xl shadow-md shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/team/${user.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      {user.title && (
                        <p className="text-sm text-gray-600">{user.title}</p>
                      )}
                    </div></div>
                  {user.active ? (
                    <UserCheck className="w-5 h-5 text-green-600" />
                  ) : (
                    <UserX className="w-5 h-5 text-red-600" />
                  )}
                </div>

                {/* Role & Status */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Circle className={`w-2 h-2 fill-current ${getStatusColor(user.status)}`} />
                    <span className={`text-xs font-medium ${getStatusColor(user.status)}`}>
                      {getStatusLabel(user.status)}
                    </span>
                  </div></div>

                {/* Contact */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2">
                  {user.is_driver && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                      <Truck className="w-3 h-3" />
                      Driver
                    </span>
                  )}
                  {user.messaging_enabled && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                      SMS
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200 mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/team/${user.id}`);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/team/${user.id}/edit`);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button></div></div>
            ))}
          </div>
        )}
      </div>
    );
}
