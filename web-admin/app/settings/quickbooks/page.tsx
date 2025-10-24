'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import {
  DollarSign,
  Users,
  FileText,
  CreditCard,
  FileCheck,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Settings as SettingsIcon,
  AlertTriangle,
  CheckCircle2,
  Activity,
  TrendingUp,
  Upload,
} from 'lucide-react';

interface QuickBooksConnection {
  connected: boolean;
  company_name?: string;
  realm_id?: string;
  token_expires_at?: string;
  connected_since?: string;
  sync_settings?: {
    sync_enabled: boolean;
    sync_direction: string;
    auto_sync_customers: boolean;
    auto_sync_invoices: boolean;
    auto_sync_payments: boolean;
    auto_sync_estimates: boolean;
  };
}

interface SyncLog {
  id: string;
  entity_type: string;
  entity_id?: string;
  operation: string;
  status: string;
  error_message?: string;
  created_at: string;
}

export default function QuickBooksSettings() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<QuickBooksConnection | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncSettings, setSyncSettings] = useState({
    sync_enabled: true,
    sync_direction: 'one_way',
    auto_sync_customers: true,
    auto_sync_invoices: true,
    auto_sync_payments: true,
    auto_sync_estimates: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [syncingEntity, setSyncingEntity] = useState<string | null>(null);

  useEffect(() => {
    fetchConnectionStatus();
    
    // Check for connection success/error in URL params
    const connected = searchParams?.get('connected');
    const error = searchParams?.get('error');
    
    if (connected === 'true') {
      setTimeout(() => {
        fetchConnectionStatus();
      }, 1000);
    }
    
    if (error) {
      alert('Failed to connect to QuickBooks. Please try again.');
    }
  }, [searchParams]);

  const fetchConnectionStatus = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await api.get(`/quickbooks/connection/status?user_id=${user.id}`);
      setConnection(response.data);
      
      if (response.data.connected) {
        setSyncSettings(response.data.sync_settings || syncSettings);
        fetchSyncLogs();
      }
    } catch (error) {
      console.error('Error fetching connection status:', error);
      setConnection({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncLogs = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await api.get(`/quickbooks/sync-logs?user_id=${user.id}&limit=20`);
      setSyncLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
    }
  };

  const handleConnect = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await api.get(`/quickbooks/auth/connect?user_id=${user.id}`);
      
      // Redirect to QuickBooks OAuth
      window.location.href = response.data.authorization_url;
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to initiate QuickBooks connection');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect QuickBooks? This will stop all automatic syncing.')) {
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await api.delete(`/quickbooks/auth/disconnect?user_id=${user.id}`);
      setConnection({ connected: false });
      alert('Successfully disconnected from QuickBooks');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to disconnect from QuickBooks');
    }
  };

  const handleUpdateSyncSettings = async () => {
    setSavingSettings(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await api.put(`/quickbooks/sync-settings?user_id=${user.id}`, syncSettings);
      alert('Sync settings updated successfully');
      fetchConnectionStatus();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to update sync settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSyncEntity = async (entityType: string) => {
    setSyncingEntity(entityType);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      let successCount = 0;
      let failCount = 0;
      let message = '';
      
      switch (entityType) {
        case 'customers': {
          // Get all active customers from local database
          const customersResponse = await api.get('/customers?active=true');
          const customers = customersResponse.data;
          
          if (!customers || customers.length === 0) {
            message = 'No active customers found to sync';
            break;
          }
          
          // Sync each customer to QuickBooks
          for (const customer of customers) {
            const qbCustomerData = {
              DisplayName: customer.name,
              PrimaryEmailAddr: customer.email ? { Address: customer.email } : undefined,
              PrimaryPhone: customer.phone ? { FreeFormNumber: customer.phone } : undefined,
              BillAddr: customer.address ? {
                Line1: customer.address,
              } : undefined,
            };
            
            try {
              await api.post(`/quickbooks/customers?user_id=${user.id}`, qbCustomerData);
              successCount++;
            } catch (err: any) {
              console.error(`Failed to sync customer ${customer.name}:`, err);
              failCount++;
              
              // If error is duplicate, count it as success
              if (err.response?.data?.detail?.includes('duplicate') || 
                  err.response?.data?.detail?.includes('already exists')) {
                successCount++;
                failCount--;
              }
            }
          }
          
          message = `Customer Sync Complete!\n✓ Successfully synced: ${successCount}\n${failCount > 0 ? `✗ Failed: ${failCount}` : ''}`;
          break;
        }
          
        case 'invoices': {
          // Get all invoices
          try {
            const invoicesResponse = await api.get('/invoices');
            const invoices = invoicesResponse.data;
            
            if (!invoices || invoices.length === 0) {
              message = 'No invoices found to sync';
              break;
            }
            
            message = `Invoice sync is currently limited due to customer mapping requirements.\n\n` +
                     `Found ${invoices.length} invoice(s) in local database.\n\n` +
                     `To sync invoices:\n` +
                     `1. First sync all customers to QuickBooks\n` +
                     `2. Each invoice needs a valid QuickBooks CustomerRef\n` +
                     `3. Line items must reference QuickBooks Items\n` +
                     `4. Contact support for advanced mapping setup\n\n` +
                     `This feature will be enhanced in a future update.`;
          } catch (err) {
            message = 'Unable to fetch invoices from local database';
          }
          break;
        }
          
        case 'payments': {
          try {
            // Payments are nested under invoices
            const invoicesResponse = await api.get('/invoices');
            const invoices = invoicesResponse.data;
            
            // Count total payments across all invoices
            let paymentCount = 0;
            invoices.forEach((inv: any) => {
              if (inv.payments && Array.isArray(inv.payments)) {
                paymentCount += inv.payments.length;
              }
            });
            
            if (paymentCount === 0) {
              message = 'No payments found to sync';
              break;
            }
            
            message = `Payment sync is currently limited due to invoice mapping requirements.\n\n` +
                     `Found ${paymentCount} payment(s) in local database.\n\n` +
                     `To sync payments:\n` +
                     `1. First sync customers and invoices to QuickBooks\n` +
                     `2. Each payment needs a valid QuickBooks InvoiceRef\n` +
                     `3. Payment methods must map to QuickBooks accounts\n` +
                     `4. Contact support for advanced mapping setup\n\n` +
                     `This feature will be enhanced in a future update.`;
          } catch (err) {
            message = 'Unable to fetch payments from local database';
          }
          break;
        }
          
        case 'estimates': {
          try {
            const estimatesResponse = await api.get('/estimates');
            const estimates = estimatesResponse.data;
            
            if (!estimates || estimates.length === 0) {
              message = 'No estimates found to sync';
              break;
            }
            
            message = `Estimate sync is currently limited due to customer mapping requirements.\n\n` +
                     `Found ${estimates.length} estimate(s) in local database.\n\n` +
                     `To sync estimates:\n` +
                     `1. First sync all customers to QuickBooks\n` +
                     `2. Each estimate needs a valid QuickBooks CustomerRef\n` +
                     `3. Line items must reference QuickBooks Items\n` +
                     `4. Contact support for advanced mapping setup\n\n` +
                     `This feature will be enhanced in a future update.`;
          } catch (err) {
            message = 'Unable to fetch estimates from local database';
          }
          break;
        }
      }
      
      alert(message);
      fetchSyncLogs(); // Refresh logs
    } catch (error: any) {
      console.error(`Sync error for ${entityType}:`, error);
      alert(error.response?.data?.detail || `Failed to sync ${entityType}. Please check your connection and try again.`);
    } finally {
      setSyncingEntity(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    return status === 'success' ? (
      <CheckCircle2 className="w-4 h-4 text-green-500" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-red-500" />
    );
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'customer':
        return <Users className="w-4 h-4" />;
      case 'invoice':
        return <FileText className="w-4 h-4" />;
      case 'payment':
        return <CreditCard className="w-4 h-4" />;
      case 'estimate':
        return <FileCheck className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <PageHeader
        title="Quickbooks"
        subtitle="Manage quickbooks"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Quickbooks" }]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </div>
    );
  }

  return (
    <PageHeader>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-[#112d4e]">QuickBooks Online Integration</h1>
          <p className="text-gray-600 mt-2">
            Connect your QuickBooks Online account to automatically sync customers, invoices, payments, and estimates.
          </p>
        </div>

        {/* Connection Status Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-[#112d4e]">Connection Status</h2>
              {connection?.connected && connection.company_name && (
                <p className="text-gray-600 mt-1">Connected to: {connection.company_name}</p>
              )}
            </div>
            <div className={`px-4 py-2 rounded-full ${connection?.connected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {connection?.connected ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <X className="w-5 h-5" />
                  <span className="font-medium">Not Connected</span>
                </div>
              )}
            </div>
          </div>

          {connection?.connected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Realm ID:</span>
                <span className="font-mono text-gray-800">{connection.realm_id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Connected Since:</span>
                <span className="text-gray-800">{connection.connected_since ? formatDate(connection.connected_since) : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Token Expires:</span>
                <span className="text-gray-800">{connection.token_expires_at ? formatDate(connection.token_expires_at) : 'N/A'}</span>
              </div>
              <div className="pt-4 border-t">
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Disconnect QuickBooks
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Connect your QuickBooks Online account to enable automatic syncing of financial data.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">What you'll need:</h3>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                  <li>QuickBooks Online account (sandbox or production)</li>
                  <li>Admin access to your QuickBooks company</li>
                  <li>QuickBooks Client ID and Client Secret (contact your admin)</li>
                </ul>
              </div>
              <button
                onClick={handleConnect}
                className="px-6 py-3 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                Connect to QuickBooks
              </button>
            </div>
          )}
        </div>

        {/* Sync Settings (only show when connected) */}
        {connection?.connected && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#112d4e]">Sync Settings</h2>
              <SettingsIcon className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-[#112d4e]">Enable Syncing</p>
                  <p className="text-sm text-gray-600">Turn on/off automatic syncing</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncSettings.sync_enabled}
                    onChange={(e) => setSyncSettings({ ...syncSettings, sync_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3f72af]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-[#112d4e]">Sync Direction</p>
                  <p className="text-sm text-gray-600">Choose sync direction</p>
                </div>
                <select
                  value={syncSettings.sync_direction}
                  onChange={(e) => setSyncSettings({ ...syncSettings, sync_direction: e.target.value })}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="one_way">One-way (to QuickBooks)</option>
                  <option value="two_way">Two-way (bidirectional)</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <p className="font-medium text-[#112d4e] mb-3">Auto-sync entities:</p>
                
                {[
                  { key: 'auto_sync_customers', label: 'Customers', icon: Users, entityType: 'customers' },
                  { key: 'auto_sync_invoices', label: 'Invoices', icon: FileText, entityType: 'invoices' },
                  { key: 'auto_sync_payments', label: 'Payments', icon: CreditCard, entityType: 'payments' },
                  { key: 'auto_sync_estimates', label: 'Estimates', icon: FileCheck, entityType: 'estimates' },
                ].map(({ key, label, icon: Icon, entityType }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-800">{label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSyncEntity(entityType)}
                        disabled={syncingEntity === entityType}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Sync all ${label.toLowerCase()} to QuickBooks`}
                      >
                        {syncingEntity === entityType ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3" />
                            Sync Now
                          </>
                        )}
                      </button>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={syncSettings[key as keyof typeof syncSettings] as boolean}
                          onChange={(e) => setSyncSettings({ ...syncSettings, [key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3f72af]"></div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t flex justify-end">
                <button
                  onClick={handleUpdateSyncSettings}
                  disabled={savingSettings}
                  className="px-6 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {savingSettings ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sync Logs (only show when connected) */}
        {connection?.connected && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#112d4e]">Recent Sync Activity</h2>
              <button
                onClick={fetchSyncLogs}
                className="text-sm text-[#3f72af] hover:text-[#2c5282] flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {syncLogs.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Sync Activity Yet</h3>
                <p className="text-gray-600 mb-4">
                  When you create customers, invoices, payments, or estimates, they will automatically sync to QuickBooks.
                </p>
                <p className="text-sm text-gray-500">
                  Sync logs will appear here showing the status of each operation.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {syncLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {getStatusIcon(log.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getEntityIcon(log.entity_type)}
                          <span className="capitalize">{log.entity_type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-sm">{log.operation}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-gray-600">{log.entity_id || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{formatDate(log.created_at)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}

        {/* Features Overview */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-[#112d4e] mb-4">Integration Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: Users,
                title: 'Customer Sync',
                description: 'Automatically sync customer data between systems',
              },
              {
                icon: FileText,
                title: 'Invoice Sync',
                description: 'Create and update invoices in QuickBooks',
              },
              {
                icon: CreditCard,
                title: 'Payment Sync',
                description: 'Record payments and track receivables',
              },
              {
                icon: FileCheck,
                title: 'Estimate Sync',
                description: 'Sync estimates and quotes to QuickBooks',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"
              >
                <div className="p-2 bg-[#3f72af] bg-opacity-10 rounded-lg">
                  <feature.icon className="w-5 h-5 text-[#3f72af]" />
                </div>
                <div>
                  <h3 className="font-medium text-[#112d4e]">{feature.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
