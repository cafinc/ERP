'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import {
  ArrowLeft,
  Edit,
  Calendar,
  Clock,
  Users,
  Truck,
  MapPin,
  RefreshCw,
  CheckCircle,
  PlayCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface Dispatch {
  _id: string;
  route_name: string;
  scheduled_date: string;
  scheduled_time: string;
  services: string[];
  crew_ids: string[];
  equipment_ids: string[];
  site_ids: string[];
  status: string;
  notes?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export default function DispatchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dispatchId = params?.id as string;
  
  const [dispatch, setDispatch] = useState<Dispatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (dispatchId) {
      loadDispatch();
    }
  }, [dispatchId]);

  const loadDispatch = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/dispatches/${dispatchId}`);
      setDispatch(response.data);
    } catch (error) {
      console.error('Error loading dispatch:', error);
      alert('Failed to load dispatch');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!confirm(`Change dispatch status to ${newStatus}?`)) return;

    try {
      setUpdating(true);
      await api.put(`/dispatches/${dispatchId}`, { status: newStatus });
      loadDispatch();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Dispatch Details"
          subtitle="View and manage dispatch details"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dispatch", href: "/dispatch" }, { label: "Details" }]}
        />
        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
          </div></div>
      </>
    );
  }

  if (!dispatch) {
    return (
      <>
        <PageHeader
          title="Dispatch Not Found"
          subtitle="The dispatch you're looking for doesn't exist"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dispatch", href: "/dispatch" }]}
        />
        <div className="p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Dispatch Not Found</h3>
            <button
              onClick={() => router.push('/dispatch')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dispatch</span>
            </button></div></div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dispatch Details"
        subtitle="View and manage dispatch information"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dispatch", href: "/dispatch" }, { label: "Details" }]}
      />
      <div className="p-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dispatch')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{dispatch.route_name}</h1>
              <p className="text-gray-600 mt-1">Dispatch Details</p>
            </div></div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`/dispatch/${dispatchId}/edit`)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button></div></div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dispatch Info */}
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Dispatch Information</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dispatch.status)}`}>
                  {dispatch.status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Scheduled Date</label>
                  <p className="text-base font-medium text-gray-900 mt-1 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {new Date(dispatch.scheduled_date).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Scheduled Time</label>
                  <p className="text-base font-medium text-gray-900 mt-1 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    {dispatch.scheduled_time}
                  </p>
                </div></div>

              {dispatch.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="text-sm text-gray-600">Notes</label>
                  <p className="text-base text-gray-900 mt-2">{dispatch.notes}</p>
                </div>
              )}
            </div>

            {/* Services */}
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Services</h2>
              <div className="flex flex-wrap gap-2">
                {dispatch.services.map((service, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg">
                    {service.replace('_', ' ')}
                  </span>
                ))}
              </div></div>

            {/* Crew & Equipment */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900">Crew Members</h3>
                </div>
                <p className="text-3xl font-bold text-[#3f72af]">{dispatch.crew_ids.length}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 mb-4">
                  <Truck className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900">Equipment</h3>
                </div>
                <p className="text-3xl font-bold text-[#3f72af]">{dispatch.equipment_ids.length}</p>
              </div></div></div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            {dispatch.status !== 'completed' && dispatch.status !== 'cancelled' && (
              <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Actions</h3>
                <div className="space-y-2">
                  {dispatch.status === 'scheduled' && (
                    <button
                      onClick={() => handleUpdateStatus('in_progress')}
                      disabled={updating}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Start Dispatch</span>
                    </button>
                  )}
                  {dispatch.status === 'in_progress' && (
                    <button
                      onClick={() => handleUpdateStatus('completed')}
                      disabled={updating}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Complete Dispatch</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateStatus('cancelled')}
                    disabled={updating}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel Dispatch</span>
                  </button></div></div>
            )}

            {/* Site Count */}
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">Sites</h3>
              </div>
              <p className="text-3xl font-bold text-[#3f72af]">{dispatch.site_ids.length}</p>
            </div></div></div></div>
    </>
  );
}
