'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';
import api from '@/lib/api';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Send,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  Calendar,
  RefreshCw,
  FileSignature,
  Shield,
  Ban,
} from 'lucide-react';

interface Contract {
  id: string;
  contract_number: string;
  customer_id: string;
  customer_name?: string;
  title: string;
  contract_type: string;
  contract_value: number;
  status: string;
  created_at: string;
  service_start_date?: string;
  service_end_date?: string;
  signed_at?: string;
}

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/contracts');
      setContracts(response.data.contracts || []);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
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
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'sent': return <Send className="w-4 h-4" />;
      case 'viewed': return <Eye className="w-4 h-4" />;
      case 'signed': return <FileSignature className="w-4 h-4" />;
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'expired': return <Clock className="w-4 h-4" />;
      case 'terminated': return <Ban className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'seasonal': return 'Seasonal';
      case 'one_time': return 'One-Time';
      case 'recurring': return 'Recurring';
      case 'custom': return 'Custom';
      default: return type;
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.contract_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || contract.status?.toLowerCase() === filterStatus;
    const matchesType = filterType === 'all' || contract.contract_type?.toLowerCase() === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCreateContract = () => {
    router.push('/contracts/create');
  };

  const handleViewContract = (id: string) => {
    router.push(`/contracts/${id}`);
  };

  // Calculate stats
  const statsData = {
    total: contracts.length,
    active: contracts.filter(c => c.status?.toLowerCase() === 'active').length,
    signed: contracts.filter(c => c.status?.toLowerCase() === 'signed').length,
    draft: contracts.filter(c => c.status?.toLowerCase() === 'draft').length,
    totalValue: contracts.reduce((sum, c) => sum + (c.contract_value || 0), 0),
  };

  if (loading) {
    return (
      <HybridNavigationTopBar>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </HybridNavigationTopBar>
    );
  }

  return (
    <HybridNavigationTopBar>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        {/* Compact Header */}
        <CompactHeader
          title="Agreements"
          icon={FileSignature}
          badges={[
            { label: `${statsData.total} Total`, color: 'blue' },
            { label: `${statsData.active} Active`, color: 'green' },
            { label: `$${statsData.totalValue.toLocaleString()} Value`, color: 'purple' },
          ]}
          actions={[
            {
              label: 'New Agreement',
              icon: Plus,
              onClick: handleCreateContract,
              variant: 'primary',
            },
          ]}
        />

        {/* Status Filter Buttons */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-[#3f72af] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              All ({contracts.length})
            </button>
            <button
              onClick={() => setFilterStatus('draft')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'draft'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Draft ({contracts.filter(c => c.status?.toLowerCase() === 'draft').length})
            </button>
            <button
              onClick={() => setFilterStatus('sent')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'sent'
                  ? 'bg-[#3f72af] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Sent ({contracts.filter(c => c.status?.toLowerCase() === 'sent').length})
            </button>
            <button
              onClick={() => setFilterStatus('signed')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'signed'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Signed ({contracts.filter(c => c.status?.toLowerCase() === 'signed').length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Active ({contracts.filter(c => c.status?.toLowerCase() === 'active').length})
            </button>
            <button
              onClick={() => setFilterStatus('expired')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'expired'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Expired ({contracts.filter(c => c.status?.toLowerCase() === 'expired').length})
            </button>
            <button
              onClick={() => setFilterStatus('terminated')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filterStatus === 'terminated'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100 transition-all'
              }`}
            >
              Terminated ({contracts.filter(c => c.status?.toLowerCase() === 'terminated').length})
            </button>
            <div className="flex-1"></div>
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-700">Total Value:</span>
              <span className="text-sm font-bold text-blue-600">
                ${statsData.totalValue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 mb-4 mx-6 mt-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search agreements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Agreements List */}
        <div className="mx-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-3">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {contracts.length}
                </p>
                <p className="text-sm text-gray-600">Total Contracts</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 rounded-lg p-3">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {contracts.filter(c => c.status === 'active').length}
                </p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-3">
                <FileSignature className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {contracts.filter(c => c.status === 'signed').length}
                </p>
                <p className="text-sm text-gray-600">Signed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 rounded-lg p-3">
                <Send className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {contracts.filter(c => c.status === 'sent' || c.status === 'viewed').length}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contracts Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contract
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No contracts found</p>
                      <p className="text-sm">Create your first contract to get started</p>
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewContract(contract.id)}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contract.contract_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contract.title}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {contract.customer_name || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">
                          {getTypeLabel(contract.contract_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">
                            {contract.contract_value?.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                          {getStatusIcon(contract.status)}
                          {contract.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(contract.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewContract(contract.id);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </HybridNavigationTopBar>
  );
}
