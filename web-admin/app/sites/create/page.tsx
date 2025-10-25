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
  Briefcase,
  Phone,
  Home,
  Building,
  Factory,
  ShoppingBag,
  Siren,
} from 'lucide-react';

const SITE_TYPES = ['residential', 'commercial', 'industrial', 'retail', 'emergency_services'];

// Helper function to get icon for each site type
const getSiteTypeIcon = (type: string) => {
  const icons: Record<string, JSX.Element> = {
    residential: <Home className="w-5 h-5" />,
    commercial: <Building className="w-5 h-5" />,
    industrial: <Factory className="w-5 h-5" />,
    retail: <ShoppingBag className="w-5 h-5" />,
    emergency_services: <Siren className="w-5 h-5" />,
  };
  return icons[type] || <Building2 className="w-5 h-5" />;
};

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
  const [siteContact, setSiteContact] = useState<{ name?: string; phone?: string }>({});
  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [siteType, setSiteType] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('AB');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [areaSize, setAreaSize] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [crewNotes, setCrewNotes] = useState('');
  const [siteServices, setSiteServices] = useState<SiteService[]>([]);
  const [showManualCoordinates, setShowManualCoordinates] = useState(false);

  const CANADIAN_PROVINCES = [
    { code: 'AB', name: 'Alberta' },
    { code: 'BC', name: 'British Columbia' },
    { code: 'MB', name: 'Manitoba' },
    { code: 'NB', name: 'New Brunswick' },
    { code: 'NL', name: 'Newfoundland and Labrador' },
    { code: 'NT', name: 'Northwest Territories' },
    { code: 'NS', name: 'Nova Scotia' },
    { code: 'NU', name: 'Nunavut' },
    { code: 'ON', name: 'Ontario' },
    { code: 'PE', name: 'Prince Edward Island' },
    { code: 'QC', name: 'Quebec' },
    { code: 'SK', name: 'Saskatchewan' },
    { code: 'YT', name: 'Yukon' },
  ];

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
            {/* Customer Assignment - Compact at Top */}
            <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-6 backdrop-blur-sm hover:shadow-md transition-shadow">
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <User className="w-4 h-4 inline-block mr-2 text-[#3f72af]" />
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

            {/* Site Type - Compact */}
            <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-6 backdrop-blur-sm hover:shadow-md transition-shadow">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <Building2 className="w-4 h-4 inline-block mr-2 text-[#3f72af]" />
                Site Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {SITE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSiteType(type)}
                    className={`px-3 py-3 rounded-xl border-2 font-medium transition-all hover:scale-105 flex flex-col items-center gap-1.5 ${
                      siteType === type
                        ? 'bg-[#3f72af] text-white border-[#3f72af] shadow-lg'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#3f72af] hover:shadow-md'
                    }`}
                  >
                    <div className={siteType === type ? 'text-white' : 'text-[#3f72af]'}>
                      {getSiteTypeIcon(type)}
                    </div>
                    <span className="text-xs capitalize leading-tight text-center">
                      {type.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Site Information Card */}
            <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-8 backdrop-blur-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <MapPin className="w-6 h-6 text-[#3f72af] mr-2" />
                Site Information
              </h2>
              <div className="space-y-6">
                {/* Site Name & Reference - Same Line */}
                <div className="grid grid-cols-2 gap-4">
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

                {/* Site Contact Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Site Contact Name
                    </label>
                    <input
                      type="text"
                      value={siteContact?.name || ''}
                      onChange={(e) => setSiteContact({ ...siteContact, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                      placeholder="e.g., John Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={siteContact?.phone || ''}
                        onChange={(e) => setSiteContact({ ...siteContact, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Section with Google Maps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Address with Google Autocomplete */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                        placeholder="123 Main Street"
                        required
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                        <img 
                          src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" 
                          alt="Powered by Google"
                          className="h-4"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Start typing to use Google address autocomplete
                    </p>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                      placeholder="Calgary"
                      required
                    />
                  </div>

                  {/* Province */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Province <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all bg-white"
                      required
                    >
                      {CANADIAN_PROVINCES.map(prov => (
                        <option key={prov.code} value={prov.code}>
                          {prov.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                      placeholder="T2P 1J9"
                      required
                    />
                  </div>

                  {/* Area Size */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Area Size (sq ft)
                    </label>
                    <input
                      type="number"
                      value={areaSize}
                      onChange={(e) => setAreaSize(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                      placeholder="e.g., 5000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Site Type - Compact */}
            <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-6 backdrop-blur-sm hover:shadow-md transition-shadow">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <Building2 className="w-4 h-4 inline-block mr-2 text-[#3f72af]" />
                Site Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {SITE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSiteType(type)}
                    className={`px-3 py-3 rounded-xl border-2 font-medium transition-all hover:scale-105 flex flex-col items-center gap-1.5 ${
                      siteType === type
                        ? 'bg-[#3f72af] text-white border-[#3f72af] shadow-lg'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#3f72af] hover:shadow-md'
                    }`}
                  >
                    <div className={siteType === type ? 'text-white' : 'text-[#3f72af]'}>
                      {getSiteTypeIcon(type)}
                    </div>
                    <span className="text-xs capitalize leading-tight text-center">
                      {type.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes Card */}
            <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-8 backdrop-blur-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FileText className="w-6 h-6 text-[#3f72af] mr-2" />
                Site Notes
              </h2>

              <div className="space-y-6">
                {/* Internal Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Internal Notes (Admin Only)
                  </label>
                  <p className="text-sm text-gray-600 mb-3 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Only visible to administrators
                  </p>
                  <textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all resize-none"
                    placeholder="Private notes for admin team..."
                  />
                </div>

                {/* Crew Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Crew Notes
                  </label>
                  <p className="text-sm text-gray-600 mb-3 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Visible to crew and customer
                  </p>
                  <textarea
                    value={crewNotes}
                    onChange={(e) => setCrewNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all resize-none"
                    placeholder="Special instructions, access codes, gate information, etc..."
                  />
                </div>
              </div>
            </div>

            {/* Site Services Card */}
            <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-8 backdrop-blur-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Briefcase className="w-6 h-6 text-[#3f72af] mr-2" />
                    Site Services
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Configure services for this site</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#3f72af] text-white rounded-xl hover:bg-[#2c5282] transition-all shadow-md hover:shadow-lg font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add Service
                </button>
              </div>

              {siteServices.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No services configured yet</p>
                  <p className="text-sm text-gray-400 mt-1">Click "Add Service" to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {siteServices.map((service) => (
                    <div
                      key={service.service_id}
                      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-100 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-3 text-lg">{service.service_name}</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/80 rounded-lg p-3">
                              <span className="text-xs text-gray-600 font-medium block mb-1">Unit Type</span>
                              <span className="text-sm font-bold text-gray-900 capitalize">
                                {service.unit_type.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="bg-white/80 rounded-lg p-3">
                              <span className="text-xs text-gray-600 font-medium block mb-1">Price</span>
                              <span className="text-sm font-bold text-[#3f72af]">
                                ${service.price.toFixed(2)}
                              </span>
                            </div>
                            {service.frequency && (
                              <div className="bg-white/80 rounded-lg p-3">
                                <span className="text-xs text-gray-600 font-medium block mb-1">Frequency</span>
                                <span className="text-sm font-bold text-gray-900 capitalize">
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
                          title="Remove service"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-[#3f72af] text-white rounded-xl hover:bg-[#2c5282] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-semibold"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Create Site
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
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
