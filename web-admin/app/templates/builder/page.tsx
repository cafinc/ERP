'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Eye,
  Download,
  Printer,
  Undo,
  Redo,
  Plus,
  Trash2,
  Settings,
  Copy,
  Image as ImageIcon,
  Type,
  Table,
  FileText,
  User,
  Building,
  DollarSign,
  Calendar,
  Hash,
  Edit2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from 'lucide-react';

// Template component types
type ComponentType = 
  | 'header' 
  | 'text' 
  | 'table' 
  | 'image' 
  | 'customer-info' 
  | 'company-info' 
  | 'line-items'
  | 'totals'
  | 'signature'
  | 'footer';

interface TemplateComponent {
  id: string;
  type: ComponentType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: any;
  styles: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    padding?: number;
    margin?: number;
    borderWidth?: number;
    borderColor?: string;
  };
}

interface Template {
  id?: string;
  type: 'estimate' | 'invoice' | 'agreement' | 'work_order';
  name: string;
  description: string;
  pageSetup: {
    size: 'letter' | 'a4' | 'legal';
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number };
  };
  components: TemplateComponent[];
  branding: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
}

export default function TemplateBuilderPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [template, setTemplate] = useState<Template>({
    type: 'invoice',
    name: 'New Template',
    description: '',
    pageSetup: {
      size: 'letter',
      orientation: 'portrait',
      margins: { top: 48, right: 48, bottom: 48, left: 48 },
    },
    components: [],
    branding: {
      primaryColor: '#3f72af',
      secondaryColor: '#1a1a1a',
      fontFamily: 'Inter',
    },
  });

  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [resizeHandle, setResizeHandle] = useState<'se' | 'sw' | 'ne' | 'nw' | 'e' | 's' | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [history, setHistory] = useState<Template[]>([template]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Available components library
  const componentLibrary = [
    {
      type: 'header' as ComponentType,
      label: 'Header',
      icon: Type,
      defaultContent: { text: 'INVOICE', size: 'xl' },
      description: 'Document title',
    },
    {
      type: 'company-info' as ComponentType,
      label: 'Company Info',
      icon: Building,
      defaultContent: {
        showLogo: true,
        showName: true,
        showAddress: true,
        showPhone: true,
        showEmail: true,
      },
      description: 'Your company details',
    },
    {
      type: 'customer-info' as ComponentType,
      label: 'Customer Info',
      icon: User,
      defaultContent: {
        title: 'Bill To:',
        showName: true,
        showAddress: true,
        showPhone: true,
        showEmail: true,
      },
      description: 'Customer/client details',
    },
    {
      type: 'text' as ComponentType,
      label: 'Text Block',
      icon: FileText,
      defaultContent: { text: 'Enter text here', size: 'md' },
      description: 'Custom text section',
    },
    {
      type: 'line-items' as ComponentType,
      label: 'Line Items Table',
      icon: Table,
      defaultContent: {
        columns: ['Description', 'Quantity', 'Rate', 'Amount'],
        showSubtotal: true,
      },
      description: 'Service/product table',
    },
    {
      type: 'totals' as ComponentType,
      label: 'Totals',
      icon: DollarSign,
      defaultContent: {
        showSubtotal: true,
        showTax: true,
        showDiscount: false,
        showTotal: true,
      },
      description: 'Calculations section',
    },
    {
      type: 'signature' as ComponentType,
      label: 'Signature',
      icon: Edit2,
      defaultContent: {
        lines: 2,
        labels: ['Client Signature', 'Company Representative'],
      },
      description: 'Signature fields',
    },
    {
      type: 'image' as ComponentType,
      label: 'Image',
      icon: ImageIcon,
      defaultContent: { url: '', alt: 'Image' },
      description: 'Logo or photo',
    },
  ];

  // Add component to canvas
  const addComponent = (type: ComponentType) => {
    const libraryItem = componentLibrary.find(c => c.type === type);
    if (!libraryItem) return;

    const newComponent: TemplateComponent = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 50, y: 50 + (template.components.length * 60) },
      size: { width: 400, height: 100 },
      content: libraryItem.defaultContent,
      styles: {
        fontSize: 14,
        color: '#000000',
        backgroundColor: '#ffffff',
        textAlign: 'left',
        padding: 12,
      },
    };

    const newTemplate = {
      ...template,
      components: [...template.components, newComponent],
    };

    setTemplate(newTemplate);
    addToHistory(newTemplate);
    setSelectedComponent(newComponent.id);
  };

  // Update component
  const updateComponent = (id: string, updates: Partial<TemplateComponent>) => {
    const newTemplate = {
      ...template,
      components: template.components.map(c =>
        c.id === id ? { ...c, ...updates } : c
      ),
    };
    setTemplate(newTemplate);
    addToHistory(newTemplate);
  };

  // Delete component
  const deleteComponent = (id: string) => {
    const newTemplate = {
      ...template,
      components: template.components.filter(c => c.id !== id),
    };
    setTemplate(newTemplate);
    addToHistory(newTemplate);
    if (selectedComponent === id) {
      setSelectedComponent(null);
    }
  };

  // Handle mouse down on component for dragging
  const handleMouseDown = (e: React.MouseEvent, componentId: string) => {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();
    
    setSelectedComponent(componentId);
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Handle mouse down on resize handle
  const handleResizeMouseDown = (e: React.MouseEvent, componentId: string, handle: 'se' | 'sw' | 'ne' | 'nw' | 'e' | 's') => {
    e.stopPropagation();
    setSelectedComponent(componentId);
    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Handle mouse move for drag and resize
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart || !selectedComponent) return;

    const component = template.components.find(c => c.id === selectedComponent);
    if (!component) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    if (isDragging) {
      // Update position
      const newX = Math.max(0, component.position.x + deltaX);
      const newY = Math.max(0, component.position.y + deltaY);
      
      updateComponent(selectedComponent, {
        position: { x: newX, y: newY },
      });
      
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isResizing && resizeHandle) {
      // Update size based on handle
      let newWidth = component.size.width;
      let newHeight = component.size.height;
      let newX = component.position.x;
      let newY = component.position.y;

      switch (resizeHandle) {
        case 'se': // Southeast (bottom-right)
          newWidth = Math.max(100, component.size.width + deltaX);
          newHeight = Math.max(50, component.size.height + deltaY);
          break;
        case 'sw': // Southwest (bottom-left)
          newWidth = Math.max(100, component.size.width - deltaX);
          newHeight = Math.max(50, component.size.height + deltaY);
          newX = component.position.x + deltaX;
          break;
        case 'ne': // Northeast (top-right)
          newWidth = Math.max(100, component.size.width + deltaX);
          newHeight = Math.max(50, component.size.height - deltaY);
          newY = component.position.y + deltaY;
          break;
        case 'nw': // Northwest (top-left)
          newWidth = Math.max(100, component.size.width - deltaX);
          newHeight = Math.max(50, component.size.height - deltaY);
          newX = component.position.x + deltaX;
          newY = component.position.y + deltaY;
          break;
        case 'e': // East (right)
          newWidth = Math.max(100, component.size.width + deltaX);
          break;
        case 's': // South (bottom)
          newHeight = Math.max(50, component.size.height + deltaY);
          break;
      }

      updateComponent(selectedComponent, {
        size: { width: newWidth, height: newHeight },
        position: { x: newX, y: newY },
      });
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle mouse up to stop dragging/resizing
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setDragStart(null);
    setResizeHandle(null);
  };

  // History management
  const addToHistory = (newTemplate: Template) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTemplate);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTemplate(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTemplate(history[historyIndex + 1]);
    }
  };

  // Save template
  const saveTemplate = async () => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      
      if (response.ok) {
        alert('Template saved successfully!');
        router.push('/templates');
      } else {
        alert('Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template');
    }
  };

  // Get selected component
  const selectedComp = template.components.find(c => c.id === selectedComponent);

  // Render component on canvas
  const renderComponent = (component: TemplateComponent) => {
    const isSelected = selectedComponent === component.id;
    
    return (
      <div
        key={component.id}
        onMouseDown={(e) => handleMouseDown(e, component.id)}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedComponent(component.id);
        }}
        style={{
          position: 'absolute',
          left: component.position.x,
          top: component.position.y,
          width: component.size.width,
          minHeight: component.size.height,
          border: isSelected ? '2px solid #3f72af' : '1px solid #e5e7eb',
          backgroundColor: component.styles.backgroundColor,
          padding: component.styles.padding,
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        className={`group hover:border-blue-400 transition-colors ${isSelected ? 'ring-2 ring-blue-300' : ''}`}
      >
        {/* Resize Handles - Only show when selected */}
        {isSelected && (
          <>
            {/* Corner handles */}
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, component.id, 'nw')}
              className="absolute -top-2 -left-2 w-4 h-4 bg-[#3f72af] border-2 border-white rounded-full cursor-nw-resize hover:scale-125 transition-transform"
              style={{ zIndex: 10 }}
            />
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, component.id, 'ne')}
              className="absolute -top-2 -right-2 w-4 h-4 bg-[#3f72af] border-2 border-white rounded-full cursor-ne-resize hover:scale-125 transition-transform"
              style={{ zIndex: 10 }}
            />
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, component.id, 'sw')}
              className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#3f72af] border-2 border-white rounded-full cursor-sw-resize hover:scale-125 transition-transform"
              style={{ zIndex: 10 }}
            />
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, component.id, 'se')}
              className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#3f72af] border-2 border-white rounded-full cursor-se-resize hover:scale-125 transition-transform"
              style={{ zIndex: 10 }}
            />
            {/* Side handles */}
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, component.id, 'e')}
              className="absolute top-1/2 -right-2 w-4 h-8 bg-[#3f72af] border-2 border-white rounded-full cursor-e-resize hover:scale-125 transition-transform -translate-y-1/2"
              style={{ zIndex: 10 }}
            />
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, component.id, 's')}
              className="absolute left-1/2 -bottom-2 w-8 h-4 bg-[#3f72af] border-2 border-white rounded-full cursor-s-resize hover:scale-125 transition-transform -translate-x-1/2"
              style={{ zIndex: 10 }}
            />
          </>
        )}
        {/* Component content based on type */}
        {component.type === 'header' && (
          <div
            style={{
              fontSize: component.content.size === 'xl' ? 32 : 24,
              fontWeight: 'bold',
              color: component.styles.color,
              textAlign: component.styles.textAlign,
            }}
          >
            {component.content.text}
          </div>
        )}

        {component.type === 'text' && (
          <div
            style={{
              fontSize: component.styles.fontSize,
              color: component.styles.color,
              textAlign: component.styles.textAlign,
            }}
          >
            {component.content.text}
          </div>
        )}

        {component.type === 'company-info' && (
          <div className="space-y-2">
            <div className="font-bold text-lg" style={{ color: template.branding.primaryColor }}>
              {'{{company.name}}'}
            </div>
            {component.content.showAddress && (
              <div className="text-sm text-gray-600">{'{{company.address}}'}</div>
            )}
            {component.content.showPhone && (
              <div className="text-sm">Phone: {'{{company.phone}}'}</div>
            )}
            {component.content.showEmail && (
              <div className="text-sm">Email: {'{{company.email}}'}</div>
            )}
          </div>
        )}

        {component.type === 'customer-info' && (
          <div className="space-y-2">
            <div className="font-semibold text-sm text-gray-500">{component.content.title}</div>
            <div className="font-medium">{'{{customer.name}}'}</div>
            {component.content.showAddress && (
              <div className="text-sm text-gray-600">{'{{customer.address}}'}</div>
            )}
            {component.content.showPhone && (
              <div className="text-sm">{'{{customer.phone}}'}</div>
            )}
            {component.content.showEmail && (
              <div className="text-sm">{'{{customer.email}}'}</div>
            )}
          </div>
        )}

        {component.type === 'line-items' && (
          <table className="w-full border-collapse" style={{ fontSize: component.styles.fontSize }}>
            <thead>
              <tr className="border-b-2" style={{ borderColor: template.branding.primaryColor }}>
                {component.content.columns.map((col: string, idx: number) => (
                  <th key={idx} className="text-left py-2 px-2 font-semibold">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-2">{'{{item.description}}'}</td>
                <td className="py-2 px-2">{'{{item.quantity}}'}</td>
                <td className="py-2 px-2">{'{{item.rate}}'}</td>
                <td className="py-2 px-2 text-right">{'{{item.amount}}'}</td>
              </tr>
            </tbody>
          </table>
        )}

        {component.type === 'totals' && (
          <div className="space-y-2 text-right">
            {component.content.showSubtotal && (
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">{'{{subtotal}}'}</span>
              </div>
            )}
            {component.content.showTax && (
              <div className="flex justify-between">
                <span>Tax:</span>
                <span className="font-medium">{'{{tax_amount}}'}</span>
              </div>
            )}
            {component.content.showDiscount && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span className="font-medium">{'{{discount}}'}</span>
              </div>
            )}
            {component.content.showTotal && (
              <div className="flex justify-between pt-2 border-t-2 text-lg font-bold" style={{ borderColor: template.branding.primaryColor }}>
                <span>Total:</span>
                <span>{'{{total}}'}</span>
              </div>
            )}
          </div>
        )}

        {component.type === 'signature' && (
          <div className="grid grid-cols-2 gap-8">
            {component.content.labels.map((label: string, idx: number) => (
              <div key={idx} className="space-y-2">
                <div className="border-b-2 border-gray-300 h-16"></div>
                <div className="text-sm text-center text-gray-600">{label}</div>
                <div className="text-xs text-center text-gray-500">Date: {'{{date}}'}</div>
              </div>
            ))}
          </div>
        )}

        {/* Delete button on hover */}
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteComponent(component.id);
            }}
            className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/templates')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="border-l border-gray-300 pl-4">
            <input
              type="text"
              value={template.name}
              onChange={(e) => setTemplate({ ...template, name: e.target.value })}
              className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
              placeholder="Template Name"
            />
            <p className="text-xs text-gray-500 mt-1">
              {template.type.charAt(0).toUpperCase() + template.type.slice(1)} Template
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <button
            onClick={undo}
            disabled={historyIndex === 0}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo className="w-5 h-5" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex === history.length - 1}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo className="w-5 h-5" />
          </button>

          <div className="border-l border-gray-300 ml-2 pl-2 flex items-center gap-2">
            {/* Zoom */}
            <select
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={50}>50%</option>
              <option value={75}>75%</option>
              <option value={100}>100%</option>
              <option value={125}>125%</option>
              <option value={150}>150%</option>
            </select>

            {/* Grid Toggle */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg ${showGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              title="Toggle Grid"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="border-l border-gray-300 ml-2 pl-2 flex items-center gap-2">
            {/* Preview */}
            <button className="px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Preview</span>
            </button>

            {/* Export PDF */}
            <button className="px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </button>

            {/* Save */}
            <button
              onClick={saveTemplate}
              className="px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#3f72af]/90 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm font-medium">Save</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Components Library */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Components</h3>
            <div className="space-y-2">
              {componentLibrary.map((comp) => (
                <button
                  key={comp.type}
                  onClick={() => addComponent(comp.type)}
                  className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded group-hover:bg-blue-100 transition-colors">
                      <comp.icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">{comp.label}</div>
                      <div className="text-xs text-gray-500 truncate">{comp.description}</div>
                    </div>
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <div className="flex justify-center">
            <div
              ref={canvasRef}
              onClick={() => setSelectedComponent(null)}
              className="bg-white shadow-lg relative"
              style={{
                width: template.pageSetup.size === 'letter' ? '816px' : '794px',
                minHeight: template.pageSetup.orientation === 'portrait' ? '1056px' : '816px',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                backgroundImage: showGrid ? 
                  'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)' : 
                  'none',
                backgroundSize: showGrid ? '20px 20px' : 'auto',
              }}
            >
              {/* Page margins guide */}
              <div
                className="absolute border border-dashed border-blue-300 pointer-events-none"
                style={{
                  top: template.pageSetup.margins.top,
                  left: template.pageSetup.margins.left,
                  right: template.pageSetup.margins.right,
                  bottom: template.pageSetup.margins.bottom,
                }}
              />

              {/* Render all components */}
              {template.components.map(renderComponent)}

              {/* Empty state */}
              {template.components.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Start building your template</p>
                    <p className="text-sm mt-2">Drag components from the left sidebar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            {selectedComp ? (
              <>
                <h3 className="font-semibold text-gray-900 mb-4">Properties</h3>
                
                {/* Component type */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Component</div>
                  <div className="font-medium">
                    {componentLibrary.find(c => c.type === selectedComp.type)?.label}
                  </div>
                </div>

                {/* Styling options */}
                <div className="space-y-4">
                  {/* Font Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Size
                    </label>
                    <input
                      type="number"
                      value={selectedComp.styles.fontSize}
                      onChange={(e) => updateComponent(selectedComp.id, {
                        styles: { ...selectedComp.styles, fontSize: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  {/* Text Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={selectedComp.styles.color}
                        onChange={(e) => updateComponent(selectedComp.id, {
                          styles: { ...selectedComp.styles, color: e.target.value }
                        })}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedComp.styles.color}
                        onChange={(e) => updateComponent(selectedComp.id, {
                          styles: { ...selectedComp.styles, color: e.target.value }
                        })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Background Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={selectedComp.styles.backgroundColor}
                        onChange={(e) => updateComponent(selectedComp.id, {
                          styles: { ...selectedComp.styles, backgroundColor: e.target.value }
                        })}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedComp.styles.backgroundColor}
                        onChange={(e) => updateComponent(selectedComp.id, {
                          styles: { ...selectedComp.styles, backgroundColor: e.target.value }
                        })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Text Alignment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Alignment
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateComponent(selectedComp.id, {
                          styles: { ...selectedComp.styles, textAlign: 'left' }
                        })}
                        className={`flex-1 p-2 border rounded ${selectedComp.styles.textAlign === 'left' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                      >
                        <AlignLeft className="w-4 h-4 mx-auto" />
                      </button>
                      <button
                        onClick={() => updateComponent(selectedComp.id, {
                          styles: { ...selectedComp.styles, textAlign: 'center' }
                        })}
                        className={`flex-1 p-2 border rounded ${selectedComp.styles.textAlign === 'center' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                      >
                        <AlignCenter className="w-4 h-4 mx-auto" />
                      </button>
                      <button
                        onClick={() => updateComponent(selectedComp.id, {
                          styles: { ...selectedComp.styles, textAlign: 'right' }
                        })}
                        className={`flex-1 p-2 border rounded ${selectedComp.styles.textAlign === 'right' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                      >
                        <AlignRight className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>

                  {/* Padding */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Padding
                    </label>
                    <input
                      type="number"
                      value={selectedComp.styles.padding}
                      onChange={(e) => updateComponent(selectedComp.id, {
                        styles: { ...selectedComp.styles, padding: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  {/* Content-specific options */}
                  {selectedComp.type === 'text' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text Content
                      </label>
                      <textarea
                        value={selectedComp.content.text}
                        onChange={(e) => updateComponent(selectedComp.id, {
                          content: { ...selectedComp.content, text: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows={4}
                      />
                    </div>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => deleteComponent(selectedComp.id)}
                  className="w-full mt-6 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Component
                </button>
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Select a component to edit properties</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
