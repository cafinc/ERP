'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import CustomerCommunicationsTab from '@/components/CustomerCommunicationsTab';
import api from '@/lib/api';
import { formatPhoneNumber } from '@/lib/utils/formatters';
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
  ClipboardList,
  MapPinned,
  FileSignature,
  DollarSign,
  FolderOpen,
  ExternalLink,
  MessageSquare,
  MessageCircle,
  PhoneCall,
  Send,
  Wallet,
} from 'lucide-react';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = (Array.isArray(params?.id) ? params.id[0] : params?.id) as string;
  
  const [customer, setCustomer] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [communications, setCommunications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
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
  
  // Archive Modal
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showArchiveSuccessModal, setShowArchiveSuccessModal] = useState(false);
  const [archiveSuccessMessage, setArchiveSuccessMessage] = useState('');

  // Attach Form Modal
  const [showAttachFormModal, setShowAttachFormModal] = useState(false);
  const [availableForms, setAvailableForms] = useState<any[]>([]);
  const [selectedFormId, setSelectedFormId] = useState('');
  const [attachingForm, setAttachingForm] = useState(false);

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
      } else {
        // For individuals, load sites linked to them
        const sitesRes = await api.get('/sites');
        const customerSites = sitesRes.data.filter((site: any) => site.customer_id === customerId);
        setSites(customerSites);
      }

      // Load forms templates
      try {
        const formsRes = await api.get('/form-templates');
        setAvailableForms(formsRes.data || []);
      } catch (error) {
        console.error('Error loading forms:', error);
        setAvailableForms([]);
      }

      // Load contracts
      try {
        const contractsRes = await api.get(`/contracts?customer_id=${customerId}`);
        const contractsData = contractsRes.data;
        setContracts(Array.isArray(contractsData) ? contractsData : (contractsData?.contracts || []));
      } catch (error) {
        console.error('Error loading contracts:', error);
        setContracts([]);
      }

      // Load invoices
      try {
        const invoicesRes = await api.get(`/invoices?customer_id=${customerId}`);
        const invoicesData = invoicesRes.data;
        setInvoices(Array.isArray(invoicesData) ? invoicesData : (invoicesData?.invoices || []));
      } catch (error) {
        console.error('Error loading invoices:', error);
        setInvoices([]);
      }

      // Load estimates
      try {
        const estimatesRes = await api.get(`/estimates?customer_id=${customerId}`);
        const estimatesData = estimatesRes.data;
        setEstimates(Array.isArray(estimatesData) ? estimatesData : (estimatesData?.estimates || []));
      } catch (error) {
        console.error('Error loading estimates:', error);
        setEstimates([]);
      }

      // Load projects
      try {
        const projectsRes = await api.get(`/projects?customer_id=${customerId}`);
        const projectsData = projectsRes.data;
        setProjects(Array.isArray(projectsData) ? projectsData : (projectsData?.projects || []));
      } catch (error) {
        console.error('Error loading projects:', error);
        setProjects([]);
      }

      // Load tasks (if tasks API is available)
      try {
        const tasksRes = await api.get(`/tasks?customer_id=${customerId}`);
        const tasksData = tasksRes.data;
        setTasks(Array.isArray(tasksData) ? tasksData : (tasksData?.tasks || []));
      } catch (error) {
        console.error('Error loading tasks:', error);
        setTasks([]);
      }

      // Load communications (emails, SMS, and Messages)
      try {
        const allCommunications: any[] = [];
        
        // Load Gmail emails linked to this customer
        const customerEmail = customerRes.data.email;
        if (customerEmail) {
          try {
            const emailsRes = await api.get(`/gmail/emails?query=${encodeURIComponent(customerEmail)}`);
            const emailsData = emailsRes.data;
            const emailsList = Array.isArray(emailsData) ? emailsData : (emailsData?.emails || []);
            
            // Format email communications
            const formattedEmails = emailsList.map((email: any) => ({
              id: email.id || email.message_id,
              type: 'email',
              subject: email.subject,
              snippet: email.snippet || email.body?.substring(0, 100),
              from: email.from,
              to: email.to,
              timestamp: email.timestamp || email.date,
              read: email.read || false,
            }));
            
            allCommunications.push(...formattedEmails);
          } catch (error) {
            console.error('Error loading emails:', error);
          }
        }
        
        // Load Messages/Conversations with this customer
        try {
          const conversationsRes = await api.get('/messages/conversations');
          const conversations = conversationsRes.data.conversations || [];
          
          // Filter conversations that include this customer
          const customerConversations = conversations.filter((conv: any) => 
            conv.participant_ids?.includes(customerId) || 
            conv.participants?.some((p: any) => p.user_id === customerId)
          );
          
          // For each conversation, get recent messages
          for (const conv of customerConversations) {
            try {
              const messagesRes = await api.get(`/messages/conversations/${conv._id}/messages?limit=5`);
              const messages = messagesRes.data.messages || [];
              
              messages.forEach((msg: any) => {
                allCommunications.push({
                  id: msg._id,
                  type: 'message',
                  subject: conv.title || 'Direct Message',
                  snippet: msg.content,
                  from: msg.sender_name,
                  to: 'Conversation',
                  timestamp: msg.created_at,
                  read: true, // Simplified
                  conversation_id: conv._id,
                  attachments: msg.attachments || [],
                });
              });
            } catch (error) {
              console.error('Error loading conversation messages:', error);
            }
          }
        } catch (error) {
          console.error('Error loading messages:', error);
        }
        
        // Sort all communications by timestamp (newest first)
        allCommunications.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setCommunications(allCommunications);
      } catch (error) {
        console.error('Error loading communications:', error);
        setCommunications([]);
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
      loadCustomerData();
    } catch (error) {
      console.error('Error creating service request:', error);
      alert('Failed to create service request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleArchiveCustomer = async () => {
    try {
      setArchiving(true);
      await api.put(`/customers/${customerId}`, {
        ...customer,
        active: false,
      });
      
      setShowArchiveModal(false);
      // Refresh customer data
      const response = await api.get(`/customers/${customerId}`);
      setCustomer(response.data);
      
      // Show success message
      alert(customer.active ? 'Customer archived successfully' : 'Customer unarchived successfully');
    } catch (error) {
      console.error('Error archiving customer:', error);
      alert('Error updating customer status');
    } finally {
      setArchiving(false);
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

  const handleAttachForm = async () => {
    if (!selectedFormId) {
      alert('Please select a form');
      return;
    }

    try {
      setAttachingForm(true);
      // Redirect to form fill page with customer context
      router.push(`/forms/${selectedFormId}/fill?customer_id=${customerId}`);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setAttachingForm(false);
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f72af]"></div>
        </div>
      );
  }

  if (!customer) {
    return (
        <div className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Not Found</h2>
          <button
            onClick={() => router.push('/customers')}
            className="mt-4 px-6 py-3 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282]"
          >
            Back to Customers
          </button>
        </div>
      );
  }

  const isCompany = customer.customer_type === 'company';

  // Organized tab groups for cleaner navigation
  const tabSections = [
    {
      label: 'General',
      tabs: [
        { id: 'overview', name: 'Overview', icon: Users },
        { id: 'estimates', name: 'Estimates', icon: FileText, count: estimates.length },
        { id: 'sites', name: 'Sites', icon: MapPinned, count: sites.length },
        { id: 'agreements', name: 'Agreements', icon: FileSignature, count: contracts.length },
        { id: 'projects', name: 'Projects', icon: FolderOpen, count: projects.length },
        { id: 'invoices', name: 'Invoices', icon: CreditCard, count: invoices.length },
        { id: 'tasks', name: 'Tasks', icon: CheckCircle, count: tasks.length },
        { id: 'communications', name: 'Comms', icon: Mail, count: communications.length },
        ...(isCompany ? [
          { id: 'accounting', name: 'Accounting', icon: DollarSign },
          { id: 'contacts', name: 'Contacts', icon: Users, count: contacts.length }
        ] : []),
      ]
    },
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Users },
    { id: 'estimates', name: 'Estimates', icon: FileText, count: estimates.length },
    { id: 'sites', name: 'Sites', icon: MapPinned, count: sites.length },
    { id: 'agreements', name: 'Agreements', icon: FileSignature, count: contracts.length },
    { id: 'projects', name: 'Projects', icon: FolderOpen, count: projects.length },
    { id: 'invoices', name: 'Invoices', icon: CreditCard, count: invoices.length },
    { id: 'tasks', name: 'Tasks', icon: CheckCircle, count: tasks.length },
    { id: 'communications', name: 'Comms', icon: Mail, count: communications.length },
    ...(isCompany ? [
      { id: 'accounting', name: 'Accounting', icon: DollarSign },
      { id: 'contacts', name: 'Contacts', icon: Users, count: contacts.length },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={customer.name}
        subtitle={`${isCompany ? 'Company' : 'Individual'} • ${customer.active ? 'Active' : 'Inactive'} • ${customer.email} • ${formatPhoneNumber(customer.phone)}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Customers", href: "/customers" },
          { label: customer.name },
        ]}
        tabs={tabs.map(tab => ({
          label: tab.name + (tab.count !== undefined ? ` (${tab.count})` : ''),
          value: tab.id,
        }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={[
          {
            label: 'Portal View',
            icon: <ExternalLink className="w-4 h-4 mr-2" />,
            onClick: () => window.open('/customer-portal/dashboard', '_blank'),
            variant: 'secondary',
          },
          {
            label: 'Request',
            icon: <Plus className="w-4 h-4 mr-2" />,
            onClick: () => setShowServiceRequestModal(true),
            variant: 'secondary',
          },
          {
            label: 'Form',
            icon: <FileText className="w-4 h-4 mr-2" />,
            onClick: () => setShowAttachFormModal(true),
            variant: 'secondary',
          },
          {
            label: 'Edit',
            icon: <Edit className="w-4 h-4 mr-2" />,
            onClick: () => router.push(`/customers/${customerId}/edit`),
            variant: 'secondary',
          },
          {
            label: customer.active ? 'Archive' : 'Unarchive',
            icon: <X className="w-4 h-4 mr-2" />,
            onClick: () => setShowArchiveModal(true),
            variant: 'secondary',
          },
        ]}
      />

      {/* Main Content */}
      <div className="mx-auto px-6 py-6">
        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-6 mb-6 hover:shadow-md transition-shadow">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column - Contact Info */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {isCompany ? 'Company Information' : 'Contact Information'}
                  </h2>
                  <div className="space-y-3">
                    {isCompany && customer.operating_as && (
                      <div className="flex items-start space-x-3">
                        <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Operating As</p>
                          <p className="text-gray-900">{customer.operating_as}</p>
                        </div>
                      </div>
                    )}
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
                        <p className="text-sm text-gray-600">{isCompany ? 'Office Number' : 'Phone'}</p>
                        <p className="text-gray-900">{formatPhoneNumber(customer.phone)}</p>
                      </div>
                    </div>
                    {customer.address && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">{isCompany ? 'Company Address' : 'Address'}</p>
                          <p className="text-gray-900">{customer.address}</p>
                        </div>
                      </div>
                    )}
                    {!isCompany && customer.company_name && (
                      <div className="flex items-start space-x-3 pt-2 border-t border-gray-200">
                        <Briefcase className="w-5 h-5 text-[#3f72af] mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Linked to Company</p>
                          <button
                            onClick={() => router.push(`/customers/${customer.company_id}`)}
                            className="text-[#3f72af] hover:text-blue-800 font-medium hover:underline"
                          >
                            {customer.company_name}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Accounting Information - Only for Companies */}
                {isCompany && customer.accounting && (
                  <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <CreditCard className="w-5 h-5 text-[#3f72af]" />
                      <span>Accounting Information</span>
                    </h2>
                    <div className="space-y-3">
                      {customer.accounting.business_number && (
                        <div className="flex items-start space-x-3">
                          <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-600">Business Number</p>
                            <p className="text-gray-900">{customer.accounting.business_number}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start space-x-3">
                        <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Payment Terms</p>
                          <p className="text-gray-900 capitalize">{customer.accounting.payment_terms?.replace('_', ' ') || 'Due on Receipt'}</p>
                        </div>
                      </div>
                      {customer.accounting.credit_limit && (
                        <div className="flex items-start space-x-3">
                          <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-600">Credit Limit</p>
                            <p className="text-gray-900">${parseFloat(customer.accounting.credit_limit).toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start space-x-3">
                        <Wallet className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Preferred Payment Method</p>
                          <p className="text-gray-900 capitalize">{customer.accounting.preferred_payment_method?.replace('_', ' ') || 'E-Transfer'}</p>
                        </div>
                      </div>
                      {customer.accounting.po_required && (
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-600">Purchase Order Required</p>
                            <p className="text-gray-900">Yes</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!isCompany && customer.company_name && (
                  <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-blue-900">Linked Company</h3>
                      <Briefcase className="w-5 h-5 text-[#3f72af]" />
                    </div>
                    <p className="text-blue-700 font-medium">{customer.company_name}</p>
                    <button
                      onClick={() => router.push(`/customers/${customer.company_id}`)}
                      className="mt-3 text-sm text-[#3f72af] hover:text-blue-800 font-medium"
                    >
                      View Company →
                    </button>
                  </div>
                )}

                {customer.custom_fields && customer.custom_fields.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Custom Information</h2>
                    <div className="space-y-3">
                      {customer.custom_fields.map((field: any, idx: number) => (
                        <div key={idx}>
                          <p className="text-sm text-gray-600">{field.field_name}</p>
                          <p className="text-gray-900">{field.field_value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Quick Stats */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <MapPinned className="w-6 h-6 text-[#3f72af]" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Sites</p>
                        <p className="text-2xl font-bold text-gray-900">{sites.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <ClipboardList className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Requests</p>
                        <p className="text-2xl font-bold text-gray-900">{serviceRequests.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <FileSignature className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Contracts</p>
                        <p className="text-2xl font-bold text-gray-900">{contracts.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Service Requests</h2>
                  {serviceRequests.slice(0, 3).length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No recent service requests</p>
                  ) : (
                    <div className="space-y-3">
                      {serviceRequests.slice(0, 3).map((request) => (
                        <div key={request.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900 capitalize">
                                {request.service_type.replace('_', ' ')}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              request.status === 'completed' ? 'bg-green-100 text-green-700' :
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
          )}

          {/* Sites Tab */}
          {activeTab === 'sites' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Sites</h2>
                  <button
                    onClick={() => router.push(`/sites/create?customer_id=${customerId}`)}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#2c5282] text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Site</span>
                  </button>
                </div>
                {sites.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No sites yet</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sites.map((site) => (
                      <div key={site.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => router.push(`/sites/${site.id}`)}>
                        <h3 className="font-semibold text-gray-900">{site.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{site.address}</p>
                        <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {site.site_type || 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* Estimates Tab */}
          {activeTab === 'estimates' && (
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Estimates</h2>
                <button
                  onClick={() => router.push(`/estimates/create?customer_id=${customerId}`)}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Estimate</span>
                </button>
              </div>
              {estimates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Estimates Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create an estimate to start a project with {customer?.name}
                  </p>
                  <button
                    onClick={() => router.push(`/estimates/create?customer_id=${customerId}`)}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Estimate</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {estimates.map((estimate: any) => (
                    <div
                      key={estimate._id || estimate.id}
                      onClick={() => router.push(`/estimates/${estimate._id || estimate.id}`)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {estimate.estimate_number || `EST-${estimate._id?.slice(-6)}`}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              estimate.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              estimate.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                              estimate.status === 'declined' ? 'bg-red-100 text-red-700' :
                              estimate.status === 'converted' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {estimate.status}
                            </span>
                          </div>
                          {estimate.description && (
                            <p className="text-sm text-gray-600 mb-2">{estimate.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Created: {new Date(estimate.created_at).toLocaleDateString()}</span>
                            {estimate.valid_until && (
                              <span>Valid Until: {new Date(estimate.valid_until).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            ${estimate.total?.toLocaleString() || estimate.total_amount?.toLocaleString() || '0.00'}
                          </p>
                          {estimate.tax && (
                            <p className="text-xs text-gray-500 mt-1">+${estimate.tax.toLocaleString()} tax</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
                <button
                  onClick={() => router.push(`/projects/create?customer_id=${customerId}`)}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Project</span>
                </button>
              </div>
              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start a new project for {customer?.name}
                  </p>
                  <button
                    onClick={() => router.push(`/projects/create?customer_id=${customerId}`)}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Project</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project: any) => (
                    <div
                      key={project._id || project.id}
                      onClick={() => router.push(`/projects/${project._id || project.id}`)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {project.project_name || project.name || `Project ${project._id?.slice(-6)}`}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              project.status === 'completed' ? 'bg-green-100 text-green-700' :
                              project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              project.status === 'on_hold' ? 'bg-yellow-100 text-yellow-700' :
                              project.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {project.status?.replace('_', ' ')}
                            </span>
                          </div>
                          {project.description && (
                            <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                            {project.start_date && (
                              <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                            )}
                            {project.completion_percentage !== undefined && (
                              <span className="flex items-center space-x-1">
                                <span>Progress:</span>
                                <span className="font-medium text-[#3f72af]">{project.completion_percentage}%</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            ${project.total_amount?.toLocaleString() || project.budget?.toLocaleString() || '0.00'}
                          </p>
                          {project.estimate_number && (
                            <p className="text-xs text-gray-500 mt-1">from {project.estimate_number}</p>
                          )}
                        </div>
                      </div>
                      {project.completion_percentage !== undefined && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[#3f72af] h-2 rounded-full transition-all"
                              style={{ width: `${project.completion_percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Agreements Tab */}
          {activeTab === 'agreements' && (
            <div className="space-y-6">
              {/* Header with Actions */}
              <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Service Agreements</h2>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => router.push(`/agreements/templates`)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Manage Templates</span>
                    </button>
                    <button
                      onClick={() => router.push(`/agreements/create?customer_id=${customerId}`)}
                      className="flex items-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Agreement</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Pending Signature Estimates Section */}
              {estimates.filter((e: any) => e.status === 'sent' && !e.requires_agreement).length > 0 && (
                <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Pending Signature Estimates</h3>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                      {estimates.filter((e: any) => e.status === 'sent' && !e.requires_agreement).length} Awaiting Signature
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    These estimates have been sent and are awaiting customer signature. No separate agreement is required.
                  </p>
                  <div className="space-y-3">
                    {estimates.filter((e: any) => e.status === 'sent' && !e.requires_agreement).map((estimate: any) => (
                      <div
                        key={estimate._id || estimate.id}
                        onClick={() => router.push(`/estimates/${estimate._id || estimate.id}`)}
                        className="p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg hover:border-yellow-300 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Clock className="w-5 h-5 text-yellow-600" />
                              <h4 className="font-semibold text-gray-900">
                                {estimate.estimate_number || `EST-${estimate._id?.slice(-6)}`}
                              </h4>
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">
                                Sent - Awaiting Signature
                              </span>
                            </div>
                            {estimate.description && (
                              <p className="text-sm text-gray-700 mb-2">{estimate.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-xs text-gray-600">
                              <span>Sent: {new Date(estimate.updated_at || estimate.created_at).toLocaleDateString()}</span>
                              {estimate.valid_until && (
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Valid Until: {new Date(estimate.valid_until).toLocaleDateString()}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                              ${estimate.total?.toLocaleString() || estimate.total_amount?.toLocaleString() || '0.00'}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                alert('Send reminder functionality coming soon!');
                              }}
                              className="mt-2 text-xs text-[#3f72af] hover:text-[#3f72af]/80 font-medium"
                            >
                              Send Reminder →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Agreements Section */}
              <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Agreements</h3>
                {contracts.length === 0 && estimates.filter((e: any) => e.status === 'sent' && !e.requires_agreement).length === 0 ? (
                  <div className="text-center py-12">
                    <FileSignature className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Agreements Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Create a service agreement with {customer?.name}
                    </p>
                    <button
                      onClick={() => router.push(`/agreements/create?customer_id=${customerId}`)}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Create Agreement</span>
                    </button>
                  </div>
                ) : contracts.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">No active agreements yet</p>
                ) : (
                  <div className="space-y-3">
                    {contracts.map((agreement: any) => (
                      <div
                        key={agreement._id}
                        onClick={() => router.push(`/agreements/${agreement._id}`)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <FileSignature className="w-5 h-5 text-[#3f72af]" />
                              <h4 className="font-semibold text-gray-900">
                                {agreement.agreement_number || agreement.contract_number || `AGR-${agreement._id?.slice(-6)}`}
                              </h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                agreement.status === 'active' ? 'bg-green-100 text-green-700' :
                                agreement.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                                agreement.status === 'expired' ? 'bg-red-100 text-red-700' :
                                agreement.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {agreement.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {agreement.agreement_type || agreement.contract_type || 'Service Agreement'}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Start: {new Date(agreement.start_date).toLocaleDateString()}</span>
                              {agreement.end_date && (
                                <span>End: {new Date(agreement.end_date).toLocaleDateString()}</span>
                              )}
                              {agreement.auto_renew && (
                                <span className="flex items-center space-x-1 text-[#3f72af]">
                                  <span>🔄</span>
                                  <span>Auto-Renew</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                              ${(agreement.agreement_value || agreement.contract_value)?.toLocaleString() || '0'}
                            </p>
                            {agreement.payment_terms && (
                              <p className="text-xs text-gray-500 mt-1">{agreement.payment_terms}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
                <button
                  className="flex items-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
                  onClick={() => alert('Task creation coming soon!')}
                >
                  <Plus className="w-4 h-4" />
                  <span>New Task</span>
                </button>
              </div>
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create tasks and assign them to team members for {customer?.name}
                  </p>
                  <button 
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
                    onClick={() => alert('Task creation coming soon!')}
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Task</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task: any) => (
                    <div
                      key={task._id || task.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{task.title || task.task_name}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              task.status === 'completed' ? 'bg-green-100 text-green-700' :
                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              task.status === 'on_hold' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {task.status?.replace('_', ' ')}
                            </span>
                            {task.priority && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                task.priority === 'high' ? 'bg-red-100 text-red-700' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {task.priority}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            {task.assigned_to && (
                              <span>Assigned to: {task.assigned_to_name || task.assigned_to}</span>
                            )}
                            {task.due_date && (
                              <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contacts Tab (Company only) */}
          {activeTab === 'contacts' && isCompany && (
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Contacts</h2>
                  <button
                    onClick={() => setShowLinkContactModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#2c5282] text-white rounded-lg font-medium transition-colors text-sm"
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
                            className="px-3 py-1 text-sm text-[#3f72af] hover:bg-blue-50 rounded"
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
            </div>
          )}

          {/* Accounting Tab (Company only) */}
          {activeTab === 'accounting' && isCompany && (
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Accounting Information</h2>
                {customer.accounting ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.accounting.tax_id && (
                      <div>
                        <p className="text-sm text-gray-600">Tax ID</p>
                        <p className="text-gray-900 font-medium">{customer.accounting.tax_id}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Payment Terms</p>
                      <p className="text-gray-900 font-medium">{customer.accounting.payment_terms?.replace('_', ' ') || 'N/A'}</p>
                    </div>
                    {customer.accounting.credit_limit && (
                      <div>
                        <p className="text-sm text-gray-600">Credit Limit</p>
                        <p className="text-gray-900 font-medium">${customer.accounting.credit_limit.toFixed(2)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">PO Required</p>
                      <p className="text-gray-900 font-medium">{customer.accounting.po_required ? 'Yes' : 'No'}</p>
                    </div>
                    {customer.accounting.billing_email && (
                      <div>
                        <p className="text-sm text-gray-600">Billing Email</p>
                        <p className="text-gray-900 font-medium">{customer.accounting.billing_email}</p>
                      </div>
                    )}
                    {customer.accounting.billing_phone && (
                      <div>
                        <p className="text-sm text-gray-600">Billing Phone</p>
                        <p className="text-gray-900 font-medium">{customer.accounting.billing_phone}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No accounting information available</p>
                )}
              </div>
            </div>
          )}

          {/* Contracts Tab */}
          {activeTab === 'contracts' && (
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Contracts</h2>
                {contracts.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No contracts yet</p>
                ) : (
                  <div className="space-y-3">
                    {contracts.map((contract: any) => (
                      <div key={contract.id} className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-gray-900">{contract.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">Status: {contract.status}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoices</h2>
                {invoices.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No invoices yet</p>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((invoice: any) => (
                      <div key={invoice.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-900">Invoice #{invoice.invoice_number}</h3>
                          <p className="text-sm text-gray-600">Amount: ${invoice.total}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                          invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Communication Center - Overview (Interactive Tabs) */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-6 mt-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Communication Center</h2>
              <button
                onClick={() => setActiveTab('communications')}
                className="text-sm text-[#3f72af] hover:text-[#2d5480] font-medium flex items-center space-x-1"
              >
                <span>View All</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {communications.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No communications recorded yet</p>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {(() => {
                  const typeConfig = {
                    'inapp': { icon: MessageCircle, color: 'bg-orange-500', textColor: 'text-orange-600', bgLight: 'bg-orange-50', label: 'In-App' },
                    'sms': { icon: MessageSquare, color: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-50', label: 'SMS' },
                    'email': { icon: Mail, color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50', label: 'Email' },
                    'phone': { icon: PhoneCall, color: 'bg-purple-500', textColor: 'text-purple-600', bgLight: 'bg-purple-50', label: 'Phone' },
                  };

                  // Group communications by type
                  const groupedComms = communications.reduce((acc: any, comm: any) => {
                    const type = comm.type || 'inapp';
                    if (!acc[type]) acc[type] = [];
                    acc[type].push(comm);
                    return acc;
                  }, {});

                  return Object.keys(typeConfig).map((type) => {
                    const config = typeConfig[type as keyof typeof typeConfig];
                    const Icon = config.icon;
                    const count = groupedComms[type]?.length || 0;

                    return (
                      <div
                        key={type}
                        className={`${config.bgLight} rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all cursor-pointer`}
                        onClick={() => setActiveTab('communications')}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${config.color} text-white`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="font-semibold text-gray-900 text-2xl">{count}</span>
                        </div>
                        <p className={`text-sm font-medium ${config.textColor}`}>{config.label}</p>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}

        {/* Communication Center - Full View with Tabs */}
        {activeTab === 'communications' && customer && (
          <CustomerCommunicationsTab
            customerId={customerId}
            customerName={customer.name}
            customerEmail={customer.email}
            customerPhone={customer.phone}
            communications={communications}
            onRefresh={async () => {
                // Reload communications
                try {
                  const allCommunications: any[] = [];
                  
                  // Fetch emails
                  try {
                    const emailResponse = await api.get(`/api/gmail/emails?query=${customer.email}`);
                    const emails = emailResponse.data.emails || [];
                    
                    // Format email communications
                    const formattedEmails = emails.map((email: any) => ({
                      type: 'email',
                      subject: email.subject,
                      content: email.snippet || email.body,
                      from: email.from,
                      to: email.to,
                      timestamp: email.timestamp,
                      direction: email.from === customer.email ? 'inbound' : 'outbound',
                    }));
                    
                    allCommunications.push(...formattedEmails);
                  } catch (emailError) {
                    console.error('Error fetching emails:', emailError);
                  }
                  
                  // Fetch messages (InApp)
                  try {
                    const messagesResponse = await api.get('/api/messages/conversations');
                    const conversations = messagesResponse.data || [];
                    
                    conversations.forEach((conv: any) => {
                      if (conv.customer_id === customerId) {
                        conv.messages?.forEach((msg: any) => {
                          allCommunications.push({
                            type: 'inapp',
                            title: conv.title || 'Message',
                            content: msg.text || msg.content,
                            from: msg.sender,
                            timestamp: msg.timestamp || msg.created_at,
                            direction: msg.sender === 'admin' ? 'outbound' : 'inbound',
                          });
                        });
                      }
                    });
                  } catch (msgError) {
                    console.error('Error fetching messages:', msgError);
                  }
                  
                  // Sort all communications by timestamp (newest first)
                  allCommunications.sort((a, b) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  );
                  
                  setCommunications(allCommunications);
                } catch (error) {
                  console.error('Error reloading communications:', error);
                }
              }}
            />
        )}
      </div>

      {/* Modals */}
      {/* Service Request Modal */}
      {showServiceRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Create Service Request</h2>
              <button
                onClick={() => setShowServiceRequestModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type *
                </label>
                <select
                  value={serviceRequestForm.service_type}
                  onChange={(e) => setServiceRequestForm({
                    ...serviceRequestForm,
                    service_type: e.target.value,
                    sub_services: [],
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="snow">Snow Services</option>
                  <option value="grass">Grass Services</option>
                  <option value="parking_lot">Parking Lot Services</option>
                </select>
              </div>

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
                          className="w-5 h-5 text-[#3f72af] rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-900">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

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
            <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Link Contact to Company</h2>
              <button
                onClick={() => setShowLinkContactModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-4 space-y-6">
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
                    className="px-6 py-2 bg-[#3f72af] hover:bg-[#2c5282] text-white rounded-lg font-medium transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>

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

      {/* Attach Form Modal */}
      {showAttachFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Fill Form for Customer</h2>
              <button
                onClick={() => setShowAttachFormModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              <p className="text-sm text-gray-600">
                Select a form to fill out for {customer.name}. The completed form will be saved to their profile.
              </p>
              
              {availableForms.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No forms available</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {availableForms.map((form) => (
                    <button
                      key={form.id}
                      onClick={() => {
                        setSelectedFormId(form.id);
                        handleAttachForm();
                      }}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left border-2 border-transparent hover:border-purple-300"
                    >
                      <div className="flex items-start space-x-3">
                        <FileText className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{form.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{form.description || 'No description'}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
            <div className={`bg-gradient-to-r ${customer.active ? 'from-orange-500 to-red-500' : 'from-green-500 to-emerald-500'} p-6 text-white`}>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">
                    {customer.active ? 'Archive Customer Confirmation' : 'Unarchive Customer Confirmation'}
                  </h2>
                  <p className="text-white/90 mt-1">
                    {customer.active 
                      ? 'Please review the information before archiving' 
                      : 'Please review the information before unarchiving'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex gap-2 mb-3">
                    <Users className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-2">Customer Information:</p>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p><span className="font-medium">Name:</span> {customer.name}</p>
                        <p><span className="font-medium">Email:</span> {customer.email}</p>
                        <p><span className="font-medium">Phone:</span> {formatPhoneNumber(customer.phone)}</p>
                        <p><span className="font-medium">Type:</span> {isCompany ? 'Company' : 'Individual'}</p>
                        <p><span className="font-medium">Current Status:</span> 
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                            customer.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {customer.active ? 'Active' : 'Archived'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {customer.active ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-orange-800">
                        <p className="font-medium mb-2">What happens when you archive this customer?</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Customer will be marked as inactive</li>
                          <li>They will be hidden from the main customer list</li>
                          <li>All historical data remains intact (projects, invoices, estimates, etc.)</li>
                          <li>You can unarchive them at any time to restore access</li>
                          <li>Archived customers still appear in reports and analytics</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-green-800">
                        <p className="font-medium mb-2">What happens when you unarchive this customer?</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Customer will be marked as active</li>
                          <li>They will appear in the main customer list</li>
                          <li>All features and functionality will be restored</li>
                          <li>You can create new projects, estimates, and invoices</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t p-6 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowArchiveModal(false)}
                disabled={archiving}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveCustomer}
                disabled={archiving}
                className={`px-6 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 ${
                  customer.active 
                    ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500' 
                    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                }`}
              >
                {archiving ? 'Processing...' : customer.active ? 'Yes, Archive Customer' : 'Yes, Unarchive Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    );
}
