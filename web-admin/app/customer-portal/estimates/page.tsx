'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import { FileText, Eye, Download, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function CustomerEstimatesPage() {
  const router = useRouter();
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadEstimates();
  }, [filter]);

  const loadEstimates = async () => {
    try {
      setLoading(true);
      const userResponse = await api.get('/auth/me');
      const customerId = userResponse.data.id;
      
      const params = new URLSearchParams({ customer_id: customerId });
      if (filter !== 'all') params.append('status', filter);
      
      const response = await api.get(`/estimates?${params.toString()}`);
      setEstimates(response.data || []);
    } catch (error) {
      console.error('Error loading estimates:', error);
      setEstimates([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="My Estimates"
        description="View and manage your estimates"
          />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Estimates List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading estimates...</p>
          </div>
        ) : estimates.length === 0 ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No estimates found</h3>
            <p className="text-gray-600">You don't have any estimates yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {estimates.map((estimate) => (
              <div
                key={estimate._id || estimate.id}
                className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/estimates/${estimate._id || estimate.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(estimate.status)}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {estimate.estimate_number || `EST-${(estimate._id || estimate.id)?.slice(-6)}`}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(estimate.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(estimate.status)}`}>
                    {estimate.status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>

                {estimate.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{estimate.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-600">
                    ${estimate.total_amount?.toFixed(2) || '0.00'}
                  </span>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
