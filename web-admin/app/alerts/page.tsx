'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, AlertCircle, AlertTriangle, Info, CheckCircle, X, Clock, TrendingUp, Users } from 'lucide-react';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: string;
  actionUrl?: string;
}

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info' | 'success'>('all');

  useEffect(() => {
    // Mock alerts data - replace with actual API call
    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'error',
        title: 'Low Stock Alert',
        message: '7mm Chip inventory is critically low (0 units remaining)',
        timestamp: new Date().toISOString(),
        read: false,
        category: 'Inventory',
        actionUrl: '/inventory'
      },
      {
        id: '2',
        type: 'warning',
        title: 'Weather Warning',
        message: 'Heavy snowfall expected tonight. Consider pre-salting operations.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false,
        category: 'Weather',
        actionUrl: '/weather'
      },
      {
        id: '3',
        type: 'info',
        title: 'System Update',
        message: 'New features available: Enhanced map builder with measurement tools',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        read: true,
        category: 'System',
      },
    ];
    setAlerts(mockAlerts);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'info': return <Info className="w-5 h-5 text-blue-600" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-orange-50 border-orange-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const markAsRead = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    ));
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.type === filter);

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-gray-600">System notifications and important updates</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
              </div>
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.type === 'error').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-orange-600">
                  {alerts.filter(a => a.type === 'warning').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
              </div>
              <Info className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex gap-2 p-2">
            {['all', 'error', 'warning', 'info', 'success'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === type
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No alerts to display</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-lg shadow-sm border-2 ${getBackgroundColor(alert.type)} ${
                  !alert.read ? 'border-l-4' : ''
                } transition-all hover:shadow-md`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(alert.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {alert.title}
                          </h3>
                          {!alert.read && (
                            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                              NEW
                            </span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{alert.message}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                          {alert.category}
                        </span>
                      </div>
                      
                      <div className="flex gap-3 mt-4">
                        {!alert.read && (
                          <button
                            onClick={() => markAsRead(alert.id)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                          >
                            Mark as Read
                          </button>
                        )}
                        {alert.actionUrl && (
                          <button
                            onClick={() => router.push(alert.actionUrl!)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                          >
                            View Details
                          </button>
                        )}
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
