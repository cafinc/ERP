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
  const [showGeofenceSave, setShowGeofenceSave] = useState(false);
  const [geofenceDrawn, setGeofenceDrawn] = useState<any>(null);
  const [savingGeofence, setSavingGeofence] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [currentLabel, setCurrentLabel] = useState('');
  
  // Modal states
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pendingMeasurement, setPendingMeasurement] = useState<any>(null);
  const [pendingAnnotation, setPendingAnnotation] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalLabel, setModalLabel] = useState('');
  
  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const drawingManagerRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const undoStack = useRef<any[]>([]);
  const redoStack = useRef<any[]>([]);

  // Fetch site details
  useEffect(() => {
    console.log('📌 Site ID from params:', siteId);
    console.log('📌 Params object:', params);
    if (siteId && siteId !== 'undefined' && siteId !== '[id]') {
      fetchSite();
    } else {
      console.error('❌ Invalid site ID:', siteId);
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
    if (!googleMapsLoaded || !site || mapInitialized) {
      return;
    }

    // Wait for next tick to ensure ref is attached
    const timer = setTimeout(() => {
      console.log('🔄 Checking map initialization conditions...');
      console.log('  - googleMapsLoaded:', googleMapsLoaded);
      console.log('  - site exists:', !!site);
      console.log('  - mapInitialized:', mapInitialized);
      console.log('  - mapContainerRef:', !!mapContainerRef.current);
      
      if (mapContainerRef.current) {
        console.log('✅ All conditions met, initializing map...');
        initializeUnifiedMap();
      } else {
        console.log('⏳ Map container ref not ready yet, will retry...');
      }
    }, 200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleMapsLoaded, site, mapInitialized]);

  const fetchSite = async () => {
    try {
      console.log('🔄 Fetching site data for ID:', siteId);
      setLoading(true);
      const response = await api.get(`/sites/${siteId}`);
      console.log('✅ Site data received:', response.data);
      setSite(response.data);
      console.log('✅ Site state updated');
      
      // Load existing geofence
      try {
        const geofenceRes = await api.get(`/sites/${siteId}/geofence`);
        console.log('Geofence response:', geofenceRes.data);
        if (geofenceRes.data.has_geofence) {
          setGeofenceBoundary(geofenceRes.data.geofence.polygon_coordinates);
          console.log('✅ Geofence boundary loaded');
        }
      } catch (err) {
        console.log('⚠️ No geofence found or error loading:', err);
      }
    } catch (error) {
      console.error('❌ Error fetching site:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
      console.log('🏁 Site fetch complete');
    }
  };

  const initializeUnifiedMap = useCallback(() => {
    console.log('📍 Initializing unified map...');
    console.log('  - window.google:', !!window.google);
    console.log('  - site:', !!site);
    console.log('  - mapContainerRef.current:', !!mapContainerRef.current);
    console.log('  - mapRef.current:', !!mapRef.current);

    if (!window.google) {
      console.error('❌ Google Maps API not loaded');
      return;
    }
    
    if (!site) {
      console.error('❌ Site data not available');
      return;
    }
    
    if (!mapContainerRef.current) {
      console.error('❌ Map container ref not available');
      return;
    }
    
    if (mapRef.current) {
      console.log('⚠️ Map already initialized, skipping');
      return;
    }

    try {
      console.log('🗺️ Creating Google Map instance...');
      console.log('  - Lat:', site.location.latitude);
      console.log('  - Lng:', site.location.longitude);

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

      console.log('✅ Map instance created');
      mapRef.current = map;

      // Wait for map to be fully loaded
      window.google.maps.event.addListenerOnce(map, 'tilesloaded', () => {
        console.log('✅ Map tiles loaded');
      });

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

      console.log('✅ Site marker added');

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
      console.log('✅ Drawing manager initialized');

      // Listen for completed drawings
      window.google.maps.event.addListener(drawingManager, 'overlaycomplete', handleOverlayComplete);
      console.log('✅ Event listeners attached');

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
        console.log('✅ Existing geofence displayed');
      }

      console.log('✅✅✅ Unified map initialized successfully!');
      setMapInitialized(true);
    } catch (error) {
      console.error('❌ Map initialization error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
  }, [site, geofenceBoundary, selectedColor]);

  const handleOverlayComplete = (event: any) => {
    const overlay = event.overlay;
    const type = event.type;

    console.log('✏️ Overlay completed:', type, 'Active tool:', activeTool);

    // Store overlay
    overlaysRef.current.push(overlay);

    if (activeTool === 'boundary') {
      // Geofence boundary drawing
      const path = overlay.getPath();
      const coordinates: GeoPoint[] = [];
      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
        coordinates.push({ lat: point.lat(), lng: point.lng() });
      }
      setGeofenceDrawn(overlay);
      setGeofenceBoundary(coordinates);
      setShowGeofenceSave(true);
      console.log('✅ Geofence drawn, save button shown');
      
    } else if (activeTool === 'arrow') {
      // Arrow with arrowhead
      const path = overlay.getPath();
      
      // Add arrowhead symbol at the end
      const lineSymbol = {
        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 4,
        strokeColor: selectedColor,
        fillColor: selectedColor,
        fillOpacity: 1,
      };
      
      overlay.setOptions({
        icons: [{
          icon: lineSymbol,
          offset: '100%',
        }],
        strokeWeight: 3,
      });
      
      // Add click listener
      window.google.maps.event.addListener(overlay, 'click', () => {
        const label = prompt('Enter label for this arrow (optional):');
        if (label) {
          const midPoint = path.getAt(Math.floor(path.getLength() / 2));
          const labelMarker = new window.google.maps.Marker({
            position: midPoint,
            map: mapRef.current,
            label: {
              text: label,
              color: '#1f2937',
              fontSize: '12px',
              fontWeight: 'bold',
            },
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 0,
            },
          });
          overlaysRef.current.push(labelMarker);
        }
      });
      
      const annotation = {
        id: Date.now().toString(),
        type: 'arrow',
        category: 'arrow',
        color: selectedColor,
        overlay: overlay,
        label: '',
      };
      setAnnotations([...annotations, annotation]);
      console.log('➡️ Arrow added');
      
    } else if (activeTool === 'measure-distance') {
      // Distance measurement
      const path = overlay.getPath();
      let totalDistance = 0;
      for (let i = 0; i < path.getLength() - 1; i++) {
        const from = path.getAt(i);
        const to = path.getAt(i + 1);
        totalDistance += window.google.maps.geometry.spherical.computeDistanceBetween(from, to);
      }
      
      const distanceMeters = totalDistance;
      const distanceFeet = distanceMeters * 3.28084;
      const distanceMiles = distanceMeters / 1609.34;
      
      // Store pending measurement and show modal
      setPendingMeasurement({
        overlay,
        type: 'distance',
        distanceFeet,
        distanceMeters,
        distanceMiles,
        path
      });
      setModalLabel('Distance Measurement');
      setShowMeasurementModal(true);
      
      // Add info window with measurement
      const midPoint = path.getAt(Math.floor(path.getLength() / 2));
      const infoWindow = new window.google.maps.InfoWindow({
        position: midPoint,
        content: `
          <div style="padding: 12px; font-family: sans-serif;">
            <strong style="font-size: 14px; color: #1f2937;">${label}</strong><br/>
            <div style="margin-top: 8px; font-size: 13px;">
              <strong>${distanceFeet.toFixed(2)}</strong> feet<br/>
              <strong>${distanceMeters.toFixed(2)}</strong> meters<br/>
              <strong>${distanceMiles.toFixed(3)}</strong> miles
            </div>
          </div>
        `,
      });
      infoWindow.open(mapRef.current);
      overlaysRef.current.push(infoWindow);
      
      const measurement = {
        id: Date.now().toString(),
        type: 'distance',
        label: label,
        distanceFeet: distanceFeet.toFixed(2),
        distanceMeters: distanceMeters.toFixed(2),
        distanceMiles: distanceMiles.toFixed(3),
        overlay: overlay,
        infoWindow: infoWindow,
      };
      setMeasurements([...measurements, measurement]);
      console.log('📏 Distance measured:', measurement);
      
    } else if (activeTool === 'measure-area') {
      // Area measurement
      const path = overlay.getPath();
      const areaSquareMeters = window.google.maps.geometry.spherical.computeArea(path);
      const areaSquareFeet = areaSquareMeters * 10.764;
      const areaAcres = areaSquareMeters * 0.000247105;
      
      // Calculate perimeter
      let perimeter = 0;
      for (let i = 0; i < path.getLength(); i++) {
        const from = path.getAt(i);
        const to = path.getAt((i + 1) % path.getLength());
        perimeter += window.google.maps.geometry.spherical.computeDistanceBetween(from, to);
      }
      const perimeterFeet = perimeter * 3.28084;
      
      // Store pending measurement and show modal
      setPendingMeasurement({
        overlay,
        type: 'area',
        areaSquareFeet,
        areaSquareMeters,
        areaAcres,
        perimeterFeet,
        center
      });
      setModalLabel('');
      setShowMeasurementModal(true);
      
      // Temp label until modal is submitted
      const label = 'Area (pending)';
      
      // Add info window
      const bounds = new window.google.maps.LatLngBounds();
      for (let i = 0; i < path.getLength(); i++) {
        bounds.extend(path.getAt(i));
      }
      const center = bounds.getCenter();
      
      const infoWindow = new window.google.maps.InfoWindow({
        position: center,
        content: `
          <div style="padding: 12px; font-family: sans-serif;">
            <strong style="font-size: 14px; color: #1f2937;">${label}</strong><br/>
            <div style="margin-top: 8px; font-size: 13px;">
              <strong>Area:</strong><br/>
              ${areaSquareFeet.toLocaleString(undefined, {maximumFractionDigits: 0})} sq ft<br/>
              ${areaSquareMeters.toLocaleString(undefined, {maximumFractionDigits: 0})} sq m<br/>
              ${areaAcres.toFixed(4)} acres<br/>
              <strong>Perimeter:</strong><br/>
              ${perimeterFeet.toFixed(2)} feet
            </div>
          </div>
        `,
      });
      infoWindow.open(mapRef.current);
      overlaysRef.current.push(infoWindow);
      
      const measurement = {
        id: Date.now().toString(),
        type: 'area',
        label: label,
        areaSquareFeet: areaSquareFeet.toLocaleString(undefined, {maximumFractionDigits: 0}),
        areaSquareMeters: areaSquareMeters.toLocaleString(undefined, {maximumFractionDigits: 0}),
        areaAcres: areaAcres.toFixed(4),
        perimeterFeet: perimeterFeet.toFixed(2),
        overlay: overlay,
        infoWindow: infoWindow,
      };
      setMeasurements([...measurements, measurement]);
      console.log('📐 Area measured:', measurement);
      
    } else if (activeTool === 'marker') {
      // Icon marker with label - show modal instead of prompt
      setPendingAnnotation({
        overlay,
        category: selectedCategory,
        color: selectedColor,
        position: overlay.getPosition()
      });
      setModalLabel('');
      setShowAnnotationModal(true);
      
      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; font-family: sans-serif;">
            <strong style="font-size: 13px; color: #1f2937;">${label}</strong><br/>
            <span style="font-size: 11px; color: #6b7280;">
              ${ANNOTATION_CATEGORIES.find(c => c.value === selectedCategory)?.label}
            </span>
          </div>
        `,
      });
      
      window.google.maps.event.addListener(overlay, 'click', () => {
        infoWindow.open(mapRef.current, overlay);
      });
      
      overlaysRef.current.push(infoWindow);
      
      const annotation = {
        id: Date.now().toString(),
        type: 'marker',
        category: selectedCategory,
        label: label,
        color: selectedColor,
        overlay: overlay,
        infoWindow: infoWindow,
      };
      setAnnotations([...annotations, annotation]);
      console.log('📍 Marker added:', annotation);
      
    } else {
      // Regular annotation shapes
      const label = prompt('Enter label for this annotation (optional):');
      
      if (label) {
        let center;
        if (type === 'circle') {
          center = overlay.getCenter();
        } else if (type === 'rectangle') {
          const bounds = overlay.getBounds();
          center = bounds.getCenter();
        } else if (type === 'polygon') {
          const path = overlay.getPath();
          const bounds = new window.google.maps.LatLngBounds();
          for (let i = 0; i < path.getLength(); i++) {
            bounds.extend(path.getAt(i));
          }
          center = bounds.getCenter();
        }
        
        if (center) {
          const infoWindow = new window.google.maps.InfoWindow({
            position: center,
            content: `
              <div style="padding: 8px; font-family: sans-serif;">
                <strong style="font-size: 13px; color: #1f2937;">${label}</strong>
              </div>
            `,
          });
          
          window.google.maps.event.addListener(overlay, 'click', () => {
            infoWindow.open(mapRef.current);
          });
          
          overlaysRef.current.push(infoWindow);
        }
      }
      
      const annotation = {
        id: Date.now().toString(),
        type: type,
        category: selectedCategory,
        label: label || '',
        color: selectedColor,
        overlay: overlay,
      };
      setAnnotations([...annotations, annotation]);
      console.log('🎨 Annotation added:', annotation);
    }

    // Stop drawing mode after completing
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
    setActiveTool(null);
  };

  const activateTool = (tool: string, drawingMode?: any) => {
    if (!drawingManagerRef.current) return;

    // Handle text tool separately (no drawing manager needed)
    if (tool === 'text') {
      // Text tool will prompt for text input
      const text = prompt('Enter text to place on map:');
      if (text && mapRef.current) {
        const center = mapRef.current.getCenter();
        
        // Create custom overlay for text box
        const infoWindow = new window.google.maps.InfoWindow({
          position: center,
          content: `
            <div style="
              padding: 8px 12px;
              background: rgba(255, 255, 255, 0.9);
              border: 2px solid ${selectedColor};
              border-radius: 4px;
              font-family: sans-serif;
              font-size: 14px;
              font-weight: 600;
              color: #1f2937;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">${text}</div>
          `,
        });
        
        infoWindow.open(mapRef.current);
        overlaysRef.current.push(infoWindow);
        
        const annotation = {
          id: Date.now().toString(),
          type: 'text',
          category: 'text',
          label: text,
          color: selectedColor,
          overlay: infoWindow,
        };
        setAnnotations([...annotations, annotation]);
        console.log('📝 Text added:', text);
      }
      setActiveTool(null);
      return;
    }

    // Clear previous mode
    drawingManagerRef.current.setDrawingMode(null);
    setActiveTool(tool);

    if (drawingMode) {
      drawingManagerRef.current.setDrawingMode(drawingMode);
      
      // Update drawing options with current color and category
      const options = {
        fillColor: selectedColor,
        fillOpacity: 0.3,
        strokeColor: selectedColor,
        strokeWeight: tool === 'boundary' ? 3 : 2,
        editable: true,
        draggable: true,
      };

      if (drawingMode === window.google.maps.drawing.OverlayType.MARKER) {
        // Custom marker with category label
        const category = ANNOTATION_CATEGORIES.find(c => c.value === selectedCategory);
        drawingManagerRef.current.setOptions({
          markerOptions: {
            draggable: true,
            label: {
              text: category?.label.charAt(0) || '📍',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: 'bold',
            },
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 20,
              fillColor: selectedColor,
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 3,
            },
          },
        });
      } else if (drawingMode === window.google.maps.drawing.OverlayType.POLYGON) {
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

  const saveGeofence = async () => {
    if (!geofenceBoundary || geofenceBoundary.length < 3) {
      alert('Please draw a geofence boundary first');
      return;
    }

    try {
      setSavingGeofence(true);
      await api.post(`/sites/${siteId}/geofence`, {
        polygon_coordinates: geofenceBoundary,
        color: '#9333EA',
        opacity: 0.2,
        stroke_color: '#9333EA',
      });
      alert('Geofence saved successfully!');
      setShowGeofenceSave(false);
    } catch (error) {
      console.error('Error saving geofence:', error);
      alert('Failed to save geofence');
    } finally {
      setSavingGeofence(false);
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

  const handleSaveMeasurement = () => {
    if (!pendingMeasurement || !modalLabel.trim()) {
      alert('Please enter a name for this measurement');
      return;
    }

    const label = modalLabel.trim();
    const { overlay, type } = pendingMeasurement;

    if (type === 'distance') {
      const { distanceFeet, distanceMeters, distanceMiles, path } = pendingMeasurement;
      
      // Add info window with measurement
      const midPoint = path.getAt(Math.floor(path.getLength() / 2));
      const infoWindow = new window.google.maps.InfoWindow({
        position: midPoint,
        content: `
          <div style="padding: 12px; font-family: sans-serif;">
            <strong style="font-size: 14px; color: #1f2937;">${label}</strong><br/>
            <div style="margin-top: 8px; font-size: 13px;">
              <strong>${distanceFeet.toFixed(2)}</strong> feet<br/>
              <strong>${distanceMeters.toFixed(2)}</strong> meters<br/>
              <strong>${distanceMiles.toFixed(3)}</strong> miles
            </div>
            <button onclick="this.closest('.gm-style-iw').previousSibling.click()" 
              style="margin-top: 8px; padding: 4px 12px; background: #3B82F6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
              Edit
            </button>
          </div>
        `,
      });
      
      // Make overlay clickable
      window.google.maps.event.addListener(overlay, 'click', () => {
        setEditingItem({
          id: Date.now().toString(),
          type: 'distance',
          label: label,
          ...pendingMeasurement
        });
        setShowEditModal(true);
      });
      
      infoWindow.open(mapRef.current);
      overlaysRef.current.push(infoWindow);
      
      const measurement = {
        id: Date.now().toString(),
        type: 'distance',
        label: label,
        distanceFeet: distanceFeet.toFixed(2),
        distanceMeters: distanceMeters.toFixed(2),
        distanceMiles: distanceMiles.toFixed(3),
        overlay: overlay,
        infoWindow: infoWindow,
      };
      setMeasurements([...measurements, measurement]);
      
    } else if (type === 'area') {
      const { areaSquareFeet, areaSquareMeters, areaAcres, perimeterFeet, center } = pendingMeasurement;
      
      const infoWindow = new window.google.maps.InfoWindow({
        position: center,
        content: `
          <div style="padding: 12px; font-family: sans-serif;">
            <strong style="font-size: 14px; color: #1f2937;">${label}</strong><br/>
            <div style="margin-top: 8px; font-size: 13px;">
              <strong>Area:</strong><br/>
              ${areaSquareFeet.toLocaleString(undefined, {maximumFractionDigits: 0})} sq ft<br/>
              ${areaSquareMeters.toLocaleString(undefined, {maximumFractionDigits: 0})} sq m<br/>
              ${areaAcres.toFixed(4)} acres<br/>
              <strong>Perimeter:</strong><br/>
              ${perimeterFeet.toFixed(2)} feet
            </div>
            <button onclick="this.closest('.gm-style-iw').previousSibling.click()" 
              style="margin-top: 8px; padding: 4px 12px; background: #3B82F6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
              Edit
            </button>
          </div>
        `,
      });
      
      // Make overlay clickable
      window.google.maps.event.addListener(overlay, 'click', () => {
        setEditingItem({
          id: Date.now().toString(),
          type: 'area',
          label: label,
          ...pendingMeasurement
        });
        setShowEditModal(true);
      });
      
      infoWindow.open(mapRef.current);
      overlaysRef.current.push(infoWindow);
      
      const measurement = {
        id: Date.now().toString(),
        type: 'area',
        label: label,
        areaSquareFeet: areaSquareFeet.toLocaleString(undefined, {maximumFractionDigits: 0}),
        areaSquareMeters: areaSquareMeters.toLocaleString(undefined, {maximumFractionDigits: 0}),
        areaAcres: areaAcres.toFixed(4),
        perimeterFeet: perimeterFeet.toFixed(2),
        overlay: overlay,
        infoWindow: infoWindow,
      };
      setMeasurements([...measurements, measurement]);
    }

    // Close modal and reset
    setShowMeasurementModal(false);
    setPendingMeasurement(null);
    setModalLabel('');
  };

  const handleSaveAnnotation = () => {
    if (!pendingAnnotation || !modalLabel.trim()) {
      alert('Please enter a label for this marker');
      return;
    }

    const label = modalLabel.trim();
    const { overlay, category, color } = pendingAnnotation;
    
    // Add info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 8px; font-family: sans-serif;">
          <strong style="font-size: 13px; color: #1f2937;">${label}</strong><br/>
          <span style="font-size: 11px; color: #6b7280;">
            ${ANNOTATION_CATEGORIES.find(c => c.value === category)?.label}
          </span>
          <button onclick="this.closest('.gm-style-iw').previousSibling.click()" 
            style="margin-top: 8px; padding: 4px 12px; background: #3B82F6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
            Edit
          </button>
        </div>
      `,
    });
    
    // Make marker clickable
    window.google.maps.event.addListener(overlay, 'click', () => {
      infoWindow.open(mapRef.current, overlay);
      setEditingItem({
        id: Date.now().toString(),
        type: 'marker',
        label: label,
        category,
        color,
        overlay
      });
    });
    
    overlaysRef.current.push(infoWindow);
    
    const annotation = {
      id: Date.now().toString(),
      type: 'marker',
      category: category,
      label: label,
      color: color,
      overlay: overlay,
      infoWindow: infoWindow,
    };
    setAnnotations([...annotations, annotation]);

    // Close modal and reset
    setShowAnnotationModal(false);
    setPendingAnnotation(null);
    setModalLabel('');
  };

  const handleUpdateItem = () => {
    if (!editingItem || !modalLabel.trim()) {
      alert('Please enter a label');
      return;
    }

    // Update the item in the respective array
    if (editingItem.type === 'distance' || editingItem.type === 'area') {
      setMeasurements(measurements.map(m => 
        m.id === editingItem.id ? { ...m, label: modalLabel.trim() } : m
      ));
    } else if (editingItem.type === 'marker') {
      setAnnotations(annotations.map(a => 
        a.id === editingItem.id ? { ...a, label: modalLabel.trim() } : a
      ));
    }

    // Update info window content
    if (editingItem.infoWindow) {
      // Recreate info window with new label
      editingItem.infoWindow.close();
      // The info window will be recreated on next click
    }

    setShowEditModal(false);
    setEditingItem(null);
    setModalLabel('');
    alert('Item updated successfully!');
  };

  const handleDeleteItem = () => {
    if (!editingItem) return;

    if (confirm(`Delete "${editingItem.label}"?`)) {
      // Remove from map
      if (editingItem.overlay) {
        editingItem.overlay.setMap(null);
      }
      if (editingItem.infoWindow) {
        editingItem.infoWindow.close();
      }

      // Remove from state
      if (editingItem.type === 'distance' || editingItem.type === 'area') {
        setMeasurements(measurements.filter(m => m.id !== editingItem.id));
      } else if (editingItem.type === 'marker') {
        setAnnotations(annotations.filter(a => a.id !== editingItem.id));
      }

      setShowEditModal(false);
      setEditingItem(null);
    }
  };

  const saveMap = async () => {
    // Implementation for saving
    alert('Save functionality will save geofence boundary and annotations');
  };

  const exportMap = async () => {
    if (!mapRef.current || !site) {
      alert('Map not ready');
      return;
    }

    try {
      // Get map bounds
      const bounds = mapRef.current.getBounds();
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      
      // Create a canvas to capture the map
      const mapElement = mapContainerRef.current;
      if (!mapElement) {
        alert('Map element not found');
        return;
      }

      // Use Google Maps Static API as fallback
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const size = '800x600';
      const mapType = 'satellite'; // or 'roadmap', 'hybrid', 'terrain'
      
      // Build static map URL
      const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat()},${center.lng()}&zoom=${zoom}&size=${size}&maptype=${mapType}&key=${apiKey}`;
      
      // Add markers for measurements and annotations
      let markers = '';
      
      // Add measurement overlays
      measurements.forEach((m, idx) => {
        if (m.overlay && m.overlay.getPath) {
          const path = m.overlay.getPath();
          const pathArray = path.getArray();
          if (pathArray.length > 0) {
            const firstPoint = pathArray[0];
            markers += `&markers=color:blue|label:${idx + 1}|${firstPoint.lat()},${firstPoint.lng()}`;
          }
        }
      });
      
      // Add annotation markers
      annotations.forEach((ann, idx) => {
        if (ann.position) {
          markers += `&markers=color:red|label:A${idx + 1}|${ann.position.lat},${ann.position.lng}`;
        }
      });
      
      const fullUrl = staticMapUrl + markers;
      
      // Open in new tab or download
      const link = document.createElement('a');
      link.href = fullUrl;
      link.target = '_blank';
      link.download = `${site.name.replace(/\s+/g, '_')}_map_${new Date().toISOString().split('T')[0]}.png`;
      
      // Try to download directly
      try {
        const response = await fetch(fullUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        
        alert('Map exported successfully!');
      } catch (fetchError) {
        // Fallback: open in new tab
        window.open(fullUrl, '_blank');
        alert('Map opened in new tab. Right-click to save the image.');
      }
      
    } catch (error) {
      console.error('Error exporting map:', error);
      alert('Failed to export map. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PageHeader
          title="Unified Map Builder"
          subtitle="Loading site data..."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Sites', href: '/sites' },
            { label: 'Loading...' },
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading site data...</p>
          </div>
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
                disabled={showGeofenceSave}
                className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTool === 'boundary'
                    ? 'bg-purple-600 text-white'
                    : showGeofenceSave
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <Pentagon className="w-5 h-5" />
                <span className="font-medium">Draw Geofence Boundary</span>
              </button>
              
              {/* Save Geofence Button - Shows after drawing */}
              {showGeofenceSave && (
                <button
                  onClick={saveGeofence}
                  disabled={savingGeofence}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span className="font-medium">
                    {savingGeofence ? 'Saving...' : 'Save Geofence'}
                  </span>
                </button>
              )}
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

              {/* Annotation Type */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Annotation Type:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => activateTool('marker', window.google?.maps?.drawing?.OverlayType?.MARKER)}
                    className={`px-3 py-2 rounded-lg flex flex-col items-center justify-center gap-1 ${
                      activeTool === 'marker'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs">Icon</span>
                  </button>
                  <button
                    onClick={() => activateTool('arrow', window.google?.maps?.drawing?.OverlayType?.POLYLINE)}
                    className={`px-3 py-2 rounded-lg flex flex-col items-center justify-center gap-1 ${
                      activeTool === 'arrow'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="text-xs">Arrow</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTool('text');
                      setShowLabelInput(true);
                    }}
                    className={`px-3 py-2 rounded-lg flex flex-col items-center justify-center gap-1 ${
                      activeTool === 'text'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Type className="w-4 h-4" />
                    <span className="text-xs">Text</span>
                  </button>
                  <button
                    onClick={() => activateTool('polygon', window.google?.maps?.drawing?.OverlayType?.POLYGON)}
                    className={`px-3 py-2 rounded-lg flex flex-col items-center justify-center gap-1 ${
                      activeTool === 'polygon'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Pentagon className="w-4 h-4" />
                    <span className="text-xs">Polygon</span>
                  </button>
                  <button
                    onClick={() => activateTool('rectangle', window.google?.maps?.drawing?.OverlayType?.RECTANGLE)}
                    className={`px-3 py-2 rounded-lg flex flex-col items-center justify-center gap-1 ${
                      activeTool === 'rectangle'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Square className="w-4 h-4" />
                    <span className="text-xs">Box</span>
                  </button>
                  <button
                    onClick={() => activateTool('circle', window.google?.maps?.drawing?.OverlayType?.CIRCLE)}
                    className={`px-3 py-2 rounded-lg flex flex-col items-center justify-center gap-1 ${
                      activeTool === 'circle'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Circle className="w-4 h-4" />
                    <span className="text-xs">Circle</span>
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

            {/* Map Legend */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Map Legend</span>
                <button onClick={() => setShowLegend(!showLegend)}>
                  {showLegend ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              {showLegend && (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {/* Geofence */}
                  {geofenceBoundary && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-purple-500 rounded border border-purple-700"></div>
                        <span className="text-xs font-semibold text-gray-800">Geofence Boundary</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Measurements */}
                  {measurements.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-gray-800">Measurements:</div>
                      {measurements.map((m, idx) => (
                        <div key={m.id} className="flex items-center gap-2 ml-2">
                          <Ruler className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-gray-700">
                            {m.label || `${m.type} #${idx + 1}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Annotations by Category */}
                  {annotations.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-gray-800">Annotations:</div>
                      {/* Group by category */}
                      {Array.from(new Set(annotations.map(a => a.category))).map(category => {
                        const categoryItems = annotations.filter(a => a.category === category);
                        const categoryInfo = ANNOTATION_CATEGORIES.find(c => c.value === category);
                        const CategoryIcon = categoryInfo?.icon || MapPin;
                        
                        return (
                          <div key={category} className="space-y-1">
                            <div className="flex items-center gap-2 ml-2">
                              <CategoryIcon className="w-3 h-3" style={{ color: categoryItems[0]?.color || '#3B82F6' }} />
                              <span className="text-xs font-medium text-gray-700">
                                {categoryInfo?.label || category} ({categoryItems.length})
                              </span>
                            </div>
                            {categoryItems.map((item, idx) => (
                              item.label && (
                                <div key={item.id} className="flex items-center gap-2 ml-6 text-xs text-gray-600">
                                  • {item.label}
                                </div>
                              )
                            ))}
                          </div>
  );
                      })}
                    </div>
                  )}
                  
                  {/* Empty state */}
                  {!geofenceBoundary && measurements.length === 0 && annotations.length === 0 && (
                    <div className="text-xs text-gray-500 italic">No items on map yet</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {/* Always render map container for ref */}
          <div 
            ref={mapContainerRef} 
            className="w-full h-full"
            style={{ display: loading ? 'none' : 'block' }}
          />
          
          {/* Loading overlay */}
          {(loading || !mapInitialized) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">
                  {loading ? 'Loading site data...' : 'Initializing map...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
