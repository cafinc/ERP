'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import { loadGoogleMapsScript } from '@/lib/googleMapsLoader';
import {
  Save,
  MapPin,
  User,
  Building2,
  FileText,
  Search,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Map,
  Edit3,
} from 'lucide-react';

const SITE_TYPES = ['residential', 'commercial', 'industrial', 'retail', 'emergency_services'];

interface Customer {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Service {
  _id: string;
  id?: string;
  name: string;
  service_type: string;
  pricing?: any;
}

interface SiteService {
  service_id: string;
  service_name: string;
  unit_type: string;
  price: number;
  frequency?: string;
}

export default function CreateSitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const autocompleteRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [siteName, setSiteName] = useState('');
  const [siteReference, setSiteReference] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [siteType, setSiteType] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [areaSize, setAreaSize] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [crewNotes, setCrewNotes] = useState('');
  const [siteServices, setSiteServices] = useState<SiteService[]>([]);
  const [showManualCoordinates, setShowManualCoordinates] = useState(false);

  // Service modal states
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [serviceUnitType, setServiceUnitType] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceFrequency, setServiceFrequency] = useState('');

  useEffect(() => {
    fetchData();
    initializeGoogleMaps();
  }, []);

  const fetchData = async () => {
    try {
      const [customersRes, servicesRes] = await Promise.all([
        api.get('/customers'),
        api.get('/services'),
      ]);
      setCustomers(customersRes.data);
      setServices(servicesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const initializeGoogleMaps = async () => {
    try {
      await loadGoogleMapsScript();
      if (inputRef.current && window.google) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'ca' },
          fields: ['address_components', 'geometry', 'formatted_address'],
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place.geometry) {
            setAddress(place.formatted_address || '');
            setLatitude(place.geometry.location.lat().toString());
            setLongitude(place.geometry.location.lng().toString());
          }
        });
      }
    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  };

  const handleAddService = () => {
    setSelectedServiceId('');
    setServiceUnitType('');
    setServicePrice('');
    setServiceFrequency('');
    setShowServiceModal(true);
  };

  const handleSaveService = () => {
    if (!selectedServiceId || !serviceUnitType || !servicePrice) {
      alert('Please fill in all service fields');
      return;
    }

    const service = services.find(s => (s._id || s.id) === selectedServiceId);
    if (!service) return;

    const newService: SiteService = {
      service_id: selectedServiceId,
      service_name: service.name,
      unit_type: serviceUnitType,
      price: parseFloat(servicePrice),
      frequency: serviceFrequency || undefined,
    };

    setSiteServices([...siteServices, newService]);
    setShowServiceModal(false);
  };

  const handleRemoveService = (serviceId: string) => {
    setSiteServices(siteServices.filter(s => s.service_id !== serviceId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!siteName.trim() || !customerId || !siteType) {
      alert('Please fill in Site Name, Customer, and Site Type');
      return;
    }

    // Validate location
    if (!address && (!latitude || !longitude)) {
      alert('Please provide either an address or manual coordinates');
      return;
    }

    setLoading(true);

    try {
      const siteData = {
        name: siteName.trim(),
        site_reference: siteReference.trim() || null,
        customer_id: customerId,
        site_type: siteType,
        location: {
          latitude: latitude ? parseFloat(latitude) : 0,
          longitude: longitude ? parseFloat(longitude) : 0,
          address: address || null,
        },
        area_size: areaSize ? parseFloat(areaSize) : null,
        internal_notes: internalNotes.trim() || null,
        crew_notes: crewNotes.trim() || null,
        services: siteServices.length > 0 ? siteServices : null,
        active: true,
      };

      const response = await api.post('/sites', siteData);
      alert('Site created successfully!');
      router.push(`/sites/${response.data._id || response.data.id}`);
    } catch (error: any) {
      console.error('Error creating site:', error);
      alert(error.response?.data?.detail || 'Failed to create site. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  const getCustomerName = (id: string) => {
    const customer = customers.find(c => (c._id || c.id) === id);
    return customer?.name || 'Unknown Customer';
  };

  return (
    <>
      <PageHeader
        title="Create Site"
        subtitle="Add a new site location"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Sites', href: '/sites' },
          { label: 'Create' },
        ]}
      />

      <div className="h-full bg-gray-50 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Site Information Card */}
            <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-8 backdrop-blur-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <MapPin className="w-6 h-6 text-[#3f72af] mr-2" />
                Site Information
              </h2>
              <div className="space-y-6">
              <div className="space-y-6">
                {/* Site Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Site Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                    placeholder="e.g., Main Office Parking Lot"
                    required
                  />
                </div>

                {/* Site Reference */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Site Reference/Code
                  </label>
                  <input
                    type="text"
                    value={siteReference}
                    onChange={(e) => setSiteReference(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                    placeholder="e.g., LOT-001, SITE-A"
                  />
                </div>
              </div>
            </div>

            {/* Customer Selection Card */}
            <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-8 backdrop-blur-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <User className="w-6 h-6 text-[#3f72af] mr-2" />
                Customer Assignment
              </h2>

              {/* Customer Dropdown */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Customer <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] text-left flex items-center justify-between bg-white hover:border-gray-300 transition-all"
                >
                  <span className={!customerId ? 'text-gray-400' : 'text-gray-900 font-medium'}>
                    {customerId ? getCustomerName(customerId) : 'Select a customer'}
                  </span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showCustomerDropdown && (
                  <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                          placeholder="Search customers..."
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredCustomers.map((customer) => (
                        <button
                          key={customer._id || customer.id}
                          type="button"
                          onClick={() => {
                            setCustomerId(customer._id || customer.id!);
                            setShowCustomerDropdown(false);
                            setCustomerSearch('');
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center justify-between transition-colors ${
                            customerId === (customer._id || customer.id) ? 'bg-blue-50 border-l-4 border-[#3f72af]' : ''
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-gray-900">{customer.name}</div>
                            {customer.email && (
                              <div className="text-sm text-gray-500">{customer.email}</div>
                            )}
                          </div>
                          {customerId === (customer._id || customer.id) && (
                            <svg className="w-5 h-5 text-[#3f72af]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p>No customers found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Site Type Card */}
            <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-8 backdrop-blur-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Building2 className="w-6 h-6 text-[#3f72af] mr-2" />
                Site Type
              </h2>

              {/* Site Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-4">
                  Select Site Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SITE_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSiteType(type)}
                      className={`px-4 py-4 rounded-xl border-2 font-semibold transition-all hover:scale-105 capitalize ${
                        siteType === type
                          ? 'bg-[#3f72af] text-white border-[#3f72af] shadow-lg'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-[#3f72af] hover:shadow-md'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Site Address
                </label>
                <button
                  type="button"
                  onClick={() => setShowManualCoordinates(!showManualCoordinates)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  {showManualCoordinates ? (
                    <>
                      <MapPin className="w-4 h-4" />
                      Use Address
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      Manual Coordinates
                    </>
                  )}
                </button>
              </div>

              {!showManualCoordinates ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Start typing address..."
                />
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Enter coordinates manually if address lookup fails
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="43.6532"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="-79.3832"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Area Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area Size (sq ft)
              </label>
              <input
                type="number"
                value={areaSize}
                onChange={(e) => setAreaSize(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 5000"
              />
            </div>

            {/* Internal Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes (Admin Only)
              </label>
              <p className="text-sm text-gray-500 mb-2">Only visible to administrators</p>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Private notes for admin team..."
              />
            </div>

            {/* Crew Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crew Notes
              </label>
              <p className="text-sm text-gray-500 mb-2">Visible to crew and customer</p>
              <textarea
                value={crewNotes}
                onChange={(e) => setCrewNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Special instructions, access codes, etc..."
              />
            </div>

            {/* Site Services */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Site Services</h3>
                  <p className="text-sm text-gray-500">Configure services for this site</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Service
                </button>
              </div>

              {siteServices.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No services configured yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {siteServices.map((service) => (
                    <div
                      key={service.service_id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">{service.service_name}</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Unit Type:</span>
                              <span className="ml-2 font-medium text-gray-900 capitalize">
                                {service.unit_type.replace('_', ' ')}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Price:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                ${service.price.toFixed(2)}
                              </span>
                            </div>
                            {service.frequency && (
                              <div>
                                <span className="text-gray-500">Frequency:</span>
                                <span className="ml-2 font-medium text-gray-900 capitalize">
                                  {service.frequency}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(service.service_id)}
                          className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Create Site</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Add Service</h3>
                <button
                  onClick={() => setShowServiceModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Service Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service._id || service.id} value={service._id || service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['hourly', 'per_occurrence', 'monthly', 'per_yard'].map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setServiceUnitType(unit)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-all capitalize text-sm ${
                        serviceUnitType === unit
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {unit.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency (Optional)
                </label>
                <input
                  type="text"
                  value={serviceFrequency}
                  onChange={(e) => setServiceFrequency(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., weekly, bi-weekly, as-needed"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowServiceModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveService}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Service
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
