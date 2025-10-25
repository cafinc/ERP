'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Calendar,
  Clock,
  Users,
  Truck,
  MapPin,
  CheckSquare,
  Square,
} from 'lucide-react';

export default function DispatchCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  
  const [dispatchForm, setDispatchForm] = useState({
    route_name: '',
    scheduled_date: '',
    scheduled_time: '08:00',
    services: [] as string[],
    crew_ids: [] as string[],
    equipment_ids: [] as string[],
    site_ids: [] as string[],
    notes: '',
  });

  const availableServices = [
    { value: 'plowing', label: 'Snow Plowing' },
    { value: 'salting', label: 'Salting' },
    { value: 'sanding', label: 'Sanding' },
    { value: 'shoveling', label: 'Shoveling' },
    { value: 'ice_removal', label: 'Ice Removal' },
    { value: 'brining', label: 'Brining' },
    { value: 'hauling', label: 'Snow Hauling' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, equipmentRes, sitesRes] = await Promise.all([
        api.get('/users/messageable').catch(() => ({ data: [] })),
        api.get('/equipment').catch(() => ({ data: [] })),
        api.get('/sites').catch(() => ({ data: [] })),
      ]);
      
      setUsers(usersRes.data || []);
      setEquipment(equipmentRes.data || []);
      setSites(sitesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (service: string) => {
    setDispatchForm(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleCrewToggle = (crewId: string) => {
    setDispatchForm(prev => ({
      ...prev,
      crew_ids: prev.crew_ids.includes(crewId)
        ? prev.crew_ids.filter(id => id !== crewId)
        : [...prev.crew_ids, crewId]
    }));
  };

  const handleEquipmentToggle = (equipmentId: string) => {
    setDispatchForm(prev => ({
      ...prev,
      equipment_ids: prev.equipment_ids.includes(equipmentId)
        ? prev.equipment_ids.filter(id => id !== equipmentId)
        : [...prev.equipment_ids, equipmentId]
    }));
  };

  const handleSiteToggle = (siteId: string) => {
    setDispatchForm(prev => ({
      ...prev,
      site_ids: prev.site_ids.includes(siteId)
        ? prev.site_ids.filter(id => id !== siteId)
        : [...prev.site_ids, siteId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dispatchForm.route_name || !dispatchForm.scheduled_date) {
      alert('Please fill in route name and scheduled date');
      return;
    }

    if (dispatchForm.services.length === 0) {
      alert('Please select at least one service');
      return;
    }

    if (dispatchForm.site_ids.length === 0) {
      alert('Please select at least one site');
      return;
    }

    try {
      setSaving(true);
      const response = await api.post('/dispatches', dispatchForm);
      alert('Dispatch created successfully!');
      router.push(`/dispatch/${response.data._id}`);
    } catch (error: any) {
      console.error('Error creating dispatch:', error);
      alert(error.response?.data?.detail || 'Failed to create dispatch');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center space-x-4">
          <button
            onClick={() => router.push('/dispatch')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Dispatch</h1>
            <p className="text-gray-600 mt-1">Schedule a new service route</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-5xl">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Route Name *
                  </label>
                  <input
                    type="text"
                    value={dispatchForm.route_name}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, route_name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Downtown Route, North Zone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={dispatchForm.scheduled_date}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, scheduled_date: e.target.value })}
                      required
                      className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      value={dispatchForm.scheduled_time}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, scheduled_time: e.target.value })}
                      required
                      className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Services *</h2>
              <p className="text-sm text-gray-600 mb-4">Select the services to be performed</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableServices.map((service) => (
                  <button
                    key={service.value}
                    type="button"
                    onClick={() => handleServiceToggle(service.value)}
                    className={`flex items-center justify-between p-3 border-2 rounded-lg transition-all ${
                      dispatchForm.services.includes(service.value)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm font-medium">{service.label}</span>
                    {dispatchForm.services.includes(service.value) ? (
                      <CheckSquare className="w-5 h-5 text-[#3f72af]" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Crew Selection */}
            <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Crew Members</h2>
                  <p className="text-sm text-gray-600">Select crew members for this dispatch</p>
                </div>
                <div className="text-sm text-gray-600">
                  <Users className="w-4 h-4 inline mr-1" />
                  {dispatchForm.crew_ids.length} selected
                </div>
              </div>
              
              {users.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {users.map((user) => (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => handleCrewToggle(user._id)}
                      className={`flex items-center justify-between p-3 border-2 rounded-lg transition-all ${
                        dispatchForm.crew_ids.includes(user._id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-gray-400" />
                        <div className="text-left">
                          <p className="text-sm font-medium">{user.username || user.email}</p>
                          <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                      </div>
                      {dispatchForm.crew_ids.includes(user._id) ? (
                        <CheckSquare className="w-5 h-5 text-[#3f72af]" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No crew members available</p>
              )}
            </div>

            {/* Equipment Selection */}
            <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Equipment</h2>
                  <p className="text-sm text-gray-600">Select equipment for this dispatch</p>
                </div>
                <div className="text-sm text-gray-600">
                  <Truck className="w-4 h-4 inline mr-1" />
                  {dispatchForm.equipment_ids.length} selected
                </div>
              </div>
              
              {equipment.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {equipment.map((equip) => (
                    <button
                      key={equip._id}
                      type="button"
                      onClick={() => handleEquipmentToggle(equip._id)}
                      className={`flex items-center justify-between p-3 border-2 rounded-lg transition-all ${
                        dispatchForm.equipment_ids.includes(equip._id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Truck className="w-5 h-5 text-gray-400" />
                        <div className="text-left">
                          <p className="text-sm font-medium">{equip.name}</p>
                          <p className="text-xs text-gray-500">{equip.type}</p>
                        </div>
                      </div>
                      {dispatchForm.equipment_ids.includes(equip._id) ? (
                        <CheckSquare className="w-5 h-5 text-[#3f72af]" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No equipment available</p>
              )}
            </div>

            {/* Site Selection */}
            <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Sites *</h2>
                  <p className="text-sm text-gray-600">Select sites to service</p>
                </div>
                <div className="text-sm text-gray-600">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  {dispatchForm.site_ids.length} selected
                </div>
              </div>
              
              {sites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {sites.map((site) => (
                    <button
                      key={site._id}
                      type="button"
                      onClick={() => handleSiteToggle(site._id)}
                      className={`flex items-center justify-between p-3 border-2 rounded-lg transition-all ${
                        dispatchForm.site_ids.includes(site._id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div className="text-left">
                          <p className="text-sm font-medium">{site.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">{site.address}</p>
                        </div>
                      </div>
                      {dispatchForm.site_ids.includes(site._id) ? (
                        <CheckSquare className="w-5 h-5 text-[#3f72af]" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No sites available</p>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl shadow-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <textarea
                value={dispatchForm.notes}
                onChange={(e) => setDispatchForm({ ...dispatchForm, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Add any additional notes or instructions..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Create Dispatch</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dispatch')}
                className="flex-1 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
  );
}
