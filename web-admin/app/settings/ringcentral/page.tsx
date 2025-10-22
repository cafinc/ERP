'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Phone,
  MessageSquare,
  Voicemail,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Bell,
  PhoneCall,
  Radio,
} from 'lucide-react';

interface RingCentralFeature {
  id: string;
  name: string;
  icon: any;
  description: string;
  enabled: boolean;
  status: 'active' | 'inactive' | 'coming_soon';
  route?: string;
}

export default function RingCentralSettings() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [features, setFeatures] = useState<RingCentralFeature[]>([
    {
      id: 'sms',
      name: 'SMS Messaging',
      icon: MessageSquare,
      description: 'Send and receive SMS messages with customers',
      enabled: true,
      status: 'active',
      route: '/ringcentral/sms',
    },
    {
      id: 'active_calls',
      name: 'Active Calls',
      icon: Radio,
      description: 'View and control active calls in real-time',
      enabled: true,
      status: 'active',
      route: '/ringcentral/active-calls',
    },
    {
      id: 'call_recordings',
      name: 'Call Recordings',
      icon: Bell,
      description: 'Access and download call recordings',
      enabled: true,
      status: 'active',
      route: '/ringcentral/recordings',
    },
    {
      id: 'contacts_sync',
      name: 'Contacts Management',
      icon: Users,
      description: 'Sync and manage RingCentral contacts',
      enabled: true,
      status: 'active',
      route: '/ringcentral/contacts',
    },
    {
      id: 'analytics',
      name: 'Call Analytics',
      icon: BarChart3,
      description: 'View call statistics and performance metrics',
      enabled: true,
      status: 'active',
      route: '/ringcentral/analytics',
    },
    {
      id: 'team_messaging',
      name: 'Team Messaging',
      icon: MessageSquare,
      description: 'Internal team communication (requires account permissions)',
      enabled: true,
      status: 'active',
      route: '/ringcentral/messaging',
    },
    {
      id: 'caller_popup',
      name: 'Caller ID Popup',
      icon: PhoneCall,
      description: 'Real-time incoming call notifications with customer info',
      enabled: false,
      status: 'coming_soon',
    },
    {
      id: 'voicemail',
      name: 'Voicemail Management',
      icon: Voicemail,
      description: 'Access and manage voicemails',
      enabled: false,
      status: 'coming_soon',
    },
  ]);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ringcentral/status');
      setConnected(response.data.connected || false);
      setConnectionInfo(response.data.account_info);
    } catch (error) {
      console.error('Error checking RingCentral status:', error);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    alert('RingCentral OAuth connection coming soon! Please configure webhook manually for now.');
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect RingCentral?')) {
      return;
    }
    
    alert('Disconnect functionality coming soon!');
  };

  const handleToggleFeature = (featureId: string) => {
    setFeatures(prev =>
      prev.map(f =>
        f.id === featureId && f.status === 'active'
          ? { ...f, enabled: !f.enabled }
          : f
      )
    );
  };

  if (loading) {
    return (
      <HybridNavigationTopBar>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </HybridNavigationTopBar>
    );
  }

  return (
    <HybridNavigationTopBar>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">RingCentral Integration</h1>
          <p className="text-gray-600">
            Manage your RingCentral phone system integration and features
          </p>
        </div>

        {/* Connection Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-4 rounded-lg ${connected ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Phone className={`w-8 h-8 ${connected ? 'text-green-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Connection Status</h2>
                {connected ? (
                  <p className="text-green-600 font-medium">Connected to RingCentral</p>
                ) : (
                  <p className="text-gray-600">Not connected</p>
                )}
                {connectionInfo && (
                  <p className="text-sm text-gray-500 mt-1">
                    Account: {connectionInfo.name || connectionInfo.email}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {connected ? (
                <>
                  <button
                    onClick={() => checkConnectionStatus()}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Disconnect</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnect}
                  className="flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>Connect RingCentral</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Features & Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              
              return (
                <div
                  key={feature.id}
                  className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${
                    feature.status === 'coming_soon' ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg ${
                        feature.enabled && feature.status === 'active'
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}>
                        <IconComponent className={`w-6 h-6 ${
                          feature.enabled && feature.status === 'active'
                            ? 'text-[#3f72af]'
                            : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{feature.name}</h4>
                        {feature.status === 'coming_soon' && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </div>

                    {feature.status === 'active' && (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={feature.enabled}
                          onChange={() => handleToggleFeature(feature.id)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3f72af]"></div>
                      </label>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{feature.description}</p>

                  {feature.route && feature.enabled && feature.status === 'active' && (
                    <button
                      onClick={() => (window.location.href = feature.route!)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#3f72af] rounded-lg font-medium transition-colors"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      <span>Open Feature</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Webhook Configuration Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-2 flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Webhook Configuration</span>
          </h4>
          <p className="text-blue-800 text-sm mb-3">
            To receive real-time call notifications, configure your RingCentral webhook:
          </p>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Webhook URL:</strong>
            </p>
            <code className="block bg-gray-100 px-3 py-2 rounded text-sm text-gray-800 font-mono">
              https://snowconnect.preview.emergentagent.com/api/ringcentral/webhook
            </code>
          </div>
          <p className="text-blue-700 text-sm mt-3">
            Subscribe to: <code className="bg-blue-100 px-2 py-0.5 rounded">Presence</code> events
          </p>
        </div>
      </div>
    </HybridNavigationTopBar>
  );
}
