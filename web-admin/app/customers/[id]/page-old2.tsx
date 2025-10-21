'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Users,
  FileText,
  Plus,
  Link as LinkIcon,
  Unlink,
  Building,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Search,
} from 'lucide-react';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = (Array.isArray(params?.id) ? params.id[0] : params?.id) as string;
  
  const [customer, setCustomer] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Service Request Modal
  const [showServiceRequestModal, setShowServiceRequestModal] = useState(false);
  const [serviceRequestForm, setServiceRequestForm] = useState({
    service_type: 'snow',
    sub_services: [] as any[],
    urgency: 'normal',
    site_id: '',
    notes: '',
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  
  // Link Contact Modal (for companies)
  const [showLinkContactModal, setShowLinkContactModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [linkingContact, setLinkingContact] = useState(false);

  const serviceTypes = {
    snow: {
      name: 'Snow Services',
      subServices: ['Plowing', 'Sidewalks', 'Hauling', 'Sanding', 'Brining'],
    },
    grass: {
      name: 'Grass Services',
      subServices: [],
    },
    parking_lot: {
      name: 'Parking Lot Services',
      subServices: ['Line Painting', 'Crack Filling', 'Pot Hole Repair', 'Asphalt Repair'],
    },
  };

  useEffect(() => {
    if (customerId && customerId !== 'undefined') {
      loadCustomerData();
    }
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      
      const customerRes = await api.get(`/customers/${customerId}`);
      setCustomer(customerRes.data);
      
      // Load service requests
      const requestsRes = await api.get(`/service-requests?customer_id=${customerId}`);
      setServiceRequests(requestsRes.data.requests || []);
      
      // If company, load contacts
      if (customerRes.data.customer_type === 'company') {
        const contactsRes = await api.get(`/customers/${customerId}/contacts`);
        setContacts(contactsRes.data.contacts || []);
        
        // Load sites for company
        if (customerRes.data.site_ids && customerRes.data.site_ids.length > 0) {
          const sitesPromises = customerRes.data.site_ids.map((siteId: string) =>
            api.get(`/sites/${siteId}`).catch(() => null)
          );
          const sitesResults = await Promise.all(sitesPromises);
          setSites(sitesResults.filter(r => r !== null).map(r => r.data));
        }
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
      alert('Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handleSubServiceToggle = (subService: string) => {
    const exists = serviceRequestForm.sub_services.find(s => s.name === subService);
    if (exists) {
      setServiceRequestForm({
        ...serviceRequestForm,
        sub_services: serviceRequestForm.sub_services.filter(s => s.name !== subService),
      });
    } else {
      setServiceRequestForm({
        ...serviceRequestForm,
        sub_services: [...serviceRequestForm.sub_services, { name: subService, selected: true }],
      });
    }
  };

  const handleSubmitServiceRequest = async () => {
    if (serviceRequestForm.sub_services.length === 0 && serviceRequestForm.service_type !== 'grass') {
      alert('Please select at least one service');
      return;
    }

    try {
      setSubmittingRequest(true);
      await api.post('/service-requests', {
        customer_id: customerId,
        site_id: serviceRequestForm.site_id || undefined,
        service_type: serviceRequestForm.service_type,
        sub_services: serviceRequestForm.sub_services,
        urgency: serviceRequestForm.urgency,
        notes: serviceRequestForm.notes,
      });
      
      alert('Service request created successfully!');
      setShowServiceRequestModal(false);
      setServiceRequestForm({
        service_type: 'snow',
        sub_services: [],
        urgency: 'normal',
        site_id: '',
        notes: '',
      });
      loadCustomerData(); // Reload to show new request
    } catch (error) {
      console.error('Error creating service request:', error);
      alert('Failed to create service request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleSearchIndividuals = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await api.get('/customers');
      const individuals = response.data.filter((c: any) => 
        c.customer_type === 'individual' &&
        !c.company_id &&
        (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         c.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setSearchResults(individuals);
    } catch (error) {
      console.error('Error searching individuals:', error);
    }
  };

  const handleLinkContact = async (individualId: string) => {
    try {
      setLinkingContact(true);
      await api.post(`/customers/${customerId}/link-individual/${individualId}`);
      alert('Contact linked successfully!');
      setShowLinkContactModal(false);
      setSearchQuery('');
      setSearchResults([]);
      loadCustomerData();
    } catch (error) {
      console.error('Error linking contact:', error);
      alert('Failed to link contact');
    } finally {
      setLinkingContact(false);
    }
  };

  const handleUnlinkContact = async (individualId: string) => {
    if (!confirm('Are you sure you want to unlink this contact?')) return;

    try {
      await api.delete(`/customers/${customerId}/unlink-individual/${individualId}`);
      alert('Contact unlinked successfully!');
      loadCustomerData();
    } catch (error) {
      console.error('Error unlinking contact:', error);
      alert('Failed to unlink contact');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Not Found</h2>
          <button
            onClick={() => router.push('/customers')}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Customers
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const isCompany = customer.customer_type === 'company';

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/customers')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
                {isCompany ? (
                  <Briefcase className="w-6 h-6 text-blue-600" />
                ) : (
                  <Users className="w-6 h-6 text-gray-600" />
                )}
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  customer.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {customer.active ? 'Active' : 'Inactive'}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isCompany ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {isCompany ? 'Company' : 'Individual'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowServiceRequestModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Service Request</span>
            </button>
            <button
              onClick={() => router.push(`/customers/${customerId}/edit`)}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Edit className="w-5 h-5" />
              <span>Edit</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-gray-900">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-gray-900">{customer.phone}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="text-gray-900">{customer.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Link (for individuals) */}
            {!isCompany && customer.company_name && (
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-blue-900">Linked Company</h3>
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-blue-700 font-medium">{customer.company_name}</p>
                <button
                  onClick={() => router.push(`/customers/${customer.company_id}`)}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Company →
                </button>
              </div>
            )}

            {/* Company Accounting (for companies) */}
            {isCompany && customer.accounting && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Accounting Information</h2>
                <div className="space-y-3">
                  {customer.accounting.tax_id && (
                    <div>
                      <p className="text-sm text-gray-600">Tax ID</p>
                      <p className="text-gray-900">{customer.accounting.tax_id}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Payment Terms</p>
                    <p className="text-gray-900">{customer.accounting.payment_terms?.replace('_', ' ') || 'N/A'}</p>
                  </div>
                  {customer.accounting.credit_limit && (
                    <div>
                      <p className="text-sm text-gray-600">Credit Limit</p>
                      <p className="text-gray-900">${customer.accounting.credit_limit.toFixed(2)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">PO Required</p>
                    <p className="text-gray-900">{customer.accounting.po_required ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Contacts/Requests/Sites */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Contacts (for companies) */}
            {isCompany && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Contacts</h2>
                  <button
                    onClick={() => setShowLinkContactModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Link Contact</span>
                  </button>
                </div>
                {contacts.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No contacts linked yet</p>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((contact) => (
                      <div key={contact._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                          <p className="text-sm text-gray-600">{contact.email}</p>
                          <p className="text-sm text-gray-600">{contact.phone}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => router.push(`/customers/${contact._id}`)}
                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleUnlinkContact(contact._id)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                          >
                            Unlink
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Service Requests */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Requests</h2>
              {serviceRequests.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No service requests yet</p>
              ) : (
                <div className="space-y-3">
                  {serviceRequests.map((request) => (
                    <div key={request.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900 capitalize">
                              {request.service_type.replace('_', ' ')}
                            </h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              request.status === 'completed' ? 'bg-green-100 text-green-700' :
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              request.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {request.status}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              request.urgency === 'emergency' ? 'bg-red-100 text-red-700' :
                              request.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {request.urgency}
                            </span>
                          </div>
                          {request.sub_services && request.sub_services.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {request.sub_services.filter((s: any) => s.selected).map((s: any, idx: number) => (
                                <span key={idx} className="px-2 py-1 bg-white text-gray-700 text-xs rounded border border-gray-200">
                                  {s.name}
                                </span>
                              ))}
                            </div>
                          )}
                          {request.notes && (
                            <p className="text-sm text-gray-600 mt-2">{request.notes}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Created: {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sites (for companies) */}
            {isCompany && sites.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Sites</h2>
                <div className="space-y-3">
                  {sites.map((site) => (
                    <div key={site.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">{site.name}</h3>
                        <p className="text-sm text-gray-600">{site.address}</p>
                      </div>
                      <button
                        onClick={() => router.push(`/sites/${site.id}`)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Request Modal */}
      {showServiceRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Create Service Request</h2>
              <button
                onClick={() => setShowServiceRequestModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type *
                </label>
                <select
                  value={serviceRequestForm.service_type}
                  onChange={(e) => setServiceRequestForm({
                    ...serviceRequestForm,
                    service_type: e.target.value,
                    sub_services: [], // Reset sub-services when type changes
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="snow">Snow Services</option>
                  <option value="grass">Grass Services</option>
                  <option value="parking_lot">Parking Lot Services</option>
                </select>
              </div>

              {/* Sub-Services */}
              {serviceTypes[serviceRequestForm.service_type as keyof typeof serviceTypes].subServices.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Services *
                  </label>
                  <div className="space-y-2">
                    {serviceTypes[serviceRequestForm.service_type as keyof typeof serviceTypes].subServices.map((service) => (
                      <label key={service} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={serviceRequestForm.sub_services.some(s => s.name === service)}
                          onChange={() => handleSubServiceToggle(service)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-900">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Urgency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency Level *
                </label>
                <select
                  value={serviceRequestForm.urgency}
                  onChange={(e) => setServiceRequestForm({ ...serviceRequestForm, urgency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes / Additional Details
                </label>
                <textarea
                  value={serviceRequestForm.notes}
                  onChange={(e) => setServiceRequestForm({ ...serviceRequestForm, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter any additional details or special requirements..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowServiceRequestModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitServiceRequest}
                  disabled={submittingRequest}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                >
                  {submittingRequest ? 'Creating...' : 'Create Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Contact Modal */}
      {showLinkContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Link Contact to Company</h2>
              <button
                onClick={() => setShowLinkContactModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Individuals
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchIndividuals()}
                    placeholder="Search by name or email..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSearchIndividuals}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Search Results</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchResults.map((individual) => (
                      <div key={individual._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-semibold text-gray-900">{individual.name}</h4>
                          <p className="text-sm text-gray-600">{individual.email}</p>
                          <p className="text-sm text-gray-600">{individual.phone}</p>
                        </div>
                        <button
                          onClick={() => handleLinkContact(individual._id)}
                          disabled={linkingContact}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors text-sm"
                        >
                          <LinkIcon className="w-4 h-4 inline-block mr-1" />
                          Link
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchQuery && searchResults.length === 0 && (
                <p className="text-center text-gray-600 py-8">
                  No individuals found. Try a different search term.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
