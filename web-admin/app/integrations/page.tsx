"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from '@/components/PageHeader';
import {
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Link as LinkIcon,
} from "lucide-react";

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
    loadSyncLogs();
  }, []);

  const loadIntegrations = async () => {
    try {
      const response = await fetch("/api/integrations");
      const data = await response.json();
      if (data.success) {
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error("Error loading integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const response = await fetch("/api/integrations/sync-logs?limit=10");
      const data = await response.json();
      if (data.success) {
        setSyncLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error loading sync logs:", error);
    }
  };

  const handleConnect = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/connect`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        loadIntegrations();
      }
    } catch (error) {
      console.error("Error connecting integration:", error);
    }
  };

  const handleSync = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sync_type: "manual" }),
      });
      const data = await response.json();
      if (data.success) {
        loadSyncLogs();
      }
    } catch (error) {
      console.error("Error syncing integration:", error);
    }
  };

  const quickSyncActions = [
    {
      name: "QuickBooks Payroll",
      endpoint: "/api/integrations/quickbooks/payroll/sync",
      icon: "💰",
    },
    {
      name: "QuickBooks Time Tracking",
      endpoint: "/api/integrations/quickbooks/time-tracking/sync",
      icon: "⏰",
    },
    {
      name: "Microsoft 365 SSO",
      endpoint: "/api/integrations/microsoft365/sso/setup",
      icon: "🔐",
    },
    {
      name: "Microsoft Teams",
      endpoint: "/api/integrations/microsoft365/teams/sync",
      icon: "👥",
    },
  ];

  const handleQuickSync = async (endpoint: string) => {
    try {
      const response = await fetch(endpoint, { method: "POST" });
      const data = await response.json();
      if (data.success) {
        loadSyncLogs();
      }
    } catch (error) {
      console.error("Error in quick sync:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "text-green-600 bg-green-100";
      case "disconnected":
        return "text-gray-600 bg-gray-100";
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-yellow-600 bg-yellow-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-5 w-5" />;
      case "disconnected":
        return <XCircle className="h-5 w-5" />;
      case "error":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  return (
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <PageHeader
        title="Integrations"
        subtitle="Connect third-party services and tools"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Integrations" }]}
        title="Integration Hub"
          icon={LinkIcon}
          badges={[
            { label: `${integrations.length} Total`, color: "blue" },
            { label: `${integrations.filter((i: any) => i.status === "connected").length} Connected`, color: "green" },
          ]}
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 mt-6">
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Integrations</p>
                <p className="text-3xl font-bold text-gray-900">
                  {integrations.length}
                </p>
              </div>
              <LinkIcon className="h-12 w-12 text-blue-500" />
            </div></div>

          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connected</p>
                <p className="text-3xl font-bold text-green-600">
                  {
                    integrations.filter((i: any) => i.status === "connected")
                      .length
                  }
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div></div>

          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Sync</p>
                <p className="text-lg font-bold text-gray-900">
                  {syncLogs.length > 0 ? "Just now" : "Never"}
                </p>
              </div>
              <RefreshCw className="h-12 w-12 text-purple-500" />
            </div></div>

          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sync Logs</p>
                <p className="text-3xl font-bold text-gray-900">
                  {syncLogs.length}
                </p>
              </div>
              <BarChart3 className="h-12 w-12 text-orange-500" />
            </div></div></div>

        {/* Quick Sync Actions */}
        <div className="bg-white rounded-lg shadow p-4 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Sync Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {quickSyncActions.map((action) => (
              <button
                key={action.endpoint}
                onClick={() => handleQuickSync(action.endpoint)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors"
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-sm font-medium">{action.name}</span>
              </button>
            ))}
          </div></div>

        {/* Integrations List */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Available Integrations
            </h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors">
              <Plus className="h-4 w-4" />
              Add Integration
            </button></div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Loading integrations...
              </div>
            ) : integrations.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">
                  No integrations configured yet
                </p>
                <p className="text-sm text-gray-400">
                  Click "Add Integration" to get started
                </p>
              </div>
            ) : (
              integrations.map((integration: any) => (
                <div
                  key={integration.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-lg ${getStatusColor(
                          integration.status
                        )}`}
                      >
                        {getStatusIcon(integration.status)}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {integration.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {integration.description ||
                            `${integration.integration_type} integration`}
                        </p>
                        {integration.last_sync && (
                          <p className="text-xs text-gray-500 mt-1">
                            Last synced:{" "}
                            {new Date(integration.last_sync).toLocaleString()}
                          </p>
                        )}
                      </div></div>

                    <div className="flex items-center gap-2">
                      {integration.status === "connected" ? (
                        <button
                          onClick={() => handleSync(integration.id)}
                          className="px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Sync Now
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(integration.id)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          Connect
                        </button>
                      )}
                    </div></div></div>
              ))
            )}
          </div></div>

        {/* Recent Sync Logs */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Sync Activity
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {syncLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No sync activity yet
              </div>
            ) : (
              syncLogs.slice(0, 10).map((log: any) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {log.integration_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {log.sync_type} sync • {log.records_synced} records
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.started_at).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        log.status === "success"
                          ? "bg-green-100 text-green-800"
                          : log.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  {log.details?.mock && (
                    <p className="text-xs text-[#3f72af] mt-2">
                      🔵 Mock: {log.details.message}
                    </p>
                  )}
                </div>
              ))
            )}
          </div></div></div>
    );
}
