'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
  ArrowLeft,
  MapPin,
  Radio,
  Save,
  History,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface SiteGeofence {
  id?: string;
  site_id: string;
  site_name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  exists?: boolean;
}

interface GeofenceLog {
  id: string;
  crew_id: string;
  crew_name: string;
  site_id: string;
  site_name: string;
  dispatch_id?: string;
  event_type: 'entry' | 'exit';
  latitude: number;
  longitude: number;
  timestamp: string;
  manual_click: boolean;
  notes?: string;
}

export default function GeofenceManagementPage() {
  const router = useRouter();
  const [geofences, setGeofences] = useState<SiteGeofence[]>([]);
  const [logs, setLogs] = useState<GeofenceLog[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [editingRadius, setEditingRadius] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [view, setView] = useState<'geofences' | 'logs'>('geofences');

  useEffect(() => {
    loadGeofences();
    loadLogs();
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      loadSiteHistory(selectedSiteId);
    }
  }, [selectedSiteId]);

  const loadGeofences = async () => {
    try {
      const response = await api.get('/site-geofences');
      setGeofences(response.data.geofences || []);
      
      // Also load sites without geofences
      const sitesResponse = await api.get('/sites?active=true');
      const sites = sitesResponse.data.filter(
        (site: any) => site.location?.latitude && site.location?.longitude
      );
      
      // Add sites that don't have geofences yet
      const existingGeofenceSiteIds = new Set(
        response.data.geofences.map((g: SiteGeofence) => g.site_id)
      );
      
      const sitesWithoutGeofences = sites
        .filter((site: any) => !existingGeofenceSiteIds.has(site.id))
        .map((site: any) => ({
          site_id: site.id,
          site_name: site.name,
          latitude: site.location.latitude,
          longitude: site.location.longitude,
          radius_meters: 100,
          is_active: true,
          exists: false,
        }));
      
      setGeofences([...response.data.geofences, ...sitesWithoutGeofences]);
    } catch (error) {
      console.error('Error loading geofences:', error);
      alert('Failed to load geofences');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await api.get('/geofence-logs?limit=50');
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error loading geofence logs:', error);
    }
  };

  const loadSiteHistory = async (siteId: string) => {
    try {
      const response = await api.get(`/geofence-logs/site/${siteId}/history?days=7`);
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error loading site history:', error);
    }
  };

  const handleRadiusChange = (siteId: string, radius: number) => {
    setEditingRadius({ ...editingRadius, [siteId]: radius });
  };

  const handleSaveGeofence = async (geofence: SiteGeofence) => {
    setSaving(geofence.site_id);
    try {
      const radius = editingRadius[geofence.site_id] || geofence.radius_meters;
      
      if (geofence.exists === false) {
        // Create new geofence
        await api.post('/site-geofences', {
          site_id: geofence.site_id,
          radius_meters: radius,
        });
      } else {
        // Update existing geofence
        await api.put(`/site-geofences/${geofence.site_id}`, {
          radius_meters: radius,
        });
      }
      
      alert('Geofence saved successfully!');
      loadGeofences();
    } catch (error) {
      console.error('Error saving geofence:', error);
      alert('Failed to save geofence');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading geofence data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/sites')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Geofence Management</h1>
                <p className="text-gray-600 mt-1">
                  Configure automatic site entry/exit detection
                </p>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="mb-6 flex space-x-4">
            <button
              onClick={() => setView('geofences')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                view === 'geofences'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Radio className="w-5 h-5 inline-block mr-2" />
              Geofence Configuration
            </button>
            <button
              onClick={() => setView('logs')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                view === 'logs'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <History className="w-5 h-5 inline-block mr-2" />
              Event Logs
            </button>
          </div>

          {view === 'geofences' ? (
            /* Geofence Configuration View */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Site Geofences</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Set the radius for automatic entry/exit detection at each site
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {geofences.map((geofence) => {
                  const radius = editingRadius[geofence.site_id] ?? geofence.radius_meters;
                  const hasChanges = editingRadius[geofence.site_id] !== undefined;
                  
                  return (
                    <div key={geofence.site_id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-gray-900">{geofence.site_name}</h3>
                            {geofence.exists === false && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                                Not Configured
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {geofence.latitude.toFixed(6)}, {geofence.longitude.toFixed(6)}
                          </p>
                          
                          <div className="mt-4 flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700">Radius:</span>
                              <input
                                type="number"
                                min="10"
                                max="1000"
                                step="10"
                                value={radius}
                                onChange={(e) =>
                                  handleRadiusChange(geofence.site_id, Number(e.target.value))
                                }
                                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <span className="text-sm text-gray-600">meters</span>
                            </label>
                            
                            <div className="text-sm text-gray-600">
                              ≈ {(radius * 3.28084).toFixed(0)} feet
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          {hasChanges && (
                            <div className="flex items-center space-x-2 text-orange-600 text-sm font-medium">
                              <AlertCircle className="w-4 h-4" />
                              <span>Unsaved</span>
                            </div>
                          )}
                          <button
                            onClick={() => handleSaveGeofence(geofence)}
                            disabled={saving === geofence.site_id}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                          >
                            <Save className="w-4 h-4" />
                            <span>{saving === geofence.site_id ? 'Saving...' : 'Save'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSiteId(geofence.site_id);
                              setView('logs');
                            }}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Event Logs View */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Geofence Event Logs</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedSiteId
                        ? 'Last 7 days for selected site'
                        : 'Recent geofence entry/exit events'}
                    </p>
                  </div>
                  {selectedSiteId && (
                    <button
                      onClick={() => {
                        setSelectedSiteId(null);
                        loadLogs();
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      Show All Events
                    </button>
                  )}
                </div>
              </div>

              {logs.length === 0 ? (
                <div className="p-12 text-center">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No geofence events recorded yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-4">
                        <div
                          className={`p-3 rounded-lg ${
                            log.event_type === 'entry'
                              ? 'bg-green-100'
                              : 'bg-orange-100'
                          }`}
                        >
                          {log.event_type === 'entry' ? (
                            <TrendingDown className="w-6 h-6 text-green-600" />
                          ) : (
                            <TrendingUp className="w-6 h-6 text-orange-600" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {log.event_type === 'entry' ? 'Entered' : 'Exited'} Geofence
                            </h3>
                            {log.manual_click && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                Manual
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>{log.crew_name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4" />
                              <span>{log.site_name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            {log.notes && (
                              <p className="text-xs text-gray-500 italic mt-2">{log.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
