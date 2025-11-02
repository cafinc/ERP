'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  FileText,
  ClipboardCheck,
  Eye,
  Edit,
  Search,
  Package,
  Truck,
  Car,
  Hammer,
} from 'lucide-react';

export default function AssetInspectionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'scheduled' | 'completed' | 'overdue'>('scheduled');
  const [inspections, setInspections] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    scheduled: 0,
    completed: 0,
    overdue: 0,
    dueToday: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load forms that can be used for inspections
      const formsRes = await api.get('/forms');
      const formsData = formsRes.data?.forms || [];
      setForms(formsData);

      // Mock inspection data - replace with actual API
      const mockInspections = [
        {
          id: 1,
          asset_name: 'Excavator 2024',
          asset_type: 'equipment',
          form_name: 'Heavy Equipment Inspection',
          form_id: 'form-1',
          scheduled_date: '2025-06-22',
          due_date: '2025-06-22',
          status: 'scheduled',
          inspector: 'John Doe',
          priority: 'high',
        },
        {
          id: 2,
          asset_name: 'Pickup Truck #123',
          asset_type: 'vehicle',
          form_name: 'Vehicle Safety Inspection',
          form_id: 'form-2',
          scheduled_date: '2025-06-20',
          completed_date: '2025-06-20',
          status: 'completed',
          inspector: 'Jane Smith',
          result: 'passed',
        },
        {
          id: 3,
          asset_name: 'Trailer Unit A',
          asset_type: 'trailer',
          form_name: 'Trailer Inspection Form',
          form_id: 'form-3',
          scheduled_date: '2025-06-15',
          due_date: '2025-06-15',
          status: 'overdue',
          inspector: 'Mike Johnson',
          priority: 'urgent',
          days_overdue: 7,
        },
      ];

      setInspections(mockInspections);
      setStats({
        scheduled: mockInspections.filter(i => i.status === 'scheduled').length,
        completed: mockInspections.filter(i => i.status === 'completed').length,
        overdue: mockInspections.filter(i => i.status === 'overdue').length,
        dueToday: mockInspections.filter(i => i.due_date === new Date().toISOString().split('T')[0]).length,
      });
    } catch (error) {
      console.error('Error loading inspections:', error);
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

  const filteredInspections = inspections.filter(inspection => {
    const matchesTab = inspection.status === activeTab;
    const matchesSearch = !searchQuery || 
      inspection.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspection.form_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const tabs = [
    { label: 'Scheduled', value: 'scheduled', count: stats.scheduled },
    { label: 'Completed', value: 'completed', count: stats.completed },
    { label: 'Overdue', value: 'overdue', count: stats.overdue },
  ];

  return (
    <div className="p-4">
      <PageHeader
        title="Asset Inspections"
        subtitle="Schedule and track asset inspections using forms"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Assets', href: '/asset/dashboard' },
          { label: 'Inspections' },
        ]}
        actions={[
          {
            label: 'Schedule Inspection',
            onClick: () => router.push('/asset/inspections/create'),
            variant: 'primary',
          },
          {
            label: 'Manage Forms',
            onClick: () => router.push('/forms'),
            variant: 'secondary',
          },
        ]}
      />

      <div className="max-w-7xl mx-auto mt-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{stats.scheduled}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Due Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.dueToday}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.value
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search inspections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Inspections List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading inspections...</div>
            ) : filteredInspections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No {activeTab} inspections found
              </div>
            ) : (
              filteredInspections.map((inspection) => {
                const AssetIcon = getAssetIcon(inspection.asset_type);
                return (
                  <div
                    key={inspection.id}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg">
                          <AssetIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{inspection.asset_name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {inspection.form_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {inspection.status === 'completed' 
                                ? `Completed: ${inspection.completed_date}`
                                : `Due: ${inspection.due_date}`}
                            </span>
                            <span>Inspector: {inspection.inspector}</span>
                          </div>
                          {inspection.status === 'overdue' && (
                            <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              {inspection.days_overdue} days overdue
                            </span>
                          )}
                          {inspection.status === 'completed' && inspection.result && (
                            <span className={`inline-flex items-center gap-1 mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                              inspection.result === 'passed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              <CheckCircle className="w-3 h-3" />
                              {inspection.result === 'passed' ? 'Passed' : 'Failed'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {inspection.status === 'scheduled' && (
                          <button
                            onClick={() => router.push(`/forms/${inspection.form_id}?asset=${inspection.id}`)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                            Start Inspection
                          </button>
                        )}
                        {inspection.status === 'completed' && (
                          <button
                            onClick={() => router.push(`/forms/${inspection.form_id}/submissions/${inspection.id}`)}
                            className="px-3 py-1.5 text-gray-700 hover:bg-white rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View Report
                          </button>
                        )}
                        {inspection.status === 'overdue' && (
                          <button
                            onClick={() => router.push(`/forms/${inspection.form_id}?asset=${inspection.id}`)}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-1"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            Complete Now
                          </button>
                        )}
                        <button
                          className="p-2 text-gray-600 hover:bg-white rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Available Inspection Forms */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Available Inspection Forms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {forms.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-gray-500">
                No inspection forms available. <button onClick={() => router.push('/forms')} className="text-blue-600 hover:underline">Create one</button>
              </div>
            ) : (
              forms.slice(0, 6).map((form) => (
                <button
                  key={form.id || form._id}
                  onClick={() => router.push(`/forms/${form.id || form._id}`)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{form.title || form.name || 'Untitled Form'}</h3>
                      <p className="text-sm text-gray-600 mt-1">{form.description || 'No description'}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          {forms.length > 6 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => router.push('/forms')}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                View all {forms.length} forms →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
