'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Fuel,
  TrendingUp,
  Calendar,
  DollarSign,
  Truck,
  Wrench,
  Box,
  X,
  Save,
  Filter,
  Download,
  LayoutGrid,
  List,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface FuelEntry {
  id: string;
  fuel_type: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  total_cost: number;
  date: string;
  equipment_id?: string;
  truck_id?: string;
  tool_id?: string;
  odometer_reading?: number;
  notes?: string;
  created_at: string;
}

export default function FuelPage() {
  const router = useRouter();
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FuelEntry | null>(null);
  
  // Resource data
  const [equipment, setEquipment] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    fuel_type: 'gasoline',
    quantity: '',
    unit: 'gallons',
    cost_per_unit: '',
    date: new Date().toISOString().split('T')[0],
    equipment_id: '',
    truck_id: '',
    tool_id: '',
    odometer_reading: '',
    notes: '',
  });

  useEffect(() => {
    loadFuelEntries();
    loadResources();
  }, []);

  const loadFuelEntries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/fuel');
      setFuelEntries(response.data || []);
    } catch (error) {
      console.error('Error loading fuel entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async () => {
    try {
      const [equipmentRes, trucksRes, toolsRes] = await Promise.all([
        api.get('/inventory').catch(() => ({ data: [] })),
        api.get('/trucks').catch((err) => {
          // Silently handle 404 for trucks endpoint if it doesn't exist yet
          if (err?.response?.status !== 404) {
            console.warn('Trucks endpoint error:', err?.response?.status);
          }
          return { data: [] };
        }),
        api.get('/tools').catch((err) => {
          // Silently handle 404 for tools endpoint if it doesn't exist yet
          if (err?.response?.status !== 404) {
            console.warn('Tools endpoint error:', err?.response?.status);
          }
          return { data: [] };
        }),
      ]);
      setEquipment(equipmentRes.data || []);
      setTrucks(trucksRes.data || []);
      setTools(toolsRes.data || []);
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalCost = parseFloat(formData.quantity) * parseFloat(formData.cost_per_unit);
    
    const payload = {
      ...formData,
      quantity: parseFloat(formData.quantity),
      cost_per_unit: parseFloat(formData.cost_per_unit),
      total_cost: totalCost,
      odometer_reading: formData.odometer_reading ? parseFloat(formData.odometer_reading) : undefined,
      equipment_id: formData.equipment_id || undefined,
      truck_id: formData.truck_id || undefined,
      tool_id: formData.tool_id || undefined,
    };

    try {
      if (editingEntry) {
        await api.put(`/fuel/${editingEntry.id}`, payload);
        alert('Fuel entry updated successfully!');
      } else {
        await api.post('/fuel', payload);
        alert('Fuel entry created successfully!');
      }
      
      resetForm();
      setShowModal(false);
      loadFuelEntries();
    } catch (error) {
      console.error('Error saving fuel entry:', error);
      alert('Failed to save fuel entry');
    }
  };

  const handleEdit = (entry: FuelEntry) => {
    setEditingEntry(entry);
    setFormData({
      fuel_type: entry.fuel_type,
      quantity: entry.quantity.toString(),
      unit: entry.unit,
      cost_per_unit: entry.cost_per_unit.toString(),
      date: entry.date.split('T')[0],
      equipment_id: entry.equipment_id || '',
      truck_id: entry.truck_id || '',
      tool_id: entry.tool_id || '',
      odometer_reading: entry.odometer_reading?.toString() || '',
      notes: entry.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fuel entry?')) return;
    
    try {
      await api.delete(`/fuel/${id}`);
      alert('Fuel entry deleted successfully!');
      loadFuelEntries();
    } catch (error) {
      console.error('Error deleting fuel entry:', error);
      alert('Failed to delete fuel entry');
    }
  };

  const resetForm = () => {
    setFormData({
      fuel_type: 'gasoline',
      quantity: '',
      unit: 'gallons',
      cost_per_unit: '',
      date: new Date().toISOString().split('T')[0],
      equipment_id: '',
      truck_id: '',
      tool_id: '',
      odometer_reading: '',
      notes: '',
    });
    setEditingEntry(null);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Fuel Type', 'Quantity', 'Unit', 'Cost/Unit', 'Total Cost', 'Resource', 'Odometer'];
    const rows = filteredEntries.map(entry => [
      new Date(entry.date).toLocaleDateString(),
      entry.fuel_type,
      entry.quantity,
      entry.unit,
      entry.cost_per_unit.toFixed(2),
      entry.total_cost.toFixed(2),
      getResourceName(entry),
      entry.odometer_reading || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fuel_entries_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getResourceName = (entry: FuelEntry) => {
    if (entry.equipment_id) {
      const eq = equipment.find(e => (e.id || e._id) === entry.equipment_id);
      return eq?.name || 'Equipment';
    }
    if (entry.truck_id) {
      const truck = trucks.find(t => (t.id || t._id) === entry.truck_id);
      return truck?.name || truck?.make + ' ' + truck?.model || 'Truck';
    }
    if (entry.tool_id) {
      const tool = tools.find(t => (t.id || t._id) === entry.tool_id);
      return tool?.name || 'Tool';
    }
    return 'Unassigned';
  };

  const getResourceIcon = (entry: FuelEntry) => {
    if (entry.equipment_id) return <Box className="w-4 h-4" />;
    if (entry.truck_id) return <Truck className="w-4 h-4" />;
    if (entry.tool_id) return <Wrench className="w-4 h-4" />;
    return <Fuel className="w-4 h-4" />;
  };

  const filteredEntries = fuelEntries.filter(entry => {
    const matchesSearch = entry.fuel_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         getResourceName(entry).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || entry.fuel_type === filterType;
    return matchesSearch && matchesType;
  });

  const totalFuelCost = filteredEntries.reduce((sum, entry) => sum + entry.total_cost, 0);
  const totalQuantity = filteredEntries.reduce((sum, entry) => sum + entry.quantity, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Fuel className="w-8 h-8 animate-spin text-[#3f72af]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <PageHeader
        title="Fuel Management"
        subtitle="Track fuel usage across equipment, vehicles, and tools"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Fuel" }
        ]}
        stats={[
          { label: 'Total Entries', value: fuelEntries.length, icon: <Fuel className="w-4 h-4" /> },
          { label: 'Total Cost', value: `$${totalFuelCost.toFixed(2)}`, icon: <DollarSign className="w-4 h-4" /> },
          { label: 'Total Fuel', value: `${totalQuantity.toFixed(1)} gal`, icon: <TrendingUp className="w-4 h-4" /> },
        ]}
        actions={[
          {
            label: 'Export',
            icon: <Download className="w-4 h-4 mr-2" />,
            onClick: exportToCSV,
            variant: 'secondary',
          },
          {
            label: 'Add Fuel Entry',
            icon: <Plus className="w-4 h-4 mr-2" />,
            onClick: () => {
              resetForm();
              setShowModal(true);
            },
            variant: 'primary',
          },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search fuel entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                />
              </div></div>

            {/* Fuel Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white"
            >
              <option value="all">All Fuel Types</option>
              <option value="gasoline">Gasoline</option>
              <option value="diesel">Diesel</option>
              <option value="propane">Propane</option>
              <option value="electric">Electric</option>
            </select>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-[#3f72af]' : 'text-gray-600'
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-[#3f72af]' : 'text-gray-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button></div></div></div>

        {/* Fuel Entries */}
        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <Fuel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Fuel Entries</h3>
            <p className="text-gray-600 mb-6">Start tracking fuel usage by adding your first entry</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-6 py-3 bg-[#3f72af] text-white rounded-xl hover:bg-[#2c5282] transition-colors font-semibold"
            >
              Add Fuel Entry
            </button></div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.map(entry => (
              <div
                key={entry.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-xl p-3">
                      <Fuel className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 capitalize">{entry.fuel_type}</h3>
                      <p className="text-sm text-gray-600">{new Date(entry.date).toLocaleDateString()}</p>
                    </div></div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button></div></div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Quantity</span>
                    <span className="font-bold text-gray-900">{entry.quantity} {entry.unit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cost/Unit</span>
                    <span className="font-semibold text-gray-900">${entry.cost_per_unit.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Total Cost</span>
                    <span className="font-bold text-lg text-[#3f72af]">${entry.total_cost.toFixed(2)}</span>
                  </div>
                  
                  {(entry.equipment_id || entry.truck_id || entry.tool_id) && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm">
                        {getResourceIcon(entry)}
                        <span className="font-medium text-gray-700">{getResourceName(entry)}</span>
                      </div></div>
                  )}
                  
                  {entry.odometer_reading && (
                    <div className="text-xs text-gray-600">
                      Odometer: {entry.odometer_reading.toLocaleString()} miles
                    </div>
                  )}
                </div></div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Fuel Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Cost/Unit</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Resource</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize font-medium text-gray-900">{entry.fuel_type}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {entry.quantity} {entry.unit}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${entry.cost_per_unit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-[#3f72af]">${entry.total_cost.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        {getResourceIcon(entry)}
                        {getResourceName(entry)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Fuel Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 flex items-center justify-between sticky top-0 z-10 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-3">
                  <Fuel className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{editingEntry ? 'Edit' : 'Add'} Fuel Entry</h2>
                  <p className="text-orange-100 text-sm">Track fuel usage for your resources</p>
                </div></div>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button></div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Fuel Details Card */}
              <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 backdrop-blur-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[#3f72af] to-[#2c5282] px-6 py-4">
                  <h3 className="text-lg font-bold text-white">Fuel Details</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Fuel Type *</label>
                      <select
                        value={formData.fuel_type}
                        onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                        required
                      >
                        <option value="gasoline">Gasoline</option>
                        <option value="diesel">Diesel</option>
                        <option value="propane">Propane</option>
                        <option value="electric">Electric</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                        required
                      />
                    </div></div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                      >
                        <option value="gallons">Gallons</option>
                        <option value="liters">Liters</option>
                        <option value="kwh">kWh</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Cost/Unit *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.cost_per_unit}
                          onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                          className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                          placeholder="0.00"
                          required
                        />
                      </div></div></div>

                  {formData.quantity && formData.cost_per_unit && (
                    <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">Total Cost:</span>
                        <span className="text-2xl font-bold text-green-600">
                          ${(parseFloat(formData.quantity) * parseFloat(formData.cost_per_unit)).toFixed(2)}
                        </span>
                      </div></div>
                  )}
                </div></div>

              {/* Resource Assignment Card */}
              <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 backdrop-blur-sm overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                  <h3 className="text-lg font-bold text-white">Assign to Resource</h3>
                  <p className="text-sm text-purple-100 mt-1">Link this fuel entry to equipment, truck, or tool</p>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Equipment</label>
                    <select
                      value={formData.equipment_id}
                      onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value, truck_id: '', tool_id: '' })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                    >
                      <option value="">No Equipment</option>
                      {equipment.map(item => (
                        <option key={item.id || item._id} value={item.id || item._id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Truck</label>
                    <select
                      value={formData.truck_id}
                      onChange={(e) => setFormData({ ...formData, truck_id: e.target.value, equipment_id: '', tool_id: '' })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                    >
                      <option value="">No Truck</option>
                      {trucks.map(item => (
                        <option key={item.id || item._id} value={item.id || item._id}>
                          {item.name || item.make + ' ' + item.model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tool</label>
                    <select
                      value={formData.tool_id}
                      onChange={(e) => setFormData({ ...formData, tool_id: e.target.value, equipment_id: '', truck_id: '' })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                    >
                      <option value="">No Tool</option>
                      {tools.map(item => (
                        <option key={item.id || item._id} value={item.id || item._id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Odometer Reading (optional)</label>
                    <input
                      type="number"
                      value={formData.odometer_reading}
                      onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                      placeholder="Miles"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                      placeholder="Additional notes..."
                    />
                  </div></div></div>

              {/* Modal Footer */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#3f72af] text-white rounded-xl hover:bg-[#2c5282] transition-all shadow-sm hover:shadow-md font-semibold flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editingEntry ? 'Update Entry' : 'Add Entry'}
                </button></div></form></div></div>
      )}
    </div>
  );
}
