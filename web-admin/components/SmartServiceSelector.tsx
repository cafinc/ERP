'use client';

import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, FileText, Star, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

interface ServiceRecommendation {
  name: string;
  id: string | null;
  count?: number;
  reason: string;
}

interface Recommendations {
  historical: ServiceRecommendation[];
  contractual: ServiceRecommendation[];
  seasonal: ServiceRecommendation[];
  popular: ServiceRecommendation[];
}

interface SmartServiceSelectorProps {
  siteId: string;
  customerId?: string;
  onServiceSelect: (serviceName: string, serviceId: string | null) => void;
  selectedService?: string;
}

export default function SmartServiceSelector({
  siteId,
  customerId,
  onServiceSelect,
  selectedService,
}: SmartServiceSelectorProps) {
  const [recommendations, setRecommendations] = useState<Recommendations>({
    historical: [],
    contractual: [],
    seasonal: [],
    popular: [],
  });
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (siteId) {
      loadRecommendations();
    }
  }, [siteId, customerId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const params = customerId ? `?customer_id=${customerId}` : '';
      const response = await api.get(`/work-orders/recommended-services/${siteId}${params}`);
      
      if (response.data.success) {
        setRecommendations(response.data.recommendations);
      }
    } catch (error) {
      console.error('Error loading service recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasRecommendations = 
    recommendations.historical.length > 0 ||
    recommendations.contractual.length > 0 ||
    recommendations.seasonal.length > 0 ||
    recommendations.popular.length > 0;

  if (!hasRecommendations && !loading) {
    return null;
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'historical':
        return <TrendingUp className="w-4 h-4" />;
      case 'contractual':
        return <FileText className="w-4 h-4" />;
      case 'seasonal':
        return <Sparkles className="w-4 h-4" />;
      case 'popular':
        return <Star className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'historical':
        return {
          bg: 'from-blue-50 to-blue-100',
          border: 'border-blue-200',
          text: 'text-blue-700',
          badge: 'bg-blue-500',
        };
      case 'contractual':
        return {
          bg: 'from-purple-50 to-purple-100',
          border: 'border-purple-200',
          text: 'text-purple-700',
          badge: 'bg-purple-500',
        };
      case 'seasonal':
        return {
          bg: 'from-green-50 to-green-100',
          border: 'border-green-200',
          text: 'text-green-700',
          badge: 'bg-green-500',
        };
      case 'popular':
        return {
          bg: 'from-orange-50 to-orange-100',
          border: 'border-orange-200',
          text: 'text-orange-700',
          badge: 'bg-orange-500',
        };
      default:
        return {
          bg: 'from-gray-50 to-gray-100',
          border: 'border-gray-200',
          text: 'text-gray-700',
          badge: 'bg-gray-500',
        };
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'historical':
        return 'Frequently Used at This Site';
      case 'contractual':
        return 'From Service Contract';
      case 'seasonal':
        return 'Seasonal Recommendations';
      case 'popular':
        return 'Popular Services';
      default:
        return category;
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4 mb-4">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <div className="bg-indigo-100 rounded-full p-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-gray-900">Smart Service Suggestions</h3>
            <p className="text-xs text-gray-600">Quick select based on history & patterns</p>
          </div>
        </div>
        <ChevronRight
          className={`w-5 h-5 text-gray-400 transition-transform ${
            expanded ? 'rotate-90' : ''
          }`}
        />
      </button>

      {/* Recommendations */}
      {expanded && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-4">
              <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-gray-600 mt-2">Loading recommendations...</p>
            </div>
          ) : (
            <>
              {Object.entries(recommendations).map(
                ([category, services]) =>
                  services.length > 0 && (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`${getCategoryColor(category).text}`}>
                          {getCategoryIcon(category)}
                        </span>
                        <h4 className="text-xs font-semibold text-gray-700">
                          {getCategoryTitle(category)}
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {services.map((service, index) => (
                          <button
                            key={`${category}-${index}`}
                            onClick={() => onServiceSelect(service.name, service.id)}
                            className={`text-left p-3 rounded-lg border-2 transition-all ${
                              selectedService === service.name
                                ? `bg-gradient-to-br ${getCategoryColor(category).bg} ${
                                    getCategoryColor(category).border
                                  } shadow-md`
                                : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-semibold text-sm text-gray-900 mb-1">
                                  {service.name}
                                </div>
                                <div className="text-xs text-gray-600">{service.reason}</div>
                              </div>
                              {service.count && (
                                <span
                                  className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold text-white ${
                                    getCategoryColor(category).badge
                                  }`}
                                >
                                  {service.count}×
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
              )}

              {!hasRecommendations && (
                <div className="text-center py-4 text-sm text-gray-600">
                  No service recommendations available for this site yet.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
