'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import SignaturePad from '@/components/SignaturePad';
import api from '@/lib/api';
import {
  ArrowLeft,
  Edit,
  Send,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  FileText,
  RefreshCw,
  PenTool,
  Shield,
  Ban,
  FileSignature,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface Contract {
  id: string;
  contract_number: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  title: string;
  contract_type: string;
  content: string;
  service_description: string;
  service_start_date?: string;
  service_end_date?: string;
  contract_value: number;
  payment_terms?: string;
  terms_and_conditions?: string;
  status: string;
  customer_signature?: {
    signature_data: string;
    typed_name: string;
    signed_at: string;
  };
  company_signature?: {
    signature_data: string;
    typed_name: string;
    signed_at: string;
  };
  notes?: string;
  auto_renew?: boolean;
  renewal_terms?: string;
  created_at: string;
  sent_at?: string;
  signed_at?: string;
  activated_at?: string;
}

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = (Array.isArray(params?.id) ? params.id[0] : params?.id) as string;
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureType, setSignatureType] = useState<'customer' | 'company'>('customer');

  useEffect(() => {
    if (contractId && contractId !== 'undefined') {
      loadContract();
    }
  }, [contractId]);

  const loadContract = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/contracts/${contractId}`);
      setContract(response.data);
    } catch (error) {
      console.error('Error loading contract:', error);
      alert('Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  const handleSignature = async (signatureData: string, signedName: string) => {
    try {
      setActionLoading(true);
      
      if (signatureType === 'customer') {
        await api.post(`/contracts/${contractId}/sign`, {
          signature_data: signatureData,
          typed_name: signedName,
          signed_at: new Date().toISOString(),
          ip_address: 'web-admin'
        });
        alert('Contract signed successfully!');
      } else {
        // Company signature
        await api.put(`/contracts/${contractId}`, {
          company_signature: {
            signature_data: signatureData,
            typed_name: signedName,
            signed_at: new Date().toISOString(),
            ip_address: 'web-admin'
          }
        });
        alert('Company signature added successfully!');
      }
      
      setShowSignaturePad(false);
      loadContract();
    } catch (error) {
      console.error('Error signing contract:', error);
      alert('Failed to sign contract');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendContract = async () => {
    if (!confirm('Send this contract to the customer?')) return;
    
    try {
      setActionLoading(true);
      await api.post(`/contracts/${contractId}/send`);
      alert('Contract sent successfully!');
      loadContract();
    } catch (error) {
      console.error('Error sending contract:', error);
      alert('Failed to send contract');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateContract = async () => {
    if (!confirm('Activate this contract? This will make it active and binding.')) return;
    
    try {
      setActionLoading(true);
      await api.post(`/contracts/${contractId}/activate`);
      alert('Contract activated successfully!');
      loadContract();
    } catch (error) {
      console.error('Error activating contract:', error);
      alert('Failed to activate contract');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerminateContract = async () => {
    const reason = prompt('Enter reason for termination:');
    if (!reason) return;
    
    if (!confirm('Terminate this contract? This action cannot be undone.')) return;
    
    try {
      setActionLoading(true);
      await api.post(`/contracts/${contractId}/terminate`, null, {
        params: { reason }
      });
      alert('Contract terminated successfully!');
      loadContract();
    } catch (error) {
      console.error('Error terminating contract:', error);
      alert('Failed to terminate contract');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteContract = async () => {
    if (!confirm('Delete this draft contract? This action cannot be undone.')) return;
    
    try {
      setActionLoading(true);
      await api.delete(`/contracts/${contractId}`);
      alert('Contract deleted successfully!');
      router.push('/contracts');
    } catch (error) {
      console.error('Error deleting contract:', error);
      alert('Failed to delete contract. Only draft contracts can be deleted.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'sent': return 'bg-blue-100 text-blue-700';
      case 'viewed': return 'bg-yellow-100 text-yellow-700';
      case 'signed': return 'bg-green-100 text-green-700';
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'expired': return 'bg-orange-100 text-orange-700';
      case 'terminated': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft': return <FileText className="w-5 h-5" />;
      case 'sent': return <Send className="w-5 h-5" />;
      case 'viewed': return <Eye className="w-5 h-5" />;
      case 'signed': return <FileSignature className="w-5 h-5" />;
      case 'active': return <CheckCircle className="w-5 h-5" />;
      case 'expired': return <Clock className="w-5 h-5" />;
      case 'terminated': return <Ban className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'seasonal': return 'Seasonal Contract';
      case 'one_time': return 'One-Time Agreement';
      case 'recurring': return 'Recurring Service';
      case 'custom': return 'Custom Agreement';
      default: return type;
    }
  };

  if (loading) {
    return (
      <HybridNavigationTopBar>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </HybridNavigationTopBar>
    );
  }

  if (!contract) {
    return (
      <HybridNavigationTopBar>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Contract not found</h2>
          <button
            onClick={() => router.push('/contracts')}
            className="mt-4 text-[#3f72af] hover:text-blue-800"
          >
            Return to Contracts
          </button>
        </div>
      </HybridNavigationTopBar>
    );
  }

  return (
    <HybridNavigationTopBar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/contracts')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {contract.contract_number}
              </h1>
              <p className="text-gray-600 mt-1">{contract.title}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {contract.status === 'draft' && (
              <>
                <button
                  onClick={() => router.push(`/contracts/${contractId}/edit`)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={actionLoading}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleSendContract}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282]"
                  disabled={actionLoading}
                >
                  <Send className="w-4 h-4" />
                  Send to Customer
                </button>
                <button
                  onClick={handleDeleteContract}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  disabled={actionLoading}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
            
            {(contract.status === 'sent' || contract.status === 'viewed') && (
              <button
                onClick={() => {
                  setSignatureType('customer');
                  setShowSignaturePad(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={actionLoading}
              >
                <FileSignature className="w-4 h-4" />
                Sign Contract
              </button>
            )}
            
            {contract.status === 'signed' && (
              <button
                onClick={handleActivateContract}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                disabled={actionLoading}
              >
                <Shield className="w-4 h-4" />
                Activate Contract
              </button>
            )}
            
            {contract.status === 'active' && (
              <button
                onClick={handleTerminateContract}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                disabled={actionLoading}
              >
                <Ban className="w-4 h-4" />
                Terminate
              </button>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-4">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(contract.status)}`}>
            {getStatusIcon(contract.status)}
            {contract.status?.toUpperCase()}
          </span>
          <span className="text-sm text-gray-600">
            {getTypeLabel(contract.contract_type)}
          </span>
        </div>

        {/* Contract Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="text-sm font-medium text-gray-900">{contract.customer_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-sm font-medium text-gray-900">{contract.customer_email}</p>
                </div>
              </div>
              {contract.customer_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{contract.customer_phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contract Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Details</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Contract Value</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${contract.contract_value?.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Service Period</p>
                  <p className="text-sm font-medium text-gray-900">
                    {contract.service_start_date ? new Date(contract.service_start_date).toLocaleDateString() : 'N/A'} - 
                    {contract.service_end_date ? new Date(contract.service_end_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Payment Terms</p>
                  <p className="text-sm font-medium text-gray-900">{contract.payment_terms || 'Net 30'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Description */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{contract.service_description}</p>
        </div>

        {/* Contract Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Agreement</h2>
          <div 
            className="prose max-w-none text-gray-700" 
            dangerouslySetInnerHTML={{ __html: contract.content }}
          />
        </div>

        {/* Terms and Conditions */}
        {contract.terms_and_conditions && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{contract.terms_and_conditions}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Signature */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Signature</h2>
            {contract.customer_signature ? (
              <div className="space-y-3">
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <img 
                    src={contract.customer_signature.signature_data} 
                    alt="Customer Signature"
                    className="max-h-32 mx-auto"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Signed by:</strong> {contract.customer_signature.typed_name}</p>
                  <p><strong>Date:</strong> {new Date(contract.customer_signature.signed_at).toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileSignature className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Not signed yet</p>
                {(contract.status === 'sent' || contract.status === 'viewed') && (
                  <button
                    onClick={() => {
                      setSignatureType('customer');
                      setShowSignaturePad(true);
                    }}
                    className="mt-4 text-[#3f72af] hover:text-blue-800 text-sm font-medium"
                  >
                    Sign Now
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Company Signature */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Signature</h2>
            {contract.company_signature ? (
              <div className="space-y-3">
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <img 
                    src={contract.company_signature.signature_data} 
                    alt="Company Signature"
                    className="max-h-32 mx-auto"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Signed by:</strong> {contract.company_signature.typed_name}</p>
                  <p><strong>Date:</strong> {new Date(contract.company_signature.signed_at).toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Not signed yet</p>
                <button
                  onClick={() => {
                    setSignatureType('company');
                    setShowSignaturePad(true);
                  }}
                  className="mt-4 text-[#3f72af] hover:text-blue-800 text-sm font-medium"
                >
                  Add Company Signature
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {contract.notes && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{contract.notes}</p>
          </div>
        )}

        {/* Auto-Renewal Info */}
        {contract.auto_renew && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Auto-Renewal Enabled</p>
                {contract.renewal_terms && (
                  <p className="text-sm text-yellow-700 mt-1">{contract.renewal_terms}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Signature Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {signatureType === 'customer' ? 'Customer Signature' : 'Company Signature'}
            </h2>
            <SignaturePad
              onSave={handleSignature}
              onCancel={() => setShowSignaturePad(false)}
              disabled={actionLoading}
            />
          </div>
        </div>
      )}
    </HybridNavigationTopBar>
  );
}
