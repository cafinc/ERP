'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Copy, Check, Sparkles } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface Placeholder {
  key: string;
  description: string;
  example: string;
  category: string;
  category_name: string;
}

interface PlaceholderBrowserProps {
  onSelect: (placeholder: string) => void;
  onClose: () => void;
  templateType?: string;
}

export default function PlaceholderBrowser({ onSelect, onClose, templateType }: PlaceholderBrowserProps) {
  const [categories, setCategories] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string>('');

  useEffect(() => {
    fetchPlaceholders();
  }, []);

  const fetchPlaceholders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/templates/placeholders`);
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching placeholders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = (key: string) => {
    onSelect(`{{${key}}}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(`{{${key}}}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // Filter placeholders by search and category
  const getFilteredPlaceholders = () => {
    const allPlaceholders: Placeholder[] = [];
    
    Object.entries(categories).forEach(([catKey, catData]: [string, any]) => {
      catData.placeholders.forEach((p: any) => {
        allPlaceholders.push({
          ...p,
          category: catKey,
          category_name: catData.name
        });
      });
    });

    let filtered = allPlaceholders;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.key.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.example.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // Get suggested placeholders based on template type
  const getSuggestedPlaceholders = () => {
    const suggestions: Record<string, string[]> = {
      estimate: ['customer', 'estimate', 'pricing', 'company'],
      invoice: ['customer', 'invoice', 'pricing', 'company'],
      proposal: ['customer', 'company', 'project', 'service'],
      contract: ['customer', 'company', 'project'],
      notification: ['customer', 'dates', 'service', 'company'],
    };

    return suggestions[templateType || ''] || ['customer', 'company', 'dates'];
  };

  const filteredPlaceholders = getFilteredPlaceholders();
  const suggestedCategories = getSuggestedPlaceholders();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Placeholder Library</h2>
                <p className="text-sm text-gray-600 mt-1">
                  70+ system variables that auto-populate from your data
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search placeholders by name, description, or example..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-3 border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({filteredPlaceholders.length})
            </button>
            {Object.entries(categories).map(([key, data]: [string, any]) => {
              const isSuggested = suggestedCategories.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap relative ${
                    selectedCategory === key
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {data.name}
                  {isSuggested && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Placeholders List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredPlaceholders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No placeholders found matching your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredPlaceholders.map((placeholder) => (
                <div
                  key={placeholder.key}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <code className="text-sm font-mono font-semibold text-blue-600">
                        {`{{${placeholder.key}}}`}
                      </code>
                      <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {placeholder.category_name}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">
                    {placeholder.description}
                  </p>
                  
                  <div className="text-xs text-gray-500 mb-3">
                    Example: <span className="font-medium">{placeholder.example}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleInsert(placeholder.key)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      {copiedKey === placeholder.key ? (
                        <>
                          <Check className="w-4 h-4" />
                          Inserted!
                        </>
                      ) : (
                        <>
                          Insert
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleCopy(placeholder.key)}
                      className="p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              <strong>{filteredPlaceholders.length}</strong> placeholders available
              {templateType && (
                <span className="ml-2 text-green-600">
                  • Suggested categories highlighted with green dot
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
