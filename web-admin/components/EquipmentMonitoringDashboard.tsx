"use client";

import React, { useState, useEffect } from 'react';
import { useWebSocketEvent, EventType } from '@/lib/WebSocketContext';

interface Equipment {
  id: string;
  name: string;
  type: string;
  make?: string;
  model?: string;
  status: string;
  health_score: number;
  total_hours: number;
  iot_device_id?: string;
  last_maintenance?: string;
  next_maintenance_due?: string;
  alerts: Alert[];
}

interface Alert {
  type: string;
  severity: string;
  message: string;
  timestamp: string;
}

interface DashboardStats {
  total_equipment: number;
  active_equipment: number;
  needs_maintenance: number;
  overdue_maintenance: number;
  average_health: number;
  total_operating_hours: number;
}

export default function EquipmentMonitoringDashboard() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Subscribe to real-time equipment alerts
  useWebSocketEvent('equipment_alert', () => {
    fetchEquipment();
    fetchStats();
  });

  useEffect(() => {
    fetchEquipment();
    fetchStats();
  }, [filterStatus, filterType]);

  const fetchEquipment = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      let url = `${backendUrl}/api/equipment`;
      
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);
      
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setEquipment(data.equipment);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/equipment/dashboard/stats`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-600';
    if (health >= 60) return 'text-yellow-600';
    if (health >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (health: number) => {
    if (health >= 80) return 'bg-green-100 border-green-500';
    if (health >= 60) return 'bg-yellow-100 border-yellow-500';
    if (health >= 40) return 'bg-orange-100 border-orange-500';
    return 'bg-red-100 border-red-500';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const EquipmentCard = ({ eq }: { eq: Equipment }) => (
    <div
      onClick={() => setSelectedEquipment(eq)}
      className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-lg transition-shadow ${getHealthBgColor(
        eq.health_score
      )}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg">{eq.name}</h3>
          <p className="text-sm text-gray-600">
            {eq.make} {eq.model} • {eq.type}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            eq.status === 'active'
              ? 'bg-green-200 text-green-800'
              : eq.status === 'maintenance'
              ? 'bg-orange-200 text-orange-800'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          {eq.status}
        </span>
      </div>

      {/* Health Score */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">Health Score</span>
          <span className={`text-2xl font-bold ${getHealthColor(eq.health_score)}`}>
            {eq.health_score}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              eq.health_score >= 80
                ? 'bg-green-500'
                : eq.health_score >= 60
                ? 'bg-yellow-500'
                : eq.health_score >= 40
                ? 'bg-orange-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${eq.health_score}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-center p-2 bg-white rounded">
          <div className="text-lg font-bold">{eq.total_hours.toFixed(0)}</div>
          <div className="text-xs text-gray-600">Hours</div>
        </div>
        <div className="text-center p-2 bg-white rounded">
          <div className="text-lg font-bold">{eq.alerts.length}</div>
          <div className="text-xs text-gray-600">Alerts</div>
        </div>
      </div>

      {/* Alerts Preview */}
      {eq.alerts.length > 0 && (
        <div className="space-y-1">
          {eq.alerts.slice(0, 2).map((alert, idx) => (
            <div
              key={idx}
              className={`text-xs p-2 rounded border ${getSeverityColor(alert.severity)}`}
            >
              {alert.message}
            </div>
          ))}
          {eq.alerts.length > 2 && (
            <div className="text-xs text-gray-600 text-center">
              +{eq.alerts.length - 2} more alerts
            </div>
          )}
        </div>
      )}

      {/* IoT Status */}
      {eq.iot_device_id && (
        <div className="mt-3 flex items-center text-xs text-gray-600">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
          IoT Connected
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Loading equipment data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Equipment Monitoring Dashboard
        </h1>
        <p className="text-gray-600">
          Real-time equipment health monitoring and predictive maintenance
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-gray-900">{stats.total_equipment}</div>
            <div className="text-sm text-gray-600">Total Equipment</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-green-700">{stats.active_equipment}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-yellow-700">{stats.needs_maintenance}</div>
            <div className="text-sm text-gray-600">Needs Maintenance</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-red-700">{stats.overdue_maintenance}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-blue-700">{stats.average_health.toFixed(0)}%</div>
            <div className="text-sm text-gray-600">Avg Health</div>
          </div>
          <div className="bg-purple-50 rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-purple-700">
              {stats.total_operating_hours.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Total Hours</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="all">All Types</option>
              <option value="plow">Plow</option>
              <option value="truck">Truck</option>
              <option value="spreader">Spreader</option>
              <option value="shovel">Shovel</option>
              <option value="blower">Blower</option>
            </select>
          </div>

          <div className="ml-auto">
            <button
              onClick={() => {
                fetchEquipment();
                fetchStats();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {equipment.map((eq) => (
          <EquipmentCard key={eq.id} eq={eq} />
        ))}
        {equipment.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No equipment found with the selected filters
          </div>
        )}
      </div>

      {/* Equipment Detail Modal */}
      {selectedEquipment && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEquipment(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold">{selectedEquipment.name}</h3>
                <p className="text-gray-600">
                  {selectedEquipment.make} {selectedEquipment.model}
                </p>
              </div>
              <button
                onClick={() => setSelectedEquipment(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Health Score Circle */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={
                      selectedEquipment.health_score >= 80
                        ? '#10b981'
                        : selectedEquipment.health_score >= 60
                        ? '#eab308'
                        : selectedEquipment.health_score >= 40
                        ? '#f97316'
                        : '#ef4444'
                    }
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(selectedEquipment.health_score / 100) * 351.86} 351.86`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getHealthColor(selectedEquipment.health_score)}`}>
                      {selectedEquipment.health_score}%
                    </div>
                    <div className="text-xs text-gray-600">Health</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-600">Type</div>
                <div className="font-semibold">{selectedEquipment.type}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className="font-semibold">{selectedEquipment.status}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Hours</div>
                <div className="font-semibold">{selectedEquipment.total_hours.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">IoT Device</div>
                <div className="font-semibold">{selectedEquipment.iot_device_id || 'Not connected'}</div>
              </div>
              {selectedEquipment.last_maintenance && (
                <div>
                  <div className="text-sm text-gray-600">Last Maintenance</div>
                  <div className="font-semibold">
                    {new Date(selectedEquipment.last_maintenance).toLocaleDateString()}
                  </div>
                </div>
              )}
              {selectedEquipment.next_maintenance_due && (
                <div>
                  <div className="text-sm text-gray-600">Next Maintenance</div>
                  <div className="font-semibold">
                    {new Date(selectedEquipment.next_maintenance_due).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            {/* Alerts */}
            {selectedEquipment.alerts.length > 0 && (
              <div>
                <h4 className="font-bold mb-3">Active Alerts</h4>
                <div className="space-y-2">
                  {selectedEquipment.alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded border ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-sm">{alert.type}</div>
                          <div className="text-sm mt-1">{alert.message}</div>
                        </div>
                        <span className="text-xs">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-2">
              <button className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Schedule Maintenance
              </button>
              <button className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300">
                View History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
