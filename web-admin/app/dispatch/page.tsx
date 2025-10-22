'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import api from '@/lib/api';
import {
  Plus,
  Search,
  Eye,
  Calendar,
  Users,
  Truck,
  MapPin,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  Map as MapIcon,
  List,
} from 'lucide-react';

interface Dispatch {
  _id: string;
  route_name: string;
  scheduled_date: string;
  scheduled_time: string;
  services: string[];
  crew_ids: string[];
  equipment_ids: string[];
  site_ids: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export default function DispatchesPage() {
  const router = useRouter();
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [view, setView] = useState<'list' | 'map'>('list');

  useEffect(() => {
    loadDispatches();
  }, []);

  const loadDispatches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dispatches');
      setDispatches(response.data || []);
    } catch (error) {
      console.error('Error loading dispatches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <PlayCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const filteredDispatches = dispatches.filter(dispatch => {
    const matchesSearch = 
      dispatch.route_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || dispatch.status === filterStatus;
    
    let matchesDate = true;
    if (filterDate !== 'all') {
      const dispatchDate = new Date(dispatch.scheduled_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (filterDate === 'today') {
        matchesDate = dispatchDate.toDateString() === today.toDateString();
      } else if (filterDate === 'upcoming') {
        matchesDate = dispatchDate > today;
      } else if (filterDate === 'past') {
        matchesDate = dispatchDate < today;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Calculate summary statistics
  const stats = {
    total: dispatches.length,
    scheduled: dispatches.filter(d => d.status === 'scheduled').length,
    inProgress: dispatches.filter(d => d.status === 'in_progress').length,
    completed: dispatches.filter(d => d.status === 'completed').length,
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dispatch</h1>
            <p className="text-gray-600 mt-1">Manage crew assignments and service routes</p>
          </div>
          <button
            onClick={() => router.push('/dispatch/create')}
            className="flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Dispatch</span>
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Dispatches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Calendar className="w-10 h-10 text-gray-300" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Scheduled</p>
                <p className="text-2xl font-bold text-[#3f72af]">{stats.scheduled}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-300" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <PlayCircle className="w-10 h-10 text-yellow-300" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-300" />
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="mb-6 flex space-x-2">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
              view === 'list'
                ? 'bg-[#3f72af] text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
            }`}
          >
            <List className="w-4 h-4 inline-block mr-2" />
            List View
          </button>
          <button
            onClick={() => setView('map')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
              view === 'map'
                ? 'bg-[#3f72af] text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
            }`}
          >
            <MapIcon className="w-4 h-4 inline-block mr-2" />
            Live Map
          </button>
        </div>

        {/* Filters - Show in list view only */}
        {view === 'list' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by route name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
              <button
                onClick={loadDispatches}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        )}

        {/* Map View */}
        {view === 'map' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="text-center py-16">
              <MapIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Live Dispatch Map</h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Interactive map showing real-time crew locations, active dispatch routes, and service sites.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-[#3f72af] rounded-full"></div>
                    <h4 className="font-semibold text-gray-900">Crew Locations</h4>
                  </div>
                  <p className="text-sm text-gray-600">Real-time GPS tracking of all active crews</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <h4 className="font-semibold text-gray-900">Service Sites</h4>
                  </div>
                  <p className="text-sm text-gray-600">All scheduled service locations plotted</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                    <h4 className="font-semibold text-gray-900">Active Routes</h4>
                  </div>
                  <p className="text-sm text-gray-600">Optimized routes with ETA calculations</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-6">
                Map integration with Google Maps API • Color-coded status indicators • Drag-and-drop dispatch assignment
              </p>
            </div>
          </div>
        )}

        {/* Dispatches List - Show in list view only */}
        {view === 'list' && (filteredDispatches.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Dispatches Found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterStatus !== 'all' || filterDate !== 'all'
                ? 'Try adjusting your search or filters' 
                : 'Get started by creating your first dispatch'}
            </p>
            {!searchQuery && filterStatus === 'all' && filterDate === 'all' && (
              <button
                onClick={() => router.push('/dispatch/create')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create First Dispatch</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDispatches.map((dispatch) => (
              <div
                key={dispatch._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dispatch/${dispatch._id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {dispatch.route_name}
                    </h3>
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dispatch.status)}`}>
                      {getStatusIcon(dispatch.status)}
                      <span>{dispatch.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                </div>

                {/* Schedule Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{new Date(dispatch.scheduled_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{dispatch.scheduled_time}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <Users className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                    <p className="text-xs text-gray-600">Crew</p>
                    <p className="text-sm font-semibold text-gray-900">{dispatch.crew_ids?.length || 0}</p>
                  </div>
                  <div className="text-center">
                    <Truck className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                    <p className="text-xs text-gray-600">Equipment</p>
                    <p className="text-sm font-semibold text-gray-900">{dispatch.equipment_ids?.length || 0}</p>
                  </div>
                  <div className="text-center">
                    <MapPin className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                    <p className="text-xs text-gray-600">Sites</p>
                    <p className="text-sm font-semibold text-gray-900">{dispatch.site_ids?.length || 0}</p>
                  </div>
                </div>

                {/* Services */}
                {dispatch.services && dispatch.services.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-2">Services:</p>
                    <div className="flex flex-wrap gap-1">
                      {dispatch.services.slice(0, 3).map((service, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {service.replace('_', ' ')}
                        </span>
                      ))}
                      {dispatch.services.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          +{dispatch.services.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dispatch/${dispatch._id}`);
                  }}
                  className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </HybridNavigationTopBar>
  );
}
