'use client';

import { X, Edit2, Trash2 } from 'lucide-react';

interface MeasurementModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (label: string) => void;
  measurementData: any;
  initialLabel: string;
}

export function MeasurementModal({ show, onClose, onSave, measurementData, initialLabel }: MeasurementModalProps) {
  const [label, setLabel] = React.useState(initialLabel || '');

  React.useEffect(() => {
    setLabel(initialLabel || (measurementData?.type === 'distance' ? 'Distance' : 'Area'));
  }, [initialLabel, measurementData]);

  if (!show || !measurementData) return null;

  const handleSave = () => {
    if (label.trim()) {
      onSave(label.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {measurementData.type === 'distance' ? 'Distance Measurement' : 'Area Measurement'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Measurement Details */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            {measurementData.type === 'distance' ? (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Distance:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {measurementData.distanceFeet?.toFixed(2)} ft
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600"></span>
                  <span className="text-sm text-gray-700">
                    {measurementData.distanceMeters?.toFixed(2)} m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600"></span>
                  <span className="text-sm text-gray-700">
                    {measurementData.distanceMiles?.toFixed(3)} mi
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Area:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {measurementData.areaSquareFeet?.toLocaleString()} sq ft
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600"></span>
                  <span className="text-sm text-gray-700">
                    {measurementData.areaSquareMeters?.toLocaleString()} sq m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600"></span>
                  <span className="text-sm text-gray-700">
                    {measurementData.areaAcres} acres
                  </span>
                </div>
                {measurementData.perimeterFeet && (
                  <div className="flex justify-between pt-2 border-t border-blue-200">
                    <span className="text-sm text-gray-600">Perimeter:</span>
                    <span className="text-sm text-gray-700">
                      {measurementData.perimeterFeet} ft
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Label Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Label (optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter a name for this measurement..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-[#3f72af] hover:bg-[#3f72af]/90 rounded-lg"
          >
            Save Measurement
          </button>
        </div>
      </div>
    </div>
  );
}

interface AnnotationModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (label: string, category: string) => void;
  initialLabel?: string;
  initialCategory?: string;
  categories: any[];
}

export function AnnotationModal({ show, onClose, onSave, initialLabel, initialCategory, categories }: AnnotationModalProps) {
  const [label, setLabel] = React.useState(initialLabel || '');
  const [category, setCategory] = React.useState(initialCategory || categories[0]?.value || '');

  React.useEffect(() => {
    setLabel(initialLabel || '');
    setCategory(initialCategory || categories[0]?.value || '');
  }, [initialLabel, initialCategory, categories]);

  if (!show) return null;

  const handleSave = () => {
    if (label.trim()) {
      onSave(label.trim(), category);
    }
  };

  const selectedCat = categories.find(c => c.value === category);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add Annotation</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Category Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Preview */}
          {selectedCat && (
            <div 
              className="p-3 rounded-lg flex items-center gap-2"
              style={{ backgroundColor: selectedCat.color }}
            >
              {selectedCat.icon && <selectedCat.icon className="w-5 h-5 text-gray-700" />}
              <span className="text-sm font-medium text-gray-700">{selectedCat.label}</span>
            </div>
          )}

          {/* Label Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter a label..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!label.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-[#3f72af] hover:bg-[#3f72af]/90 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Annotation
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditItemModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (label: string) => void;
  onDelete: () => void;
  item: any;
}

export function EditItemModal({ show, onClose, onSave, onDelete, item }: EditItemModalProps) {
  const [label, setLabel] = React.useState(item?.label || '');

  React.useEffect(() => {
    setLabel(item?.label || '');
  }, [item]);

  if (!show || !item) return null;

  const handleSave = () => {
    if (label.trim()) {
      onSave(label.trim());
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this item?')) {
      onDelete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Item</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Item Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs font-medium text-gray-500 mb-1">Type</div>
            <div className="text-sm text-gray-900 capitalize">{item.type}</div>
          </div>

          {/* Label Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter a label..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
            />
          </div>

          {/* Measurement Details if applicable */}
          {item.type === 'distance' && (
            <div className="bg-blue-50 p-3 rounded-lg space-y-1">
              <div className="text-xs font-medium text-gray-700">Distance</div>
              <div className="text-sm text-gray-900">{item.distanceFeet} feet</div>
              <div className="text-xs text-gray-600">{item.distanceMeters} meters</div>
            </div>
          )}

          {item.type === 'area' && (
            <div className="bg-blue-50 p-3 rounded-lg space-y-1">
              <div className="text-xs font-medium text-gray-700">Area</div>
              <div className="text-sm text-gray-900">{item.areaSquareFeet} sq ft</div>
              <div className="text-xs text-gray-600">{item.areaAcres} acres</div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!label.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-[#3f72af] hover:bg-[#3f72af]/90 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add React import at top
import * as React from 'react';
