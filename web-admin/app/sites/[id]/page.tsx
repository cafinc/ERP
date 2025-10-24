'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
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
} from 'lucide-react';

interface Site {
  id: string;
  customer_id: string;
  name: string;
  site_reference?: string;
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

export default function SiteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const siteId = (Array.isArray(params?.id) ? params.id[0] : params?.id) as string;
  
  const [site, setSite] = useState<Site | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (siteId && siteId !== 'undefined') {
      loadSite();
    }
  }, [siteId]);

  const loadSite = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sites/${siteId}`);
      setSite(response.data);
      
      // Load customer details
      if (response.data.customer_id) {
        const customerResponse = await api.get(`/customers/${response.data.customer_id}`);
        setCustomer(customerResponse.data);
      }
    } catch (error) {
      console.error('Error loading site:', error);
      alert('Failed to load site');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveSite = async () => {
    if (!confirm(`${site?.active ? 'Archive' : 'Restore'} this site?`)) return;
    
    try {
      setActionLoading(true);
      await api.put(`/sites/${siteId}`, {
        active: !site?.active
      });
      alert(`Site ${site?.active ? 'archived' : 'restored'} successfully!`);
      loadSite();
    } catch (error) {
      console.error('Error updating site:', error);
      alert('Failed to update site');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewOnMap = () => {
    if (site?.location?.latitude && site?.location?.longitude) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${site.location.latitude},${site.location.longitude}`,
        '_blank'
      );
    }
  };

  const getSiteTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'parking_lot': 'Parking Lot',
      'driveway': 'Driveway',
      'sidewalk': 'Sidewalk',
      'roadway': 'Roadway',
      'loading_dock': 'Loading Dock',
      'other': 'Other'
    };
    return typeMap[type] || type;
  };

  const getUnitTypeLabel = (unit: string) => {
    const unitMap: { [key: string]: string } = {
      'hourly': 'Per Hour',
      'per_occurrence': 'Per Occurrence',
      'monthly': 'Monthly',
      'per_yard': 'Per Yard',
      'no_charge': 'No Charge'
    };
    return unitMap[unit] || unit;
  };

  if (loading) {
    return (
      <PageHeader
        title="Sites Details"
        subtitle="View and manage details"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Sites", href: "/sites" }, { label: "Details" }]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <PageHeader>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Site not found</h2>
          <button
            onClick={() => router.push('/sites')}
            className="mt-4 text-[#3f72af] hover:text-blue-800"
          >
            Return to Sites
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageHeader>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/sites')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{site.name}</h1>
              {site.site_reference && (
                <p className="text-gray-600 mt-1">Ref: {site.site_reference}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/sites/${siteId}/maps`)}
              className="flex items-center gap-2 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282]"
            >
              <MapPin className="w-4 h-4" />
              Site Maps
            </button>
            <button
              onClick={handleViewOnMap}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <SquareArrowOutUpRight className="w-4 h-4" />
              View on Map
            </button>
            <button
              onClick={() => router.push(`/sites/${siteId}/edit`)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={actionLoading}
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleArchiveSite}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                site.active
                  ? 'border border-orange-300 text-orange-600 hover:bg-orange-50'
                  : 'border border-green-300 text-green-600 hover:bg-green-50'
              }`}
              disabled={actionLoading}
            >
              <Archive className="w-4 h-4" />
              {site.active ? 'Archive' : 'Restore'}
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            site.active 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {site.active ? 'ACTIVE' : 'ARCHIVED'}
          </span>
        </div>

        {/* Site Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Information */}
          {customer && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                  </div>
                </div>
                {customer.company_name && (
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Company</p>
                      <p className="text-sm font-medium text-gray-900">{customer.company_name}</p>
                    </div>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-sm font-medium text-gray-900">{customer.email}</p>
                    </div>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{customer.phone}</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => router.push(`/customers/${customer.id}`)}
                  className="text-sm text-[#3f72af] hover:text-blue-800 font-medium"
                >
                  View Customer Details →
                </button>
              </div>
            </div>
          )}

          {/* Site Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Site Details</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="text-sm font-medium text-gray-900">{getSiteTypeLabel(site.site_type)}</p>
                </div>
              </div>
              {site.area_size && (
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Area Size</p>
                    <p className="text-sm font-medium text-gray-900">
                      {site.area_size.toLocaleString()} sq ft
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(site.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="text-sm font-medium text-gray-900">{site.location.address}</p>
              </div>
            </div>
            {site.location.latitude && site.location.longitude && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Coordinates</p>
                  <p className="text-sm font-medium text-gray-900">
                    {site.location.latitude}, {site.location.longitude}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Services */}
        {site.services && site.services.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configured Services</h2>
            <div className="space-y-3">
              {site.services.map((service, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{service.service_name}</p>
                      <p className="text-sm text-gray-600">{service.service_type}</p>
                      {service.notes && (
                        <p className="text-sm text-gray-500 mt-1">{service.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-900">{service.cost.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-600">{getUnitTypeLabel(service.unit_type)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Access & Security */}
        {site.access_fields && site.access_fields.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Access & Security Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {site.access_fields.map((field, index) => (
                <div key={index} className="flex items-start gap-3 border border-gray-200 rounded-lg p-3">
                  <Key className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">{field.field_name}</p>
                    <p className="text-sm font-medium text-gray-900">{field.field_value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {(site.crew_notes || site.internal_notes || site.notes) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <div className="space-y-4">
              {site.crew_notes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Crew Notes</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{site.crew_notes}</p>
                </div>
              )}
              {site.internal_notes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Internal Notes (Admin Only)</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{site.internal_notes}</p>
                </div>
              )}
              {site.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">General Notes</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{site.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
