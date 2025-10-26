'use client';

import { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, Wrench, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

interface SiteInfoCardProps {
  siteId: string;
  showRecentServices?: boolean;
  compact?: boolean;
}

interface Site {
  id: string;
  name: string;
  address: string;
  city?: string;
  province?: string;
  postal_code?: string;
  access_notes?: string;
  special_instructions?: string;
  hazards?: string;
  equipment_on_site?: string[];
  contact_person?: string;
  contact_phone?: string;
}

interface RecentService {
  service_type: string;
  scheduled_date: string;
  status: string;
}

export default function SiteInfoCard({ 
  siteId, 
  showRecentServices = true,
  compact = false 
}: SiteInfoCardProps) {
  const [site, setSite] = useState<Site | null>(null);
  const [recentServices, setRecentServices] = useState<RecentService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (siteId) {
      loadSiteInfo();
    }
  }, [siteId]);

  const loadSiteInfo = async () => {
    try {
      setLoading(true);
      
      // Load site details
      const siteResponse = await api.get(`/sites/${siteId}`);
      setSite(siteResponse.data);

      // Load recent work orders if requested
      if (showRecentServices) {
        try {
          const workOrdersResponse = await api.get('/work-orders', {
            params: { site_id: siteId, limit: 3 }
          });
          const workOrders = workOrdersResponse.data?.work_orders || [];
          setRecentServices(workOrders);
        } catch (error) {
          console.error('Error loading recent services:', error);
          setRecentServices([]);
        }
      }
    } catch (error) {
      console.error('Error loading site info:', error);
      setSite(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border-2 border-gray-200 p-4">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-600">Loading site information...</span>
        </div>
      </div>
    );
  }

  if (!site) {
    return null;
  }

  const fullAddress = [
    site.address,
    site.city,
    site.province,
    site.postal_code,
  ].filter(Boolean).join(', ');

  const hasAlerts = site.access_notes || site.special_instructions || site.hazards;

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-3">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-900 mb-1">{site.name}</h4>
            <p className="text-xs text-gray-700">{fullAddress}</p>
            {hasAlerts && (
              <div className="mt-2 flex items-center gap-1 text-xs text-amber-700">
                <AlertTriangle className="w-3 h-3" />
                <span>Has special instructions</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-100 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{site.name}</h3>
              <p className="text-sm text-gray-700 mt-1">{fullAddress}</p>
            </div>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Open in Google Maps"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Contact Information */}
        {(site.contact_person || site.contact_phone) && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Site Contact</h4>
            <div className="space-y-1">
              {site.contact_person && (
                <p className="text-sm text-gray-900">{site.contact_person}</p>
              )}
              {site.contact_phone && (
                <a 
                  href={`tel:${site.contact_phone}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {site.contact_phone}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Access Notes & Special Instructions */}
        {hasAlerts && (
          <div className="space-y-2">
            {site.access_notes && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-blue-900 mb-1">Access Notes</h4>
                    <p className="text-sm text-blue-800">{site.access_notes}</p>
                  </div>
                </div>
              </div>
            )}

            {site.special_instructions && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-amber-900 mb-1">Special Instructions</h4>
                    <p className="text-sm text-amber-800">{site.special_instructions}</p>
                  </div>
                </div>
              </div>
            )}

            {site.hazards && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-red-900 mb-1">⚠️ Hazards</h4>
                    <p className="text-sm text-red-800">{site.hazards}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Equipment On-Site */}
        {site.equipment_on_site && site.equipment_on_site.length > 0 && (
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-semibold text-purple-900">Equipment On-Site</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {site.equipment_on_site.map((equipment, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium"
                >
                  {equipment}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent Services */}
        {showRecentServices && recentServices.length > 0 && (
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-green-600" />
              <h4 className="text-xs font-semibold text-green-900">Last 3 Services</h4>
            </div>
            <div className="space-y-2">
              {recentServices.map((service, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between text-sm bg-white rounded p-2"
                >
                  <span className="font-medium text-gray-900">{service.service_type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">
                      {new Date(service.scheduled_date).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      service.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : service.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {service.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
