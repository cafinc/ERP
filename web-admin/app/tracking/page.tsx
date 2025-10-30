'use client';

import PageHeader from '@/components/PageHeader';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  RefreshCw,
  Users,
  MapPin,
  Truck,
  Navigation,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';

interface CrewLocation {
  crew_id: string;
  crew_name: string;
  latitude: number;
  longitude: number;
  speed: number;
  bearing: number;
  accuracy: number;
  timestamp: string;
  dispatch_id?: string;
  status: string;
}

interface SiteMarker {
  site_id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  site_type: string;
  has_active_dispatch: boolean;
}

interface EquipmentLocation {
  equipment_id: string;
  equipment_name: string;
  equipment_type: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  dispatch_id?: string;
}

export default function LiveTrackingPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [crewLocations, setCrewLocations] = useState<CrewLocation[]>([]);
  const [sites, setSites] = useState<SiteMarker[]>([]);
  const [equipment, setEquipment] = useState<EquipmentLocation[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<'all' | 'crew' | 'sites' | 'equipment'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const markers = useRef<{ [key: string]: maplibregl.Marker }>({});

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 4,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {
      setLoading(false);
      loadAllData();
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadAllData();
    }, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadAllData = async () => {
    try {
      const [crewRes, sitesRes, equipmentRes] = await Promise.all([
        api.get('/gps-location/map/all-active'),
        api.get('/gps-location/map/sites'),
        api.get('/gps-location/map/equipment'),
      ]);

      setCrewLocations(crewRes.data.locations || []);
      setSites(sitesRes.data.sites || []);
      setEquipment(equipmentRes.data.equipment || []);

      updateMarkers(crewRes.data.locations || [], sitesRes.data.sites || [], equipmentRes.data.equipment || []);
    } catch (error) {
      console.error('Error loading map data:', error);
    }
  };

  const updateMarkers = (crew: CrewLocation[], sitesData: SiteMarker[], equipmentData: EquipmentLocation[]) => {
    if (!map.current) return;

    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Add crew markers
    if (selectedLayer === 'all' || selectedLayer === 'crew') {
      crew.forEach(location => {
        const el = document.createElement('div');
        el.className = 'crew-marker';
        el.innerHTML = `
          <div class="relative">
            <div class="w-10 h-10 bg-[#3f72af] rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <span class="text-white text-xs font-bold">${location.crew_name.charAt(0)}</span>
            </div>
            ${location.dispatch_id ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>' : ''}
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div class="p-2">
            <h3 class="font-bold text-sm">${location.crew_name}</h3>
            <p class="text-xs text-gray-600">Speed: ${Math.round(location.speed)} km/h</p>
            <p class="text-xs text-gray-600">Updated: ${new Date(location.timestamp).toLocaleTimeString()}</p>
            ${location.dispatch_id ? '<p class="text-xs text-green-600 font-medium">Active Dispatch</p>' : ''}
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([location.longitude, location.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markers.current[`crew-${location.crew_id}`] = marker;
      });
    }

    // Add site markers
    if (selectedLayer === 'all' || selectedLayer === 'sites') {
      sitesData.forEach(site => {
        const el = document.createElement('div');
        el.className = 'site-marker';
        el.innerHTML = `
          <div class="relative">
            <div class="w-8 h-8 ${site.has_active_dispatch ? 'bg-orange-500' : 'bg-gray-400'} rounded-lg border-2 border-white shadow-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
              </svg>
            </div>
        `;

        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div class="p-2">
            <h3 class="font-bold text-sm">${site.name}</h3>
            <p class="text-xs text-gray-600">${site.site_type}</p>
            ${site.address ? `<p class="text-xs text-gray-500 mt-1">${site.address}</p>` : ''}
            ${site.has_active_dispatch ? '<p class="text-xs text-orange-600 font-medium mt-1">Active Work</p>' : ''}
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([site.longitude, site.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markers.current[`site-${site.site_id}`] = marker;
      });
    }

    // Add equipment markers
    if (selectedLayer === 'all' || selectedLayer === 'equipment') {
      equipmentData.forEach(eq => {
        const el = document.createElement('div');
        el.className = 'equipment-marker';
        el.innerHTML = `
          <div class="w-9 h-9 bg-purple-600 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
            </svg>
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div class="p-2">
            <h3 class="font-bold text-sm">${eq.equipment_name}</h3>
            <p class="text-xs text-gray-600">${eq.equipment_type}</p>
            <p class="text-xs text-gray-500">Updated: ${new Date(eq.timestamp).toLocaleTimeString()}</p>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([eq.longitude, eq.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markers.current[`equipment-${eq.equipment_id}`] = marker;
      });
    }

    // Fit bounds to show all markers if there are any
    const allCoords: [number, number][] = [];
    if (selectedLayer === 'all' || selectedLayer === 'crew') {
      crew.forEach(l => allCoords.push([l.longitude, l.latitude]));
    }
    if (selectedLayer === 'all' || selectedLayer === 'sites') {
      sitesData.forEach(s => allCoords.push([s.longitude, s.latitude]));
    }
    if (selectedLayer === 'all' || selectedLayer === 'equipment') {
      equipmentData.forEach(e => allCoords.push([e.longitude, e.latitude]));
    }

    if (allCoords.length > 0 && map.current) {
      const bounds = allCoords.reduce((bounds, coord) => {
        return bounds.extend(coord as [number, number]);
      }, new maplibregl.LngLatBounds(allCoords[0], allCoords[0]));

      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  };

  useEffect(() => {
    updateMarkers(crewLocations, sites, equipment);
  }, [selectedLayer]);

  if (loading) {
    return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Tracking"
        subtitle="Manage tracking"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Tracking" }]}
      />
      <div className="flex items-center justify-center h-screen">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div></div>
  );
  }

  return (
      <div className="relative h-[calc(100vh-4rem)]">
        {/* Map Container */}
        <div ref={mapContainer} className="absolute inset-0" />

        {/* Controls Overlay */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10 space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Live Tracking
          </h2>

          {/* Layer Selector */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              Show Layers:
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedLayer('all')}
                className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                  selectedLayer === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                All ({crewLocations.length + sites.length + equipment.length})
              </button>
              <button
                onClick={() => setSelectedLayer('crew')}
                className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedLayer === 'crew'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4" />
                Crew ({crewLocations.length})
              </button>
              <button
                onClick={() => setSelectedLayer('sites')}
                className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedLayer === 'sites'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MapPin className="w-4 h-4" />
                Sites ({sites.length})
              </button>
              <button
                onClick={() => setSelectedLayer('equipment')}
                className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedLayer === 'equipment'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Truck className="w-4 h-4" />
                Equipment ({equipment.length})
              </button></div>

          {/* Auto Refresh Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 text-[#3f72af] rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto-refresh (15s)</span>
          </label>

          {/* Manual Refresh */}
          <button
            onClick={loadAllData}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Now
          </button></div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
          <p className="text-xs font-medium text-gray-600 mb-2">Legend:</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-[#3f72af] rounded-full"></div>
              <span>Active Crew</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span>Active Site</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-gray-400 rounded"></div>
              <span>Inactive Site</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-purple-600 rounded-full"></div>
              <span>Equipment</span>
            </div></div></div></div>

      <style jsx global>{`
        .crew-marker,
        .site-marker,
        .equipment-marker {
          cursor: pointer;
          transition: transform 0.2s;
        }
        .crew-marker:hover,
        .site-marker:hover,
        .equipment-marker:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
