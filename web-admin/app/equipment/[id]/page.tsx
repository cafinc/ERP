'use client';

import PageHeader from '@/components/PageHeader';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Truck,
  Calendar,
  Wrench,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Hash,
  FileText,
  User,
  Clock,
} from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  equipment_type: string;
  unit_number?: string;
  license_plate?: string;
  license_required: boolean;
  maintenance_due?: string;
  last_maintenance?: string;
  status: string;
  notes?: string;
  assigned_to?: string;
  active: boolean;
  created_at: string;
}

export default function EquipmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const equipmentId = (Array.isArray(params?.id) ? params.id[0] : params?.id) as string;
  
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (equipmentId && equipmentId !== 'undefined') {
      loadEquipment();
    }
  }, [equipmentId]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/equipment/${equipmentId}`);
      setEquipment(response.data);
    } catch (error) {
      console.error('Error loading equipment:', error);
      alert('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!confirm(`Update equipment status to ${newStatus}?`)) return;
    
    try {
      setActionLoading(true);
      await api.put(`/equipment/${equipmentId}`, { status: newStatus });
      alert('Status updated successfully!');
      loadEquipment();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this equipment? This action cannot be undone.')) return;
    
    try {
      setActionLoading(true);
      await api.delete(`/equipment/${equipmentId}`);
      alert('Equipment deleted successfully!');
      router.push('/equipment');
    } catch (error) {
      console.error('Error deleting equipment:', error);
      alert('Failed to delete equipment');
    } finally {
      setActionLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'plow_truck': 'Plow Truck',
      'truck': 'Truck',
      'loader': 'Loader',
      'skid_steer': 'Skid Steer',
      'sanding_truck': 'Sanding Truck',
      'brine_truck': 'Brine Truck',
      'cab_sweeper': 'Cab Sweeper',
      'single_stage_thrower': 'Single Stage Thrower',
      'gravely_sweeper': 'Gravely Sweeper'
    };
    return typeMap[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'in_use': return 'bg-blue-100 text-blue-700';
      case 'maintenance': return 'bg-orange-100 text-orange-700';
      case 'unavailable': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isMaintenanceDue = () => {
    if (!equipment?.maintenance_due) return false;
    const due = new Date(equipment.maintenance_due);
    const today = new Date();
    const daysUntilDue = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 7;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PageHeader
          title="Equipment Details"
          subtitle="View and manage details"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Equipment", href: "/equipment" }, { label: "Details" }]}
        />
        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
          </div>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Equipment not found</h2>
          <button
            onClick={() => router.push('/equipment')}
            className="mt-4 text-[#3f72af] hover:text-blue-800"
          >
            Return to Equipment
          </button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Equipment Details"
        subtitle={equipment.name}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Equipment", href: "/equipment" }, { label: "Details" }]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/equipment')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{equipment.name}</h1>
                <p className="text-gray-600 mt-1">{getTypeLabel(equipment.equipment_type)}</p>
              </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/equipment/${equipmentId}/edit`)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={actionLoading}
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              disabled={actionLoading}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(equipment.status)}`}>
            {equipment.status?.toUpperCase()}
          </span>
          {isMaintenanceDue() && (
            <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              MAINTENANCE DUE SOON
            </span>
          )}
          {equipment.license_required && (
            <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
              LICENSE REQUIRED
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleStatusUpdate('available')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium"
              disabled={actionLoading || equipment.status === 'available'}
            >
              <CheckCircle className="w-5 h-5" />
              Mark Available
            </button>
            <button
              onClick={() => handleStatusUpdate('in_use')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium"
              disabled={actionLoading || equipment.status === 'in_use'}
            >
              <Truck className="w-5 h-5" />
              Mark In Use
            </button>
            <button
              onClick={() => handleStatusUpdate('maintenance')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 font-medium"
              disabled={actionLoading || equipment.status === 'maintenance'}
            >
              <Wrench className="w-5 h-5" />
              Send to Maintenance
            </button>
            <button
              onClick={() => router.push(`/equipment/${equipmentId}/history`)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
            >
              <Clock className="w-5 h-5" />
              View History
            </button>
          </div>

        {/* Equipment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Equipment Information</h2>
            <div className="space-y-3">
              {equipment.unit_number && (
                <div className="flex items-center gap-3">
                  <Hash className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Unit Number</p>
                    <p className="text-sm font-medium text-gray-900">{equipment.unit_number}</p>
                  </div>
                </div>
              )}
              {equipment.license_plate && (
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">License Plate</p>
                    <p className="text-sm font-medium text-gray-900">{equipment.license_plate}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Added</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(equipment.created_at).toLocaleDateString()}
                  </p>
                </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance</h2>
            <div className="space-y-3">
              {equipment.last_maintenance && (
                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Last Maintenance</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(equipment.last_maintenance).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              {equipment.maintenance_due && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Next Maintenance Due</p>
                    <p className={`text-sm font-medium ${isMaintenanceDue() ? 'text-red-600' : 'text-gray-900'}`}>
                      {new Date(equipment.maintenance_due).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

        {/* Assignment */}
        {equipment.assigned_to && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Current Assignment
            </h2>
            <p className="text-gray-700">Assigned to: {equipment.assigned_to}</p>
          </div>
        )}

        {/* Notes */}
        {equipment.notes && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{equipment.notes}</p>
          </div>
        )}
        </div>
        </div>
        </div>
      </div>
      </div>
    </div>
  );
}
