'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';
import api from '@/lib/api';
import {
  MapPin,
  Radio,
  Save,
  History,
  Clock,
  User,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  Bell,
  BellOff,
  Map as MapIcon,
  List,
  Activity,
  Settings,
  Search,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';

interface SiteGeofence {
  id?: string;
  site_id: string;
  site_name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  alert_on_entry?: boolean;
  alert_on_exit?: boolean;
  alert_recipients?: string[];
  exists?: boolean;
  created_at?: string;
  updated_at?: string;
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

interface GeofenceStats {
  total_geofences: number;
  active_geofences: number;
  total_events_today: number;
  entry_events_today: number;
  exit_events_today: number;
  active_crews_in_zones: number;
}

export default function GeofenceManagementPage() {
  const router = useRouter();
  const [geofences, setGeofences] = useState<SiteGeofence[]>([]);
  const [logs, setLogs] = useState<GeofenceLog[]>([]);
  const [stats, setStats] = useState<GeofenceStats>({
    total_geofences: 0,
    active_geofences: 0,
    total_events_today: 0,
    entry_events_today: 0,
    exit_events_today: 0,
    active_crews_in_zones: 0,
  });
  
  const [selectedGeofence, setSelectedGeofence] = useState<SiteGeofence | null>(null);
  const [editingRadius, setEditingRadius] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'map' | 'logs' | 'analytics'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    loadGeofences();
    loadLogs();
    loadStats();
  }, []);

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
          is_active: false,
          alert_on_entry: false,
          alert_on_exit: false,
          alert_recipients: [],
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
      const response = await api.get('/geofence-logs?limit=100');
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error loading geofence logs:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Calculate stats from geofences and logs
      const activeGeofences = geofences.filter(g => g.is_active).length;
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = logs.filter(log => log.timestamp.startsWith(today));
      
      setStats({
        total_geofences: geofences.length,
        active_geofences: activeGeofences,
        total_events_today: todayLogs.length,
        entry_events_today: todayLogs.filter(l => l.event_type === 'entry').length,
        exit_events_today: todayLogs.filter(l => l.event_type === 'exit').length,
        active_crews_in_zones: new Set(todayLogs.map(l => l.crew_id)).size,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
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
          is_active: true,
          alert_on_entry: geofence.alert_on_entry || false,
          alert_on_exit: geofence.alert_on_exit || false,
        });
      } else {
        // Update existing geofence
        await api.put(`/site-geofences/${geofence.site_id}`, {
          radius_meters: radius,
          is_active: geofence.is_active,
          alert_on_entry: geofence.alert_on_entry,
          alert_on_exit: geofence.alert_on_exit,
        });
      }
      
      alert('Geofence saved successfully!');
      loadGeofences();
      loadStats();
    } catch (error) {
      console.error('Error saving geofence:', error);
      alert('Failed to save geofence');
    } finally {
      setSaving(null);
    }
  };

  const handleToggleActive = async (geofence: SiteGeofence) => {
    try {
      await api.put(`/site-geofences/${geofence.site_id}`, {
        is_active: !geofence.is_active,
      });
      loadGeofences();
      loadStats();
    } catch (error) {
      console.error('Error toggling geofence:', error);
      alert('Failed to toggle geofence');
    }
  };

  const handleDeleteGeofence = async (geofence: SiteGeofence) => {
    if (!confirm(`Are you sure you want to delete the geofence for ${geofence.site_name}?`)) {
      return;
    }
    
    try {
      await api.delete(`/site-geofences/${geofence.site_id}`);
      alert('Geofence deleted successfully!');
      loadGeofences();
      loadStats();
    } catch (error) {
      console.error('Error deleting geofence:', error);
      alert('Failed to delete geofence');
    }
  };

  const filteredGeofences = geofences.filter(g => {
    const matchesSearch = g.site_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && g.is_active) ||
      (filterStatus === 'inactive' && !g.is_active);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <HybridNavigationTopBar>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading geofence data...</p>
          </div>
        </div>
      </HybridNavigationTopBar>
    );
  }

  return (
    <HybridNavigationTopBar>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Compact Header */}
          <CompactHeader
            title="Geofence Management"
            subtitle="Configure automatic site entry/exit detection zones"
            backUrl="/sites"
            icon={Radio}
            actions={[
              {
                label: 'Refresh',
                icon: RefreshCw,
                onClick: () => {
                  loadGeofences();
                  loadLogs();
                  loadStats();
                },
                variant: 'secondary',
              },
            ]}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Geofences</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_geofences}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <MapIcon className="w-6 h-6 text-[#3f72af]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Zones</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.active_geofences}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Radio className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Events Today</p>
                  <p className="text-3xl font-bold text-[#3f72af] mt-2">{stats.total_events_today}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.entry_events_today} entries • {stats.exit_events_today} exits
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Activity className="w-6 h-6 text-[#3f72af]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Crews</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{stats.active_crews_in_zones}</p>
                  <p className="text-xs text-gray-500 mt-1">In geofenced zones</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <User className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="mb-4 flex space-x-2">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                view === 'list'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <List className="w-4 h-4 inline-block mr-2" />
              List View
            </button>
            <button
              onClick={() => setView('map')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                view === 'map'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MapIcon className="w-4 h-4 inline-block mr-2" />
              Map View
            </button>
            <button
              onClick={() => setView('logs')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                view === 'logs'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <History className="w-4 h-4 inline-block mr-2" />
              Event Logs
            </button>
            <button
              onClick={() => setView('analytics')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                view === 'analytics'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Activity className="w-4 h-4 inline-block mr-2" />
              Analytics
            </button>
          </div>

          {/* List View */}
          {view === 'list' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search geofences by site name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredGeofences.length === 0 ? (
                  <div className="p-12 text-center">
                    <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No geofences found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {searchQuery || filterStatus !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Create geofences for your sites to enable automatic tracking'}
                    </p>
                  </div>
                ) : (
                  filteredGeofences.map((geofence) => {
                    const radius = editingRadius[geofence.site_id] ?? geofence.radius_meters;
                    const hasChanges = editingRadius[geofence.site_id] !== undefined;
                    
                    return (
                      <div key={geofence.site_id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <MapPin className="w-5 h-5 text-[#3f72af] flex-shrink-0" />
                              <h3 className="font-semibold text-gray-900 truncate">{geofence.site_name}</h3>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {geofence.exists === false ? (
                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                                    Not Configured
                                  </span>
                                ) : geofence.is_active ? (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                                    <Radio className="w-3 h-3" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                    Inactive
                                  </span>
                                )}
                                {hasChanges && (
                                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Unsaved
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">
                              {geofence.latitude.toFixed(6)}, {geofence.longitude.toFixed(6)}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4">
                              <label className="flex items-center gap-2">
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
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <span className="text-sm text-gray-600">m</span>
                                <span className="text-xs text-gray-500">
                                  (≈ {(radius * 3.28084).toFixed(0)} ft)
                                </span>
                              </label>
                              
                              {geofence.exists !== false && (
                                <>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={geofence.alert_on_entry || false}
                                      onChange={(e) => {
                                        const updated = geofences.map(g =>
                                          g.site_id === geofence.site_id
                                            ? { ...g, alert_on_entry: e.target.checked }
                                            : g
                                        );
                                        setGeofences(updated);
                                      }}
                                      className="w-4 h-4 text-[#3f72af] rounded focus:ring-blue-500"
                                    />
                                    <Bell className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm text-gray-700">Alert on Entry</span>
                                  </label>
                                  
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={geofence.alert_on_exit || false}
                                      onChange={(e) => {
                                        const updated = geofences.map(g =>
                                          g.site_id === geofence.site_id
                                            ? { ...g, alert_on_exit: e.target.checked }
                                            : g
                                        );
                                        setGeofences(updated);
                                      }}
                                      className="w-4 h-4 text-[#3f72af] rounded focus:ring-blue-500"
                                    />
                                    <Bell className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm text-gray-700">Alert on Exit</span>
                                  </label>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {geofence.exists !== false && (
                              <button
                                onClick={() => handleToggleActive(geofence)}
                                className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                                  geofence.is_active
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {geofence.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleSaveGeofence(geofence)}
                              disabled={saving === geofence.site_id}
                              className="px-3 py-1.5 bg-[#3f72af] hover:bg-[#2c5282] disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                            >
                              <Save className="w-4 h-4" />
                              <span>{saving === geofence.site_id ? 'Saving...' : 'Save'}</span>
                            </button>
                            
                            {geofence.exists !== false && (
                              <button
                                onClick={() => handleDeleteGeofence(geofence)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Map View */}
          {view === 'map' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <MapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Map View</h3>
                <p className="text-gray-600 mb-4">
                  Interactive map visualization of all geofences with real-time crew locations
                </p>
                <p className="text-sm text-gray-500">
                  Map integration with Google Maps API will display:
                  <br />• All configured geofences with radius circles
                  <br />• Site markers with status indicators
                  <br />• Real-time crew positions
                  <br />• Entry/exit event history
                </p>
              </div>
            </div>
          )}

          {/* Event Logs View */}
          {view === 'logs' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Geofence Event Logs</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Recent geofence entry and exit events
                  </p>
                </div>
                <button
                  onClick={() => loadLogs()}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="p-12 text-center">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No geofence events recorded yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Events will appear here when crews enter or exit geofenced zones
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                  {logs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg flex-shrink-0 ${
                            log.event_type === 'entry'
                              ? 'bg-green-100'
                              : 'bg-orange-100'
                          }`}
                        >
                          {log.event_type === 'entry' ? (
                            <TrendingDown className="w-5 h-5 text-green-600" />
                          ) : (
                            <TrendingUp className="w-5 h-5 text-orange-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {log.event_type === 'entry' ? 'Entered' : 'Exited'} Geofence
                            </h3>
                            {log.manual_click && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                Manual
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{log.crew_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{log.site_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
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

          {/* Analytics View */}
          {view === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Geofence Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Most Active Zones (Today)</h3>
                    <div className="space-y-2">
                      {/* Placeholder for actual analytics */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-900">Loading analytics...</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Crew Activity</h3>
                    <div className="space-y-2">
                      {/* Placeholder for crew analytics */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-900">Loading crew data...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Timeline</h2>
                <p className="text-sm text-gray-600">
                  Visual timeline of all geofence events will be displayed here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </HybridNavigationTopBar>
  );
}
