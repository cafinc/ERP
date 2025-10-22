'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
  ArrowLeft,
  Navigation,
  MapPin,
  Clock,
  TrendingDown,
  AlertCircle,
  Loader,
  GripVertical,
  RefreshCw,
  Save,
} from 'lucide-react';

interface Site {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  priority?: number;
}

interface RouteDetails {
  position: number;
  site_id: string;
  site_name: string;
  distance_from_previous_km?: number;
}

interface OptimizationResult {
  optimized_order: string[];
  original_order: string[];
  estimated_distance_km: number;
  original_distance_km: number;
  savings_km: number;
  savings_percentage: number;
  estimated_time_minutes: number;
  total_sites: number;
  route_details: RouteDetails[];
}

export default function RouteOptimizationPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const response = await api.get('/sites?active=true');
      const sitesData = response.data
        .filter((site: any) => site.location?.latitude && site.location?.longitude)
        .map((site: any) => ({
          id: site.id,
          name: site.name,
          address: site.address,
          location: site.location,
          priority: site.priority || 5,
        }));
      setSites(sitesData);
    } catch (error) {
      console.error('Error loading sites:', error);
      alert('Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  const handleSiteToggle = (siteId: string) => {
    setSelectedSiteIds((prev) =>
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId]
    );
    // Clear optimization result when selection changes
    setOptimizationResult(null);
  };

  const handleOptimize = async () => {
    if (selectedSiteIds.length < 2) {
      alert('Please select at least 2 sites to optimize');
      return;
    }

    setOptimizing(true);
    try {
      const response = await api.post('/routes/optimize', selectedSiteIds);
      setOptimizationResult(response.data);
      // Update selected site IDs to match optimized order
      setSelectedSiteIds(response.data.optimized_order);
    } catch (error) {
      console.error('Error optimizing route:', error);
      alert('Failed to optimize route');
    } finally {
      setOptimizing(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...selectedSiteIds];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    setSelectedSiteIds(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    // Clear optimization result after manual reordering
    setOptimizationResult(null);
  };

  const handleSaveRoute = async () => {
    if (selectedSiteIds.length === 0) {
      alert('No sites selected to save');
      return;
    }

    try {
      // Create a route template with the optimized order
      const routeName = `Route ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      await api.post('/routes', {
        name: routeName,
        stops: selectedSiteIds.map((siteId, index) => ({
          site_id: siteId,
          sequence: index + 1,
        })),
        is_template: true,
        estimated_duration_hours: optimizationResult
          ? optimizationResult.estimated_time_minutes / 60
          : 0,
      });

      alert('Route saved successfully!');
      router.push('/dispatch');
    } catch (error) {
      console.error('Error saving route:', error);
      alert('Failed to save route');
    }
  };

  const getSiteById = (siteId: string): Site | undefined => {
    return sites.find((s) => s.id === siteId);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f72af] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading sites...</p>
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
                onClick={() => router.push('/dispatch')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Route Optimization</h1>
                <p className="text-gray-600 mt-1">
                  Optimize your routes for efficiency and save time
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Site Selection Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Select Sites
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Choose sites to include in the route optimization
                </p>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sites.map((site) => (
                    <label
                      key={site.id}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSiteIds.includes(site.id)}
                        onChange={() => handleSiteToggle(site.id)}
                        className="w-5 h-5 text-[#3f72af] rounded focus:ring-blue-500 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {site.name}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {site.address}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleOptimize}
                    disabled={selectedSiteIds.length < 2 || optimizing}
                    className="w-full px-6 py-3 bg-[#3f72af] hover:bg-[#2c5282] disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    {optimizing ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Optimizing...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        <span>Optimize Route</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSaveRoute}
                    disabled={selectedSiteIds.length === 0}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>Save Route</span>
                  </button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-[#3f72af] flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Manual Reordering</p>
                      <p className="text-xs mt-1">
                        Drag and drop sites in the route list to manually reorder them
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Display & Stats */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards */}
              {optimizationResult && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Navigation className="w-6 h-6 text-[#3f72af]" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Distance</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {optimizationResult.estimated_distance_km}
                          <span className="text-sm font-normal text-gray-600 ml-1">km</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Clock className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Est. Time</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {Math.floor(optimizationResult.estimated_time_minutes / 60)}h{' '}
                          {optimizationResult.estimated_time_minutes % 60}m
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <TrendingDown className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Savings</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {optimizationResult.savings_km}
                          <span className="text-sm font-normal text-gray-600 ml-1">km</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <MapPin className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Sites</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {optimizationResult.total_sites}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Route List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Route Order
                  {optimizationResult && (
                    <span className="ml-2 text-sm font-normal text-green-600">
                      (Optimized - {optimizationResult.savings_percentage}% improvement)
                    </span>
                  )}
                </h2>

                {selectedSiteIds.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Select sites from the left panel to start building your route
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedSiteIds.map((siteId, index) => {
                      const site = getSiteById(siteId);
                      const routeDetail = optimizationResult?.route_details.find(
                        (rd) => rd.site_id === siteId
                      );

                      return (
                        <div
                          key={siteId}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border-2 transition-all cursor-move ${
                            draggedIndex === index
                              ? 'border-blue-400 shadow-lg scale-105'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <GripVertical className="w-5 h-5 text-gray-400" />
                            <div className="w-8 h-8 bg-[#3f72af] text-white rounded-full flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                          </div>

                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{site?.name}</p>
                            <p className="text-sm text-gray-600">{site?.address}</p>
                            {routeDetail?.distance_from_previous_km !== undefined &&
                              routeDetail.distance_from_previous_km > 0 && (
                                <p className="text-xs text-[#3f72af] mt-1">
                                  {routeDetail.distance_from_previous_km.toFixed(2)} km from
                                  previous
                                </p>
                              )}
                          </div>

                          <button
                            onClick={() => handleSiteToggle(siteId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
