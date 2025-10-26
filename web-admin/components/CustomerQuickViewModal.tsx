'use client';

import { useState, useEffect } from 'react';
import { X, Phone, Mail, MessageSquare, MapPin, FileText, DollarSign, Building, ExternalLink, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface CustomerQuickViewProps {
  customerId: string;
  onClose: () => void;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  customer_type?: string;
  company_name?: string;
  status?: string;
}

interface QuickStats {
  sites_count: number;
  work_orders_count: number;
  invoices_count: number;
  outstanding_balance: number;
}

export default function CustomerQuickViewModal({ customerId, onClose }: CustomerQuickViewProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [stats, setStats] = useState<QuickStats>({
    sites_count: 0,
    work_orders_count: 0,
    invoices_count: 0,
    outstanding_balance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      
      // Load customer details
      const customerResponse = await api.get(`/customers/${customerId}`);
      const customerData = customerResponse.data;
      setCustomer(customerData);

      // Load related data counts
      const [sitesRes, workOrdersRes, invoicesRes] = await Promise.all([
        api.get('/sites', { params: { customer_id: customerId } }).catch(() => ({ data: [] })),
        api.get('/work-orders', { params: { customer_id: customerId } }).catch(() => ({ data: { work_orders: [] } })),
        api.get('/invoices', { params: { customer_id: customerId } }).catch(() => ({ data: [] })),
      ]);

      // Calculate stats
      const sites = Array.isArray(sitesRes.data) ? sitesRes.data : [];
      const workOrders = workOrdersRes.data?.work_orders || [];
      const invoices = Array.isArray(invoicesRes.data) ? invoicesRes.data : [];
      
      const outstandingBalance = invoices
        .filter((inv: any) => inv.status !== 'paid')
        .reduce((sum: number, inv: any) => sum + (inv.amount_due || 0), 0);

      setStats({
        sites_count: sites.length,
        work_orders_count: workOrders.length,
        invoices_count: invoices.length,
        outstanding_balance: outstandingBalance,
      });
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallCustomer = () => {
    if (customer?.phone) {
      window.location.href = `tel:${customer.phone}`;
    }
  };

  const handleEmailCustomer = () => {
    if (customer?.email) {
      window.location.href = `mailto:${customer.email}`;
    }
  };

  const handleViewFullProfile = () => {
    router.push(`/customers/${customerId}`);
    onClose();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Not Found</h3>
            <button
              onClick={onClose}
              className="text-[#3f72af] hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fullAddress = [
    customer.address,
    customer.city,
    customer.province,
    customer.postal_code,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3f72af] to-[#2c5282] p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 rounded-full p-2">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {customer.company_name || customer.name}
                  </h2>
                  {customer.company_name && (
                    <p className="text-sm text-white/80">{customer.name}</p>
                  )}
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                {customer.customer_type || 'Customer'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <MapPin className="w-5 h-5 text-purple-600 mb-2" />
              <div className="text-2xl font-bold text-purple-900">{stats.sites_count}</div>
              <div className="text-xs text-purple-700">Sites</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <FileText className="w-5 h-5 text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-blue-900">{stats.work_orders_count}</div>
              <div className="text-xs text-blue-700">Work Orders</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <DollarSign className="w-5 h-5 text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-900">{stats.invoices_count}</div>
              <div className="text-xs text-green-700">Invoices</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <DollarSign className="w-5 h-5 text-orange-600 mb-2" />
              <div className="text-xl font-bold text-orange-900">
                ${stats.outstanding_balance.toFixed(2)}
              </div>
              <div className="text-xs text-orange-700">Outstanding</div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Contact Information</h3>
            <div className="space-y-2">
              {customer.phone && (
                <div className="flex items-center text-sm text-gray-700">
                  <Phone className="w-4 h-4 mr-3 text-gray-400" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center text-sm text-gray-700">
                  <Mail className="w-4 h-4 mr-3 text-gray-400" />
                  <span>{customer.email}</span>
                </div>
              )}
              {fullAddress && (
                <div className="flex items-start text-sm text-gray-700">
                  <MapPin className="w-4 h-4 mr-3 text-gray-400 mt-0.5" />
                  <span>{fullAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {customer.phone && (
              <button
                onClick={handleCallCustomer}
                className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-[#3f72af] hover:bg-blue-50 transition-all"
              >
                <Phone className="w-5 h-5 text-[#3f72af] mb-2" />
                <span className="text-xs font-medium text-gray-700">Call</span>
              </button>
            )}
            {customer.email && (
              <button
                onClick={handleEmailCustomer}
                className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-[#3f72af] hover:bg-blue-50 transition-all"
              >
                <Mail className="w-5 h-5 text-[#3f72af] mb-2" />
                <span className="text-xs font-medium text-gray-700">Email</span>
              </button>
            )}
            <button
              onClick={() => {
                router.push(`/communication?customer_id=${customerId}`);
                onClose();
              }}
              className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-[#3f72af] hover:bg-blue-50 transition-all"
            >
              <MessageSquare className="w-5 h-5 text-[#3f72af] mb-2" />
              <span className="text-xs font-medium text-gray-700">Message</span>
            </button>
            <button
              onClick={handleViewFullProfile}
              className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-[#3f72af] hover:bg-blue-50 transition-all"
            >
              <ExternalLink className="w-5 h-5 text-[#3f72af] mb-2" />
              <span className="text-xs font-medium text-gray-700">Full Profile</span>
            </button>
          </div>

          {/* View Full Profile Button */}
          <button
            onClick={handleViewFullProfile}
            className="w-full py-3 bg-gradient-to-r from-[#3f72af] to-[#2c5282] text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-[1.02]"
          >
            View Complete Customer Profile
          </button>
        </div>
      </div>
    </div>
  );
}
