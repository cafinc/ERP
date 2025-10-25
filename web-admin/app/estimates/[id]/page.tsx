'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Plus,
  RefreshCw,
  PenTool,
} from 'lucide-react';

interface EstimateLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Estimate {
  _id: string;
  estimate_number: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  items: EstimateLineItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  notes?: string;
  terms?: string;
  created_at: string;
  valid_until: string;
  sent_at?: string;
  approved_at?: string;
}

export default function EstimateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const estimateId = (Array.isArray(params?.id) ? params.id[0] : params?.id) as string;
  
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  useEffect(() => {
    if (estimateId && estimateId !== 'undefined') {
      loadEstimate();
    }
  }, [estimateId]);

  const loadEstimate = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/estimates/${estimateId}`);
      setEstimate(response.data);
    } catch (error) {
      console.error('Error loading estimate:', error);
      alert('Failed to load estimate');
    } finally {
      setLoading(false);
    }
  };

  const handleSignature = async (signatureData: string, signedName: string) => {
    try {
      setActionLoading(true);
      await api.post(`/estimates/${estimateId}/sign`, {
        signature_data: signatureData,
        signed_name: signedName,
        signed_date: new Date().toISOString(),
        ip_address: 'web-admin',
        estimate_number: estimate?.estimate_number || '',
        customer_id: estimate?.customer_id || ''
      });
      
      alert('Estimate signed and accepted successfully!');
      setShowSignaturePad(false);
      loadEstimate();
    } catch (error) {
      console.error('Error signing estimate:', error);
      alert('Failed to sign estimate');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendEstimate = async () => {
    if (!confirm('Send this estimate to the customer?')) return;
    
    try {
      setActionLoading(true);
      await api.post(`/estimates/${estimateId}/send`);
      alert('Estimate sent successfully!');
      loadEstimate();
    } catch (error) {
      console.error('Error sending estimate:', error);
      alert('Failed to send estimate');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToProject = async () => {
    if (!confirm('Convert this estimate to a project?')) return;
    
    try {
      setActionLoading(true);
      const response = await api.post(`/estimates/${estimateId}/convert-to-project`);
      alert('Estimate converted to project successfully!');
      router.push(`/projects/${response.data._id}`);
    } catch (error) {
      console.error('Error converting estimate:', error);
      alert('Failed to convert estimate');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this estimate? This action cannot be undone.')) return;
    
    try {
      setActionLoading(true);
      await api.delete(`/estimates/${estimateId}`);
      alert('Estimate deleted successfully');
      router.push('/estimates');
    } catch (error) {
      console.error('Error deleting estimate:', error);
      alert('Failed to delete estimate');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'sent': return 'bg-blue-100 text-blue-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'declined': return 'bg-red-100 text-red-700';
      case 'converted': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Estimate Details"
          subtitle="View and manage estimate details"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Estimates", href: "/estimates" }, { label: "Details" }]}
        />
        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
          </div>
        </div>
      </>
    );
  }

  if (!estimate) {
    return (
      <PageHeader>
        <div className="flex flex-col items-center justify-center h-full">
          <FileText className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Estimate Not Found</h2>
          <p className="text-gray-600 mb-4">The estimate you're looking for doesn't exist</p>
          <button
            onClick={() => router.push('/estimates')}
            className="flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Estimates</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageHeader>
      <div className="p-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/estimates')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Estimate #{estimate.estimate_number}</h1>
              <p className="text-gray-600 mt-1">View and manage estimate details</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(estimate.status)}`}>
              <span>{estimate.status}</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-4 flex flex-wrap gap-3">
          <button
            onClick={() => router.push(`/estimates/${estimateId}/edit`)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
            disabled={actionLoading}
          >
            <Edit className="w-5 h-5" />
            <span>Edit</span>
          </button>

          {estimate.status?.toLowerCase() !== 'sent' && estimate.status?.toLowerCase() !== 'approved' && (
            <button
              onClick={handleSendEstimate}
              className="flex items-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#2c5282] text-white rounded-lg font-medium transition-colors"
              disabled={actionLoading}
            >
              <Send className="w-5 h-5" />
              <span>Send to Customer</span>
            </button>
          )}

          {(estimate.status?.toLowerCase() === 'sent' || estimate.status?.toLowerCase() === 'draft') && !estimate.customer_signature && (
            <button
              onClick={() => setShowSignaturePad(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              disabled={actionLoading}
            >
              <PenTool className="w-5 h-5" />
              <span>Sign & Accept</span>
            </button>
          )}

          {estimate.status?.toLowerCase() === 'approved' && (
            <button
              onClick={handleConvertToProject}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              disabled={actionLoading}
            >
              <CheckCircle className="w-5 h-5" />
              <span>Convert to Project</span>
            </button>
          )}

          <button
            onClick={() => alert('PDF download coming soon!')}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleDelete}
            className="flex items-center space-x-2 px-4 py-2 border border-red-300 hover:bg-red-50 text-red-600 rounded-lg font-medium transition-colors"
            disabled={actionLoading}
          >
            <Trash2 className="w-5 h-5" />
            <span>Delete</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Customer Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 font-medium">{estimate.customer_name || 'N/A'}</span>
                </div>
                {estimate.customer_email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <a href={`mailto:${estimate.customer_email}`} className="text-[#3f72af] hover:underline">
                      {estimate.customer_email}
                    </a>
                  </div>
                )}
                {estimate.customer_phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <a href={`tel:${estimate.customer_phone}`} className="text-[#3f72af] hover:underline">
                      {estimate.customer_phone}
                    </a>
                  </div>
                )}
                {estimate.customer_address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <span className="text-gray-700">{estimate.customer_address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Line Items
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {estimate.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-4 text-sm text-gray-900">{item.description}</td>
                        <td className="px-4 py-4 text-sm text-gray-900 text-right">{item.quantity}</td>
                        <td className="px-4 py-4 text-sm text-gray-900 text-right">${item.unit_price.toFixed(2)}</td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 text-right">${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-6 border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900 font-medium">${estimate.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({estimate.tax_rate}%)</span>
                  <span className="text-gray-900 font-medium">${estimate.tax_amount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-[#3f72af]">${estimate.total_amount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            {(estimate.notes || estimate.terms) && (
              <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-4 space-y-4 hover:shadow-md transition-shadow">
                {estimate.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{estimate.notes}</p>
                  </div>
                )}
                {estimate.terms && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Terms & Conditions</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{estimate.terms}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Dates */}
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Important Dates</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600">Created</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(estimate.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600">Valid Until</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(estimate.valid_until).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {estimate.sent_at && (
                  <div className="flex items-start space-x-3">
                    <Send className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-600">Sent</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(estimate.sent_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                {estimate.approved_at && (
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-600">Approved</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(estimate.approved_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-br from-[#3f72af] to-[#3f72af]/80 rounded-xl shadow-sm p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">Total Amount</span>
                <DollarSign className="w-5 h-5 opacity-75" />
              </div>
              <div className="text-3xl font-bold mb-1">
                ${estimate.total_amount?.toLocaleString() || '0.00'}
              </div>
              <div className="text-xs opacity-75">
                {estimate.items?.length || 0} line item{estimate.items?.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Signature Section */}
            {estimate.customer_signature && (
              <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Signature</h2>
                <div className="space-y-4">
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                    <img 
                      src={estimate.customer_signature.signature_data} 
                      alt="Customer Signature" 
                      className="max-w-full h-24 object-contain"
                    />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Signed By:</span>
                      <span className="font-medium text-gray-900">{estimate.customer_signature.signed_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(estimate.customer_signature.signed_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-3 p-2 bg-green-50 border border-green-200 rounded">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-700 font-medium">Digitally Signed & Accepted</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Signature Pad Modal */}
        {showSignaturePad && (
          <SignaturePad
            onSave={handleSignature}
            onCancel={() => setShowSignaturePad(false)}
            title={`Sign Estimate #${estimate.estimate_number}`}
          />
        )}
      </div>
    </div>
  );
}
