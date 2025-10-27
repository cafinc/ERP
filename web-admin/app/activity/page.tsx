'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, TrendingUp, Users, FileText, DollarSign, Package, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'invoice' | 'project' | 'customer' | 'user' | 'inventory' | 'other';
  action: string;
  description: string;
  user: string;
  timestamp: string;
  trend?: 'up' | 'down';
  amount?: string;
}

export default function ActivityPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    // Mock activity data - replace with actual API call
    const mockActivities: ActivityItem[] = [
      {
        id: '1',
        type: 'invoice',
        action: 'Invoice Paid',
        description: 'Invoice #1234 paid',
        user: 'Admin User',
        timestamp: new Date().toISOString(),
        trend: 'up',
        amount: '$2,500'
      },
      {
        id: '2',
        type: 'project',
        action: 'Project Updated',
        description: 'Project "Main St Plowing" updated',
        user: 'John Doe',
        timestamp: new Date(Date.now() - 900000).toISOString(),
      },
      {
        id: '3',
        type: 'customer',
        action: 'New Customer',
        description: 'Customer added',
        user: 'Admin User',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        trend: 'up'
      },
      {
        id: '4',
        type: 'inventory',
        action: 'Low Stock Alert',
        description: 'Rock Salt inventory is low',
        user: 'System',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        trend: 'down'
      },
      {
        id: '5',
        type: 'user',
        action: 'User Login',
        description: 'User logged in',
        user: 'Jane Smith',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
    ];
    setActivities(mockActivities);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'invoice': return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'project': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'customer': return <Users className="w-5 h-5 text-purple-600" />;
      case 'user': return <Users className="w-5 h-5 text-gray-600" />;
      case 'inventory': return <Package className="w-5 h-5 text-orange-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'invoice': return 'bg-green-100';
      case 'project': return 'bg-blue-100';
      case 'customer': return 'bg-purple-100';
      case 'user': return 'bg-gray-100';
      case 'inventory': return 'bg-orange-100';
      default: return 'bg-gray-100';
    }
  };

  const filteredActivities = activities; // Add actual filtering logic

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">Activity Feed</h1>
          </div>
          <p className="text-gray-600">Recent actions and updates across your system</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Today</p>
                <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
              </div>
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {activities.filter(a => a.type === 'invoice').length}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Projects</p>
                <p className="text-2xl font-bold text-blue-600">
                  {activities.filter(a => a.type === 'project').length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Customers</p>
                <p className="text-2xl font-bold text-purple-600">
                  {activities.filter(a => a.type === 'customer').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex gap-2 p-2">
            {['all', 'today', 'week', 'month'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === type
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
              <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No activity to display</p>
            </div>
          ) : (
            filteredActivities.map((activity, index) => (
              <div
                key={activity.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 transition-all hover:shadow-md"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getBackgroundColor(activity.type)} flex items-center justify-center`}>
                      {getIcon(activity.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                            {activity.action}
                            {activity.trend === 'up' && (
                              <ArrowUpRight className="w-4 h-4 text-green-600" />
                            )}
                            {activity.trend === 'down' && (
                              <ArrowDownRight className="w-4 h-4 text-red-600" />
                            )}
                          </h3>
                          <p className="text-gray-600">{activity.description}</p>
                        </div>
                        
                        {activity.amount && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-semibold">
                            {activity.amount}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {activity.user}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getBackgroundColor(activity.type)} ${
                          activity.type === 'invoice' ? 'text-green-700' :
                          activity.type === 'project' ? 'text-blue-700' :
                          activity.type === 'customer' ? 'text-purple-700' :
                          activity.type === 'inventory' ? 'text-orange-700' :
                          'text-gray-700'
                        }`}>
                          {activity.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
