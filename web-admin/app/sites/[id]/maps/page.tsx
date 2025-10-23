'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { loadGoogleMapsScript, isGoogleMapsLoaded } from '@/lib/googleMapsLoader';
import {
  ArrowLeft,
  MapPin,
  Edit,
  Save,
  X,
  Ruler,
  Map as MapIcon,
  Pentagon,
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

interface GeoPoint {
  lat: number;
  lng: number;
}

interface Geofence {
  id: string;
  name: string;
  polygon_coordinates: GeoPoint[];
  center_point: GeoPoint;
  area_square_meters?: number;
  perimeter_meters?: number;
  color: string;
  opacity: number;
  stroke_color: string;
  stroke_weight: number;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function SiteMapsGeofencingPage() {
  const router = useRouter();
  const params = useParams();
  const siteId = (Array.isArray(params?.id) ? params.id[0] : params?.id) as string;

  const [activeTab, setActiveTab] = useState<'geofence' | 'annotations'>('geofence');
  const [site, setSite] = useState<Site | null>(null);
  const [geofence, setGeofence] = useState<Geofence | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapMode, setMapMode] = useState<'view' | 'edit'>('view');
  const [saving, setSaving] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const drawingManagerRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const [drawingPath, setDrawingPath] = useState<GeoPoint[]>([]);
  const [measurements, setMeasurements] = useState<any>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  useEffect(() => {
    if (siteId && siteId !== 'undefined') {
      fetchSiteDetails();
      loadGoogleMapsScript()
        .then(() => {
          console.log('Google Maps loaded successfully');
          setGoogleMapsLoaded(true);
        })
        .catch((error) => {
          console.error('Failed to load Google Maps:', error);
          alert('Failed to load Google Maps. Please refresh the page.');
        });
    }
  }, [siteId]);

  useEffect(() => {
    if (googleMapsLoaded && site && mapRef.current && activeTab === 'geofence' && !googleMapRef.current) {
      console.log('Initializing map with:', site);
      initializeMap();
    }
  }, [googleMapsLoaded, site, activeTab]);

  const fetchSiteDetails = async () => {
    try {
      const siteResponse = await api.get(`/sites/${siteId}`);
      setSite(siteResponse.data);

      const geofenceResponse = await api.get(`/sites/${siteId}/geofence`);
      
      if (geofenceResponse.data.has_geofence) {
        setGeofence(geofenceResponse.data.geofence);
      }
    } catch (error) {
      console.error('Error fetching site details:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!site || !mapRef.current || googleMapRef.current || !window.google) {
      console.log('Map initialization skipped:', { 
        hasSite: !!site, 
        hasMapRef: !!mapRef.current, 
        hasGoogleMapRef: !!googleMapRef.current, 
        hasGoogle: !!window.google 
      });
      return;
    }

    console.log('Initializing map at coordinates:', site.location);

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: site.location.latitude, lng: site.location.longitude },
        zoom: 19,
        mapTypeId: 'satellite',
        tilt: 0,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: window.google.maps.ControlPosition.TOP_RIGHT,
          mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
        },
        fullscreenControl: true,
        streetViewControl: true,
      });

      googleMapRef.current = map;
      console.log('Map initialized successfully');

      // Add marker for site location
      new window.google.maps.Marker({
        position: { lat: site.location.latitude, lng: site.location.longitude },
        map: map,
        title: site.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      if (geofence) {
        displayGeofence(geofence);
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const displayGeofence = (gf: Geofence) => {
    if (!googleMapRef.current || !window.google) return;

    if (polygonRef.current) {
      polygonRef.current.setMap(null);
    }

    const polygon = new window.google.maps.Polygon({
      paths: gf.polygon_coordinates,
      strokeColor: gf.stroke_color,
      strokeOpacity: 1.0,
      strokeWeight: gf.stroke_weight,
      fillColor: gf.color,
      fillOpacity: gf.opacity,
      editable: false,
      draggable: false,
    });

    polygon.setMap(googleMapRef.current);
    polygonRef.current = polygon;
  };

  const enableDrawingMode = () => {
    if (!googleMapRef.current || !window.google) return;

    setMapMode('edit');

    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }

    const drawingManager = new window.google.maps.drawing.DrawingManager({
      drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        fillColor: '#3B82F6',
        fillOpacity: 0.3,
        strokeColor: '#1E40AF',
        strokeWeight: 2,
        clickable: true,
        editable: true,
        draggable: false,
      },
    });

    drawingManager.setMap(googleMapRef.current);
    drawingManagerRef.current = drawingManager;

    window.google.maps.event.addListener(drawingManager, 'overlaycomplete', (event: any) => {
      if (event.type === 'polygon') {
        const polygon = event.overlay;
        const path = polygon.getPath();
        const coordinates: GeoPoint[] = [];

        for (let i = 0; i < path.getLength(); i++) {
          const point = path.getAt(i);
          coordinates.push({ lat: point.lat(), lng: point.lng() });
        }

        setDrawingPath(coordinates);
        polygonRef.current = polygon;
        calculateMeasurements(coordinates);
        drawingManager.setDrawingMode(null);

        window.google.maps.event.addListener(path, 'set_at', () => updatePath(polygon));
        window.google.maps.event.addListener(path, 'insert_at', () => updatePath(polygon));
        window.google.maps.event.addListener(path, 'remove_at', () => updatePath(polygon));
      }
    });
  };

  const updatePath = (polygon: any) => {
    const path = polygon.getPath();
    const coordinates: GeoPoint[] = [];

    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coordinates.push({ lat: point.lat(), lng: point.lng() });
    }

    setDrawingPath(coordinates);
    calculateMeasurements(coordinates);
  };

  const calculateMeasurements = async (coordinates: GeoPoint[]) => {
    try {
      const response = await api.post(
        `/sites/${siteId}/calculate-measurements`,
        coordinates
      );

      if (response.data.success) {
        setMeasurements(response.data.measurements);
      }
    } catch (error) {
      console.error('Error calculating measurements:', error);
    }
  };

  const saveGeofence = async () => {
    if (drawingPath.length < 3) {
      alert('Please draw a polygon with at least 3 points');
      return;
    }

    setSaving(true);
    try {
      const endpoint = `/sites/${siteId}/geofence`;
      const method = geofence ? 'put' : 'post';

      const payload: any = {
        polygon_coordinates: drawingPath,
        center_point: measurements?.center_point || drawingPath[0],
        area_square_meters: measurements?.area_square_meters,
        perimeter_meters: measurements?.perimeter_meters,
      };

      if (!geofence) {
        payload.site_id = siteId;
        payload.name = 'Property Boundary';
        payload.color = '#3B82F6';
        payload.opacity = 0.3;
        payload.stroke_color = '#1E40AF';
        payload.stroke_weight = 2;
      }

      const response = await api[method](endpoint, payload);
      
      if (response.data.success) {
        alert(geofence ? 'Geofence updated successfully!' : 'Geofence saved successfully!');
        setMapMode('view');
        
        if (drawingManagerRef.current) {
          drawingManagerRef.current.setMap(null);
          drawingManagerRef.current = null;
        }
        
        fetchSiteDetails();
      } else {
        alert('Failed to save geofence');
      }
    } catch (error) {
      console.error('Error saving geofence:', error);
      alert('Error saving geofence');
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setMapMode('view');
    setDrawingPath([]);
    setMeasurements(null);

    if (drawingManagerRef.current) {
      drawingManagerRef.current.setMap(null);
      drawingManagerRef.current = null;
    }

    if (polygonRef.current && !geofence) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }

    if (geofence) {
      displayGeofence(geofence);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!site) {
    return <div className="p-6">Site not found</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/sites/${siteId}`)}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{site.name} - Site Maps</h1>
              <p className="text-sm text-gray-600 mt-1">{site.location.address}</p>
            </div>
          </div>

          {activeTab === 'geofence' && (
            <div className="flex gap-2">
              {mapMode === 'view' ? (
                <button
                  onClick={enableDrawingMode}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  {geofence ? 'Edit Geo Fencing' : 'Add Geo Fencing'}
                </button>
              ) : (
                <>
                  <button
                    onClick={cancelEditing}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    disabled={saving}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={saveGeofence}
                    disabled={drawingPath.length < 3 || saving}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : (geofence ? 'Update' : 'Save')} Geofence
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          <button
            onClick={() => setActiveTab('geofence')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'geofence'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Pentagon className="w-4 h-4" />
            Geo Fencing & Measurements
          </button>
          <button
            onClick={() => setActiveTab('annotations')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'annotations'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            Map Annotations
          </button>
        </div>

        {/* Instructions */}
        {activeTab === 'geofence' && mapMode === 'edit' && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong> Click on the map to draw points around the property boundary. 
              The polygon must have at least 3 points. After drawing, you can drag the points to adjust the boundary. 
              The area and perimeter will be calculated automatically.
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {activeTab === 'geofence' ? (
          <>
            {/* Map */}
            <div ref={mapRef} className="w-full h-full" />

            {/* Measurements Panel */}
            {measurements && mapMode === 'edit' && (
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-xl p-5 max-w-sm border border-gray-200 z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Ruler className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-lg text-gray-900">Property Measurements</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Area:</span>
                    <span className="font-semibold text-gray-900">
                      {measurements.area_square_feet?.toLocaleString()} sq ft
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Area (m²):</span>
                    <span className="font-semibold text-gray-900">
                      {measurements.area_square_meters?.toLocaleString()} m²
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Acres:</span>
                    <span className="font-semibold text-gray-900">
                      {measurements.area_acres?.toFixed(4)} acres
                    </span>
                  </div>
                  <div className="h-px bg-gray-200 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Perimeter:</span>
                    <span className="font-semibold text-gray-900">
                      {measurements.perimeter_feet?.toLocaleString()} ft
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Perimeter (m):</span>
                    <span className="font-semibold text-gray-900">
                      {measurements.perimeter_meters?.toLocaleString()} m
                    </span>
                  </div>
                  <div className="h-px bg-gray-200 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Points:</span>
                    <span className="font-semibold text-gray-900">
                      {measurements.num_points}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Geofence Info Panel (View Mode) */}
            {geofence && mapMode === 'view' && (
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-xl p-5 max-w-sm border border-gray-200 z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Pentagon className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-lg text-gray-900">Geofence Details</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="font-medium text-green-700">Active</span>
                  </div>
                  {geofence.area_square_meters && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Area:</span>
                        <span className="font-semibold text-gray-900">
                          {(geofence.area_square_meters * 10.764).toLocaleString(undefined, {maximumFractionDigits: 0})} sq ft
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Acres:</span>
                        <span className="font-semibold text-gray-900">
                          {(geofence.area_square_meters * 0.000247105).toFixed(4)} acres
                        </span>
                      </div>
                    </>
                  )}
                  {geofence.perimeter_meters && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Perimeter:</span>
                      <span className="font-semibold text-gray-900">
                        {(geofence.perimeter_meters * 3.28084).toLocaleString(undefined, {maximumFractionDigits: 0})} ft
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Points:</span>
                    <span className="font-semibold text-gray-900">
                      {geofence.polygon_coordinates.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Map Annotations</h3>
              <p className="text-gray-600">This feature is coming soon...</p>
              <p className="text-sm text-gray-500 mt-2">
                Map annotations allow you to mark important features like entrances, exits, obstacles, etc.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
