'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { loadGoogleMapsScript } from '@/lib/googleMapsLoader';
import {
  ArrowLeft,
  Edit,
  Archive,
  MapPin,
  User,
  Phone,
  Mail,
  Building,
  Calendar,
  DollarSign,
  RefreshCw,
  AlertCircle,
  SquareArrowOutUpRight,
  FileText,
  Key,
  Lock,
  Shield,
  Map,
  Ruler,
  Plus,
  Save,
  X,
  Home,
  Factory,
  ShoppingBag,
  Siren,
} from 'lucide-react';

interface Site {
  id: string;
  customer_id: string;
  name: string;
  site_reference?: string;
  site_contact?: {
    name?: string;
    phone?: string;
  };
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  site_type: string;
  area_size?: number;
  notes?: string;
  internal_notes?: string;
  crew_notes?: string;
  services?: Array<{
    service_id: string;
    service_name: string;
    service_type: string;
    unit_type: string;
    cost: number;
    notes?: string;
  }>;
  access_fields?: Array<{
    field_name: string;
    field_value: string;
    field_type: string;
  }>;
  geofence?: {
    coordinates: Array<{ lat: number; lng: number }>;
    radius?: number;
  };
  active: boolean;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
}

const getSiteTypeIcon = (type: string) => {
  const icons: Record<string, JSX.Element> = {
    residential: <Home className="w-5 h-5" />,
    commercial: <Building className="w-5 h-5" />,
    industrial: <Factory className="w-5 h-5" />,
    retail: <ShoppingBag className="w-5 h-5" />,
    emergency_services: <Siren className="w-5 h-5" />,
  };
  return icons[type] || <Building className="w-5 h-5" />;
};

export default function SiteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const siteId = (Array.isArray(params?.id) ? params.id[0] : params?.id) as string;
  
  const [site, setSite] = useState<Site | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMeasureModal, setShowMeasureModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Map refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const geofencePolygon = useRef<google.maps.Polygon | null>(null);
  const measurementPath = useRef<google.maps.Polyline | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (siteId && siteId !== 'undefined') {
      loadSite();
      loadGoogleMapsScript().then(() => {
        initializeMap();
      });
    }
  }, [siteId]);

  const loadSite = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sites/${siteId}`);
      setSite(response.data);
      
      // Load customer details (optional)
      if (response.data.customer_id) {
        try {
          const customerResponse = await api.get(`/customers/${response.data.customer_id}`);
          setCustomer(customerResponse.data);
        } catch (customerError: any) {
          console.warn('Customer not found:', customerError);
        }
      }
    } catch (error: any) {
      console.error('Error loading site:', error);
      alert(`Failed to load site: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google || !site) return;

    const center = {
      lat: site.location.latitude || 51.0447,
      lng: site.location.longitude || -114.0719,
    };

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 18,
      mapTypeId: 'satellite',
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    // Add site marker
    new window.google.maps.Marker({
      position: center,
      map: mapInstance.current,
      title: site.name,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#3f72af',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });

    // Draw existing geofence if available
    if (site.geofence?.coordinates && site.geofence.coordinates.length > 0) {
      drawGeofence(site.geofence.coordinates);
    }
  };

  const drawGeofence = (coordinates: Array<{ lat: number; lng: number }>) => {
    if (!mapInstance.current) return;

    // Remove existing polygon
    if (geofencePolygon.current) {
      geofencePolygon.current.setMap(null);
    }

    geofencePolygon.current = new window.google.maps.Polygon({
      paths: coordinates,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.15,
      map: mapInstance.current,
      editable: false,
    });
  };

  const handleArchiveSite = async () => {
    if (!confirm('Are you sure you want to archive this site?')) return;

    try {
      setActionLoading(true);
      await api.patch(`/sites/${siteId}`, { active: false });
      alert('Site archived successfully');
      router.push('/sites');
    } catch (error) {
      console.error('Error archiving site:', error);
      alert('Failed to archive site');
    } finally {
      setActionLoading(false);
    }
  };

  const getAccessFieldValue = (fieldName: string) => {
    return site?.access_fields?.find(f => f.field_name === fieldName)?.field_value || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading site details...</p>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Site not found</p>
          <button
            onClick={() => router.push('/sites')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Sites
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={site.name}
        subtitle={site.site_reference || 'Site Details'}
        breadcrumbs={[
          { label: 'Sites', href: '/sites' },
          { label: site.name },
        ]}
        actions={[
          {
            label: 'Edit',
            icon: <Edit className="w-4 h-4 mr-2" />,
            onClick: () => router.push(`/sites/${siteId}/edit`),
            variant: 'secondary',
          },
          {
            label: 'Archive',
            icon: <Archive className="w-4 h-4 mr-2" />,
            onClick: handleArchiveSite,
            variant: 'danger',
          },
        ]}
      />

      <div className="p-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'map'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Map className="w-4 h-4 inline mr-2" />
                Maps & Geofence
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'services'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-4 h-4 inline mr-2" />
                Services
              </button>
              <button
                onClick={() => setActiveTab('access')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'access'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Key className="w-4 h-4 inline mr-2" />
                Access & Security
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Site Information Card */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  {getSiteTypeIcon(site.site_type)}
                  <span className="ml-2">Site Information</span>
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Site Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{site.name}</dd>
                  </div>
                  {site.site_reference && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Site Reference</dt>
                      <dd className="mt-1 text-sm text-gray-900">{site.site_reference}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Site Type</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{site.site_type.replace('_', ' ')}</dd>
                  </div>
                  {site.area_size && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Area Size</dt>
                      <dd className="mt-1 text-sm text-gray-900">{site.area_size} sq ft</dd>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900 flex items-start">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                      {site.location.address}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Site Contact */}
              {site.site_contact && (site.site_contact.name || site.site_contact.phone) && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Site Contact
                  </h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {site.site_contact.name && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Name</dt>
                        <dd className="mt-1 text-sm text-gray-900">{site.site_contact.name}</dd>
                      </div>
                    )}
                    {site.site_contact.phone && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Phone</dt>
                        <dd className="mt-1 text-sm text-gray-900">{site.site_contact.phone}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Notes */}
              {(site.internal_notes || site.crew_notes || site.notes) && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Notes
                  </h3>
                  <div className="space-y-4">
                    {site.internal_notes && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Internal Notes</h4>
                        <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">{site.internal_notes}</p>
                      </div>
                    )}
                    {site.crew_notes && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Crew Notes</h4>
                        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">{site.crew_notes}</p>
                      </div>
                    )}
                    {site.notes && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">General Notes</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{site.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Card */}
            <div className="space-y-6">
              {customer && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer</h3>
                  <div className="space-y-3">
                    <p className="font-medium text-gray-900">{customer.company_name || customer.name}</p>
                    {customer.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {customer.email}
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {customer.phone}
                      </div>
                    )}
                    <button
                      onClick={() => router.push(`/customers/${customer.id}`)}
                      className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                    >
                      View Customer
                      <SquareArrowOutUpRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Services</dt>
                    <dd className="text-sm font-semibold text-gray-900">{site.services?.length || 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Status</dt>
                    <dd>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        site.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {site.active ? 'Active' : 'Archived'}
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Created</dt>
                    <dd className="text-sm font-semibold text-gray-900">
                      {new Date(site.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {/* Map & Geofence Tab */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Site Location</h3>
                <div className="space-x-2">
                  <button
                    onClick={() => router.push(`/geofence?site=${siteId}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Manage Geofence
                  </button>
                  <button
                    onClick={() => setShowMeasureModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center"
                  >
                    <Ruler className="w-4 h-4 mr-2" />
                    Measure
                  </button>
                </div>
              </div>
              <div ref={mapRef} className="w-full h-[600px] rounded-lg"></div>
              {site.geofence && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Geofence is active for this site
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Site Services</h3>
            </div>
            {site.services && site.services.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {site.services.map((service, index) => (
                  <div key={index} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{service.service_name}</h4>
                        <p className="text-sm text-gray-500 mt-1 capitalize">{service.service_type}</p>
                        {service.notes && (
                          <p className="text-sm text-gray-600 mt-2">{service.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">${service.cost}</p>
                        <p className="text-sm text-gray-500">per {service.unit_type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No services added yet</p>
              </div>
            )}
          </div>
        )}

        {/* Access & Security Tab */}
        {activeTab === 'access' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Access Information</h3>
              <div className="space-y-6">
                {/* Gate Code */}
                {getAccessFieldValue('gate_code') && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Key className="w-5 h-5 text-blue-600 mr-2" />
                      <h4 className="font-semibold text-gray-900">Gate Code</h4>
                    </div>
                    <p className="text-2xl font-mono font-bold text-gray-900 ml-7">
                      {getAccessFieldValue('gate_code')}
                    </p>
                  </div>
                )}

                {/* Lockbox */}
                {getAccessFieldValue('lockbox_code') && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Lock className="w-5 h-5 text-purple-600 mr-2" />
                      <h4 className="font-semibold text-gray-900">Lockbox Code</h4>
                    </div>
                    <p className="text-2xl font-mono font-bold text-gray-900 ml-7">
                      {getAccessFieldValue('lockbox_code')}
                    </p>
                  </div>
                )}

                {/* Security */}
                {getAccessFieldValue('security_phone') && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Shield className="w-5 h-5 text-red-600 mr-2" />
                      <h4 className="font-semibold text-gray-900">Security Onsite</h4>
                    </div>
                    <p className="text-sm text-gray-600 ml-7">Phone:</p>
                    <p className="text-lg font-semibold text-gray-900 ml-7">
                      {getAccessFieldValue('security_phone')}
                    </p>
                  </div>
                )}

                {/* Key Card */}
                {getAccessFieldValue('keycard_info') && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Key className="w-5 h-5 text-green-600 mr-2" />
                      <h4 className="font-semibold text-gray-900">Key Card Required</h4>
                    </div>
                    <p className="text-sm text-gray-600 ml-7">
                      {getAccessFieldValue('keycard_info')}
                    </p>
                  </div>
                )}

                {!getAccessFieldValue('gate_code') && 
                 !getAccessFieldValue('lockbox_code') && 
                 !getAccessFieldValue('security_phone') && 
                 !getAccessFieldValue('keycard_info') && (
                  <div className="text-center py-12">
                    <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No access information available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Measure Modal */}
      {showMeasureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Measure Property</h3>
              <button
                onClick={() => setShowMeasureModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Click on the map to measure distances and calculate area.
              </p>
              <div className="h-96 bg-gray-100 rounded-lg mb-4">
                {/* Map for measurements will go here */}
                <p className="text-center pt-40 text-gray-500">Measurement tools (to be implemented)</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Measurements:</h4>
                <div className="space-y-1 text-sm">
                  <p>Distance: <span className="font-mono font-semibold">-- ft</span></p>
                  <p>Area: <span className="font-mono font-semibold">-- sq ft</span></p>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowMeasureModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
