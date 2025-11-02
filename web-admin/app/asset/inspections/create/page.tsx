'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import { Calendar, Save, X, Package, Truck, Car, Hammer, AlertCircle, FileText, User } from 'lucide-react';

export default function ScheduleInspectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [inspectors, setInspectors] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    asset_id: '',
    form_id: '',
    scheduled_date: '',
    inspector_id: '',
    priority: 'medium',
    notes: '',
    recurring: false,
    recurring_interval: 'monthly',
  });
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load assets
      const assetsRes = await api.get('/equipment');
      setAssets(assetsRes.data?.equipment || []);

      // Load forms
      const formsRes = await api.get('/forms');
      setForms(formsRes.data?.forms || []);

      // Mock inspectors - replace with actual API
      setInspectors([
        { id: 'inspector-1', name: 'John Doe', role: 'Senior Inspector' },
        { id: 'inspector-2', name: 'Jane Smith', role: 'Inspector' },
        { id: 'inspector-3', name: 'Mike Johnson', role: 'Lead Technician' },
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.asset_id) newErrors.asset_id = 'Please select an asset';
    if (!formData.form_id) newErrors.form_id = 'Please select an inspection form';
    if (!formData.scheduled_date) newErrors.scheduled_date = 'Please select a date';
    if (!formData.inspector_id) newErrors.inspector_id = 'Please assign an inspector';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // In production, this would call the actual API
      await api.post('/equipment-inspections', formData);
      alert('Inspection scheduled successfully!');
      router.push('/asset/inspections');
    } catch (error) {
      console.error('Error scheduling inspection:', error);
      alert('Failed to schedule inspection');
    } finally {
      setLoading(false);
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'vehicle': return Car;
      case 'trailer': return Truck;
      case 'tool': return Hammer;
      default: return Package;
    }
  };

  const selectedAsset = assets.find(a => a.id === formData.asset_id || a._id === formData.asset_id);
  const selectedForm = forms.find(f => f.id === formData.form_id || f._id === formData.form_id);

  return (
    <div className="p-4">
      <PageHeader
        title="Schedule Inspection"
        subtitle="Schedule a new asset inspection with form"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Assets', href: '/asset/dashboard' },
          { label: 'Inspections', href: '/asset/inspections' },
          { label: 'Schedule' },
        ]}
        actions={[
          {
            label: 'Cancel',
            onClick: () => router.push('/asset/inspections'),
            variant: 'secondary',
          },
        ]}
      />

      <div className="max-w-4xl mx-auto mt-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Asset Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Select Asset
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asset <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.asset_id}
                onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.asset_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select an asset...</option>
                {assets.map((asset) => {
                  const AssetIcon = getAssetIcon(asset.type);
                  return (
                    <option key={asset.id || asset._id} value={asset.id || asset._id}>
                      {asset.name} - {asset.type || 'equipment'}
                    </option>
                  );
                })}
              </select>
              {errors.asset_id && (
                <p className="mt-1 text-xs text-red-600">{errors.asset_id}</p>
              )}
              
              {selectedAsset && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Selected: <strong>{selectedAsset.name}</strong> ({selectedAsset.type || 'equipment'})</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form Selection */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Inspection Form
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Template <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.form_id}
                onChange={(e) => setFormData({ ...formData, form_id: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.form_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a form...</option>
                {forms.map((form) => (
                  <option key={form.id || form._id} value={form.id || form._id}>
                    {form.title || form.name || 'Untitled Form'}
                  </option>
                ))}
              </select>
              {errors.form_id && (
                <p className="mt-1 text-xs text-red-600">{errors.form_id}</p>
              )}
              
              {selectedForm && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>{selectedForm.title || selectedForm.name}</strong>
                  </p>
                  {selectedForm.description && (
                    <p className="text-xs text-green-700 mt-1">{selectedForm.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Schedule Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule Details
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.scheduled_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.scheduled_date && (
                  <p className="mt-1 text-xs text-red-600">{errors.scheduled_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Inspector Assignment */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Inspector Assignment
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Inspector <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.inspector_id}
                onChange={(e) => setFormData({ ...formData, inspector_id: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.inspector_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select an inspector...</option>
                {inspectors.map((inspector) => (
                  <option key={inspector.id} value={inspector.id}>
                    {inspector.name} - {inspector.role}
                  </option>
                ))}
              </select>
              {errors.inspector_id && (
                <p className="mt-1 text-xs text-red-600">{errors.inspector_id}</p>
              )}
            </div>
          </div>

          {/* Recurring Options */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="recurring"
                checked={formData.recurring}
                onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="recurring" className="text-sm font-medium text-gray-700">
                Set as recurring inspection
              </label>
            </div>

            {formData.recurring && (
              <div className="ml-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recurring Interval
                </label>
                <select
                  value={formData.recurring_interval}
                  onChange={(e) => setFormData({ ...formData, recurring_interval: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any special instructions or notes for this inspection..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.push('/asset/inspections')}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2d5a8f] font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Scheduling...' : 'Schedule Inspection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
