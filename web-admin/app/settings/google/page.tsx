'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Mail,
  CheckSquare,
  Cloud,
  Calendar,
  Users,
  FileText,
  Presentation,
  Table,
  RefreshCw,
  Check,
  X,
  ExternalLink,
  Settings as SettingsIcon,
} from 'lucide-react';

interface Integration {
  service: string;
  name: string;
  icon: any;
  description: string;
  connected: boolean;
  connectionInfo?: any;
  features: string[];
  settingsRoute?: string;
}

export default function GoogleWorkspaceSettings() {
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      service: 'gmail',
      name: 'Gmail',
      icon: Mail,
      description: 'Access and manage your Gmail emails directly in the app',
      connected: false,
      features: [
        'Read and send emails',
        'Email synchronization',
        'Label management',
        'Mark as read/unread',
        'Email templates',
        'CRM integration',
      ],
      settingsRoute: '/gmail',
    },
    {
      service: 'tasks',
      name: 'Google Tasks',
      icon: CheckSquare,
      description: 'Sync your project tasks with Google Tasks',
      connected: false,
      features: [
        'Two-way task sync',
        'Project task lists',
        'Auto-sync every 15 minutes',
        'Access from any device',
      ],
    },
    {
      service: 'drive',
      name: 'Google Drive',
      icon: Cloud,
      description: 'Store and access files in Google Drive',
      connected: false,
      features: [
        'File storage',
        'Document sharing',
        'Automatic backups',
        'Team collaboration',
      ],
    },
    {
      service: 'calendar',
      name: 'Google Calendar',
      icon: Calendar,
      description: 'Sync dispatch schedules with Google Calendar',
      connected: false,
      features: [
        'Schedule sync',
        'Event management',
        'Reminders',
        'Team availability',
      ],
    },
    {
      service: 'contacts',
      name: 'Google Contacts',
      icon: Users,
      description: 'Sync customer information with Google Contacts',
      connected: false,
      features: [
        'Contact sync',
        'CRM integration',
        'Auto-update',
        'Backup contacts',
      ],
    },
    {
      service: 'docs',
      name: 'Google Docs',
      icon: FileText,
      description: 'Create and edit documents',
      connected: false,
      features: [
        'Document creation',
        'Real-time collaboration',
        'Template library',
        'Export options',
      ],
    },
    {
      service: 'sheets',
      name: 'Google Sheets',
      icon: Table,
      description: 'Create and manage spreadsheets',
      connected: false,
      features: [
        'Spreadsheet creation',
        'Data analysis',
        'Export reports',
        'Formula support',
      ],
    },
    {
      service: 'slides',
      name: 'Google Slides',
      icon: Presentation,
      description: 'Create presentations',
      connected: false,
      features: [
        'Presentation creation',
        'Slide templates',
        'Team sharing',
        'Present mode',
      ],
    },
  ]);

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  const checkIntegrationStatus = async () => {
    try {
      setLoading(true);
      // Check Gmail status
      const gmailResponse = await api.get('/gmail/status');
      
      setIntegrations(prev =>
        prev.map(integration => {
          if (integration.service === 'gmail') {
            return {
              ...integration,
              connected: gmailResponse.data.connected || false,
              connectionInfo: gmailResponse.data.email,
            };
          }
          return integration;
        })
      );
    } catch (error) {
      console.error('Error checking integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (service: string) => {
    if (service === 'gmail') {
      try {
        const response = await api.get('/gmail/connect');
        window.location.href = response.data.authorization_url;
      } catch (error) {
        console.error('Error connecting Gmail:', error);
        alert('Failed to connect Gmail');
      }
    } else {
      alert(`${service} integration coming soon!`);
    }
  };

  const handleDisconnect = async (service: string) => {
    if (!confirm(`Are you sure you want to disconnect ${service}?`)) {
      return;
    }

    if (service === 'gmail') {
      try {
        const response = await api.get('/gmail/status');
        if (response.data.connections && response.data.connections.length > 0) {
          const connectionId = response.data.connections[0].id;
          await api.post(`/gmail/disconnect/${connectionId}`);
          alert('Gmail disconnected successfully');
          checkIntegrationStatus();
        }
      } catch (error) {
        console.error('Error disconnecting Gmail:', error);
        alert('Failed to disconnect Gmail');
      }
    }
  };

  if (loading) {
    return (
      <PageHeader
        title="Google"
        subtitle="Manage google"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Google" }]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </div>
    );
  }

  return (
    <PageHeader>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Google Workspace Integration</h1>
          <p className="text-gray-600">
            Connect your Google Workspace services to enhance productivity and collaboration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((integration) => {
            const IconComponent = integration.icon;
            
            return (
              <div
                key={integration.service}
                className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${integration.connected ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <IconComponent className={`w-6 h-6 ${integration.connected ? 'text-green-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                      {integration.connected && integration.connectionInfo && (
                        <p className="text-sm text-green-600">Connected: {integration.connectionInfo}</p>
                      )}
                    </div>
                  </div>
                  
                  {integration.connected ? (
                    <span className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      <Check className="w-4 h-4" />
                      <span>Connected</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                      <X className="w-4 h-4" />
                      <span>Not Connected</span>
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4">{integration.description}</p>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Features:</h4>
                  <ul className="space-y-1">
                    {integration.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                  {integration.connected ? (
                    <>
                      {integration.settingsRoute && (
                        <button
                          onClick={() => (window.location.href = integration.settingsRoute!)}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
                        >
                          <SettingsIcon className="w-4 h-4" />
                          <span>Open</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDisconnect(integration.service)}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Disconnect</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(integration.service)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Connect {integration.name}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
