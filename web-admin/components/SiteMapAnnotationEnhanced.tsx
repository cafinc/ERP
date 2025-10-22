'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Line, Circle, Rect, Text as KonvaText, Image as KonvaImage, Group } from 'react-konva';
import {
  Download,
  Upload,
  Save,
  Undo,
  Redo,
  Trash2,
  Type,
  Circle as CircleIcon,
  Square,
  Minus,
  MapPin,
  AlertTriangle,
  Accessibility,
  Droplet,
  Flame,
  ArrowRight,
  Pen,
  Palette,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Copy,
  Grid,
  Ruler,
  CheckCircle,
  Search,
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
  { id: 'curb', label: 'Curb', icon: Minus, color: '#EF4444', keywords: ['curb', 'edge', 'border'] },
  { id: 'drain', label: 'Drain', icon: Droplet, color: '#3B82F6', keywords: ['drain', 'water', 'sewer'] },
  { id: 'speed_bump', label: 'Speed Bump', icon: AlertTriangle, color: '#F59E0B', keywords: ['bump', 'speed', 'slow'] },
  { id: 'handicap', label: 'Handicap Spot', icon: Accessibility, color: '#3B82F6', keywords: ['handicap', 'accessible', 'disabled'] },
  { id: 'fire_hydrant', label: 'Fire Hydrant', icon: Flame, color: '#DC2626', keywords: ['fire', 'hydrant', 'water'] },
  { id: 'entrance', label: 'Entrance', icon: ArrowRight, color: '#10B981', keywords: ['entrance', 'entry', 'in'] },
  { id: 'exit', label: 'Exit', icon: MapPin, color: '#EF4444', keywords: ['exit', 'out', 'leave'] },
  { id: 'hazard', label: 'Hazard', icon: AlertTriangle, color: '#F59E0B', keywords: ['hazard', 'danger', 'warning'] },
];

const AREA_TYPES = [
  { id: 'sidewalk', label: 'Sidewalk', color: '#94A3B8' },
  { id: 'plowing_zone', label: 'Plowing Zone', color: '#60A5FA' },
  { id: 'no_parking', label: 'No Parking', color: '#F87171' },
  { id: 'restricted', label: 'Restricted Area', color: '#FCD34D' },
];

export default function SiteMapAnnotationEnhanced({
  siteId,
  siteName,
  siteAddress,
  initialMapData,
  initialAnnotations,
  onSave,
}: SiteMapAnnotationProps) {
  const [tool, setTool] = useState('select');
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations || []);
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [isDrawing, setIsDrawing] = useState(false);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [iconSearch, setIconSearch] = useState('');
  const [measuring, setMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<number[]>([]);
  const [imageLoading, setImageLoading] = useState(true);
  const [polygonPoints, setPolygonPoints] = useState<number[]>([]);
  const [tempPolygonLine, setTempPolygonLine] = useState<number[]>([]);
  const [drawingPolygon, setDrawingPolygon] = useState(false);
  const [currentAreaType, setCurrentAreaType] = useState<string>('');
  
  const stageRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Google Maps or initial image
  useEffect(() => {
    if (initialMapData) {
      const img = new window.Image();
      img.src = initialMapData;
      img.onload = () => {
        setBaseImage(img);
        setImageLoading(false);
      };
    } else {
      loadGoogleMapsScreenshot();
    }
  }, [initialMapData]);

  const loadGoogleMapsScreenshot = async () => {
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
  };

  // Keyboard shortcuts
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
        } else if (e.key === 'c' && selectedAnnotation) {
          e.preventDefault();
          handleCopyAnnotation();
        }
      } else if (e.key === 'Delete' && selectedAnnotation) {
        deleteAnnotation(selectedAnnotation);
      } else if (e.key === 'Escape') {
        setTool('select');
        setSelectedAnnotation(null);
        setMeasuring(false);
        setMeasurePoints([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotation, annotations, historyStep]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveEnabled && annotations.length > 0) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(true); // Silent save
      }, 5000); // Auto-save after 5 seconds of inactivity
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [annotations, autoSaveEnabled]);

  const addToHistory = useCallback((newAnnotations: Annotation[]) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  }, [history, historyStep]);

  const handleUndo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      setAnnotations(history[historyStep - 1]);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      setAnnotations(history[historyStep + 1]);
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom / 1.2, 0.5));
  };

  const handleResetView = () => {
    setZoom(1);
    setStagePos({ x: 0, y: 0 });
  };

  const handleWheel = (e: any) => {
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
  };

  const handleMouseDown = (e: any) => {
    if (tool === 'select') return;
    
    if (measuring) {
      const pos = e.target.getStage().getPointerPosition();
      setMeasurePoints([...measurePoints, pos.x, pos.y]);
      return;
    }
    
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    
    if (tool === 'pen') {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'line',
        color: selectedColor,
        points: [pos.x, pos.y],
      };
      setAnnotations([...annotations, newAnnotation]);
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
        const updated = [...annotations, newAnnotation];
        setAnnotations(updated);
        addToHistory(updated);
      }
      setIsDrawing(false);
    } else if (tool === 'circle') {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'circle',
        color: selectedColor,
        x: pos.x,
        y: pos.y,
        radius: 0,
      };
      setAnnotations([...annotations, newAnnotation]);
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
      setAnnotations([...annotations, newAnnotation]);
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const lastAnnotation = annotations[annotations.length - 1];

    if (tool === 'pen' && lastAnnotation.type === 'line') {
      const updatedAnnotations = annotations.slice(0, -1);
      updatedAnnotations.push({
        ...lastAnnotation,
        points: [...(lastAnnotation.points || []), point.x, point.y],
      });
      setAnnotations(updatedAnnotations);
    } else if (tool === 'circle' && lastAnnotation.type === 'circle') {
      const dx = point.x - (lastAnnotation.x || 0);
      const dy = point.y - (lastAnnotation.y || 0);
      const radius = Math.sqrt(dx * dx + dy * dy);
      const updatedAnnotations = annotations.slice(0, -1);
      updatedAnnotations.push({
        ...lastAnnotation,
        radius,
      });
      setAnnotations(updatedAnnotations);
    } else if (tool === 'rectangle' && lastAnnotation.type === 'rectangle') {
      const updatedAnnotations = annotations.slice(0, -1);
      updatedAnnotations.push({
        ...lastAnnotation,
        width: point.x - (lastAnnotation.x || 0),
        height: point.y - (lastAnnotation.y || 0),
      });
      setAnnotations(updatedAnnotations);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      addToHistory(annotations);
    }
    setIsDrawing(false);
  };

  const addFeatureIcon = (featureId: string) => {
    const feature = FEATURE_ICONS.find(f => f.id === featureId);
    if (!feature) return;

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: 'feature-icon',
      category: featureId,
      label: feature.label,
      color: feature.color,
      x: 400,
      y: 300,
      text: feature.label,
    };
    
    const updated = [...annotations, newAnnotation];
    setAnnotations(updated);
    addToHistory(updated);
  };

  const addAreaMarker = (areaId: string) => {
    const area = AREA_TYPES.find(a => a.id === areaId);
    if (!area) return;

    // Start polygon drawing mode
    setDrawingPolygon(true);
    setCurrentAreaType(areaId);
    setPolygonPoints([]);
    setTempPolygonLine([]);
    setTool('polygon');
  };

  const handleCopyAnnotation = () => {
    if (!selectedAnnotation) return;
    
    const annotation = annotations.find(a => a.id === selectedAnnotation);
    if (!annotation) return;

    const newAnnotation: Annotation = {
      ...annotation,
      id: Date.now().toString(),
      x: (annotation.x || 0) + 20,
      y: (annotation.y || 0) + 20,
    };

    const updated = [...annotations, newAnnotation];
    setAnnotations(updated);
    addToHistory(updated);
  };

  const deleteAnnotation = (annotationId: string) => {
    const updated = annotations.filter(a => a.id !== annotationId);
    setAnnotations(updated);
    addToHistory(updated);
    setSelectedAnnotation(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        setBaseImage(img);
      };
    };
    reader.readAsDataURL(file);
  };

  const exportAsPNG = () => {
    if (!stageRef.current) return;
    
    const uri = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = `${siteName.replace(/\s+/g, '_')}_map.png`;
    link.href = uri;
    link.click();
  };

  const exportAsPDF = () => {
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
    
    legendY += 7;
    pdf.setFontSize(10);
    FEATURE_ICONS.forEach((feature, idx) => {
      pdf.text(`• ${feature.label}`, 20, legendY + (idx * 5));
    });

    pdf.save(`${siteName.replace(/\s+/g, '_')}_map.pdf`);
  };

  const handleSave = async (silent = false) => {
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
  };

  const clearCanvas = () => {
    if (!confirm('Clear all annotations?')) return;
    const updated: Annotation[] = [];
    setAnnotations(updated);
    addToHistory(updated);
  };

  const calculateDistance = () => {
    if (measurePoints.length < 4) return 0;
    
    let total = 0;
    for (let i = 0; i < measurePoints.length - 2; i += 2) {
      const dx = measurePoints[i + 2] - measurePoints[i];
      const dy = measurePoints[i + 3] - measurePoints[i + 1];
      total += Math.sqrt(dx * dx + dy * dy);
    }
    
    // Convert pixels to approximate feet (assuming 1px = 1ft for now)
    return Math.round(total);
  };

  const filteredIcons = FEATURE_ICONS.filter(icon =>
    icon.label.toLowerCase().includes(iconSearch.toLowerCase()) ||
    icon.keywords.some(k => k.includes(iconSearch.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Enhanced Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 flex-wrap bg-gray-50">
        {/* File Operations */}
        <div className="flex items-center gap-1 pr-3 border-r border-gray-300">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm"
            title="Upload Base Image"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSave(false)}
            className="p-2 hover:bg-white rounded-lg transition-colors text-green-600 shadow-sm"
            title="Save Map (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1 px-2">
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={(e) => setAutoSaveEnabled(e.target.checked)}
              className="w-3 h-3"
            />
            <span className="text-xs text-gray-600">Auto</span>
          </div>
        </div>

        {/* History */}
        <div className="flex items-center gap-1 pr-3 border-r border-gray-300">
          <button
            onClick={handleUndo}
            disabled={historyStep <= 0}
            className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyStep >= history.length - 1}
            className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyAnnotation}
            disabled={!selectedAnnotation}
            className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            title="Copy (Ctrl+C)"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* Drawing Tools */}
        <div className="flex items-center gap-1 pr-3 border-r border-gray-300">
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded-lg transition-colors shadow-sm ${tool === 'pen' ? 'bg-blue-500 text-white' : 'hover:bg-white'}`}
            title="Freehand Draw"
          >
            <Pen className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('text')}
            className={`p-2 rounded-lg transition-colors shadow-sm ${tool === 'text' ? 'bg-blue-500 text-white' : 'hover:bg-white'}`}
            title="Add Text"
          >
            <Type className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`p-2 rounded-lg transition-colors shadow-sm ${tool === 'circle' ? 'bg-blue-500 text-white' : 'hover:bg-white'}`}
            title="Add Circle"
          >
            <CircleIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('rectangle')}
            className={`p-2 rounded-lg transition-colors shadow-sm ${tool === 'rectangle' ? 'bg-blue-500 text-white' : 'hover:bg-white'}`}
            title="Add Rectangle"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1 pr-3 border-r border-gray-300">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-gray-600 min-w-[40px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm"
            title="Reset View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Utilities */}
        <div className="flex items-center gap-1 pr-3 border-r border-gray-300">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-colors shadow-sm ${showGrid ? 'bg-blue-500 text-white' : 'hover:bg-white'}`}
            title="Toggle Grid"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setMeasuring(!measuring);
              setMeasurePoints([]);
            }}
            className={`p-2 rounded-lg transition-colors shadow-sm ${measuring ? 'bg-blue-500 text-white' : 'hover:bg-white'}`}
            title="Measure Distance"
          >
            <Ruler className="w-4 h-4" />
          </button>
          <label className="flex items-center gap-1 cursor-pointer p-2 hover:bg-white rounded-lg">
            <Palette className="w-4 h-4" />
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-6 h-6 cursor-pointer"
            />
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={clearCanvas}
            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors shadow-sm"
            title="Clear All"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={exportAsPNG}
            className="px-3 py-1.5 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors text-sm shadow-sm"
          >
            PNG
          </button>
          <button
            onClick={exportAsPDF}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm shadow-sm"
          >
            PDF
          </button>
        </div>

        {/* Status */}
        {lastSaved && (
          <div className="ml-auto text-xs text-gray-500 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-600" />
            Saved {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Measurement Display */}
      {measuring && measurePoints.length >= 2 && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-sm">
          <span className="font-medium text-blue-900">
            Distance: {calculateDistance()}px
          </span>
          <span className="text-blue-700 ml-4">Click to add points, Esc to cancel</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 p-4 overflow-hidden bg-gray-100">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading satellite view...</p>
              </div>
            </div>
          )}
          
          <Stage
            width={1000}
            height={700}
            ref={stageRef}
            scaleX={zoom}
            scaleY={zoom}
            x={stagePos.x}
            y={stagePos.y}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            onWheel={handleWheel}
            draggable={tool === 'select'}
            className="bg-white border-2 border-gray-300 rounded shadow-lg"
          >
            <Layer>
              {baseImage && (
                <KonvaImage
                  image={baseImage}
                  width={1000}
                  height={700}
                />
              )}
              
              {/* Grid overlay */}
              {showGrid && (
                <>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <React.Fragment key={`grid-${i}`}>
                      <Line
                        points={[i * 50, 0, i * 50, 700]}
                        stroke="#e5e7eb"
                        strokeWidth={1}
                      />
                      <Line
                        points={[0, i * 50, 1000, i * 50]}
                        stroke="#e5e7eb"
                        strokeWidth={1}
                      />
                    </React.Fragment>
                  ))}
                </>
              )}
              
              {/* Annotations */}
              {annotations.map((ann) => {
                if (ann.type === 'line') {
                  return (
                    <Line
                      key={ann.id}
                      points={ann.points}
                      stroke={ann.color}
                      strokeWidth={3}
                      tension={0.5}
                      lineCap="round"
                      lineJoin="round"
                      onClick={() => setSelectedAnnotation(ann.id)}
                    />
                  );
                } else if (ann.type === 'circle') {
                  return (
                    <Circle
                      key={ann.id}
                      x={ann.x}
                      y={ann.y}
                      radius={ann.radius}
                      stroke={ann.color}
                      strokeWidth={selectedAnnotation === ann.id ? 5 : 3}
                      draggable
                      onClick={() => setSelectedAnnotation(ann.id)}
                    />
                  );
                } else if (ann.type === 'rectangle') {
                  return (
                    <Rect
                      key={ann.id}
                      x={ann.x}
                      y={ann.y}
                      width={ann.width}
                      height={ann.height}
                      stroke={ann.color}
                      strokeWidth={selectedAnnotation === ann.id ? 5 : 3}
                      fill={ann.category ? ann.color + '40' : undefined}
                      draggable
                      onClick={() => setSelectedAnnotation(ann.id)}
                    />
                  );
                } else if (ann.type === 'feature-icon') {
                  return (
                    <Group key={ann.id} draggable onClick={() => setSelectedAnnotation(ann.id)}>
                      <Circle
                        x={ann.x}
                        y={ann.y}
                        radius={20}
                        fill={ann.color}
                        stroke={selectedAnnotation === ann.id ? '#000' : 'white'}
                        strokeWidth={selectedAnnotation === ann.id ? 4 : 3}
                      />
                      <KonvaText
                        x={(ann.x || 0) - 60}
                        y={(ann.y || 0) + 25}
                        text={ann.text}
                        fontSize={14}
                        fill={ann.color}
                        fontStyle="bold"
                        align="center"
                        width={120}
                      />
                    </Group>
                  );
                } else if (ann.type === 'text') {
                  return (
                    <KonvaText
                      key={ann.id}
                      x={ann.x}
                      y={ann.y}
                      text={ann.text}
                      fontSize={16}
                      fill={ann.color}
                      draggable
                      onClick={() => setSelectedAnnotation(ann.id)}
                    />
                  );
                }
                return null;
              })}

              {/* Measurement lines */}
              {measuring && measurePoints.length >= 2 && (
                <Line
                  points={measurePoints}
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dash={[5, 5]}
                />
              )}
            </Layer>
          </Stage>
        </div>

        {/* Enhanced Sidebar */}
        <div className="w-72 border-l border-gray-200 overflow-y-auto bg-gray-50">
          {/* Search Icons */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search icons..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Feature Icons */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Feature Icons
              <span className="ml-auto text-xs text-gray-500">{filteredIcons.length}</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {filteredIcons.map((feature) => {
                const Icon = feature.icon;
                return (
                  <button
                    key={feature.id}
                    onClick={() => addFeatureIcon(feature.id)}
                    className="flex flex-col items-center gap-1 p-3 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:shadow-md transition-all bg-white"
                    style={{ borderColor: feature.color + '40' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: feature.color }} />
                    <span className="text-xs text-gray-700 text-center">{feature.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Area Types */}
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Area Types
            </h3>
            <div className="space-y-2 mb-6">
              {AREA_TYPES.map((area) => (
                <button
                  key={area.id}
                  onClick={() => addAreaMarker(area.id)}
                  className="w-full flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:shadow-md transition-all bg-white"
                >
                  <div
                    className="w-6 h-6 rounded border-2 border-white shadow-sm"
                    style={{ backgroundColor: area.color }}
                  />
                  <span className="text-sm text-gray-700 font-medium">{area.label}</span>
                </button>
              ))}
            </div>

            {/* Legend Preview */}
            <div className="p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Map Info
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">{siteName}</p>
                <p>{siteAddress}</p>
                <p className="text-gray-500 pt-2">Annotations: {annotations.length}</p>
                <p className="text-gray-500">Zoom: {Math.round(zoom * 100)}%</p>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-900">
              <p className="font-semibold mb-2">⌨️ Shortcuts</p>
              <p>Ctrl+Z: Undo</p>
              <p>Ctrl+Y: Redo</p>
              <p>Ctrl+S: Save</p>
              <p>Ctrl+C: Copy</p>
              <p>Del: Delete</p>
              <p>Esc: Cancel</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
