'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import SiteMapAnnotation from '@/components/SiteMapAnnotationOptimized';
import api from '@/lib/api';
import {
  ArrowLeft,
  MapPin,
  RefreshCw,
  AlertCircle,
  Clock,
  Eye,
  Plus,
} from 'lucide-react';

interface Site {
  id: string;
  name: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

interface SiteMapData {
  id: string;
  version: number;
  name: string;
  base_map_type: string;
  base_map_data?: string;
  base_map_url?: string;
  annotations: any[];
  legend_items?: any[];
  created_at: string;
  updated_at: string;
  is_current: boolean;
}

export default function SiteMapsPage() {
  const router = useRouter();
  const params = useParams();
  const siteId = (Array.isArray(params?.id) ? params.id[0] : params?.id) as string;

  const [site, setSite] = useState<Site | null>(null);
  const [siteMaps, setSiteMaps] = useState<SiteMapData[]>([]);
  const [currentMap, setCurrentMap] = useState<SiteMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewMap, setShowNewMap] = useState(false);

  useEffect(() => {
    if (siteId && siteId !== 'undefined') {
      loadData();
    }
  }, [siteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load site details
      const siteResponse = await api.get(`/sites/${siteId}`);
      setSite(siteResponse.data);

      // Load site maps
      const mapsResponse = await api.get(`/site-maps/site/${siteId}`);
      setSiteMaps(mapsResponse.data || []);
      
      // Find current map
      const current = mapsResponse.data?.find((m: SiteMapData) => m.is_current);
      setCurrentMap(current || null);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMap = async (mapData: any) => {
    try {
      setSaving(true);
      
      const mapPayload = {
        site_id: siteId,
        name: `Site Map - ${new Date().toLocaleDateString()}`,
        base_map_type: 'uploaded_image',
        base_map_data: mapData.base_map_data,
        annotations: mapData.annotations?.objects || [],
        legend_items: mapData.legend_items || [],
      };

      await api.post('/site-maps', mapPayload);
      
      alert('Site map saved successfully!');
      loadData();
      setShowNewMap(false);
      
    } catch (error) {
      console.error('Error saving map:', error);
      alert('Failed to save site map');
    } finally {
      setSaving(false);
    }
  };

  const handleViewMap = (map: SiteMapData) => {
    setCurrentMap(map);
  };

  const handleNewMap = () => {
    setCurrentMap(null);
    setShowNewMap(true);
  };

  if (loading) {
    return (
      <HybridNavigationTopBar>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </HybridNavigationTopBar>
    );
  }

  if (!site) {
    return (
      <HybridNavigationTopBar>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Site not found</h2>
          <button
            onClick={() => router.push('/sites')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Return to Sites
          </button>
        </div>
      </HybridNavigationTopBar>
    );
  }

  return (
    <HybridNavigationTopBar>
      <div className="h-full flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/sites/${siteId}`)}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Site Maps</h1>
              <p className="text-gray-600 mt-1">{site.name}</p>
              <p className="text-sm text-gray-500">{site.location.address}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleNewMap}
              className="flex items-center gap-2 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Map
            </button>
          </div>
        </div>

        {/* Previous Maps Sidebar */}
        {siteMaps.length > 0 && !showNewMap && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Map Versions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {siteMaps.map((map) => (
                <button
                  key={map.id}
                  onClick={() => handleViewMap(map)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    currentMap?.id === map.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Version {map.version}</p>
                      <p className="text-xs text-gray-600 mt-1">{map.name}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(map.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {map.is_current && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        Current
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Map Editor/Viewer */}
        <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {(showNewMap || currentMap) ? (
            <SiteMapAnnotation
              siteId={siteId}
              siteName={site.name}
              siteAddress={site.location.address}
              initialMapData={currentMap?.base_map_data}
              initialAnnotations={currentMap?.annotations}
              onSave={handleSaveMap}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-12">
              <MapPin className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {siteMaps.length === 0 ? 'No Site Maps Yet' : 'Select a Map Version'}
              </h3>
              <p className="text-gray-600 mb-6">
                {siteMaps.length === 0
                  ? 'Create your first annotated site map to document layout, features, and work areas'
                  : 'Select a map version above or create a new one'}
              </p>
              <button
                onClick={handleNewMap}
                className="flex items-center gap-2 px-6 py-3 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create First Map
              </button>
            </div>
          )}
        </div>
      </div>
    </HybridNavigationTopBar>
  );
}
