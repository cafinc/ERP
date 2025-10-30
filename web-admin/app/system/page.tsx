'use client';

import { useState } from 'react';
import { 
  Server, CheckCircle, Database, Wifi, RefreshCw, AlertCircle, 
  Globe, Mail, Phone, MapPin, DollarSign, Cloud, FileText, Zap,
  Settings, ExternalLink, Check, X
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  category: string;
  status: 'connected' | 'disconnected' | 'error';
  icon: any;
  description: string;
  lastSync?: string;
  color: string;
}

export default function SystemPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: '1',
      name: 'Google Maps',
      category: 'Mapping',
      status: 'connected',
      icon: MapPin,
      description: 'Geofencing, routing, and address validation',
      lastSync: '5 minutes ago',
      color: 'text-red-600 bg-red-100'
    },
    {
      id: '2',
      name: 'Email Service',
      category: 'Communication',
      status: 'connected',
      icon: Mail,
      description: 'Automated email notifications and alerts',
      lastSync: '2 minutes ago',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      id: '3',
      name: 'RingCentral',
      category: 'Communication',
      status: 'connected',
      icon: Phone,
      description: 'Voice calls and SMS messaging',
      lastSync: '10 minutes ago',
      color: 'text-purple-600 bg-purple-100'
    },
    {
      id: '4',
      name: 'QuickBooks',
      category: 'Accounting',
      status: 'connected',
      icon: DollarSign,
      description: 'Invoice sync and payment processing',
      lastSync: '1 hour ago',
      color: 'text-green-600 bg-green-100'
    },
    {
      id: '5',
      name: 'Weather API',
      category: 'Weather',
      status: 'connected',
      icon: Cloud,
      description: 'Real-time weather data and forecasts',
      lastSync: '3 minutes ago',
      color: 'text-cyan-600 bg-cyan-100'
    },
    {
      id: '6',
      name: 'Document Storage',
      category: 'Storage',
      status: 'connected',
      icon: FileText,
      description: 'Cloud storage for documents and files',
      lastSync: '15 minutes ago',
      color: 'text-orange-600 bg-orange-100'
    },
    {
      id: '7',
      name: 'Automation Engine',
      category: 'Workflow',
      status: 'connected',
      icon: Zap,
      description: 'Automated workflows and tasks',
      lastSync: 'Just now',
      color: 'text-yellow-600 bg-yellow-100'
    },
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
          <Check className="w-3 h-3" /> Connected
        </span>;
      case 'disconnected':
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold flex items-center gap-1">
          <X className="w-3 h-3" /> Disconnected
        </span>;
      case 'error':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Error
        </span>;
    }
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const totalCount = integrations.length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Server className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">System</h1>
          </div>
          <p className="text-gray-600">System status and integration connections</p>
        </div>

        {/* System Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div></div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">API Status</h3>
            <p className="text-2xl font-bold text-gray-900">Healthy</p>
            <p className="text-xs text-green-600 mt-1">99.9% uptime</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Database className="w-6 h-6 text-blue-600" />
              </div></div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Database</h3>
            <p className="text-2xl font-bold text-gray-900">Connected</p>
            <p className="text-xs text-blue-600 mt-1">12ms latency</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Wifi className="w-6 h-6 text-purple-600" />
              </div></div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Integrations</h3>
            <p className="text-2xl font-bold text-gray-900">{connectedCount}/{totalCount}</p>
            <p className="text-xs text-purple-600 mt-1">Active connections</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-orange-600" />
              </div></div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Last Sync</h3>
            <p className="text-2xl font-bold text-gray-900">2m ago</p>
            <p className="text-xs text-orange-600 mt-1">All systems synced</p>
          </div></div>

        {/* Integrations Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Integration Connections</h2>
            <p className="text-sm text-gray-600 mt-1">Manage third-party service integrations</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrations.map((integration) => {
                const Icon = integration.icon;
                return (
                  <div
                    key={integration.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg ${integration.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                          <p className="text-xs text-gray-500">{integration.category}</p>
                        </div></div>
                      {getStatusBadge(integration.status)}
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{integration.description}</p>

                    <div className="flex items-center justify-between">
                      {integration.lastSync && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <RefreshCw className="w-3 h-3" />
                          Last sync: {integration.lastSync}
                        </div>
                      )}
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                        Configure <ExternalLink className="w-3 h-3" />
                      </button></div></div>
  );
              })}
            </div></div></div>

        {/* System Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Server Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Version</span>
                <span className="text-sm font-semibold text-gray-900">v2.1.0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Environment</span>
                <span className="text-sm font-semibold text-gray-900">Production</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Region</span>
                <span className="text-sm font-semibold text-gray-900">US-East-1</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="text-sm font-semibold text-gray-900">15 days 3 hours</span>
              </div></div></div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">CPU Usage</span>
                <span className="text-sm font-semibold text-gray-900">32%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Memory Usage</span>
                <span className="text-sm font-semibold text-gray-900">1.2 GB / 4 GB</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">API Requests (24h)</span>
                <span className="text-sm font-semibold text-gray-900">12,453</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">Avg Response Time</span>
                <span className="text-sm font-semibold text-gray-900">125ms</span>
              </div></div></div></div></div></div>
  );
}
