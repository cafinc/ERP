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
} from 'lucide-react';

// Canadian provinces
const CANADIAN_PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'YT', name: 'Yukon' },
];

const SITE_TYPES = [
  'Residential',
  'Commercial',
  'Industrial',
  'Municipal',
  'Retail',
  'Office',
  'Parking Lot',
  'Other',
];

interface Customer {
  id: string;
  name: string;
  email?: string;
  company_name?: string;
  customer_type?: string;
}

export default function CreateSitePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const addressInputRef = useRef<HTMLInputElement>(null);

  const [siteForm, setSiteForm] = useState({
    name: '',
    customer_id: '',
    site_type: 'Residential',
    street_address: '',
    city: '',
    province: 'ON',
    postal_code: '',
    country: 'Canada',
    latitude: 0,
    longitude: 0,
    area_size: '',
    access_notes: '',
    special_instructions: '',
    emergency_contact: '',
    gate_code: '',
    parking_info: '',
    notes: '',
  });

  useEffect(() => {
    loadCustomers();
    loadGoogleMapsScript(initializeAutocomplete);
  }, []);

  useEffect(() => {
    if (customerSearchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const query = customerSearchQuery.toLowerCase();
      const filtered = customers.filter(
        (customer) =>
          customer.name?.toLowerCase().includes(query) ||
          customer.email?.toLowerCase().includes(query) ||
          customer.company_name?.toLowerCase().includes(query)
      );
      setFilteredCustomers(filtered);
    }
  }, [customerSearchQuery, customers]);

  const loadCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data || []);
      setFilteredCustomers(response.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadGoogleMapsScript = () => {
    if (typeof window !== 'undefined' && !(window as any).google) {
      const script = document.createElement('script');
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('Google Maps API key not configured - address autocomplete will be disabled');
        return;
      }
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeAutocomplete;
      document.head.appendChild(script);
    } else if ((window as any).google) {
      initializeAutocomplete();
    }
  };

  const initializeAutocomplete = () => {
    if (!addressInputRef.current || !(window as any).google) return;

    const autocomplete = new (window as any).google.maps.places.Autocomplete(
      addressInputRef.current,
      {
        types: ['address'],
        componentRestrictions: { country: 'ca' },
      }
    );

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      let street = '';
      let city = '';
      let province = 'ON';
      let postal = '';

      place.address_components?.forEach((component: any) => {
        const types = component.types;
        if (types.includes('street_number')) {
          street = component.long_name + ' ';
        }
        if (types.includes('route')) {
          street += component.long_name;
        }
        if (types.includes('locality')) {
          city = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          province = component.short_name;
        }
        if (types.includes('postal_code')) {
          postal = component.long_name;
        }
      });

      setSiteForm({
        ...siteForm,
        street_address: street.trim() || place.formatted_address || '',
        city: city,
        province: province,
        postal_code: postal,
        latitude: lat,
        longitude: lng,
      });
    });
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSiteForm({ ...siteForm, customer_id: customer.id });
    setShowCustomerSearch(false);
    setCustomerSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};

    // Validation
    if (!siteForm.name) errors['name'] = 'Site name is required';
    if (!siteForm.customer_id) errors['customer_id'] = 'Customer selection is required';
    if (!siteForm.street_address) errors['street_address'] = 'Address is required';
    if (!siteForm.city) errors['city'] = 'City is required';
    if (!siteForm.postal_code) errors['postal_code'] = 'Postal code is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      alert('Please fix the errors in the form before submitting');
      return;
    }

    try {
      setSaving(true);

      const fullAddress = `${siteForm.street_address}, ${siteForm.city}, ${siteForm.province} ${siteForm.postal_code}, ${siteForm.country}`;

      const sitePayload = {
        name: siteForm.name,
        customer_id: siteForm.customer_id,
        site_type: siteForm.site_type,
        location: {
          address: fullAddress,
          latitude: siteForm.latitude,
          longitude: siteForm.longitude,
        },
        area_size: siteForm.area_size ? parseFloat(siteForm.area_size) : undefined,
        access_notes: siteForm.access_notes || undefined,
        special_instructions: siteForm.special_instructions || undefined,
        emergency_contact: siteForm.emergency_contact || undefined,
        gate_code: siteForm.gate_code || undefined,
        parking_info: siteForm.parking_info || undefined,
        notes: siteForm.notes || undefined,
        status: 'active',
      };

      const response = await api.post('/sites', sitePayload);

      if (response.data?.id || response.data?._id) {
        alert('Site created successfully!');
        const newSiteId = response.data.id || response.data._id;
        router.push(`/sites/${newSiteId}`);
      }
    } catch (error: any) {
      console.error('Error creating site:', error);
      alert(error.response?.data?.detail || 'Failed to create site');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Page Header */}
      <PageHeader
        title="New Site"
        breadcrumbs={[
          { label: 'Sites', href: '/sites' },
          { label: 'New' }
        ]}
        actions={[
          {
            label: 'Cancel',
            onClick: () => router.push('/sites'),
            variant: 'secondary' as const,
          },
          {
            label: saving ? 'Creating...' : 'Create Site',
            icon: <Save className="w-4 h-4 mr-2" />,
            onClick: () => {
              const form = document.querySelector('form') as HTMLFormElement;
              if (form) form.requestSubmit();
            },
            variant: 'primary',
          },
        ]}
      />

      {/* Main Content */}
      <div className="h-full bg-gray-50 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-[#3f72af]" />
                <span>Link to Customer *</span>
              </h2>

              {selectedCustomer ? (
                <div className="flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-500 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
                    {selectedCustomer.email && (
                      <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                    )}
                    {selectedCustomer.company_name && (
                      <p className="text-sm text-gray-600">{selectedCustomer.company_name}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setSiteForm({ ...siteForm, customer_id: '' });
                    }}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search for a customer..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      onFocus={() => setShowCustomerSearch(true)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                        fieldErrors['customer_id'] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                  </div>
                  {fieldErrors['customer_id'] && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors['customer_id']}</p>
                  )}

                  {showCustomerSearch && (
                    <div className="mt-2 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg">
                      {filteredCustomers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No customers found
                        </div>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => handleCustomerSelect(customer)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                          >
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            {customer.email && (
                              <p className="text-sm text-gray-600">{customer.email}</p>
                            )}
                            {customer.company_name && (
                              <p className="text-sm text-gray-500">{customer.company_name}</p>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Site Information */}
            <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-[#3f72af]" />
                <span>Site Information</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name *
                  </label>
                  <input
                    type="text"
                    value={siteForm.name}
                    onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                      fieldErrors['name'] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="e.g., Main Office, Warehouse #1"
                    required
                  />
                  {fieldErrors['name'] && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors['name']}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Type *
                  </label>
                  <select
                    value={siteForm.site_type}
                    onChange={(e) => setSiteForm({ ...siteForm, site_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {SITE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area Size (sq ft)
                  </label>
                  <input
                    type="number"
                    value={siteForm.area_size}
                    onChange={(e) => setSiteForm({ ...siteForm, area_size: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 5000"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-[#3f72af]" />
                <span>Location</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={siteForm.street_address}
                    onChange={(e) => setSiteForm({ ...siteForm, street_address: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                      fieldErrors['street_address'] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="Start typing address..."
                    required
                  />
                  {fieldErrors['street_address'] && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors['street_address']}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={siteForm.city}
                      onChange={(e) => setSiteForm({ ...siteForm, city: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                        fieldErrors['city'] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Toronto"
                      required
                    />
                    {fieldErrors['city'] && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors['city']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Province *
                    </label>
                    <select
                      value={siteForm.province}
                      onChange={(e) => setSiteForm({ ...siteForm, province: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {CANADIAN_PROVINCES.map((prov) => (
                        <option key={prov.code} value={prov.code}>
                          {prov.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      value={siteForm.postal_code}
                      onChange={(e) => setSiteForm({ ...siteForm, postal_code: e.target.value.toUpperCase() })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                        fieldErrors['postal_code'] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="M5H 2N2"
                      required
                    />
                    {fieldErrors['postal_code'] && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors['postal_code']}</p>
                    )}
                  </div>
                </div>

                {siteForm.latitude !== 0 && siteForm.longitude !== 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ Location coordinates captured: {siteForm.latitude.toFixed(6)}, {siteForm.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Access & Special Instructions */}
            <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#3f72af]" />
                <span>Access & Instructions</span>
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gate Code
                    </label>
                    <input
                      type="text"
                      value={siteForm.gate_code}
                      onChange={(e) => setSiteForm({ ...siteForm, gate_code: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., #1234"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact
                    </label>
                    <input
                      type="text"
                      value={siteForm.emergency_contact}
                      onChange={(e) => setSiteForm({ ...siteForm, emergency_contact: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Name & Phone"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Notes
                  </label>
                  <textarea
                    value={siteForm.access_notes}
                    onChange={(e) => setSiteForm({ ...siteForm, access_notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="How to access the property..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parking Information
                  </label>
                  <textarea
                    value={siteForm.parking_info}
                    onChange={(e) => setSiteForm({ ...siteForm, parking_info: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Where crews should park..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    value={siteForm.special_instructions}
                    onChange={(e) => setSiteForm({ ...siteForm, special_instructions: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any special requirements or considerations..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={siteForm.notes}
                    onChange={(e) => setSiteForm({ ...siteForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any other relevant information..."
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
