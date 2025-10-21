'use client';

import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Circle, Rect, Text as KonvaText, Image as KonvaImage } from 'react-konva';
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
  { id: 'curb', label: 'Curb', icon: Minus, color: '#EF4444' },
  { id: 'drain', label: 'Drain', icon: Droplet, color: '#3B82F6' },
  { id: 'speed_bump', label: 'Speed Bump', icon: AlertTriangle, color: '#F59E0B' },
  { id: 'handicap', label: 'Handicap Spot', icon: Accessibility, color: '#3B82F6' },
  { id: 'fire_hydrant', label: 'Fire Hydrant', icon: Flame, color: '#DC2626' },
  { id: 'entrance', label: 'Entrance', icon: ArrowRight, color: '#10B981' },
  { id: 'exit', label: 'Exit', icon: MapPin, color: '#EF4444' },
  { id: 'hazard', label: 'Hazard', icon: AlertTriangle, color: '#F59E0B' },
];

const AREA_TYPES = [
  { id: 'sidewalk', label: 'Sidewalk', color: '#94A3B8' },
  { id: 'plowing_zone', label: 'Plowing Zone', color: '#60A5FA' },
  { id: 'no_parking', label: 'No Parking', color: '#F87171' },
  { id: 'restricted', label: 'Restricted Area', color: '#FCD34D' },
];

export default function SiteMapAnnotation({
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
  const stageRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialMapData) {
      const img = new window.Image();
      img.src = initialMapData;
      img.onload = () => {
        setBaseImage(img);
      };
    } else {
      // Automatically load Google Maps screenshot for the site
      loadGoogleMapsScreenshot();
    }
  }, [initialMapData]);

  const loadGoogleMapsScreenshot = async () => {
    try {
      // Use Google Maps Static API to get a screenshot of the site location
      const apiKey = 'AIzaSyCUDEtt2lRq3PGRqDKZAwk6i-iZkiyTzJw';
      const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(siteAddress)}&zoom=18&size=1000x700&maptype=satellite&key=${apiKey}`;
      
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = mapUrl;
      img.onload = () => {
        setBaseImage(img);
      };
    } catch (error) {
      console.error('Error loading Google Maps screenshot:', error);
    }
  };

  const addToHistory = (newAnnotations: Annotation[]) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

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

  const handleMouseDown = (e: any) => {
    if (tool === 'select') return;
    
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
      type: 'text',
      category: featureId,
      label: feature.label,
      color: feature.color,
      x: 400,
      y: 300,
      text: `📍 ${feature.label}`,
    };
    
    const updated = [...annotations, newAnnotation];
    setAnnotations(updated);
    addToHistory(updated);
  };

  const addAreaMarker = (areaId: string) => {
    const area = AREA_TYPES.find(a => a.id === areaId);
    if (!area) return;

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: 'rectangle',
      category: areaId,
      label: area.label,
      color: area.color,
      x: 100,
      y: 100,
      width: 200,
      height: 150,
    };
    
    const updated = [...annotations, newAnnotation];
    setAnnotations(updated);
    addToHistory(updated);
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
    
    // Add title
    pdf.setFontSize(18);
    pdf.text(siteName, 15, 15);
    
    pdf.setFontSize(12);
    pdf.text(siteAddress, 15, 22);
    
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 28);

    // Add canvas image
    const uri = stageRef.current.toDataURL();
    const imgWidth = pageWidth - 30;
    pdf.addImage(uri, 'PNG', 15, 35, imgWidth, imgWidth * 0.7);

    // Add legend
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

  const handleSave = async () => {
    const mapData = {
      base_map_data: stageRef.current?.toDataURL(),
      annotations: annotations,
      legend_items: [
        ...FEATURE_ICONS.map(f => ({ ...f, icon: undefined })),
        ...AREA_TYPES,
      ],
    };

    await onSave(mapData);
  };

  const clearCanvas = () => {
    if (!confirm('Clear all annotations?')) return;
    const updated: Annotation[] = [];
    setAnnotations(updated);
    addToHistory(updated);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200 flex-wrap">
        <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Upload Base Image"
          >
            <Upload className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-green-600"
            title="Save Map"
          >
            <Save className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
          <button
            onClick={handleUndo}
            disabled={historyStep <= 0}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Undo"
          >
            <Undo className="w-5 h-5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyStep >= history.length - 1}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Redo"
          >
            <Redo className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded-lg transition-colors ${tool === 'pen' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Freehand Draw"
          >
            <Pen className="w-5 h-5" />
          </button>
          <button
            onClick={() => setTool('text')}
            className={`p-2 rounded-lg transition-colors ${tool === 'text' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Add Text"
          >
            <Type className="w-5 h-5" />
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`p-2 rounded-lg transition-colors ${tool === 'circle' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Add Circle"
          >
            <CircleIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setTool('rectangle')}
            className={`p-2 rounded-lg transition-colors ${tool === 'rectangle' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Add Rectangle"
          >
            <Square className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <Palette className="w-5 h-5" />
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-8 h-8 cursor-pointer"
            />
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearCanvas}
            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
            title="Clear All"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={exportAsPNG}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Export PNG
          </button>
          <button
            onClick={exportAsPDF}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 p-4 overflow-auto bg-gray-50">
          <Stage
            width={1000}
            height={700}
            ref={stageRef}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            className="bg-white border border-gray-300 rounded shadow-sm"
          >
            <Layer>
              {baseImage && (
                <KonvaImage
                  image={baseImage}
                  width={1000}
                  height={700}
                />
              )}
              
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
                      strokeWidth={3}
                      draggable
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
                      strokeWidth={3}
                      fill={ann.category ? ann.color + '40' : undefined}
                      draggable
                    />
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
                    />
                  );
                }
                return null;
              })}
            </Layer>
          </Stage>
        </div>

        {/* Sidebar */}
        <div className="w-64 border-l border-gray-200 p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-3">Feature Icons</h3>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {FEATURE_ICONS.map((feature) => {
              const Icon = feature.icon;
              return (
                <button
                  key={feature.id}
                  onClick={() => addFeatureIcon(feature.id)}
                  className="flex flex-col items-center gap-1 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ borderColor: feature.color }}
                >
                  <Icon className="w-5 h-5" style={{ color: feature.color }} />
                  <span className="text-xs text-gray-700">{feature.label}</span>
                </button>
              );
            })}
          </div>

          <h3 className="font-semibold text-gray-900 mb-3">Area Types</h3>
          <div className="space-y-2">
            {AREA_TYPES.map((area) => (
              <button
                key={area.id}
                onClick={() => addAreaMarker(area.id)}
                className="w-full flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: area.color }}
                />
                <span className="text-sm text-gray-700">{area.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Legend Preview</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-medium">{siteName}</p>
              <p>{siteAddress}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
