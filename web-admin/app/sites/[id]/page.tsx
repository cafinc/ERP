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
  History,
  Clock,
  Users,
  Camera,
  Trash2,
  CheckCircle,
  XCircle,
  Circle,
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

interface ServiceHistory {
  id: string;
  site_id: string;
  service_date: string;
  service_type: string;
  crew_members: string[];
  crew_lead?: string;
  description?: string;
  notes?: string;
  status: string;
  duration_hours?: number;
  photos: string[];
  weather_conditions?: string;
  equipment_used: string[];
  created_at: string;
  updated_at: string;
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
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [measurementType, setMeasurementType] = useState<'distance' | 'area'>('distance');
  const [currentDistance, setCurrentDistance] = useState(0);
  const [currentArea, setCurrentArea] = useState(0);
  const [measurementPath, setMeasurementPath] = useState<Array<{ lat: number; lng: number }>>([]);
  
  // Service History State
  const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>([]);
  const [serviceHistoryLoading, setServiceHistoryLoading] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceHistory | null>(null);
  const [serviceForm, setServiceForm] = useState({
    service_date: new Date().toISOString().split('T')[0],
    service_type: '',
    crew_members: [] as string[],
    crew_lead: '',
    description: '',
    notes: '',
    status: 'completed',
    duration_hours: 0,
    photos: [] as string[],
    weather_conditions: '',
    equipment_used: [] as string[],
  });
  
  // Map refs
  const mapRef = useRef<HTMLDivElement>(null);
  const measureMapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const measureMapInstance = useRef<google.maps.Map | null>(null);
  const geofencePolygon = useRef<google.maps.Polygon | null>(null);
  const drawingPolyline = useRef<google.maps.Polyline | null>(null);
  const drawingPolygon = useRef<google.maps.Polygon | null>(null);
  const drawingMarkers = useRef<google.maps.Marker[]>([]);
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

  const loadServiceHistory = async () => {
    try {
      setServiceHistoryLoading(true);
      const response = await api.get(`/sites/${siteId}/service-history`);
      setServiceHistory(response.data.service_history || []);
    } catch (error: any) {
      console.error('Error loading service history:', error);
      alert(`Failed to load service history: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
    } finally {
      setServiceHistoryLoading(false);
    }
  };

  const handleCreateService = async () => {
    try {
      setActionLoading(true);
      await api.post(`/sites/${siteId}/service-history`, serviceForm);
      alert('Service history created successfully');
      setShowServiceModal(false);
      loadServiceHistory();
      resetServiceForm();
    } catch (error: any) {
      console.error('Error creating service history:', error);
      alert(`Failed to create service history: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteService = async (historyId: string) => {
    if (!confirm('Are you sure you want to delete this service history entry?')) return;
    
    try {
      setActionLoading(true);
      await api.delete(`/sites/${siteId}/service-history/${historyId}`);
      alert('Service history deleted successfully');
      loadServiceHistory();
    } catch (error: any) {
      console.error('Error deleting service history:', error);
      alert(`Failed to delete service history: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const resetServiceForm = () => {
    setServiceForm({
      service_date: new Date().toISOString().split('T')[0],
      service_type: '',
      crew_members: [],
      crew_lead: '',
      description: '',
      notes: '',
      status: 'completed',
      duration_hours: 0,
      photos: [],
      weather_conditions: '',
      equipment_used: [],
    });
    setEditingService(null);
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, JSX.Element> = {
      completed: <CheckCircle className="w-5 h-5 text-green-600" />,
      in_progress: <Circle className="w-5 h-5 text-yellow-600" />,
      scheduled: <Clock className="w-5 h-5 text-blue-600" />,
      cancelled: <XCircle className="w-5 h-5 text-red-600" />,
    };
    return icons[status] || <Circle className="w-5 h-5 text-gray-600" />;
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
              <button
                onClick={() => {
                  setActiveTab('history');
                  if (serviceHistory.length === 0) loadServiceHistory();
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <History className="w-4 h-4 inline mr-2" />
                Service History
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
                    onClick={() => router.push(`/sites/${siteId}/maps`)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Advanced Maps
                  </button>
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

        {/* Service History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Service History ({serviceHistory.length} records)
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportToExcel()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center"
                    disabled={serviceHistory.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export to Excel
                  </button>
                  <button
                    onClick={() => exportToPDF()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center"
                    disabled={serviceHistory.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export to PDF
                  </button>
                  <button
                    onClick={() => exportToGoogleSheets()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
                    disabled={serviceHistory.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Google Sheets
                  </button>
                  <button
                    onClick={() => setShowServiceModal(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Record
                  </button>
                </div>
              </div>

              {serviceHistoryLoading ? (
                <div className="p-12 text-center">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading service history...</p>
                </div>
              ) : serviceHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration (hrs)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Crew Lead
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Crew Members
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Weather
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Equipment
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {serviceHistory.map((entry, index) => (
                        <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {new Date(entry.service_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {entry.service_type}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                              entry.status === 'completed' ? 'bg-green-100 text-green-800' :
                              entry.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                              entry.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {entry.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {entry.duration_hours || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {entry.crew_lead || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {entry.crew_members && entry.crew_members.length > 0 
                              ? entry.crew_members.join(', ') 
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                            {entry.description || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {entry.weather_conditions || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {entry.equipment_used && entry.equipment_used.length > 0 
                              ? entry.equipment_used.join(', ') 
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                            {entry.notes || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleDeleteService(entry.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No service history recorded yet</p>
                  <button
                    onClick={() => setShowServiceModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Service Record
                  </button>
                </div>
              )}
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

      {/* Service History Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingService ? 'Edit Service Record' : 'Add Service Record'}
              </h3>
              <button
                onClick={() => {
                  setShowServiceModal(false);
                  resetServiceForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* Service Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={serviceForm.service_date}
                    onChange={(e) => setServiceForm({ ...serviceForm, service_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Service Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={serviceForm.service_type}
                    onChange={(e) => setServiceForm({ ...serviceForm, service_type: e.target.value })}
                    placeholder="e.g., Snow Plowing, Salting, Landscaping"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={serviceForm.status}
                    onChange={(e) => setServiceForm({ ...serviceForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Crew Lead */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Crew Lead
                  </label>
                  <input
                    type="text"
                    value={serviceForm.crew_lead}
                    onChange={(e) => setServiceForm({ ...serviceForm, crew_lead: e.target.value })}
                    placeholder="Name of crew lead"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={serviceForm.duration_hours}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration_hours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    rows={3}
                    placeholder="Describe the service performed"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={serviceForm.notes}
                    onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value })}
                    rows={2}
                    placeholder="Additional notes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Weather Conditions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weather Conditions
                  </label>
                  <input
                    type="text"
                    value={serviceForm.weather_conditions}
                    onChange={(e) => setServiceForm({ ...serviceForm, weather_conditions: e.target.value })}
                    placeholder="e.g., Clear, Snowy, Rainy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowServiceModal(false);
                    resetServiceForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateService}
                  disabled={!serviceForm.service_type || !serviceForm.service_date || actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Service Record
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
