'use client';

import PageHeader from '@/components/PageHeader';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { loadGoogleMapsScript } from '@/lib/googleMapsLoader';
import {
  ArrowLeft,
  Pentagon,
  MapPin,
  Ruler,
  Download,
  Save,
  Undo,
  Redo,
  Trash2,
  Circle,
  Square,
  Type,
  Minus as Line,
  Mountain,
  Box,
  ParkingCircle,
  Home,
  Trees,
  Snowflake,
  X,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react';

// Interfaces
interface Site {
  id: string;
  name: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

interface GeoPoint {
  lat: number;
  lng: number;
}

// Category definitions with proper icons
const ANNOTATION_CATEGORIES = [
  { value: 'snowpile', label: 'Snow Pile', icon: Mountain, color: '#E0F2FE' },
  { value: 'curb', label: 'Curb', icon: Box, color: '#D1D5DB' },
  { value: 'equipment', label: 'Equipment', icon: Box, color: '#FEF3C7' },
  { value: 'parking', label: 'Parking', icon: ParkingCircle, color: '#DBEAFE' },
  { value: 'building', label: 'Building', icon: Home, color: '#E5E7EB' },
  { value: 'vegetation', label: 'Vegetation', icon: Trees, color: '#D1FAE5' },
  { value: 'snow_storage', label: 'Snow Storage', icon: Snowflake, color: '#E0F2FE' },
  { value: 'custom', label: 'Custom', icon: MapPin, color: '#F3F4F6' },
];

export default function UnifiedSiteMapsBuilder() {
  const router = useRouter();
  const params = useParams();
  const siteId = (Array.isArray(params?.id) ? params.id[0] : params?.id) as string;

  // State
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // Tool states
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('snowpile');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [geofenceBoundary, setGeofenceBoundary] = useState<GeoPoint[] | null>(null);
  const [showLayers, setShowLayers] = useState(true);
  
  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const drawingManagerRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const undoStack = useRef<any[]>([]);
  const redoStack = useRef<any[]>([]);

  // Fetch site details
  useEffect(() => {
    if (siteId && siteId !== 'undefined') {
      fetchSite();
    }
  }, [siteId]);

  // Load Google Maps
  useEffect(() => {
    console.log('🔄 Loading Google Maps API...');
    loadGoogleMapsScript()
      .then(() => {
        console.log('✅ Google Maps API loaded successfully');
        console.log('Google object:', window.google);
        setGoogleMapsLoaded(true);
      })
      .catch((error) => {
        console.error('❌ Failed to load Google Maps:', error);
        alert('Failed to load Google Maps. Please check your API key and refresh the page.');
      });
  }, []);

  // Initialize map when ready
  useEffect(() => {
    if (googleMapsLoaded && site && mapContainerRef.current && !mapInitialized) {
      console.log('🗺️ Initializing unified map...');
      initializeUnifiedMap();
    }
  }, [googleMapsLoaded, site, mapInitialized]);

  const fetchSite = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sites/${siteId}`);
      setSite(response.data);
      
      // Load existing geofence
      try {
        const geofenceRes = await api.get(`/sites/${siteId}/geofence`);
        if (geofenceRes.data.has_geofence) {
          setGeofenceBoundary(geofenceRes.data.geofence.polygon_coordinates);
        }
      } catch (err) {
        console.log('No geofence found');
      }
    } catch (error) {
      console.error('Error fetching site:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeUnifiedMap = useCallback(() => {
    if (!window.google || !site || !mapContainerRef.current || mapRef.current) {
      return;
    }

    try {
      // Create map instance
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: site.location.latitude, lng: site.location.longitude },
        zoom: 19,
        mapTypeId: 'satellite',
        tilt: 0,
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: false,
        zoomControl: true,
        scaleControl: true,
      });

      mapRef.current = map;

      // Add site marker
      new window.google.maps.Marker({
        position: { lat: site.location.latitude, lng: site.location.longitude },
        map: map,
        title: site.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      });

      // Initialize drawing manager
      const drawingManager = new window.google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false,
        polygonOptions: {
          fillColor: selectedColor,
          fillOpacity: 0.3,
          strokeColor: selectedColor,
          strokeWeight: 2,
          editable: true,
          draggable: true,
        },
        polylineOptions: {
          strokeColor: selectedColor,
          strokeWeight: 3,
          editable: true,
        },
        circleOptions: {
          fillColor: selectedColor,
          fillOpacity: 0.3,
          strokeColor: selectedColor,
          strokeWeight: 2,
          editable: true,
        },
        rectangleOptions: {
          fillColor: selectedColor,
          fillOpacity: 0.3,
          strokeColor: selectedColor,
          strokeWeight: 2,
          editable: true,
        },
        markerOptions: {
          draggable: true,
        },
      });

      drawingManager.setMap(map);
      drawingManagerRef.current = drawingManager;

      // Listen for completed drawings
      window.google.maps.event.addListener(drawingManager, 'overlaycomplete', handleOverlayComplete);

      // Draw existing geofence if available
      if (geofenceBoundary && geofenceBoundary.length > 0) {
        const polygon = new window.google.maps.Polygon({
          paths: geofenceBoundary,
          strokeColor: '#9333EA',
          strokeOpacity: 0.8,
          strokeWeight: 3,
          fillColor: '#9333EA',
          fillOpacity: 0.2,
          editable: false,
        });
        polygon.setMap(map);
      }

      console.log('✅ Unified map initialized successfully');
      setMapInitialized(true);
    } catch (error) {
      console.error('❌ Map initialization error:', error);
    }
  }, [site, geofenceBoundary, selectedColor]);

  const handleOverlayComplete = (event: any) => {
    const overlay = event.overlay;
    const type = event.type;

    // Store overlay
    overlaysRef.current.push(overlay);

    // Create annotation record
    const annotation = {
      id: Date.now().toString(),
      type: type,
      category: activeTool === 'boundary' ? 'boundary' : selectedCategory,
      color: selectedColor,
      overlay: overlay,
    };

    if (activeTool === 'boundary') {
      // Store as geofence boundary
      const path = overlay.getPath();
      const coordinates: GeoPoint[] = [];
      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
        coordinates.push({ lat: point.lat(), lng: point.lng() });
      }
      setGeofenceBoundary(coordinates);
    } else {
      setAnnotations([...annotations, annotation]);
    }

    // Stop drawing mode after completing
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
    setActiveTool(null);
  };

  const activateTool = (tool: string, drawingMode?: any) => {
    if (!drawingManagerRef.current) return;

    // Clear previous mode
    drawingManagerRef.current.setDrawingMode(null);
    setActiveTool(tool);

    if (drawingMode) {
      drawingManagerRef.current.setDrawingMode(drawingMode);
      
      // Update drawing options with current color
      const options = {
        fillColor: selectedColor,
        fillOpacity: 0.3,
        strokeColor: selectedColor,
        strokeWeight: tool === 'boundary' ? 3 : 2,
        editable: true,
        draggable: true,
      };

      if (drawingMode === window.google.maps.drawing.OverlayType.POLYGON) {
        drawingManagerRef.current.setOptions({ polygonOptions: options });
      } else if (drawingMode === window.google.maps.drawing.OverlayType.POLYLINE) {
        drawingManagerRef.current.setOptions({ 
          polylineOptions: { 
            strokeColor: selectedColor, 
            strokeWeight: 3, 
            editable: true 
          } 
        });
      } else if (drawingMode === window.google.maps.drawing.OverlayType.CIRCLE) {
        drawingManagerRef.current.setOptions({ circleOptions: options });
      } else if (drawingMode === window.google.maps.drawing.OverlayType.RECTANGLE) {
        drawingManagerRef.current.setOptions({ rectangleOptions: options });
      }
    }
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all annotations and measurements?')) {
      overlaysRef.current.forEach(overlay => overlay.setMap(null));
      overlaysRef.current = [];
      setAnnotations([]);
      setMeasurements([]);
      setActiveTool(null);
    }
  };

  const saveMap = async () => {
    // Implementation for saving
    alert('Save functionality will save geofence boundary and annotations');
  };

  const exportMap = () => {
    alert('Export functionality to download map as image');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Site not found</p>
      </div>
    );
  }

  const CategoryIcon = ANNOTATION_CATEGORIES.find(cat => cat.value === selectedCategory)?.icon || MapPin;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title={`${site.name} - Unified Map Builder`}
        subtitle={site.location.address}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Sites', href: '/sites' },
          { label: site.name, href: `/sites/${siteId}` },
          { label: 'Maps' },
        ]}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Draw Boundaries Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Pentagon className="w-4 h-4 text-purple-600" />
                Draw Boundaries
              </h3>
              <button
                onClick={() => activateTool('boundary', window.google?.maps?.drawing?.OverlayType?.POLYGON)}
                className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTool === 'boundary'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <Pentagon className="w-5 h-5" />
                <span className="font-medium">Draw Geofence Boundary</span>
              </button>
            </div>

            {/* Add Annotations Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Add Annotations
              </h3>
              
              {/* Category Selection */}
              <div className="grid grid-cols-2 gap-2">
                {ANNOTATION_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`p-3 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                        selectedCategory === category.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{category.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Drawing Tools */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Drawing Tools:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => activateTool('polygon', window.google?.maps?.drawing?.OverlayType?.POLYGON)}
                    className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 ${
                      activeTool === 'polygon'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Pentagon className="w-4 h-4" />
                    <span className="text-sm">Polygon</span>
                  </button>
                  <button
                    onClick={() => activateTool('rectangle', window.google?.maps?.drawing?.OverlayType?.RECTANGLE)}
                    className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 ${
                      activeTool === 'rectangle'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Square className="w-4 h-4" />
                    <span className="text-sm">Rectangle</span>
                  </button>
                  <button
                    onClick={() => activateTool('circle', window.google?.maps?.drawing?.OverlayType?.CIRCLE)}
                    className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 ${
                      activeTool === 'circle'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Circle className="w-4 h-4" />
                    <span className="text-sm">Circle</span>
                  </button>
                  <button
                    onClick={() => activateTool('line', window.google?.maps?.drawing?.OverlayType?.POLYLINE)}
                    className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 ${
                      activeTool === 'line'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Line className="w-4 h-4" />
                    <span className="text-sm">Line</span>
                  </button>
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="text-xs text-gray-500 block mb-2">Color:</label>
                <div className="flex gap-2">
                  {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'].map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedColor === color ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Measure Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Ruler className="w-4 h-4 text-green-600" />
                Measure
              </h3>
              <button
                onClick={() => activateTool('measure-distance', window.google?.maps?.drawing?.OverlayType?.POLYLINE)}
                className={`w-full px-4 py-2 rounded-lg flex items-center gap-2 ${
                  activeTool === 'measure-distance'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                <Ruler className="w-4 h-4" />
                <span className="text-sm">Measure Distance</span>
              </button>
              <button
                onClick={() => activateTool('measure-area', window.google?.maps?.drawing?.OverlayType?.POLYGON)}
                className={`w-full px-4 py-2 rounded-lg flex items-center gap-2 ${
                  activeTool === 'measure-area'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                <Square className="w-4 h-4" />
                <span className="text-sm">Measure Area</span>
              </button>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <button
                onClick={saveMap}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Map
              </button>
              <button
                onClick={exportMap}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export as Image
              </button>
              <button
                onClick={clearAll}
                className="w-full px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>

            {/* Layer Info */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Layers</span>
                <button onClick={() => setShowLayers(!showLayers)}>
                  {showLayers ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              {showLayers && (
                <div className="space-y-1 text-xs text-gray-600">
                  <div>Boundary: {geofenceBoundary ? 'Active' : 'Not set'}</div>
                  <div>Annotations: {annotations.length}</div>
                  <div>Measurements: {measurements.length}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={mapContainerRef} className="w-full h-full" />
          
          {!mapInitialized && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Initializing map...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
