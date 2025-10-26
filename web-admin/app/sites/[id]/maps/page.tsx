'use client';

import PageHeader from '@/components/PageHeader';

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
  Layers,
  Circle,
  Square,
  Pencil,
  Type,
  Camera,
  Undo,
  Redo,
  Trash2,
  Eye,
  Download,
  Plus,
  RefreshCw,
  Building,
  Users,
  Calendar,
  FileText,
  ExternalLink,
  Maximize2,
  Share2,
  Info,
  Activity,
} from 'lucide-react';

interface Site {
  id: string;
  name: string;
  site_type?: string;
  area_size?: number;
  site_reference?: string;
  created_at?: string;
  services?: any[];
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

interface SiteMapAnnotation {
  id: string;
  type: string;
  category?: string;
  label?: string;
  color?: string;
  coordinates: Array<{ x: number; y: number }>;
  properties?: any;
}

interface SiteMap {
  id?: string;
  site_id: string;
  version: number;
  name: string;
  base_map_type: string;
  base_map_data?: string;
  base_map_url?: string;
  annotations: SiteMapAnnotation[];
  legend_items?: Array<{ category: string; label: string; color: string; icon: string }>;
  is_current: boolean;
  created_at: string;
  updated_at: string;
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

  const [activeTab, setActiveTab] = useState<'overview' | 'geofence' | 'annotations'>('overview');
  const [site, setSite] = useState<Site | null>(null);
  const [geofence, setGeofence] = useState<Geofence | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapMode, setMapMode] = useState<'view' | 'edit'>('view');
  const [saving, setSaving] = useState(false);
  
  // Annotations state
  const [siteMaps, setSiteMaps] = useState<SiteMap[]>([]);
  const [currentMap, setCurrentMap] = useState<SiteMap | null>(null);
  const [annotations, setAnnotations] = useState<SiteMapAnnotation[]>([]);
  const [drawingMode, setDrawingMode] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [selectedCategory, setSelectedCategory] = useState('custom');
  const [showMapsList, setShowMapsList] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [mapName, setMapName] = useState('');
  const [annotationsLoading, setAnnotationsLoading] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const drawingManagerRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  
  // Annotations refs
  const annotationsMapRef = useRef<HTMLDivElement>(null);
  const annotationsGoogleMapRef = useRef<any>(null);
  const annotationsDrawingManagerRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const undoStack = useRef<SiteMapAnnotation[][]>([]);
  const redoStack = useRef<SiteMapAnnotation[][]>([]);
  
  // Overview tab refs
  const overviewMapRef = useRef<HTMLDivElement>(null);
  const overviewGoogleMapRef = useRef<any>(null);
  
  const [drawingPath, setDrawingPath] = useState<GeoPoint[]>([]);
  const [measurements, setMeasurements] = useState<any>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Drawing colors and categories
  const drawingColors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Green', value: '#10B981' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Orange', value: '#F97316' },
  ];

  const annotationCategories = [
    { value: 'curb', label: 'Curb', icon: '╪' },
    { value: 'drain', label: 'Drain', icon: '⊚' },
    { value: 'speed_bump', label: 'Speed Bump', icon: '▲' },
    { value: 'handicap', label: 'Handicap', icon: '♿' },
    { value: 'sidewalk', label: 'Sidewalk', icon: '═' },
    { value: 'plowing_zone', label: 'Plowing Zone', icon: '▭' },
    { value: 'fire_hydrant', label: 'Fire Hydrant', icon: '🚰' },
    { value: 'entrance', label: 'Entrance', icon: '→' },
    { value: 'exit', label: 'Exit', icon: '←' },
    { value: 'custom', label: 'Custom', icon: '★' },
  ];

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

  // Load site maps when switching to annotations tab
  useEffect(() => {
    if (activeTab === 'annotations' && siteId) {
      loadSiteMaps();
    }
  }, [activeTab, siteId]);

  // Initialize annotations map
  useEffect(() => {
    if (googleMapsLoaded && site && annotationsMapRef.current && activeTab === 'annotations' && !annotationsGoogleMapRef.current) {
      initializeAnnotationsMap();
    }
  }, [googleMapsLoaded, site, activeTab]);

  // Initialize overview map
  useEffect(() => {
    if (googleMapsLoaded && site && overviewMapRef.current && activeTab === 'overview' && !overviewGoogleMapRef.current) {
      initializeOverviewMap();
    }
  }, [googleMapsLoaded, site, activeTab]);

  useEffect(() => {
    if (googleMapsLoaded && site && mapRef.current && (activeTab === 'geofence' || activeTab === 'overview') && !googleMapRef.current) {
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

  const initializeOverviewMap = () => {
    if (!overviewMapRef.current || !window.google || !site || overviewGoogleMapRef.current) return;

    const center = {
      lat: site.location.latitude || 51.0447,
      lng: site.location.longitude || -114.0719,
    };

    overviewGoogleMapRef.current = new window.google.maps.Map(overviewMapRef.current, {
      center,
      zoom: 18,
      mapTypeId: 'satellite',
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });

    // Add site marker
    new window.google.maps.Marker({
      position: center,
      map: overviewGoogleMapRef.current,
      title: site.name,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });

    // Draw geofence if exists
    if (geofence && geofence.polygon_coordinates && geofence.polygon_coordinates.length > 0) {
      new window.google.maps.Polygon({
        paths: geofence.polygon_coordinates,
        strokeColor: '#10B981',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#10B981',
        fillOpacity: 0.15,
        map: overviewGoogleMapRef.current,
      });
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

  // ==================== ANNOTATIONS FUNCTIONS ====================
  
  const loadSiteMaps = async () => {
    try {
      setAnnotationsLoading(true);
      const response = await api.get(`/site-maps/site/${siteId}`);
      setSiteMaps(response.data || []);
      
      // Load the current map if exists
      const current = response.data.find((m: SiteMap) => m.is_current);
      if (current) {
        setCurrentMap(current);
        setAnnotations(current.annotations || []);
      }
    } catch (error: any) {
      console.error('Error loading site maps:', error);
    } finally {
      setAnnotationsLoading(false);
    }
  };

  const initializeAnnotationsMap = () => {
    if (!annotationsMapRef.current || !window.google || !site) return;

    const center = {
      lat: site.location.latitude || 51.0447,
      lng: site.location.longitude || -114.0719,
    };

    annotationsGoogleMapRef.current = new window.google.maps.Map(annotationsMapRef.current, {
      center,
      zoom: 19,
      mapTypeId: 'satellite',
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });

    // Initialize Drawing Manager for annotations
    annotationsDrawingManagerRef.current = new window.google.maps.drawing.DrawingManager({
      drawingControl: false,
      polygonOptions: {
        strokeColor: selectedColor,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: selectedColor,
        fillOpacity: 0.2,
        editable: false,
      },
      polylineOptions: {
        strokeColor: selectedColor,
        strokeOpacity: 0.8,
        strokeWeight: 3,
        editable: false,
      },
      circleOptions: {
        strokeColor: selectedColor,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: selectedColor,
        fillOpacity: 0.2,
        editable: false,
      },
      rectangleOptions: {
        strokeColor: selectedColor,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: selectedColor,
        fillOpacity: 0.2,
        editable: false,
      },
      markerOptions: {
        draggable: false,
      },
    });

    annotationsDrawingManagerRef.current.setMap(annotationsGoogleMapRef.current);

    // Listen for drawing complete events
    google.maps.event.addListener(annotationsDrawingManagerRef.current, 'overlaycomplete', (event: any) => {
      handleAnnotationDrawingComplete(event);
    });
  };

  const handleAnnotationDrawingComplete = (event: any) => {
    const overlay = event.overlay;
    const type = event.type;

    // Save overlay reference
    overlaysRef.current.push(overlay);

    // Extract coordinates based on type
    let coordinates: Array<{ x: number; y: number }> = [];
    
    if (type === 'polygon') {
      const path = overlay.getPath();
      for (let i = 0; i < path.getLength(); i++) {
        const latLng = path.getAt(i);
        coordinates.push({ x: latLng.lng(), y: latLng.lat() });
      }
    } else if (type === 'polyline') {
      const path = overlay.getPath();
      for (let i = 0; i < path.getLength(); i++) {
        const latLng = path.getAt(i);
        coordinates.push({ x: latLng.lng(), y: latLng.lat() });
      }
    } else if (type === 'circle') {
      const center = overlay.getCenter();
      coordinates = [{ x: center.lng(), y: center.lat() }];
    } else if (type === 'rectangle') {
      const bounds = overlay.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      coordinates = [
        { x: sw.lng(), y: ne.lat() },
        { x: ne.lng(), y: ne.lat() },
        { x: ne.lng(), y: sw.lat() },
        { x: sw.lng(), y: sw.lat() },
      ];
    } else if (type === 'marker') {
      const position = overlay.getPosition();
      coordinates = [{ x: position.lng(), y: position.lat() }];
    }

    // Create annotation
    const annotation: SiteMapAnnotation = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      category: selectedCategory,
      color: selectedColor,
      coordinates: coordinates,
      properties: {
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillOpacity: 0.2,
      },
    };

    // Add to annotations with undo support
    undoStack.current.push([...annotations]);
    redoStack.current = [];
    setAnnotations([...annotations, annotation]);

    // Stop drawing mode
    setDrawingMode(null);
    if (annotationsDrawingManagerRef.current) {
      annotationsDrawingManagerRef.current.setDrawingMode(null);
    }
  };

  const startAnnotationDrawing = (mode: string) => {
    setDrawingMode(mode);
    if (annotationsDrawingManagerRef.current) {
      let drawMode: any = null;
      switch (mode) {
        case 'polygon':
          drawMode = google.maps.drawing.OverlayType.POLYGON;
          break;
        case 'polyline':
          drawMode = google.maps.drawing.OverlayType.POLYLINE;
          break;
        case 'circle':
          drawMode = google.maps.drawing.OverlayType.CIRCLE;
          break;
        case 'rectangle':
          drawMode = google.maps.drawing.OverlayType.RECTANGLE;
          break;
        case 'marker':
          drawMode = google.maps.drawing.OverlayType.MARKER;
          break;
      }
      annotationsDrawingManagerRef.current.setDrawingMode(drawMode);
    }
  };

  const captureMapScreenshot = async (): Promise<string> => {
    if (!annotationsGoogleMapRef.current) return '';
    
    try {
      const center = annotationsGoogleMapRef.current.getCenter();
      const zoom = annotationsGoogleMapRef.current.getZoom() || 19;
      
      if (!center) return '';
      
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat()},${center.lng()}&zoom=${zoom}&size=800x600&maptype=satellite&key=${apiKey}`;
      
      // Fetch the image and convert to base64
      const response = await fetch(staticMapUrl);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      return '';
    }
  };

  const handleSaveMap = async () => {
    if (!mapName.trim()) {
      alert('Please enter a name for this map');
      return;
    }

    try {
      setSaving(true);
      
      // Capture screenshot
      const screenshot = await captureMapScreenshot();
      
      const mapData = {
        site_id: siteId,
        name: mapName,
        base_map_type: 'google_maps',
        base_map_data: screenshot,
        base_map_url: site?.location.address || '',
        annotations: annotations,
        legend_items: generateLegend(),
      };

      await api.post('/site-maps', mapData);
      alert('Map saved successfully!');
      setShowSaveModal(false);
      setMapName('');
      loadSiteMaps();
    } catch (error: any) {
      console.error('Error saving map:', error);
      alert(`Failed to save map: ${error.response?.data?.detail || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const generateLegend = () => {
    const categories = new Set(annotations.map(a => a.category).filter(Boolean));
    return Array.from(categories).map(category => {
      const cat = annotationCategories.find(c => c.value === category);
      const annotation = annotations.find(a => a.category === category);
      return {
        category: category || 'custom',
        label: cat?.label || 'Custom',
        color: annotation?.color || '#3B82F6',
        icon: cat?.icon || '★',
      };
    });
  };

  const loadMap = (map: SiteMap) => {
    setCurrentMap(map);
    setAnnotations(map.annotations || []);
    setShowMapsList(false);
    
    // Clear existing overlays
    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    overlaysRef.current = [];
  };

  const deleteMap = async (mapId: string) => {
    if (!confirm('Are you sure you want to delete this map version?')) return;
    
    try {
      setSaving(true);
      await api.delete(`/site-maps/${mapId}`);
      alert('Map deleted successfully');
      loadSiteMaps();
    } catch (error: any) {
      console.error('Error deleting map:', error);
      alert('Failed to delete map');
    } finally {
      setSaving(false);
    }
  };

  const clearAllAnnotations = () => {
    if (!confirm('Are you sure you want to clear all annotations?')) return;
    
    undoStack.current.push([...annotations]);
    redoStack.current = [];
    setAnnotations([]);
    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    overlaysRef.current = [];
  };

  const undoAnnotation = () => {
    if (undoStack.current.length === 0) return;
    
    const previous = undoStack.current.pop();
    redoStack.current.push([...annotations]);
    setAnnotations(previous || []);
  };

  const redoAnnotation = () => {
    if (redoStack.current.length === 0) return;
    
    const next = redoStack.current.pop();
    undoStack.current.push([...annotations]);
    setAnnotations(next || []);
  };


  if (loading) {
    return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Maps"
        subtitle="Manage maps"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Sites", href: "/sites" }, { label: site?.name || "Site", href: `/sites/${siteId}` }, { label: "Maps" }]}
      />
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    </div>
    );
  }

  if (!site) {
    return <div className="p-6">Site not found</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4 hover:shadow-md transition-shadow">
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
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Property Overview
          </button>
          <button
            onClick={() => setActiveTab('geofence')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'geofence'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Pentagon className="w-4 h-4" />
            Geofence & Boundaries
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
            Annotations & Markup
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
        {/* Property Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <Building className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Site Type</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{site?.site_type || 'N/A'}</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <Maximize2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Area Size</p>
                <p className="text-2xl font-bold text-gray-900">
                  {site?.area_size ? `${site.area_size.toLocaleString()} sq ft` : 'N/A'}
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600">Active Services</p>
                <p className="text-2xl font-bold text-gray-900">{site?.services?.length || 0}</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-8 h-8 text-orange-600" />
                </div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-2xl font-bold text-gray-900">
                  {site?.created_at ? new Date(site.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Map and Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Map View */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Interactive Map</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const url = `https://www.google.com/maps/search/?api=1&query=${site?.location.latitude},${site?.location.longitude}`;
                          window.open(url, '_blank');
                        }}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Open in Google Maps
                      </button>
                      <button
                        onClick={() => setActiveTab('geofence')}
                        className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center"
                      >
                        <Pentagon className="w-4 h-4 mr-1" />
                        Edit Boundaries
                      </button>
                      <button
                        onClick={() => setActiveTab('annotations')}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center"
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Add Annotations
                      </button>
                    </div>
                  </div>
                  <div ref={overviewMapRef} className="w-full h-[500px]"></div>
                </div>
              </div>

              {/* Site Information Sidebar */}
              <div className="space-y-4">
                {/* Location Details */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                    Location Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="text-sm font-medium text-gray-900">{site?.location.address || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Coordinates</p>
                      <p className="text-xs font-mono text-gray-900">
                        {site?.location.latitude?.toFixed(6)}, {site?.location.longitude?.toFixed(6)}
                      </p>
                    </div>
                    {site?.site_reference && (
                      <div>
                        <p className="text-sm text-gray-600">Reference ID</p>
                        <p className="text-sm font-medium text-gray-900">{site.site_reference}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-purple-600" />
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => router.push(`/sites/${siteId}`)}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-left flex items-center"
                    >
                      <Info className="w-4 h-4 mr-2" />
                      View Full Site Details
                    </button>
                    <button
                      onClick={() => setActiveTab('geofence')}
                      className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-left flex items-center"
                    >
                      <Pentagon className="w-4 h-4 mr-2" />
                      Manage Geofence
                    </button>
                    <button
                      onClick={() => setActiveTab('annotations')}
                      className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-left flex items-center"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Add Map Annotations
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement share functionality
                        alert('Share functionality coming soon!');
                      }}
                      className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-left flex items-center"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Map with Customer
                    </button>
                  </div>
                </div>

                {/* Map Versions */}
                {siteMaps.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Layers className="w-5 h-5 mr-2 text-orange-600" />
                      Saved Map Versions
                    </h3>
                    <div className="space-y-2">
                      {siteMaps.slice(0, 3).map((map) => (
                        <div
                          key={map.id}
                          className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setActiveTab('annotations');
                            setTimeout(() => loadMap(map), 100);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{map.name}</p>
                              <p className="text-xs text-gray-600">
                                v{map.version} • {map.annotations?.length || 0} annotations
                              </p>
                            </div>
                            {map.is_current && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {siteMaps.length > 3 && (
                        <button
                          onClick={() => setActiveTab('annotations')}
                          className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View all {siteMaps.length} versions →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'geofence' && (
          <>
            {/* Map */}
            <div ref={mapRef} className="w-full h-full" style={{ minHeight: '600px' }} />

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
        )}

        {activeTab === 'annotations' && (
          <div className="flex gap-6 h-full">
            {/* Drawing Toolbar */}
            <div className="w-72 bg-white rounded-lg shadow-sm p-4 h-fit">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Pencil className="w-5 h-5 mr-2" />
                Drawing Tools
              </h3>
              
              {/* Drawing modes */}
              <div className="space-y-2 mb-4">
                <button
                  onClick={() => startAnnotationDrawing('polygon')}
                  className={`w-full px-3 py-2 rounded-lg flex items-center ${
                    drawingMode === 'polygon' ? 'bg-blue-100 text-blue-700 font-semibold' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Square className="w-4 h-4 mr-2" />
                  Draw Area (Polygon)
                </button>
                <button
                  onClick={() => startAnnotationDrawing('polyline')}
                  className={`w-full px-3 py-2 rounded-lg flex items-center ${
                    drawingMode === 'polyline' ? 'bg-blue-100 text-blue-700 font-semibold' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Draw Line
                </button>
                <button
                  onClick={() => startAnnotationDrawing('rectangle')}
                  className={`w-full px-3 py-2 rounded-lg flex items-center ${
                    drawingMode === 'rectangle' ? 'bg-blue-100 text-blue-700 font-semibold' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Square className="w-4 h-4 mr-2" />
                  Rectangle
                </button>
                <button
                  onClick={() => startAnnotationDrawing('circle')}
                  className={`w-full px-3 py-2 rounded-lg flex items-center ${
                    drawingMode === 'circle' ? 'bg-blue-100 text-blue-700 font-semibold' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Circle className="w-4 h-4 mr-2" />
                  Circle
                </button>
                <button
                  onClick={() => startAnnotationDrawing('marker')}
                  className={`w-full px-3 py-2 rounded-lg flex items-center ${
                    drawingMode === 'marker' ? 'bg-blue-100 text-blue-700 font-semibold' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Add Marker
                </button>
              </div>

              {/* Colors */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="grid grid-cols-3 gap-2">
                  {drawingColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      className={`w-full h-10 rounded-lg border-2 transition-transform ${
                        selectedColor === color.value ? 'border-gray-900 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {annotationCategories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <button
                  onClick={() => undoAnnotation()}
                  disabled={undoStack.current.length === 0}
                  className="w-full px-3 py-2 rounded-lg flex items-center bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                >
                  <Undo className="w-4 h-4 mr-2" />
                  Undo
                </button>
                <button
                  onClick={() => redoAnnotation()}
                  disabled={redoStack.current.length === 0}
                  className="w-full px-3 py-2 rounded-lg flex items-center bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                >
                  <Redo className="w-4 h-4 mr-2" />
                  Redo
                </button>
                <button
                  onClick={clearAllAnnotations}
                  className="w-full px-3 py-2 rounded-lg flex items-center bg-red-100 text-red-700 hover:bg-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </button>
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
                <button
                  onClick={() => setShowSaveModal(true)}
                  disabled={annotations.length === 0}
                  className="w-full px-3 py-2 rounded-lg flex items-center bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Map
                </button>
                <button
                  onClick={() => setShowMapsList(!showMapsList)}
                  className="w-full px-3 py-2 rounded-lg flex items-center bg-purple-600 text-white hover:bg-purple-700"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  View Saved Maps ({siteMaps.length})
                </button>
              </div>

              {/* Annotations count */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>{annotations.length}</strong> annotation{annotations.length !== 1 ? 's' : ''}
                </p>
                {currentMap && (
                  <p className="text-xs text-blue-700 mt-1">
                    Current: {currentMap.name} (v{currentMap.version})
                  </p>
                )}
              </div>
            </div>

            {/* Map Canvas */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full">
                <div ref={annotationsMapRef} className="w-full h-[calc(100vh-280px)]"></div>
              </div>
            </div>
          </div>
        )}

        {/* Save Map Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Save Map</h3>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Map Name
                </label>
                <input
                  type="text"
                  value={mapName}
                  onChange={(e) => setMapName(e.target.value)}
                  placeholder="e.g., Winter 2024 Layout"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMap}
                  disabled={saving || !mapName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Maps List Modal */}
        {showMapsList && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Saved Map Versions</h3>
                <button
                  onClick={() => setShowMapsList(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                {annotationsLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading maps...</p>
                  </div>
                ) : siteMaps.length === 0 ? (
                  <div className="text-center py-12">
                    <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No saved maps yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {siteMaps.map((map) => (
                      <div
                        key={map.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{map.name}</h4>
                              {map.is_current && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">Version {map.version}</p>
                            <p className="text-sm text-gray-500">
                              {map.annotations?.length || 0} annotations
                            </p>
                            <p className="text-sm text-gray-500">
                              Created: {new Date(map.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => loadMap(map)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Load this map"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => map.id && deleteMap(map.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete this map"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
