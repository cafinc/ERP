'use client';

import { useState, useRef, useEffect } from 'react';
import { fabric } from 'fabric/dist/fabric.min.js';
import {
  Download,
  Upload,
  Save,
  Undo,
  Redo,
  Trash2,
  Type,
  Circle,
  Square,
  Minus,
  Triangle,
  MapPin,
  AlertTriangle,
  Construction,
  Accessibility,
  Droplet,
  Navigation as NavigationIcon,
  Flame,
  ArrowRight,
  Pen,
  Palette,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Annotation {
  id: string;
  type: string;
  category?: string;
  label?: string;
  color?: string;
  coordinates: any[];
  properties?: any;
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
  { id: 'speed_bump', label: 'Speed Bump', icon: Triangle, color: '#F59E0B' },
  { id: 'handicap', label: 'Handicap Spot', icon: Accessibility, color: '#3B82F6' },
  { id: 'fire_hydrant', label: 'Fire Hydrant', icon: Flame, color: '#DC2626' },
  { id: 'entrance', label: 'Entrance', icon: ArrowRight, color: '#10B981' },
  { id: 'exit', label: 'Exit', icon: NavigationIcon, color: '#EF4444' },
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('#3B82F6');
  const [baseImage, setBaseImage] = useState<string | null>(initialMapData || null);
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations || []);
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(0);
  const [showLegend, setShowLegend] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: 1000,
        height: 700,
        backgroundColor: '#f3f4f6',
      });
      
      setCanvas(fabricCanvas);
      
      // Load base image if available
      if (baseImage) {
        fabric.Image.fromURL(baseImage, (img) => {
          if (img) {
            img.scaleToWidth(fabricCanvas.width!);
            fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas));
          }
        });
      }
    }

    return () => {
      canvas?.dispose();
    };
  }, [canvasRef]);

  // Handle tool selection
  const handleToolChange = (tool: string) => {
    setSelectedTool(tool);
    if (canvas) {
      canvas.isDrawingMode = tool === 'freehand';
      if (canvas.isDrawingMode) {
        canvas.freeDrawingBrush.color = selectedColor;
        canvas.freeDrawingBrush.width = 3;
      }
    }
  };

  // Add feature icon
  const addFeatureIcon = (featureId: string) => {
    if (!canvas) return;
    
    const feature = FEATURE_ICONS.find(f => f.id === featureId);
    if (!feature) return;

    const text = new fabric.Text(feature.label, {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      fontSize: 14,
      fill: feature.color,
      fontWeight: 'bold',
      backgroundColor: 'white',
      padding: 5,
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    saveToHistory();
  };

  // Add area marker
  const addAreaMarker = () => {
    if (!canvas || !selectedArea) return;
    
    const area = AREA_TYPES.find(a => a.id === selectedArea);
    if (!area) return;

    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 200,
      height: 150,
      fill: area.color + '40', // 40 is alpha for transparency
      stroke: area.color,
      strokeWidth: 3,
    });
    
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    saveToHistory();
  };

  // Add text label
  const addTextLabel = () => {
    if (!canvas) return;
    
    const text = new fabric.IText('Label', {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      fontSize: 16,
      fill: selectedColor,
      fontFamily: 'Arial',
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    saveToHistory();
  };

  // Add shape
  const addShape = (shapeType: string) => {
    if (!canvas) return;
    
    let shape;
    switch (shapeType) {
      case 'circle':
        shape = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: 'transparent',
          stroke: selectedColor,
          strokeWidth: 3,
        });
        break;
      case 'rectangle':
        shape = new fabric.Rect({
          left: 100,
          top: 100,
          width: 150,
          height: 100,
          fill: 'transparent',
          stroke: selectedColor,
          strokeWidth: 3,
        });
        break;
      case 'line':
        shape = new fabric.Line([50, 50, 200, 50], {
          stroke: selectedColor,
          strokeWidth: 3,
        });
        break;
      case 'arrow':
        // Simple arrow using line with triangle
        shape = new fabric.Line([50, 50, 200, 50], {
          stroke: selectedColor,
          strokeWidth: 3,
        });
        break;
    }
    
    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
      saveToHistory();
    }
  };

  // Save to history for undo/redo
  const saveToHistory = () => {
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
    setHistory(prev => [...prev.slice(0, historyStep + 1), json]);
    setHistoryStep(prev => prev + 1);
  };

  // Undo
  const handleUndo = () => {
    if (!canvas || historyStep <= 0) return;
    const newStep = historyStep - 1;
    canvas.loadFromJSON(history[newStep], () => {
      canvas.renderAll();
      setHistoryStep(newStep);
    });
  };

  // Redo
  const handleRedo = () => {
    if (!canvas || historyStep >= history.length - 1) return;
    const newStep = historyStep + 1;
    canvas.loadFromJSON(history[newStep], () => {
      canvas.renderAll();
      setHistoryStep(newStep);
    });
  };

  // Delete selected object
  const deleteSelected = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
      canvas.renderAll();
      saveToHistory();
    }
  };

  // Clear canvas
  const clearCanvas = () => {
    if (!canvas || !confirm('Clear all annotations?')) return;
    canvas.clear();
    canvas.backgroundColor = '#f3f4f6';
    if (baseImage) {
      fabric.Image.fromURL(baseImage, (img) => {
        if (img) {
          img.scaleToWidth(canvas.width!);
          canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
        }
      });
    }
    canvas.renderAll();
    saveToHistory();
  };

  // Upload base image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setBaseImage(dataUrl);
      
      fabric.Image.fromURL(dataUrl, (img) => {
        if (img) {
          img.scaleToWidth(canvas.width!);
          canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
        }
      });
    };
    reader.readAsDataURL(file);
  };

  // Export as PNG
  const exportAsPNG = () => {
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    
    const link = document.createElement('a');
    link.download = `${siteName.replace(/\s+/g, '_')}_map.png`;
    link.href = dataURL;
    link.click();
  };

  // Export as PDF with legend
  const exportAsPDF = async () => {
    if (!canvas) return;

    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Add title
    pdf.setFontSize(18);
    pdf.setTextColor(31, 41, 55);
    pdf.text(siteName, 15, 15);
    
    pdf.setFontSize(12);
    pdf.text(siteAddress, 15, 22);

    // Add date
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 28);

    // Add canvas image
    const canvasDataURL = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - 30;
    const imgHeight = (canvas.height! / canvas.width!) * imgWidth;
    pdf.addImage(canvasDataURL, 'PNG', 15, 35, imgWidth, Math.min(imgHeight, pageHeight - 70));

    // Add legend on next page or bottom
    let legendY = 35 + Math.min(imgHeight, pageHeight - 70) + 10;
    if (legendY > pageHeight - 50) {
      pdf.addPage();
      legendY = 15;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Legend', 15, legendY);
    
    legendY += 7;
    pdf.setFontSize(10);
    
    // Add feature icons to legend
    FEATURE_ICONS.forEach((feature, idx) => {
      pdf.setTextColor(31, 41, 55);
      pdf.text(`• ${feature.label}`, 20, legendY + (idx * 5));
    });

    pdf.save(`${siteName.replace(/\s+/g, '_')}_map.pdf`);
  };

  // Save to database
  const handleSave = async () => {
    if (!canvas) return;

    const mapData = {
      base_map_data: baseImage,
      annotations: canvas.toJSON(),
      legend_items: [
        ...FEATURE_ICONS.map(f => ({ ...f, icon: undefined })),
        ...AREA_TYPES.map(a => ({ ...a })),
      ],
    };

    await onSave(mapData);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200 flex-wrap">
        {/* File Operations */}
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

        {/* History */}
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

        {/* Drawing Tools */}
        <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
          <button
            onClick={() => handleToolChange('freehand')}
            className={`p-2 rounded-lg transition-colors ${selectedTool === 'freehand' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Freehand Draw"
          >
            <Pen className="w-5 h-5" />
          </button>
          <button
            onClick={addTextLabel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Add Text"
          >
            <Type className="w-5 h-5" />
          </button>
          <button
            onClick={() => addShape('circle')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Add Circle"
          >
            <Circle className="w-5 h-5" />
          </button>
          <button
            onClick={() => addShape('rectangle')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Add Rectangle"
          >
            <Square className="w-5 h-5" />
          </button>
          <button
            onClick={() => addShape('line')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Add Line"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>

        {/* Color Picker */}
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

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={deleteSelected}
            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
            title="Delete Selected"
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
        <div className="flex-1 p-4 overflow-auto">
          <canvas ref={canvasRef} />
        </div>

        {/* Sidebar - Feature Icons & Areas */}
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
                onClick={() => {
                  setSelectedArea(area.id);
                  addAreaMarker();
                }}
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

          {/* Legend Preview */}
          {showLegend && (
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Legend Preview</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-medium">{siteName}</p>
                <p>{siteAddress}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
