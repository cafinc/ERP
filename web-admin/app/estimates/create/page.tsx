'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CompactHeader from '@/components/CompactHeader';
import TemplateSelector from '@/components/TemplateSelector';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import api from '@/lib/api';
import {
  Plus,
  Trash2,
  Save,
  Send,
  User,
  Search,
  MapPin,
  Users,
  FileText,
  Upload,
  Image,
  File,
  X,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Sparkles,
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  customer_type?: string;
  contacts?: Contact[];
}

interface Contact {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface Site {
  _id: string;
  name: string;
  address: string;
  customer_id: string;
}

interface ServiceOption {
  name: string;
  description: string;
  price: number;
}

interface LineItem {
  id: string;
  description: string;
  service_type: string;
  quantity: number;
  unit_price: number;
  service_options?: ServiceOption[];
  selected_option?: string;
  total: number;
}

interface Section {
  id: string;
  name: string;
  items: LineItem[];
  show_subtotal: boolean;
}

export default function CreateEstimatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customer_id');

  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [attachedForms, setAttachedForms] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Form data
  const [sections, setSections] = useState<Section[]>([
    {
      id: '1',
      name: 'Services',
      items: [],
      show_subtotal: true
    }
  ]);

  const [formData, setFormData] = useState({
    estimate_number: '',
    valid_days: 30,
    payment_terms: 'Net 30',
    notes: '',
    tax_rate: 13,
    requires_signature: false,
    requires_agreement: false,
    selected_agreement_template: '',
  });

  useEffect(() => {
    loadCustomers();
    loadForms();
    loadAgreements();
    if (preselectedCustomerId) {
      loadCustomerById(preselectedCustomerId);
    }
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      loadSitesForCustomer(selectedCustomer._id);
    }
  }, [selectedCustomer]);

  const loadCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadCustomerById = async (customerId: string) => {
    try {
      const response = await api.get(`/customers/${customerId}`);
      setSelectedCustomer(response.data);
    } catch (error) {
      console.error('Error loading customer:', error);
    }
  };

  const loadSitesForCustomer = async (customerId: string) => {
    try {
      const response = await api.get(`/sites?customer_id=${customerId}`);
      setSites(response.data || []);
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  };

  const loadForms = async () => {
    try {
      const response = await api.get('/form-templates');
      setForms(response.data || []);
    } catch (error) {
      console.error('Error loading forms:', error);
    }
  };

  const loadAgreements = async () => {
    try {
      const response = await api.get('/contracts?type=template');
      const agreementData = Array.isArray(response.data) ? response.data : (response.data?.contracts || []);
      setAgreements(agreementData);
    } catch (error) {
      console.error('Error loading agreements:', error);
      setAgreements([]);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  const addSection = () => {
    const newSection: Section = {
      id: Date.now().toString(),
      name: `Section ${sections.length + 1}`,
      items: [],
      show_subtotal: true
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
  };

  const handleTemplateSelect = async (template: any) => {
    try {
      // Fetch the full template with content
      const response = await fetch(`${BACKEND_URL}/api/templates/${template.type}/${template._id}`);
      const data = await response.json();
      
      if (data.success && data.template.content) {
        const content = data.template.content;
        
        // Auto-fill form fields from template
        if (content.line_items && Array.isArray(content.line_items)) {
          const newItems: LineItem[] = content.line_items.map((item: any, index: number) => ({
            id: `template-${Date.now()}-${index}`,
            description: item.description || '',
            service_type: '',
            quantity: item.quantity || 1,
            unit_price: parseFloat(item.unit_price) || 0,
            total: (item.quantity || 1) * (parseFloat(item.unit_price) || 0)
          }));
          
          setSections([{
            id: Date.now().toString(),
            name: content.service_description || 'Services',
            items: newItems,
            show_subtotal: true
          }]);
        }
        
        // Set notes and terms
        if (content.notes || content.terms) {
          setFormData(prev => ({
            ...prev,
            notes: content.notes || prev.notes,
            payment_terms: content.terms || prev.payment_terms
          }));
        }
        
        setShowTemplateSelector(false);
        alert('Template applied successfully! Review and adjust the details as needed.');
      }
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Failed to apply template');
    }
  };

  const updateSection = (sectionId: string, field: string, value: any) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, [field]: value } : s
    ));
  };

  const addLineItem = (sectionId: string) => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      service_type: '',
      quantity: 1,
      unit_price: 0,
      service_options: [],
      total: 0
    };
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, items: [...s.items, newItem] } : s
    ));
  };

  const removeLineItem = (sectionId: string, itemId: string) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s
    ));
  };

  const updateLineItem = (sectionId: string, itemId: string, field: string, value: any) => {
    setSections(sections.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        items: s.items.map(item => {
          if (item.id !== itemId) return item;
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unit_price' || field === 'selected_option') {
            let price = updated.unit_price;
            if (updated.selected_option && updated.service_options) {
              const option = updated.service_options.find(o => o.name === updated.selected_option);
              if (option) price = option.price;
            }
            updated.total = updated.quantity * price;
          }
          return updated;
        })
      };
    }));
  };

  const addServiceOption = (sectionId: string, itemId: string) => {
    setSections(sections.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        items: s.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            service_options: [
              ...(item.service_options || []),
              { name: '', description: '', price: 0 }
            ]
          };
        })
      };
    }));
  };

  const removeServiceOption = (sectionId: string, itemId: string, optionIndex: number) => {
    setSections(sections.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        items: s.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            service_options: item.service_options?.filter((_, i) => i !== optionIndex)
          };
        })
      };
    }));
  };

  const updateServiceOption = (sectionId: string, itemId: string, optionIndex: number, field: string, value: any) => {
    setSections(sections.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        items: s.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            service_options: item.service_options?.map((opt, i) => 
              i === optionIndex ? { ...opt, [field]: value } : opt
            )
          };
        })
      };
    }));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    sections.forEach(section => {
      section.items.forEach(item => {
        subtotal += item.total;
      });
    });
    const tax = subtotal * (formData.tax_rate / 100);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = async (status: 'draft' | 'sent' = 'draft') => {
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    // Validation for sending
    if (status === 'sent') {
      if (sections.every(s => s.items.length === 0)) {
        alert('Please add at least one line item before sending');
        return;
      }
      if (!selectedCustomer.email) {
        alert('Customer email is required to send estimate');
        return;
      }
      if (!confirm(`Send estimate to ${selectedCustomer.name} (${selectedCustomer.email})?`)) {
        return;
      }
    }

    try {
      setLoading(true);
      
      const estimateData = {
        customer_id: selectedCustomer._id,
        site_id: selectedSite?._id,
        contacts: selectedContacts,
        sections: sections,
        ...formData,
        attached_forms: attachedForms,
        attached_files: attachedFiles,
        ...calculateTotals(),
        status: status,
      };

      const response = await api.post('/estimates', estimateData);
      
      if (status === 'sent') {
        // Send the estimate via email
        try {
          await api.post(`/estimates/${response.data._id}/send`);
          alert('Estimate created and sent successfully!');
        } catch (sendError) {
          console.error('Error sending estimate:', sendError);
          alert('Estimate created but failed to send. You can send it from the detail page.');
        }
      } else {
        alert('Estimate saved as draft successfully!');
      }
      
      router.push(`/estimates/${response.data._id}`);
    } catch (error) {
      console.error('Error creating estimate:', error);
      alert('Failed to create estimate');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, tax, total } = calculateTotals();
  const isCompany = selectedCustomer?.customer_type === 'company';

  return (
    <HybridNavigationTopBar>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
        <CompactHeader
          title="Create Estimate"
          backUrl="/estimates"
          icon={FileText}
          actions={[
            {
              label: 'Cancel',
              onClick: () => router.push('/estimates'),
              variant: 'secondary',
            },
            {
              label: loading ? 'Saving...' : 'Save Draft',
              icon: Save,
              onClick: () => handleSubmit('draft'),
              variant: 'secondary',
              disabled: loading,
            },
            {
              label: loading ? 'Sending...' : 'Save & Send',
              icon: Send,
              onClick: () => handleSubmit('sent'),
              variant: 'primary',
              disabled: loading,
            },
          ]}
        />

        <div className="max-w-6xl mx-auto space-y-4">
          {/* Use Template Button */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-blue-300 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Quick Start with Templates</h3>
                  <p className="text-sm text-gray-600">Auto-fill this estimate using a pre-built template</p>
                </div>
              </div>
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <FileText className="w-4 h-4" />
                <span>Use Template</span>
              </button>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer & Site Information</h2>
            
            {/* Customer */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-[#3f72af]" />
                    <div>
                      <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
                      <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCustomer(null);
                      setSelectedSite(null);
                      setSelectedContacts([]);
                      setSites([]);
                    }}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomerSearch(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Select Customer</span>
                </button>
              )}
            </div>

            {/* Site Selection */}
            {selectedCustomer && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Site</label>
                {selectedSite ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{selectedSite.name}</p>
                        <p className="text-sm text-gray-600">{selectedSite.address}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSite(null)}
                      className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSiteModal(true)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
                  >
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">Select Site</span>
                  </button>
                )}
              </div>
            )}

            {/* Contacts */}
            {selectedCustomer && isCompany && selectedCustomer.contacts && selectedCustomer.contacts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contacts</label>
                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">
                    {selectedContacts.length > 0 ? `${selectedContacts.length} Contact(s) Selected` : 'Add Contacts'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Line Items by Section */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
              <button
                onClick={addSection}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Section</span>
              </button>
            </div>

            {sections.map((section, sectionIndex) => (
              <div key={section.id} className="mb-4 border-2 border-gray-200 rounded-lg p-4">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1 flex items-center space-x-3">
                    <input
                      type="text"
                      value={section.name}
                      onChange={(e) => updateSection(section.id, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-semibold text-gray-900"
                      placeholder="Section Name"
                    />
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={section.show_subtotal}
                        onChange={(e) => updateSection(section.id, 'show_subtotal', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">Show Subtotal</span>
                    </label>
                  </div>
                  {sections.length > 1 && (
                    <button
                      onClick={() => removeSection(section.id)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Line Items in Section */}
                {section.items.map((item, itemIndex) => (
                  <div key={item.id} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(section.id, item.id, 'description', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Service description"
                        />
                        <input
                          type="text"
                          value={item.service_type}
                          onChange={(e) => updateLineItem(section.id, item.id, 'service_type', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Service type (e.g., Parking Lot Plowing)"
                        />
                      </div>
                      <button
                        onClick={() => removeLineItem(section.id, item.id)}
                        className="ml-2 p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Service Options */}
                    {item.service_options && item.service_options.length > 0 && (
                      <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">Service Options:</p>
                        {item.service_options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2 mb-2">
                            <input
                              type="radio"
                              name={`option-${section.id}-${item.id}`}
                              checked={item.selected_option === option.name}
                              onChange={() => updateLineItem(section.id, item.id, 'selected_option', option.name)}
                              className="w-4 h-4"
                            />
                            <input
                              type="text"
                              value={option.name}
                              onChange={(e) => updateServiceOption(section.id, item.id, optIndex, 'name', e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Option name"
                            />
                            <input
                              type="text"
                              value={option.description}
                              onChange={(e) => updateServiceOption(section.id, item.id, optIndex, 'description', e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Description"
                            />
                            <div className="flex items-center">
                              <span className="text-sm text-gray-600 mr-1">$</span>
                              <input
                                type="number"
                                value={option.price}
                                onChange={(e) => updateServiceOption(section.id, item.id, optIndex, 'price', parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Price"
                              />
                            </div>
                            <button
                              onClick={() => removeServiceOption(section.id, item.id, optIndex)}
                              className="p-1 hover:bg-red-100 text-red-600 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => addServiceOption(section.id, item.id)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-sm font-medium transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Option</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-700">Qty:</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(section.id, item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          min="1"
                        />
                      </div>

                      {(!item.service_options || item.service_options.length === 0) && (
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-700">Unit Price:</label>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600 mr-1">$</span>
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateLineItem(section.id, item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-28 px-2 py-1 border border-gray-300 rounded text-sm"
                              step="0.01"
                            />
                          </div>
                        </div>
                      )}

                      <div className="ml-auto">
                        <span className="text-sm text-gray-700 font-semibold">Total: ${item.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => addLineItem(section.id)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-gray-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Line Item</span>
                </button>

                {/* Section Subtotal */}
                {section.show_subtotal && section.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-300 flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-gray-700">Section Subtotal:</p>
                      <p className="text-lg font-bold text-gray-900">
                        ${section.items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setShowFormModal(true)}
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <FileText className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 text-center">Attach Forms</span>
                {attachedForms.length > 0 && (
                  <span className="text-xs text-[#3f72af] mt-1">{attachedForms.length} attached</span>
                )}
              </button>

              <button className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors">
                <Image className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 text-center">Upload Photos</span>
              </button>

              <button className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 text-center">Upload Documents</span>
              </button>
            </div>
          </div>

          {/* Terms & Settings */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Terms & Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                <select
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valid for (days)</label>
                <input
                  type="number"
                  value={formData.valid_days}
                  onChange={(e) => setFormData({ ...formData, valid_days: parseInt(e.target.value) || 30 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                <input
                  type="number"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  step="0.01"
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.requires_signature}
                  onChange={(e) => setFormData({ ...formData, requires_signature: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-700">Require Customer Signature</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.requires_agreement}
                  onChange={(e) => setFormData({ ...formData, requires_agreement: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-700">Require Signed Agreement</span>
              </label>

              {formData.requires_agreement && (
                <div className="ml-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agreement Template</label>
                  <button
                    onClick={() => setShowAgreementModal(true)}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 text-gray-600 transition-colors text-sm"
                  >
                    {formData.selected_agreement_template ? 'Change Agreement Template' : 'Select Agreement Template'}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={4}
                placeholder="Additional notes or terms..."
              />
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <div className="max-w-md ml-auto space-y-3">
              <div className="flex items-center justify-between text-gray-700">
                <span>Subtotal:</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-700">
                <span>Tax ({formData.tax_rate}%):</span>
                <span className="font-semibold">${tax.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-300">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {/* Customer Search Modal */}
        {showCustomerSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Select Customer</h3>
                  <button
                    onClick={() => setShowCustomerSearch(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    placeholder="Search customers..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                    autoFocus
                  />
                </div>
              </div>
              <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
                {filteredCustomers.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">No customers found</p>
                ) : (
                  <div className="space-y-2">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer._id}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowCustomerSearch(false);
                        }}
                        className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                      >
                        <p className="font-semibold text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                        {customer.phone && <p className="text-sm text-gray-600">{customer.phone}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Site Modal */}
        {showSiteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Select Site</h3>
                  <button onClick={() => setShowSiteModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {sites.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">No sites found for this customer</p>
                ) : (
                  <div className="space-y-2">
                    {sites.map((site) => (
                      <button
                        key={site._id}
                        onClick={() => {
                          setSelectedSite(site);
                          setShowSiteModal(false);
                        }}
                        className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all"
                      >
                        <p className="font-semibold text-gray-900">{site.name}</p>
                        <p className="text-sm text-gray-600">{site.address}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contact Modal */}
        {showContactModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Select Contacts</h3>
                  <button onClick={() => setShowContactModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {selectedCustomer.contacts?.map((contact, index) => (
                    <label
                      key={index}
                      className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-purple-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContacts([...selectedContacts, contact.name]);
                          } else {
                            setSelectedContacts(selectedContacts.filter(c => c !== contact.name));
                          }
                        }}
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{contact.name}</p>
                        {contact.role && <p className="text-sm text-gray-600">{contact.role}</p>}
                        <div className="flex items-center space-x-4 mt-1">
                          {contact.email && <p className="text-sm text-gray-600">{contact.email}</p>}
                          {contact.phone && <p className="text-sm text-gray-600">{contact.phone}</p>}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Forms Modal */}
        {showFormModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Attach Forms</h3>
                  <button onClick={() => setShowFormModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {forms.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">No forms available</p>
                ) : (
                  <div className="space-y-2">
                    {forms.map((form) => (
                      <label
                        key={form._id}
                        className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={attachedForms.includes(form._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAttachedForms([...attachedForms, form._id]);
                            } else {
                              setAttachedForms(attachedForms.filter(f => f !== form._id));
                            }
                          }}
                          className="w-5 h-5"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{form.name}</p>
                          {form.description && <p className="text-sm text-gray-600">{form.description}</p>}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Agreement Template Modal */}
        {showAgreementModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Select Agreement Template</h3>
                  <button onClick={() => setShowAgreementModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {agreements.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">No agreement templates available</p>
                ) : (
                  <div className="space-y-2">
                    {agreements.map((agreement) => (
                      <button
                        key={agreement._id}
                        onClick={() => {
                          setFormData({ ...formData, selected_agreement_template: agreement._id });
                          setShowAgreementModal(false);
                        }}
                        className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all"
                      >
                        <p className="font-semibold text-gray-900">{agreement.name || agreement.contract_number}</p>
                        {agreement.description && <p className="text-sm text-gray-600">{agreement.description}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <TemplateSelector
          templateType="estimate"
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </HybridNavigationTopBar>
  );
}
