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
  FileText,
  DollarSign,
  Calendar,
  RefreshCw,
  AlertCircle,
  Plus,
  Activity,
  Tag,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  X,
  Briefcase,
} from 'lucide-react';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = (Array.isArray(params?.id) ? params.id[0] : params?.id) as string;
  
  const [customer, setCustomer] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Tag management
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [savingTag, setSavingTag] = useState(false);
  
  // Custom field management
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [customFieldForm, setCustomFieldForm] = useState({
    field_name: '',
    field_value: '',
    field_type: 'text'
  });
  const [savingCustomField, setSavingCustomField] = useState(false);

  useEffect(() => {
    if (customerId && customerId !== 'undefined') {
      loadCustomerData();
    }
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      
      const [customerRes, statsRes, activityRes] = await Promise.all([
        api.get(`/customers/${customerId}`),
        api.get(`/customers/${customerId}/stats`).catch(() => ({ data: null })),
        api.get(`/customers/${customerId}/activity?limit=20`).catch(() => ({ data: [] })),
      ]);
      
      setCustomer(customerRes.data);
      setStats(statsRes.data);
      setActivity(activityRes.data || []);
    } catch (error) {
      console.error('Error loading customer data:', error);
      alert('Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) {
      alert('Please enter a tag name');
      return;
    }

    try {
      setSavingTag(true);
      const updatedTags = [...(customer.tags || []), newTag.trim()];
      await api.put(`/customers/${customerId}`, { tags: updatedTags });
      setCustomer({ ...customer, tags: updatedTags });
      setNewTag('');
      setShowTagModal(false);
    } catch (error) {
      console.error('Error adding tag:', error);
      alert('Failed to add tag');
    } finally {
      setSavingTag(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      const updatedTags = customer.tags.filter((t: string) => t !== tagToRemove);
      await api.put(`/customers/${customerId}`, { tags: updatedTags });
      setCustomer({ ...customer, tags: updatedTags });
    } catch (error) {
      console.error('Error removing tag:', error);
      alert('Failed to remove tag');
    }
  };

  const handleAddCustomField = async () => {
    if (!customFieldForm.field_name || !customFieldForm.field_value) {
      alert('Please fill in field name and value');
      return;
    }

    try {
      setSavingCustomField(true);
      const updatedFields = [...(customer.custom_fields || []), customFieldForm];
      await api.put(`/customers/${customerId}`, { custom_fields: updatedFields });
      setCustomer({ ...customer, custom_fields: updatedFields });
      setCustomFieldForm({ field_name: '', field_value: '', field_type: 'text' });
      setShowCustomFieldModal(false);
    } catch (error) {
      console.error('Error adding custom field:', error);
      alert('Failed to add custom field');
    } finally {
      setSavingCustomField(false);
    }
  };

  const handleRemoveCustomField = async (fieldName: string) => {
    try {
      const updatedFields = customer.custom_fields.filter((f: any) => f.field_name !== fieldName);
      await api.put(`/customers/${customerId}`, { custom_fields: updatedFields });
      setCustomer({ ...customer, custom_fields: updatedFields });
    } catch (error) {
      console.error('Error removing custom field:', error);
      alert('Failed to remove custom field');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'estimate_created': case 'estimate_accepted': return <FileText className="w-4 h-4" />;
      case 'invoice_created': return <DollarSign className="w-4 h-4" />;
      case 'payment_received': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'project_created': case 'project_completed': return <Briefcase className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'payment_received': return 'bg-green-100 text-green-700';
      case 'estimate_accepted': case 'project_completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer Not Found</h3>
            <button
              onClick={() => router.push('/customers')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Customers</span>
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/customers')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  customer.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {customer.active ? 'Active Customer' : 'Inactive Customer'}
                </span>
                {customer.customer_type && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {customer.customer_type}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push(`/customers/${customerId}/edit`)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Customer</span>
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-[#3f72af]">${stats.total_revenue?.toLocaleString() || 0}</p>
                </div>
                <DollarSign className="w-10 h-10 text-gray-300" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Outstanding</p>
                  <p className="text-2xl font-bold text-orange-600">${stats.total_outstanding?.toLocaleString() || 0}</p>
                </div>
                <Clock className="w-10 h-10 text-orange-300" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.projects_count || 0}</p>
                </div>
                <Briefcase className="w-10 h-10 text-gray-300" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Project</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.avg_project_value?.toFixed(0) || 0}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-gray-300" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-1 ${activeTab === 'overview' ? 'border-b-2 border-[#3f72af] text-[#3f72af] font-medium' : 'text-gray-600'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-4 px-1 ${activeTab === 'activity' ? 'border-b-2 border-[#3f72af] text-[#3f72af] font-medium' : 'text-gray-600'}`}
            >
              Activity Timeline
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-base font-medium text-gray-900">{customer.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-base font-medium text-gray-900">{customer.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="text-base font-medium text-gray-900">{customer.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Customer Since</p>
                    <p className="text-base font-medium text-gray-900">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {customer.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Notes</p>
                  <p className="text-base text-gray-900">{customer.notes}</p>
                </div>
              )}
            </div>

            {/* Tags & Custom Fields */}
            <div className="space-y-6">
              {/* Tags */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
                  <button 
                    onClick={() => setShowTagModal(true)}
                    className="text-sm text-[#3f72af] hover:text-[#3f72af]/80 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Tag
                  </button>
                </div>
                {customer.tags && customer.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {customer.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center group">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-purple-500 hover:text-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No tags added</p>
                )}
              </div>

              {/* Custom Fields */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Custom Fields</h3>
                  <button 
                    onClick={() => setShowCustomFieldModal(true)}
                    className="text-sm text-[#3f72af] hover:text-[#3f72af]/80 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Field
                  </button>
                </div>
                {customer.custom_fields && customer.custom_fields.length > 0 ? (
                  <div className="space-y-3">
                    {customer.custom_fields.map((field: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{field.field_name}</p>
                          <p className="text-sm text-gray-600">{field.field_value}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveCustomField(field.field_name)}
                          className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No custom fields added</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Activity Timeline */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Timeline</h2>
            
            {activity.length > 0 ? (
              <div className="space-y-4">
                {activity.map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0">
                    <div className={`p-2 rounded-lg ${getActivityColor(item.activity_type)}`}>
                      {getActivityIcon(item.activity_type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                    {item.amount && (
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${item.amount.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No activity recorded yet</p>
            )}
          </div>
        )}

        {/* Tag Modal */}
        {showTagModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Add Tag</h3>
                <button
                  onClick={() => {
                    setShowTagModal(false);
                    setNewTag('');
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag Name *
                  </label>
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    placeholder="e.g., VIP, Seasonal, Priority"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    Common tags: VIP, Seasonal, Commercial, Residential, High Priority, Problematic
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 mt-6">
                <button
                  onClick={handleAddTag}
                  disabled={savingTag}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {savingTag ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Add Tag</span>
                </button>
                <button
                  onClick={() => {
                    setShowTagModal(false);
                    setNewTag('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Field Modal */}
        {showCustomFieldModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Add Custom Field</h3>
                <button
                  onClick={() => {
                    setShowCustomFieldModal(false);
                    setCustomFieldForm({ field_name: '', field_value: '', field_type: 'text' });
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field Name *
                  </label>
                  <input
                    type="text"
                    value={customFieldForm.field_name}
                    onChange={(e) => setCustomFieldForm({ ...customFieldForm, field_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    placeholder="e.g., Property Size, Gate Code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field Value *
                  </label>
                  <input
                    type="text"
                    value={customFieldForm.field_value}
                    onChange={(e) => setCustomFieldForm({ ...customFieldForm, field_value: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    placeholder="Enter value"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    Common fields: Property Size, Gate Code, Special Instructions, Equipment Required
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 mt-6">
                <button
                  onClick={handleAddCustomField}
                  disabled={savingCustomField}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {savingCustomField ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Add Field</span>
                </button>
                <button
                  onClick={() => {
                    setShowCustomFieldModal(false);
                    setCustomFieldForm({ field_name: '', field_value: '', field_type: 'text' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
