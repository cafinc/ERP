'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Circle, Rect, Text as KonvaText, Image as KonvaImage, Group, RegularPolygon } from 'react-konva';
import {
  Upload, Save, Undo, Redo, Trash2, Type, Circle as CircleIcon, Square, Minus,
  MapPin, AlertTriangle, Accessibility, Droplet, Flame, ArrowRight, Pen, Palette,
  ZoomIn, ZoomOut, Maximize2, Layers, Grid, CheckCircle, Search,
} from 'lucide-react';
import jsPDF from 'jspdf';

interface Annotation {
  id: string;
  type: string;
  category?: string;
  label?: string;
  color?: string;
  points?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
}

interface SiteMapAnnotationProps {
  siteId: string;
  siteName: string;
  siteAddress: string;
  initialMapData?: string;
  initialAnnotations?: Annotation[];
  onSave: (mapData: any) => Promise<void>;
}

const FEATURE_ICONS = [
  { id: 'curb', label: 'Curb', icon: Minus, color: '#EF4444', keywords: ['curb', 'edge', 'border'], shape: 'line' },
  { id: 'drain', label: 'Drain', icon: Droplet, color: '#3B82F6', keywords: ['drain', 'water', 'sewer'], shape: 'drain' },
  { id: 'speed_bump', label: 'Speed Bump', icon: AlertTriangle, color: '#F59E0B', keywords: ['bump', 'speed', 'slow'], shape: 'triangle' },
  { id: 'handicap', label: 'Handicap Spot', icon: Accessibility, color: '#3B82F6', keywords: ['handicap', 'accessible', 'disabled'], shape: 'wheelchair' },
  { id: 'fire_hydrant', label: 'Fire Hydrant', icon: Flame, color: '#DC2626', keywords: ['fire', 'hydrant', 'water'], shape: 'hydrant' },
  { id: 'entrance', label: 'Entrance', icon: ArrowRight, color: '#10B981', keywords: ['entrance', 'entry', 'in'], shape: 'arrow' },
  { id: 'exit', label: 'Exit', icon: MapPin, color: '#EF4444', keywords: ['exit', 'out', 'leave'], shape: 'arrow' },
  { id: 'hazard', label: 'Hazard', icon: AlertTriangle, color: '#F59E0B', keywords: ['hazard', 'danger', 'warning'], shape: 'triangle' },
];

const AREA_TYPES = [
  { id: 'sidewalk', label: 'Sidewalk', color: '#94A3B8' },
  { id: 'plowing_zone', label: 'Plowing Zone', color: '#60A5FA' },
  { id: 'no_parking', label: 'No Parking', color: '#F87171' },
  { id: 'restricted', label: 'Restricted Area', color: '#FCD34D' },
];

const MAX_HISTORY = 50; // Limit history to prevent memory issues

// Memoized icon shape component for better performance
const FeatureIconShape = React.memo(({ shape, color, x, y, selected }: any) => {
  const strokeWidth = selected ? 4 : 2;
  const size = 30;
  
  switch (shape) {
    case 'drain':
      return (
        <Group x={x} y={y}>
          <Circle radius={size/2} stroke={color} strokeWidth={strokeWidth} fill="white" />
          <Circle x={0} y={-8} radius={3} fill={color} />
          <Circle x={-6} y={4} radius={3} fill={color} />
          <Circle x={6} y={4} radius={3} fill={color} />
        </Group>
      );
    
    case 'triangle':
      return (
        <RegularPolygon
          x={x}
          y={y}
          sides={3}
          radius={size/2}
          fill={color}
          stroke="white"
          strokeWidth={strokeWidth}
        />
      );
    
    case 'wheelchair':
      return (
        <Group x={x} y={y}>
          <Circle radius={size/2} stroke={color} strokeWidth={strokeWidth} fill="white" />
          <Circle x={0} y={-5} radius={4} fill={color} />
          <Rect x={-2} y={0} width={4} height={8} fill={color} />
          <Circle x={0} y={8} radius={8} stroke={color} strokeWidth={2} />
        </Group>
      );
    
    case 'hydrant':
      return (
        <Group x={x} y={y}>
          <Rect x={-8} y={-10} width={16} height={20} fill={color} cornerRadius={2} />
          <Rect x={-10} y={-12} width={20} height={4} fill={color} />
          <Rect x={-10} y={8} width={20} height={4} fill={color} />
          <Circle x={-12} y={0} radius={3} fill="white" />
          <Circle x={12} y={0} radius={3} fill="white" />
        </Group>
      );
    
    case 'arrow':
      return (
        <Group x={x} y={y}>
          <Line points={[-15, 0, 15, 0]} stroke={color} strokeWidth={strokeWidth} />
          <Line points={[15, 0, 10, -5]} stroke={color} strokeWidth={strokeWidth} />
          <Line points={[15, 0, 10, 5]} stroke={color} strokeWidth={strokeWidth} />
        </Group>
      );
    
    case 'line':
      return (
        <Line
          x={x}
          y={y}
          points={[-20, 0, 20, 0]}
          stroke={color}
          strokeWidth={4}
        />
      );
    
    default:
      return (
        <Circle
          x={x}
          y={y}
          radius={size/2}
          fill={color}
          stroke="white"
          strokeWidth={strokeWidth}
        />
      );
  }
});

FeatureIconShape.displayName = 'FeatureIconShape';

export default function SiteMapAnnotationOptimized({
  siteId,
  siteName,
  siteAddress,
  initialMapData,
  initialAnnotations,
  onSave,
}: SiteMapAnnotationProps) {
  // Core state
  const [tool, setTool] = useState('select');
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations || []);
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [imageLoading, setImageLoading] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // NEW ENHANCEMENTS
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(50);
  const [showRuler, setShowRuler] = useState(false);
  const [rulerPoints, setRulerPoints] = useState<number[]>([]);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [layers, setLayers] = useState([
    { id: 'main', name: 'Main Layer', visible: true, locked: false }
  ]);
  const [currentLayer, setCurrentLayer] = useState('main');
  const [selectedAnnotations, setSelectedAnnotations] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<Annotation[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAreaCalculator, setShowAreaCalculator] = useState(false);
  const [annotationNotes, setAnnotationNotes] = useState<{[key: string]: string}>({});
  
  // Polygon state
  const [polygonPoints, setPolygonPoints] = useState<number[]>([]);
  const [drawingPolygon, setDrawingPolygon] = useState(false);
  const [currentAreaType, setCurrentAreaType] = useState<string>('');
  const [editingPolygon, setEditingPolygon] = useState<string | null>(null);
  
  // Use refs instead of state for high-frequency updates (PERFORMANCE FIX)
  const isDrawingRef = useRef(false);
  const cursorPosRef = useRef<{x: number, y: number} | null>(null);
  const tempPolygonLineRef = useRef<number[]>([]);
  const stageRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastMouseMoveRef = useRef<number>(0);

  // Memoize filtered icons (PERFORMANCE FIX)
  const filteredIcons = useMemo(() => {
    return FEATURE_ICONS.filter(icon =>
      icon.label.toLowerCase().includes(iconSearch.toLowerCase()) ||
      icon.keywords.some(k => k.includes(iconSearch.toLowerCase()))
    );
  }, [iconSearch]);

  // Memoize grid lines (PERFORMANCE FIX)
  const gridLines = useMemo(() => {
    if (!showGrid) return null;
    return Array.from({ length: 20 }).map((_, i) => (
      <React.Fragment key={`grid-${i}`}>
        <Line
          points={[i * 50, 0, i * 50, 700]}
          stroke="#e5e7eb"
          strokeWidth={1}
          listening={false}
        />
        <Line
          points={[0, i * 50, 1000, i * 50]}
          stroke="#e5e7eb"
          strokeWidth={1}
          listening={false}
        />
      </React.Fragment>
    ));
  }, [showGrid]);

  // Load image once
  useEffect(() => {
    if (initialMapData) {
      const img = new window.Image();
      img.src = initialMapData;
      img.onload = () => {
        setBaseImage(img);
        setImageLoading(false);
      };
      img.onerror = () => setImageLoading(false);
    } else {
      loadGoogleMapsScreenshot();
    }
    
    // Cleanup
    return () => {
      if (baseImage) {
        baseImage.src = '';
      }
    };
  }, [initialMapData]);

  const loadGoogleMapsScreenshot = useCallback(async () => {
    try {
      setImageLoading(true);
      const apiKey = 'AIzaSyCUDEtt2lRq3PGRqDKZAwk6i-iZkiyTzJw';
      const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(siteAddress)}&zoom=19&size=1000x700&maptype=satellite&key=${apiKey}`;
      
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = mapUrl;
      img.onload = () => {
        setBaseImage(img);
        setImageLoading(false);
      };
      img.onerror = () => {
        setImageLoading(false);
        console.error('Failed to load Google Maps image');
      };
    } catch (error) {
      setImageLoading(false);
      console.error('Error loading Google Maps screenshot:', error);
    }
  }, [siteAddress]);

  // Optimized history management with limit (PERFORMANCE FIX)
  const addToHistory = useCallback((newAnnotations: Annotation[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(Math.max(0, prev.length - MAX_HISTORY + 1), historyStep + 1);
      newHistory.push(newAnnotations);
      return newHistory;
    });
    setHistoryStep(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyStep]);

  // Keyboard shortcuts with useCallback (PERFORMANCE FIX)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 's') {
          e.preventDefault();
          handleSave();
        }
      } else if (e.key === 'Delete' && selectedAnnotation) {
        deleteAnnotation(selectedAnnotation);
      } else if (e.key === 'Escape') {
        setTool('select');
        setSelectedAnnotation(null);
        setDrawingPolygon(false);
        setPolygonPoints([]);
        tempPolygonLineRef.current = [];
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotation, historyStep]);

  // Optimized auto-save with proper cleanup (RELIABILITY FIX)
  useEffect(() => {
    if (autoSaveEnabled && annotations.length > 0) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(true);
      }, 5000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [annotations, autoSaveEnabled]);

  const handleUndo = useCallback(() => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      setAnnotations(history[newStep]);
    }
  }, [historyStep, history]);

  const handleRedo = useCallback(() => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      setAnnotations(history[newStep]);
    }
  }, [historyStep, history]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setStagePos({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = Math.max(0.5, Math.min(3, newScale));

    setZoom(clampedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  }, []);

  // Throttled mouse move for better performance (PERFORMANCE FIX)
  const handleStageMouseMove = useCallback((e: any) => {
    const now = Date.now();
    // Throttle to 60fps max
    if (now - lastMouseMoveRef.current < 16) return;
    lastMouseMoveRef.current = now;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    cursorPosRef.current = point;

    if (drawingPolygon && polygonPoints.length >= 2) {
      const lastX = polygonPoints[polygonPoints.length - 2];
      const lastY = polygonPoints[polygonPoints.length - 1];
      tempPolygonLineRef.current = [lastX, lastY, point.x, point.y];
      stage.batchDraw(); // Use batchDraw for better performance
    }

    if (!isDrawingRef.current) return;
    
    const lastAnnotation = annotations[annotations.length - 1];

    if (tool === 'pen' && lastAnnotation?.type === 'line') {
      setAnnotations(prev => {
        const updated = prev.slice(0, -1);
        updated.push({
          ...lastAnnotation,
          points: [...(lastAnnotation.points || []), point.x, point.y],
        });
        return updated;
      });
    } else if (tool === 'circle' && lastAnnotation?.type === 'circle') {
      const dx = point.x - (lastAnnotation.x || 0);
      const dy = point.y - (lastAnnotation.y || 0);
      const radius = Math.sqrt(dx * dx + dy * dy);
      setAnnotations(prev => {
        const updated = prev.slice(0, -1);
        updated.push({ ...lastAnnotation, radius });
        return updated;
      });
    } else if (tool === 'rectangle' && lastAnnotation?.type === 'rectangle') {
      setAnnotations(prev => {
        const updated = prev.slice(0, -1);
        updated.push({
          ...lastAnnotation,
          width: point.x - (lastAnnotation.x || 0),
          height: point.y - (lastAnnotation.y || 0),
        });
        return updated;
      });
    }
  }, [tool, annotations, drawingPolygon, polygonPoints]);

  // Helper function to get correctly transformed pointer position
  const getTransformedPointerPosition = useCallback((stage: any) => {
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return { x: 0, y: 0 };
    
    // Get the stage's absolute transform and invert it to get canvas coordinates
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = transform.point(pointerPosition);
    
    return pos;
  }, []);

  const handleMouseDown = useCallback((e: any) => {
    if (tool === 'select') return;
    
    const stage = e.target.getStage();
    const pos = getTransformedPointerPosition(stage);

    if (drawingPolygon) {
      setPolygonPoints(prev => [...prev, pos.x, pos.y]);
      return;
    }
    
    isDrawingRef.current = true;
    
    if (tool === 'pen') {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'line',
        color: selectedColor,
        points: [pos.x, pos.y],
      };
      setAnnotations(prev => [...prev, newAnnotation]);
    } else if (tool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const newAnnotation: Annotation = {
          id: Date.now().toString(),
          type: 'text',
          color: selectedColor,
          x: pos.x,
          y: pos.y,
          text,
        };
        setAnnotations(prev => {
          const updated = [...prev, newAnnotation];
          addToHistory(updated);
          return updated;
        });
      }
      isDrawingRef.current = false;
    } else if (tool === 'circle') {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'circle',
        color: selectedColor,
        x: pos.x,
        y: pos.y,
        radius: 0,
      };
      setAnnotations(prev => [...prev, newAnnotation]);
    } else if (tool === 'rectangle') {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'rectangle',
        color: selectedColor,
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
      };
      setAnnotations(prev => [...prev, newAnnotation]);
    }
  }, [tool, selectedColor, drawingPolygon, addToHistory, getTransformedPointerPosition]);

  const handleMouseUp = useCallback(() => {
    if (isDrawingRef.current) {
      addToHistory(annotations);
    }
    isDrawingRef.current = false;
  }, [annotations, addToHistory]);

  const handleDoubleClick = useCallback(() => {
    if (drawingPolygon && polygonPoints.length >= 6) {
      const area = AREA_TYPES.find(a => a.id === currentAreaType);
      if (area) {
        const newAnnotation: Annotation = {
          id: Date.now().toString(),
          type: 'polygon',
          category: currentAreaType,
          label: area.label,
          color: area.color,
          points: polygonPoints,
        };
        
        setAnnotations(prev => {
          const updated = [...prev, newAnnotation];
          addToHistory(updated);
          return updated;
        });
      }
      
      setDrawingPolygon(false);
      setPolygonPoints([]);
      tempPolygonLineRef.current = [];
      setCurrentAreaType('');
      setTool('select');
    }
  }, [drawingPolygon, polygonPoints, currentAreaType, addToHistory]);

  const addFeatureIcon = useCallback((featureId: string) => {
    const feature = FEATURE_ICONS.find(f => f.id === featureId);
    if (!feature) return;

    // Get center of visible canvas area
    const stage = stageRef.current;
    if (stage) {
      const centerX = (-stagePos.x + 500) / zoom;
      const centerY = (-stagePos.y + 350) / zoom;
      
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'feature-icon',
        category: featureId,
        label: feature.label,
        color: feature.color,
        x: centerX,
        y: centerY,
        text: feature.label,
      };
      
      setAnnotations(prev => {
        const updated = [...prev, newAnnotation];
        addToHistory(updated);
        return updated;
      });
    }
  }, [addToHistory, stagePos, zoom]);

  // Handler for drag end - updates annotation position
  const handleDragEnd = useCallback((annotationId: string, e: any) => {
    const newX = e.target.x();
    const newY = e.target.y();
    
    setAnnotations(prev => {
      const updated = prev.map(ann => 
        ann.id === annotationId 
          ? { ...ann, x: newX, y: newY }
          : ann
      );
      addToHistory(updated);
      return updated;
    });
  }, [addToHistory]);

  const addAreaMarker = useCallback((areaId: string) => {
    const area = AREA_TYPES.find(a => a.id === areaId);
    if (!area) return;

    setDrawingPolygon(true);
    setCurrentAreaType(areaId);
    setPolygonPoints([]);
    tempPolygonLineRef.current = [];
    setTool('polygon');
  }, []);

  const deleteAnnotation = useCallback((annotationId: string) => {
    setAnnotations(prev => {
      const updated = prev.filter(a => a.id !== annotationId);
      addToHistory(updated);
      return updated;
    });
    setSelectedAnnotation(null);
  }, [addToHistory]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => setBaseImage(img);
    };
    reader.readAsDataURL(file);
  }, []);

  const exportAsPNG = useCallback(() => {
    if (!stageRef.current) return;
    
    const uri = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = `${siteName.replace(/\s+/g, '_')}_map.png`;
    link.href = uri;
    link.click();
  }, [siteName]);

  const exportAsPDF = useCallback(() => {
    if (!stageRef.current) return;

    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    pdf.setFontSize(18);
    pdf.text(siteName, 15, 15);
    pdf.setFontSize(12);
    pdf.text(siteAddress, 15, 22);
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 28);

    const uri = stageRef.current.toDataURL();
    const imgWidth = pageWidth - 30;
    pdf.addImage(uri, 'PNG', 15, 35, imgWidth, imgWidth * 0.7);

    let legendY = 140;
    pdf.setFontSize(14);
    pdf.text('Legend', 15, legendY);
    pdf.setFontSize(10);
    legendY += 7;
    FEATURE_ICONS.forEach((feature, idx) => {
      pdf.text(`• ${feature.label}`, 20, legendY + (idx * 5));
    });

    pdf.save(`${siteName.replace(/\s+/g, '_')}_map.pdf`);
  }, [siteName, siteAddress]);

  const handleSave = useCallback(async (silent = false) => {
    try {
      const mapData = {
        base_map_data: stageRef.current?.toDataURL(),
        annotations: annotations,
        legend_items: [
          ...FEATURE_ICONS.map(f => ({ ...f, icon: undefined })),
          ...AREA_TYPES,
        ],
      };

      await onSave(mapData);
      setLastSaved(new Date());
      
      if (!silent) {
        alert('Site map saved successfully!');
      }
    } catch (error) {
      console.error('Save failed:', error);
      if (!silent) {
        alert('Failed to save site map');
      }
    }
  }, [annotations, onSave]);

  const clearCanvas = useCallback(() => {
    if (!confirm('Clear all annotations?')) return;
    setAnnotations([]);
    addToHistory([]);
  }, [addToHistory]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
      {/* Modern Header Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0 sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Site Map Editor</h2>
            <p className="text-sm text-gray-500 mt-0.5">Create and annotate site layout maps</p>
          </div>
          {lastSaved && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">Saved {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Enhanced Toolbar */}
        <div className="flex items-center gap-3 px-6 py-3 bg-gray-50 border-t border-gray-200 overflow-x-auto">
          {/* File Operations */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm whitespace-nowrap"
              title="Upload Base Image"
            >
              <Upload className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Upload</span>
            </button>
            <button
              onClick={() => handleSave(false)}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm whitespace-nowrap"
              title="Save Map (Ctrl+S)"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm font-medium">Save</span>
            </button>
            <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-all whitespace-nowrap">
              <input
                type="checkbox"
                checked={autoSaveEnabled}
                onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                className="w-4 h-4 text-green-600 rounded"
              />
              <span className="text-sm text-gray-700">Auto-save</span>
            </label>
          </div>

          <div className="w-px h-8 bg-gray-300 flex-shrink-0"></div>

          {/* History */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={handleUndo} disabled={historyStep <= 0} className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all" title="Undo (Ctrl+Z)">
              <Undo className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={handleRedo} disabled={historyStep >= history.length - 1} className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all" title="Redo (Ctrl+Y)">
              <Redo className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="w-px h-8 bg-gray-300 flex-shrink-0"></div>

          {/* Drawing Tools */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setTool('pen')} className={`p-2 rounded-lg transition-all ${tool === 'pen' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`} title="Freehand Draw">
              <Pen className="w-4 h-4" />
            </button>
            <button onClick={() => setTool('text')} className={`p-2 rounded-lg transition-all ${tool === 'text' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`} title="Add Text">
              <Type className="w-4 h-4" />
            </button>
            <button onClick={() => setTool('circle')} className={`p-2 rounded-lg transition-all ${tool === 'circle' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`} title="Circle">
              <CircleIcon className="w-4 h-4" />
            </button>
            <button onClick={() => setTool('rectangle')} className={`p-2 rounded-lg transition-all ${tool === 'rectangle' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`} title="Rectangle">
              <Square className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-8 bg-gray-300 flex-shrink-0"></div>

          {/* View Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleZoomOut} className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all" title="Zoom Out">
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <div className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg min-w-[60px] text-center">
              <span className="text-sm font-semibold text-gray-700">{Math.round(zoom * 100)}%</span>
            </div>
            <button onClick={handleZoomIn} className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all" title="Zoom In">
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={handleResetView} className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all" title="Reset View">
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="w-px h-8 bg-gray-300 flex-shrink-0"></div>

          {/* Utilities */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setShowGrid(!showGrid)} className={`p-2 rounded-lg transition-all ${showGrid ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`} title="Toggle Grid">
              <Grid className="w-4 h-4" />
            </button>
            <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
              <Palette className="w-4 h-4 text-gray-600" />
              <input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-gray-300" />
            </label>
          </div>

          <div className="flex-1"></div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={clearCanvas} className="p-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-all" title="Clear All">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={exportAsPNG} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm font-medium text-sm whitespace-nowrap">
              Export PNG
            </button>
            <button onClick={exportAsPDF} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-sm font-medium text-sm whitespace-nowrap">
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Polygon Drawing Status Bar */}
      {drawingPolygon && (
        <div className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 border-b border-blue-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-semibold">Drawing: {AREA_TYPES.find(a => a.id === currentAreaType)?.label}</span>
              {polygonPoints.length >= 2 && (
                <span className="px-2 py-1 bg-white/20 rounded text-sm font-medium">
                  {polygonPoints.length / 2} points
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-white text-sm">
              <span>Click to add points</span>
              <span>•</span>
              <span>Double-click to complete</span>
              <span>•</span>
              <span className="font-medium">Press Esc to cancel</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Canvas Area */}
        <div className="flex-1 p-4 overflow-auto min-w-0">
          <div className="h-full min-h-[500px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative flex items-center justify-center">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm z-10">
                <div className="text-center">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                    <MapPin className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="mt-4 text-gray-700 font-medium">Loading satellite view...</p>
                  <p className="mt-1 text-sm text-gray-500">Fetching high-resolution imagery</p>
                </div>
              </div>
            )}
            
            <Stage
              width={Math.min(1000, window.innerWidth - 450)}
              height={Math.min(700, window.innerHeight - 300)}
              ref={stageRef}
              scaleX={zoom}
              scaleY={zoom}
              x={stagePos.x}
              y={stagePos.y}
              onMouseDown={handleMouseDown}
              onMousemove={handleStageMouseMove}
              onMouseup={handleMouseUp}
              onDblClick={handleDoubleClick}
              onWheel={handleWheel}
              draggable={tool === 'select' && !drawingPolygon}
              className="shadow-inner"
            >
              <Layer>
                {baseImage && <KonvaImage image={baseImage} width={Math.min(1000, window.innerWidth - 450)} height={Math.min(700, window.innerHeight - 300)} listening={false} />}
                {gridLines}
                
                {annotations.map((ann) => {
                  if (ann.type === 'line') {
                    return <Line key={ann.id} points={ann.points} stroke={ann.color} strokeWidth={3} tension={0.5} lineCap="round" lineJoin="round" onClick={() => setSelectedAnnotation(ann.id)} />;
                  } else if (ann.type === 'circle') {
                    return <Circle key={ann.id} x={ann.x} y={ann.y} radius={ann.radius} stroke={ann.color} strokeWidth={selectedAnnotation === ann.id ? 5 : 3} draggable onClick={() => setSelectedAnnotation(ann.id)} />;
                  } else if (ann.type === 'rectangle') {
                    return <Rect key={ann.id} x={ann.x} y={ann.y} width={ann.width} height={ann.height} stroke={ann.color} strokeWidth={selectedAnnotation === ann.id ? 5 : 3} fill={ann.category ? ann.color + '40' : undefined} draggable onClick={() => setSelectedAnnotation(ann.id)} />;
                  } else if (ann.type === 'polygon') {
                    return <Line key={ann.id} points={ann.points} stroke={ann.color} strokeWidth={3} fill={ann.color + '60'} closed onClick={() => setSelectedAnnotation(ann.id)} />;
                  } else if (ann.type === 'feature-icon') {
                    const feature = FEATURE_ICONS.find(f => f.id === ann.category);
                    return (
                      <Group 
                        key={ann.id} 
                        draggable 
                        x={ann.x}
                        y={ann.y}
                        onClick={() => setSelectedAnnotation(ann.id)}
                        onDragEnd={(e) => handleDragEnd(ann.id, e)}
                      >
                        <FeatureIconShape shape={feature?.shape || 'circle'} color={ann.color} x={0} y={0} selected={selectedAnnotation === ann.id} />
                        <KonvaText x={-60} y={30} text={ann.text} fontSize={12} fill={ann.color} fontStyle="bold" align="center" width={120} />
                      </Group>
                    );
                  } else if (ann.type === 'text') {
                    return <KonvaText key={ann.id} x={ann.x} y={ann.y} text={ann.text} fontSize={16} fill={ann.color} draggable onClick={() => setSelectedAnnotation(ann.id)} onDragEnd={(e) => handleDragEnd(ann.id, e)} />;
                  }
                  return null;
                })}

                {drawingPolygon && polygonPoints.length >= 2 && (
                  <>
                    <Line points={polygonPoints} stroke={AREA_TYPES.find(a => a.id === currentAreaType)?.color || '#3B82F6'} strokeWidth={2} listening={false} />
                    {tempPolygonLineRef.current.length === 4 && <Line points={tempPolygonLineRef.current} stroke={AREA_TYPES.find(a => a.id === currentAreaType)?.color || '#3B82F6'} strokeWidth={2} dash={[5, 5]} listening={false} />}
                    {Array.from({ length: polygonPoints.length / 2 }).map((_, i) => (
                      <Circle key={`point-${i}`} x={polygonPoints[i * 2]} y={polygonPoints[i * 2 + 1]} radius={5} fill={AREA_TYPES.find(a => a.id === currentAreaType)?.color || '#3B82F6'} listening={false} />
                    ))}
                  </>
                )}
              </Layer>
            </Stage>
          </div>
        </div>

        {/* Enhanced Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
          {/* Search Section */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 sticky top-0 z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
              <input
                type="text"
                placeholder="Search icons..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              />
            </div>
          </div>

          <div className="p-5">
            {/* Feature Icons Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  Feature Icons
                </h3>
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  {filteredIcons.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {filteredIcons.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <button
                      key={feature.id}
                      onClick={() => addFeatureIcon(feature.id)}
                      className="group flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-200 hover:scale-105"
                      style={{ borderColor: feature.color + '30' }}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: feature.color + '20' }}>
                        <Icon className="w-5 h-5" style={{ color: feature.color }} />
                      </div>
                      <span className="text-xs text-gray-700 font-medium text-center">{feature.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Area Types Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  Area Types
                </h3>
              </div>
              <p className="text-xs text-gray-500 mb-3 italic">Click to start drawing polygon</p>
              <div className="space-y-2">
                {AREA_TYPES.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => addAreaMarker(area.id)}
                    className={`w-full flex items-center gap-3 p-4 border-2 rounded-xl transition-all duration-200 hover:scale-102 ${
                      drawingPolygon && currentAreaType === area.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg border-2 border-white shadow-md flex-shrink-0"
                      style={{ backgroundColor: area.color }}
                    />
                    <span className="text-sm text-gray-800 font-semibold">{area.label}</span>
                    {drawingPolygon && currentAreaType === area.id && (
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Map Info Card */}
            <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 shadow-sm">
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Map Information
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-white rounded-lg">
                  <p className="text-gray-500 text-xs mb-1">Site Name</p>
                  <p className="font-semibold text-gray-900">{siteName}</p>
                </div>
                <div className="p-2 bg-white rounded-lg">
                  <p className="text-gray-500 text-xs mb-1">Address</p>
                  <p className="text-gray-700 text-xs">{siteAddress}</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 p-2 bg-white rounded-lg text-center">
                    <p className="text-gray-500 text-xs">Annotations</p>
                    <p className="font-bold text-blue-600 text-lg">{annotations.length}</p>
                  </div>
                  <div className="flex-1 p-2 bg-white rounded-lg text-center">
                    <p className="text-gray-500 text-xs">Zoom</p>
                    <p className="font-bold text-purple-600 text-lg">{Math.round(zoom * 100)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="mt-5 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100">
              <p className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-lg">⌨️</span>
                Keyboard Shortcuts
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Undo</span>
                  <kbd className="px-2 py-1 bg-white border border-blue-200 rounded font-mono text-blue-700">Ctrl+Z</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Redo</span>
                  <kbd className="px-2 py-1 bg-white border border-blue-200 rounded font-mono text-blue-700">Ctrl+Y</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Save</span>
                  <kbd className="px-2 py-1 bg-white border border-blue-200 rounded font-mono text-blue-700">Ctrl+S</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Delete</span>
                  <kbd className="px-2 py-1 bg-white border border-blue-200 rounded font-mono text-blue-700">Del</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cancel</span>
                  <kbd className="px-2 py-1 bg-white border border-blue-200 rounded font-mono text-blue-700">Esc</kbd>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-700 flex items-center gap-1">
                  <span>💡</span>
                  <span className="font-medium">Tip: Drag icons to reposition them</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
