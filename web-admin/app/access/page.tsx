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
  AlertCircle,
  Search,
  HardHat,
  UserCog,
  Building2,
  TrendingUp,
  Clock,
  Activity,
  Eye,
  Lock,
  Unlock,
  Settings,
  Save,
  Plus,
} from 'lucide-react';

type TabType = 'overview' | 'team' | 'crew' | 'external' | 'roles' | 'audit';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: 'active' | 'inactive';
  created_at: string;
  last_login?: string;
  team?: string;
}

export default function UnifiedAccessPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  
  // Mock data for different user types
  const [teamMembers] = useState<User[]>([
    { id: '1', name: 'John Admin', email: 'john@company.com', phone: '+1 (555) 234-5678', role: 'Admin', status: 'active', created_at: '2025-01-15', last_login: '2025-06-21' },
    { id: '2', name: 'Sarah Manager', email: 'sarah@company.com', phone: '+1 (555) 345-6789', role: 'Manager', status: 'active', created_at: '2025-02-10', last_login: '2025-06-20' },
    { id: '3', name: 'Alex Supervisor', email: 'alex@company.com', phone: '+1 (555) 456-7890', role: 'Supervisor', status: 'active', created_at: '2025-03-05', last_login: '2025-06-21' },
  ]);

  const [crewMembers] = useState<User[]>([
    { id: '4', name: 'Mike Johnson', email: 'mike@company.com', phone: '+1 (555) 456-7890', role: 'Crew Lead', status: 'active', created_at: '2025-01-20', last_login: '2025-06-21', team: 'Team A' },
    { id: '5', name: 'Tom Wilson', email: 'tom@company.com', phone: '+1 (555) 567-8901', role: 'Operator', status: 'active', created_at: '2025-02-15', last_login: '2025-06-21', team: 'Team B' },
    { id: '6', name: 'David Brown', email: 'david@company.com', phone: '+1 (555) 678-9012', role: 'Operator', status: 'inactive', created_at: '2025-03-10', last_login: '2025-06-15', team: 'Team A' },
  ]);

  const [externalUsers] = useState<User[]>([
    { id: '7', name: 'ABC Corp', email: 'contact@abccorp.com', phone: '+1 (555) 111-2222', role: 'Customer', status: 'active', created_at: '2025-01-05', last_login: '2025-06-20' },
    { id: '8', name: 'XYZ Contractors', email: 'info@xyzcontractors.com', phone: '+1 (555) 333-4444', role: 'Subcontractor', status: 'active', created_at: '2025-02-01', last_login: '2025-06-19' },
    { id: '9', name: 'Supply Co', email: 'sales@supplyco.com', phone: '+1 (555) 555-6666', role: 'Vendor', status: 'active', created_at: '2025-03-15', last_login: '2025-06-18' },
  ]);

  const [roles] = useState([
    { 
      id: 1, 
      name: 'Admin', 
      users: 3, 
      permissions: ['All Access', 'Manage Users', 'Manage Settings', 'View Reports', 'Manage Billing', 'System Configuration'],
      color: 'blue',
      category: 'Internal'
    },
    { 
      id: 2, 
      name: 'Manager', 
      users: 5, 
      permissions: ['View Reports', 'Manage Teams', 'Edit Sites', 'Manage Projects', 'Approve Timesheets'],
      color: 'green',
      category: 'Internal'
    },
    { 
      id: 3, 
      name: 'Operator', 
      users: 12, 
      permissions: ['View Sites', 'Update Status', 'Upload Photos', 'Submit Timesheets', 'View Assigned Tasks'],
      color: 'orange',
      category: 'Internal'
    },
    { 
      id: 4, 
      name: 'Viewer', 
      users: 8, 
      permissions: ['View Only', 'Download Reports'],
      color: 'gray',
      category: 'Internal'
    },
    { 
      id: 5, 
      name: 'Subcontractor', 
      users: 4, 
      permissions: ['View Assigned Projects', 'Update Work Progress', 'Upload Documentation', 'Submit Invoices', 'View Project Schedule', 'Access Site Details'],
      color: 'purple',
      category: 'External'
    },
    { 
      id: 6, 
      name: 'Customer', 
      users: 15, 
      permissions: ['View Projects', 'Request Services', 'View Invoices', 'Make Payments', 'Track Work Orders', 'Submit Support Tickets'],
      color: 'indigo',
      category: 'External'
    },
    { 
      id: 7, 
      name: 'Vendor', 
      users: 7, 
      permissions: ['View Purchase Orders', 'Update Delivery Status', 'Submit Invoices', 'Manage Inventory', 'View Order History'],
      color: 'pink',
      category: 'External'
    },
  ]);

  // State for managing role permissions
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [editablePermissions, setEditablePermissions] = useState<string[]>([]);

  // All available permissions in the system
  const allPermissions = [
    { category: 'Core Access', items: ['All Access', 'View Only', 'Dashboard Access'] },
    { category: 'User Management', items: ['Manage Users', 'View Users', 'Edit User Profiles', 'Delete Users'] },
    { category: 'Project Management', items: ['Manage Projects', 'View Projects', 'Edit Projects', 'View Assigned Projects', 'Approve Projects'] },
    { category: 'Site Management', items: ['View Sites', 'Edit Sites', 'Create Sites', 'Delete Sites', 'Access Site Details'] },
    { category: 'Reports & Analytics', items: ['View Reports', 'Download Reports', 'Create Reports', 'Export Data'] },
    { category: 'Team Operations', items: ['Manage Teams', 'View Teams', 'Approve Timesheets', 'Submit Timesheets'] },
    { category: 'Field Operations', items: ['Update Status', 'Upload Photos', 'Upload Documentation', 'View Assigned Tasks', 'Update Work Progress'] },
    { category: 'Financial', items: ['Manage Billing', 'View Invoices', 'Submit Invoices', 'Make Payments', 'View Purchase Orders'] },
    { category: 'Customer Service', items: ['Request Services', 'Track Work Orders', 'Submit Support Tickets', 'View Project Schedule'] },
    { category: 'Inventory', items: ['Manage Inventory', 'View Inventory', 'Update Delivery Status'] },
    { category: 'System', items: ['System Configuration', 'Manage Settings', 'View Activity Logs'] },
  ];

  const [auditLogs] = useState([
    { id: 1, action: 'User Created', user: 'John Admin', target: 'Mike Johnson', timestamp: '2025-06-21 10:30 AM', ip: '192.168.1.100' },
    { id: 2, action: 'Role Modified', user: 'Sarah Manager', target: 'Manager Role', timestamp: '2025-06-21 09:15 AM', ip: '192.168.1.101' },
    { id: 3, action: 'Permission Changed', user: 'John Admin', target: 'Tom Wilson', timestamp: '2025-06-20 04:45 PM', ip: '192.168.1.100' },
    { id: 4, action: 'User Deactivated', user: 'Sarah Manager', target: 'David Brown', timestamp: '2025-06-20 02:30 PM', ip: '192.168.1.101' },
  ]);

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: TrendingUp },
    { id: 'team' as TabType, label: 'Team', icon: UserCog },
    { id: 'crew' as TabType, label: 'Crew', icon: HardHat },
    { id: 'external' as TabType, label: 'External', icon: Building2 },
    { id: 'roles' as TabType, label: 'Roles', icon: Shield },
    { id: 'audit' as TabType, label: 'Audit Log', icon: Activity },
  ];

  const getStats = () => {
    return {
      totalUsers: teamMembers.length + crewMembers.length + externalUsers.length,
      activeUsers: [...teamMembers, ...crewMembers, ...externalUsers].filter(u => u.status === 'active').length,
      teamCount: teamMembers.length,
      crewCount: crewMembers.length,
      externalCount: externalUsers.length,
      rolesCount: roles.length,
    };
  };

  const stats = getStats();

  const renderUserTable = (users: User[], title: string) => {
    const filteredUsers = users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2d5a8f] font-medium transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    {user.team && <div className="text-sm text-gray-500">{user.team}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <XCircle className="w-3 h-3" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.last_login || 'Never'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <PageHeader
        title="Universal Access Control"
        subtitle="Manage users, roles, and permissions across your organization"
        icon={<Shield size={28} />}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Access Control" }
        ]}
        actions={[
          {
            label: 'Manage Roles',
            icon: <Shield className="w-4 h-4 mr-2" />,
            onClick: () => setShowRolesModal(true),
            variant: 'secondary',
          },
          {
            label: 'Add User',
            icon: <UserPlus className="w-4 h-4 mr-2" />,
            onClick: () => setShowAddUserModal(true),
            variant: 'primary',
          },
        ]}
      />

      {/* Tabs Navigation */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#3f72af] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      {(activeTab === 'team' || activeTab === 'crew' || activeTab === 'external') && (
        <div className="mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Roles Defined</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.rolesCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Recent Activity</p>
                    <p className="text-2xl font-bold text-gray-900">{auditLogs.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Team Members</h3>
                  <UserCog className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stats.teamCount}</div>
                <p className="text-sm text-gray-600">Internal staff & admins</p>
                <button
                  onClick={() => setActiveTab('team')}
                  className="mt-4 w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                >
                  View Team
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Crew Members</h3>
                  <HardHat className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stats.crewCount}</div>
                <p className="text-sm text-gray-600">Field workers & operators</p>
                <button
                  onClick={() => setActiveTab('crew')}
                  className="mt-4 w-full px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium transition-colors"
                >
                  View Crew
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">External Users</h3>
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stats.externalCount}</div>
                <p className="text-sm text-gray-600">Customers, vendors, contractors</p>
                <button
                  onClick={() => setActiveTab('external')}
                  className="mt-4 w-full px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 font-medium transition-colors"
                >
                  View External
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Activity className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.action}</p>
                        <p className="text-xs text-gray-600">
                          {log.user} → {log.target}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">{log.timestamp}</p>
                      <p className="text-xs text-gray-500">{log.ip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && renderUserTable(teamMembers, 'Team Members')}

        {/* Crew Tab */}
        {activeTab === 'crew' && renderUserTable(crewMembers, 'Crew Members')}

        {/* External Tab */}
        {activeTab === 'external' && renderUserTable(externalUsers, 'External Users')}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            {/* Internal Roles Section */}
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Internal Roles</h2>
                <p className="text-sm text-gray-600">Roles for team members and internal staff</p>
              </div>
              <div className="space-y-4">
                {roles.filter(role => role.category === 'Internal').map((role) => (
                  <div
                    key={role.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${
                          role.color === 'blue' ? 'bg-blue-100' :
                          role.color === 'green' ? 'bg-green-100' :
                          role.color === 'orange' ? 'bg-orange-100' :
                          'bg-gray-100'
                        }`}>
                          <Shield className={`w-5 h-5 ${
                            role.color === 'blue' ? 'text-blue-600' :
                            role.color === 'green' ? 'text-green-600' :
                            role.color === 'orange' ? 'text-orange-600' :
                            'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{role.name}</h3>
                          <p className="text-sm text-gray-600">
                            {role.users} {role.users === 1 ? 'user' : 'users'} assigned
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Permissions ({role.permissions.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map((permission, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                              role.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                              role.color === 'green' ? 'bg-green-100 text-green-700' :
                              role.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* External Roles Section */}
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-1">External Roles</h2>
                <p className="text-sm text-gray-600">Roles for subcontractors, customers, and vendors</p>
              </div>
              <div className="space-y-4">
                {roles.filter(role => role.category === 'External').map((role) => (
                  <div
                    key={role.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${
                          role.color === 'purple' ? 'bg-purple-100' :
                          role.color === 'indigo' ? 'bg-indigo-100' :
                          role.color === 'pink' ? 'bg-pink-100' :
                          'bg-gray-100'
                        }`}>
                          <Shield className={`w-5 h-5 ${
                            role.color === 'purple' ? 'text-purple-600' :
                            role.color === 'indigo' ? 'text-indigo-600' :
                            role.color === 'pink' ? 'text-pink-600' :
                            'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{role.name}</h3>
                          <p className="text-sm text-gray-600">
                            {role.users} {role.users === 1 ? 'user' : 'users'} assigned
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Permissions ({role.permissions.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map((permission, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                              role.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                              role.color === 'indigo' ? 'bg-indigo-100 text-indigo-700' :
                              role.color === 'pink' ? 'bg-pink-100 text-pink-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Security Audit Log</h3>
              <p className="text-sm text-gray-600 mt-1">Track all access control changes and user activities</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Target</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Activity className="w-3 h-3" />
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.user}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.target}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.timestamp}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{log.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Add New User</h3>
                  <p className="text-sm text-gray-600">Create a new user account and assign permissions</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              <form className="space-y-6">
                {/* User Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    User Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg hover:border-blue-400 transition-colors"
                    >
                      <UserCog className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-sm font-semibold text-blue-900">Team Member</div>
                      <div className="text-xs text-blue-600 mt-1">Internal staff</div>
                    </button>
                    <button
                      type="button"
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 transition-colors"
                    >
                      <HardHat className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                      <div className="text-sm font-semibold text-gray-900">Crew Member</div>
                      <div className="text-xs text-gray-600 mt-1">Field worker</div>
                    </button>
                    <button
                      type="button"
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 transition-colors"
                    >
                      <Building2 className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                      <div className="text-sm font-semibold text-gray-900">External</div>
                      <div className="text-xs text-gray-600 mt-1">Customer/Vendor</div>
                    </button>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="john@company.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company/Organization
                      </label>
                      <input
                        type="text"
                        placeholder="ABC Corp"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Role Assignment */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Role Assignment
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Role <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select a role...</option>
                      <optgroup label="Internal Roles">
                        <option value="admin">Admin - All Access</option>
                        <option value="manager">Manager - Manage Teams & Projects</option>
                        <option value="operator">Operator - Field Operations</option>
                        <option value="viewer">Viewer - Read Only</option>
                      </optgroup>
                      <optgroup label="External Roles">
                        <option value="subcontractor">Subcontractor - Project Access</option>
                        <option value="customer">Customer - Service Portal</option>
                        <option value="vendor">Vendor - Supply Chain</option>
                      </optgroup>
                    </select>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Selected role will determine user permissions and access level throughout the system.</span>
                    </p>
                  </div>
                </div>

                {/* Team Assignment (for Crew Members) */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <HardHat className="w-4 h-4" />
                    Team Assignment
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign to Team
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">No team assignment</option>
                      <option value="team-a">Team A - North Division</option>
                      <option value="team-b">Team B - South Division</option>
                      <option value="team-c">Team C - East Division</option>
                      <option value="team-d">Team D - West Division</option>
                    </select>
                  </div>
                </div>

                {/* Account Settings */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Account Settings
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Status
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temporary Password
                      </label>
                      <input
                        type="text"
                        placeholder="Auto-generated"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        disabled
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sendEmail"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      defaultChecked
                    />
                    <label htmlFor="sendEmail" className="text-sm text-gray-700">
                      Send welcome email with login credentials
                    </label>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-xl">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  className="px-6 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2d5a8f] font-medium transition-colors flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Roles Modal */}
      {showRolesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Manage Roles & Permissions</h3>
                  <p className="text-sm text-gray-600">Configure access levels and permissions for each role</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRolesModal(false);
                  setSelectedRole(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex h-[calc(100vh-250px)]">
              {/* Left Sidebar - Role List */}
              <div className="w-80 border-r border-gray-200 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <button className="w-full px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2d5a8f] font-medium transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create New Role
                  </button>
                </div>

                {/* Internal Roles */}
                <div className="p-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Internal Roles</h4>
                  <div className="space-y-2">
                    {roles.filter(role => role.category === 'Internal').map((role) => (
                      <button
                        key={role.id}
                        onClick={() => {
                          setSelectedRole(role.id);
                          setEditablePermissions(role.permissions);
                        }}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          selectedRole === role.id
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900">{role.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            role.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                            role.color === 'green' ? 'bg-green-100 text-green-700' :
                            role.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {role.users} users
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">{role.permissions.length} permissions</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* External Roles */}
                <div className="p-4 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">External Roles</h4>
                  <div className="space-y-2">
                    {roles.filter(role => role.category === 'External').map((role) => (
                      <button
                        key={role.id}
                        onClick={() => {
                          setSelectedRole(role.id);
                          setEditablePermissions(role.permissions);
                        }}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          selectedRole === role.id
                            ? 'bg-purple-50 border-2 border-purple-500'
                            : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900">{role.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            role.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                            role.color === 'indigo' ? 'bg-indigo-100 text-indigo-700' :
                            role.color === 'pink' ? 'bg-pink-100 text-pink-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {role.users} users
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">{role.permissions.length} permissions</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Panel - Permission Editor */}
              <div className="flex-1 overflow-y-auto p-6">
                {selectedRole ? (
                  <div>
                    {(() => {
                      const role = roles.find(r => r.id === selectedRole);
                      return (
                        <div>
                          <div className="mb-6">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-3 rounded-xl ${
                                role?.color === 'blue' ? 'bg-blue-100' :
                                role?.color === 'green' ? 'bg-green-100' :
                                role?.color === 'orange' ? 'bg-orange-100' :
                                role?.color === 'purple' ? 'bg-purple-100' :
                                role?.color === 'indigo' ? 'bg-indigo-100' :
                                role?.color === 'pink' ? 'bg-pink-100' :
                                'bg-gray-100'
                              }`}>
                                <Shield className={`w-6 h-6 ${
                                  role?.color === 'blue' ? 'text-blue-600' :
                                  role?.color === 'green' ? 'text-green-600' :
                                  role?.color === 'orange' ? 'text-orange-600' :
                                  role?.color === 'purple' ? 'text-purple-600' :
                                  role?.color === 'indigo' ? 'text-indigo-600' :
                                  role?.color === 'pink' ? 'text-pink-600' :
                                  'text-gray-600'
                                }`} />
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold text-gray-900">{role?.name}</h3>
                                <p className="text-sm text-gray-600">{role?.users} users assigned • {editablePermissions.length} permissions active</p>
                              </div>
                            </div>
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-xs text-amber-800 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>Changes to permissions will affect all {role?.users} users with this role. Be careful when modifying access levels.</span>
                              </p>
                            </div>
                          </div>

                          {/* Permission Categories */}
                          <div className="space-y-4">
                            {allPermissions.map((category, idx) => (
                              <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                  <Lock className="w-4 h-4 text-gray-600" />
                                  {category.category}
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {category.items.map((permission, permIdx) => (
                                    <label
                                      key={permIdx}
                                      className="flex items-center gap-2 p-2 rounded hover:bg-white transition-colors cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={editablePermissions.includes(permission)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setEditablePermissions([...editablePermissions, permission]);
                                          } else {
                                            setEditablePermissions(editablePermissions.filter(p => p !== permission));
                                          }
                                        }}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                      <span className="text-sm text-gray-700">{permission}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Role to Manage</h3>
                      <p className="text-sm text-gray-600 max-w-md">
                        Choose a role from the left sidebar to view and modify its permissions. You can also create a new role.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-xl">
              <button
                type="button"
                onClick={() => {
                  setShowRolesModal(false);
                  setSelectedRole(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              {selectedRole && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Reset to original permissions
                      const role = roles.find(r => r.id === selectedRole);
                      if (role) setEditablePermissions(role.permissions);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                  >
                    Reset Changes
                  </button>
                  <button
                    type="button"
                    className="px-6 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2d5a8f] font-medium transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Permissions
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
