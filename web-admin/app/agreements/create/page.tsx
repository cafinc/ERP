'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import CompactHeader from '@/components/CompactHeader';
import api from '@/lib/api';
import {
  FileSignature,
  Save,
  FileText,
  User,
  MapPin,
  DollarSign,
  Calendar,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function CreateAgreementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer_id');
  const estimateId = searchParams.get('estimate_id');

  const [step, setStep] = useState<'select' | 'details' | 'review'>('select');
  const [creationMethod, setCreationMethod] = useState<'template' | 'estimate' | 'scratch'>('template');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  
  // Agreement Data
  const [agreement, setAgreement] = useState({
    customer_id: customerId || '',
    agreement_number: '',
    agreement_type: 'Snow Removal Services',
    status: 'draft',
    start_date: '',
    end_date: '',
    agreement_value: '',
    payment_terms: 'Net 30',
    auto_renew: false,
    renewal_notice_days: 30,
    template_id: '',
    estimate_id: estimateId || '',
    sections: [] as any[],
    notes: '',
  });

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedEstimate, setSelectedEstimate] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (estimateId) {
      setCreationMethod('estimate');
      loadEstimateData(estimateId);
    }
  }, [estimateId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [customersRes, templatesRes, estimatesRes] = await Promise.all([
        api.get('/customers'),
        api.get('/agreement-templates'),
        api.get('/estimates?status=accepted'),
      ]);

      setCustomers(customersRes.data.customers || customersRes.data || []);
      setTemplates(templatesRes.data.templates || templatesRes.data || []);
      setEstimates(estimatesRes.data.estimates || estimatesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEstimateData = async (estId: string) => {
    try {
      const res = await api.get(`/estimates/${estId}`);
      const estimate = res.data;
      setSelectedEstimate(estimate);
      
      // Pre-fill agreement data from estimate
      setAgreement(prev => ({
        ...prev,
        customer_id: estimate.customer_id,
        agreement_value: estimate.total || estimate.total_amount,
        estimate_id: estId,
        notes: `Created from Estimate ${estimate.estimate_number}`,
      }));
    } catch (error) {
      console.error('Error loading estimate:', error);
    }
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setAgreement(prev => ({
      ...prev,
      template_id: template._id,
      agreement_type: template.category || prev.agreement_type,
      payment_terms: template.payment_terms || prev.payment_terms,
      auto_renew: template.auto_renew || prev.auto_renew,
      sections: template.sections || [],
    }));
    setStep('details');
  };

  const handleEstimateSelect = (estimate: any) => {
    setSelectedEstimate(estimate);
    setAgreement(prev => ({
      ...prev,
      customer_id: estimate.customer_id,
      agreement_value: estimate.total || estimate.total_amount,
      estimate_id: estimate._id,
      notes: `Created from Estimate ${estimate.estimate_number}`,
    }));
    setStep('details');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Generate agreement number if not provided
      if (!agreement.agreement_number) {
        agreement.agreement_number = `AGR-${Date.now()}`;
      }

      await api.post('/contracts', {
        ...agreement,
        contract_number: agreement.agreement_number,
        contract_type: agreement.agreement_type,
        contract_value: agreement.agreement_value,
        contract_status: agreement.status,
      });

      alert('Agreement created successfully!');
      router.push(`/customers/${agreement.customer_id}?tab=agreements`);
    } catch (error) {
      console.error('Error creating agreement:', error);
      alert('Failed to create agreement');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (index: number) => {
    setExpandedSections(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const selectedCustomer = customers.find(c => c._id === agreement.customer_id);

  return (
    <DashboardLayout>
      <div className="p-6">
        <CompactHeader
          title="Create Service Agreement"
          backUrl={customerId ? `/customers/${customerId}?tab=agreements` : '/contracts'}
          icon={FileSignature}
          description="Create a new service agreement from template or estimate"
        />

        {/* Step Indicator */}
        <div className="mt-6 mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 ${step === 'select' ? 'text-[#3f72af]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'select' ? 'bg-[#3f72af] text-white' : 'bg-gray-200'
              }`}>1</div>
              <span className="font-medium">Select Method</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300" />
            <div className={`flex items-center space-x-2 ${step === 'details' ? 'text-[#3f72af]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'details' ? 'bg-[#3f72af] text-white' : 'bg-gray-200'
              }`}>2</div>
              <span className="font-medium">Agreement Details</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300" />
            <div className={`flex items-center space-x-2 ${step === 'review' ? 'text-[#3f72af]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'review' ? 'bg-[#3f72af] text-white' : 'bg-gray-200'
              }`}>3</div>
              <span className="font-medium">Review & Save</span>
            </div>
          </div>
        </div>

        {/* Step 1: Select Creation Method */}
        {step === 'select' && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">How would you like to create this agreement?</h2>
            <p className="text-gray-600 mb-8 text-center">Choose a method to get started</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* From Template */}
              <div
                onClick={() => setCreationMethod('template')}
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  creationMethod === 'template'
                    ? 'border-[#3f72af] bg-[#3f72af]/5'
                    : 'border-gray-200 hover:border-[#3f72af]/50'
                }`}
              >
                <FileText className="w-12 h-12 text-[#3f72af] mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">From Template</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Use a pre-configured agreement template with standard terms and sections
                </p>
                {creationMethod === 'template' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
                    <select
                      value={agreement.template_id}
                      onChange={(e) => {
                        const template = templates.find(t => t._id === e.target.value);
                        if (template) handleTemplateSelect(template);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    >
                      <option value="">Choose a template...</option>
                      {templates.map((template: any) => (
                        <option key={template._id} value={template._id}>
                          {template.template_name} ({template.category})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* From Accepted Estimate */}
              <div
                onClick={() => setCreationMethod('estimate')}
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  creationMethod === 'estimate'
                    ? 'border-[#3f72af] bg-[#3f72af]/5'
                    : 'border-gray-200 hover:border-[#3f72af]/50'
                }`}
              >
                <FileSignature className="w-12 h-12 text-[#3f72af] mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">From Accepted Estimate</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Convert an accepted estimate into a service agreement automatically
                </p>
                {creationMethod === 'estimate' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Estimate</label>
                    <select
                      value={agreement.estimate_id}
                      onChange={(e) => {
                        const estimate = estimates.find(est => est._id === e.target.value);
                        if (estimate) handleEstimateSelect(estimate);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    >
                      <option value="">Choose an estimate...</option>
                      {estimates.map((estimate: any) => (
                        <option key={estimate._id} value={estimate._id}>
                          {estimate.estimate_number} - ${estimate.total?.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* From Scratch */}
              <div
                onClick={() => {
                  setCreationMethod('scratch');
                  setStep('details');
                }}
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  creationMethod === 'scratch'
                    ? 'border-[#3f72af] bg-[#3f72af]/5'
                    : 'border-gray-200 hover:border-[#3f72af]/50'
                }`}
              >
                <Plus className="w-12 h-12 text-[#3f72af] mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">From Scratch</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create a custom agreement from the ground up with your own terms
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Agreement Details */}
        {step === 'details' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Agreement Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Customer *
                  </label>
                  <select
                    value={agreement.customer_id}
                    onChange={(e) => setAgreement({ ...agreement, customer_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    required
                  >
                    <option value="">Select customer...</option>
                    {customers.map((customer: any) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name || customer.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Agreement Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agreement Number</label>
                  <input
                    type="text"
                    value={agreement.agreement_number}
                    onChange={(e) => setAgreement({ ...agreement, agreement_number: e.target.value })}
                    placeholder="Auto-generated if left blank"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  />
                </div>

                {/* Agreement Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Type *</label>
                  <select
                    value={agreement.agreement_type}
                    onChange={(e) => setAgreement({ ...agreement, agreement_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  >
                    <option value="Snow Removal Services">Snow Removal Services</option>
                    <option value="Lawn Care Services">Lawn Care Services</option>
                    <option value="Parking Lot Services">Parking Lot Services</option>
                    <option value="Master Service Agreement">Master Service Agreement</option>
                    <option value="Seasonal Contract">Seasonal Contract</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={agreement.start_date}
                    onChange={(e) => setAgreement({ ...agreement, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    required
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={agreement.end_date}
                    onChange={(e) => setAgreement({ ...agreement, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  />
                </div>

                {/* Agreement Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Agreement Value *
                  </label>
                  <input
                    type="number"
                    value={agreement.agreement_value}
                    onChange={(e) => setAgreement({ ...agreement, agreement_value: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    required
                  />
                </div>

                {/* Payment Terms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                  <select
                    value={agreement.payment_terms}
                    onChange={(e) => setAgreement({ ...agreement, payment_terms: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                  >
                    <option value="Net 30">Net 30</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="50% Deposit">50% Deposit</option>
                    <option value="Monthly Installments">Monthly Installments</option>
                  </select>
                </div>

                {/* Auto-Renew */}
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={agreement.auto_renew}
                      onChange={(e) => setAgreement({ ...agreement, auto_renew: e.target.checked })}
                      className="w-4 h-4 text-[#3f72af] border-gray-300 rounded focus:ring-[#3f72af]"
                    />
                    <span className="text-sm font-medium text-gray-700">Auto-renew agreement</span>
                  </label>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={agreement.notes}
                    onChange={(e) => setAgreement({ ...agreement, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    placeholder="Additional notes or special conditions..."
                  />
                </div>
              </div>

              {/* Agreement Sections (if from template) */}
              {agreement.sections.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Agreement Sections</h3>
                  <div className="space-y-2">
                    {agreement.sections.map((section: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => toggleSection(index)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                        >
                          <span className="font-medium text-gray-900">{section.title}</span>
                          {expandedSections.includes(index) ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        {expandedSections.includes(index) && (
                          <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <textarea
                              value={section.content}
                              onChange={(e) => {
                                const newSections = [...agreement.sections];
                                newSections[index].content = e.target.value;
                                setAgreement({ ...agreement, sections: newSections });
                              }}
                              rows={6}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent font-mono text-sm"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setStep('select')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('review')}
                  disabled={!agreement.customer_id || !agreement.start_date || !agreement.agreement_value}
                  className="px-6 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#3f72af]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Review
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review & Save */}
        {step === 'review' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Agreement</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium text-gray-900">{selectedCustomer?.name || selectedCustomer?.company_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Agreement Type</p>
                    <p className="font-medium text-gray-900">{agreement.agreement_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-medium text-gray-900">{new Date(agreement.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="font-medium text-gray-900">
                      {agreement.end_date ? new Date(agreement.end_date).toLocaleDateString() : 'No end date'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Agreement Value</p>
                    <p className="font-medium text-gray-900">${parseFloat(agreement.agreement_value).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Terms</p>
                    <p className="font-medium text-gray-900">{agreement.payment_terms}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Auto-Renew</p>
                    <p className="font-medium text-gray-900">{agreement.auto_renew ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                {agreement.notes && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Notes</p>
                    <p className="text-gray-900">{agreement.notes}</p>
                  </div>
                )}

                {agreement.sections.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Agreement contains {agreement.sections.length} sections
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setStep('details')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#3f72af]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  <span>{saving ? 'Creating...' : 'Create Agreement'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
