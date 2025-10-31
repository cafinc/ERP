'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  ArrowLeft,
  Save,
  Building2,
  Users,
  Wrench,
  FileText,
  ClipboardList,
  Package,
  Calendar,
  Clock,
  DollarSign,
  Image as ImageIcon,
  Plus,
  X,
  Search,
} from 'lucide-react';

interface SelectOption {
  id: string;
  name: string;
  address?: string;
}

export default function CreateTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'general',
    priority: 'medium',
    status: 'pending',
    due_date: '',
    estimated_hours: '',
    billable: true,
    
    // Relations
    site_id: '',
    customer_id: '',
    work_order_id: '',
    service_ids: [] as string[],
    form_ids: [] as string[],
    equipment_ids: [] as string[],
    
    // Assignments
    assigned_to: [] as any[],
    
    // Checklist
    checklist: [] as any[],
  });

  // Options data
  const [sites, setSites] = useState<SelectOption[]>([]);
  const [customers, setCustomers] = useState<SelectOption[]>([]);
  const [workOrders, setWorkOrders] = useState<SelectOption[]>([]);
  const [services, setServices] = useState<SelectOption[]>([]);
  const [forms, setForms] = useState<SelectOption[]>([]);
  const [equipment, setEquipment] = useState<SelectOption[]>([]);
  const [users, setUsers] = useState<SelectOption[]>([]);

  // UI state
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [searchUser, setSearchUser] = useState('');

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      setLoading(true);
      const [sitesRes, customersRes, workOrdersRes, servicesRes, formsRes, equipmentRes, usersRes] = await Promise.all([
        api.get('/sites'),
        api.get('/customers'),
        api.get('/work-orders'),
        api.get('/services'),
        api.get('/form-templates'),
        api.get('/equipment'),
        api.get('/users'),
      ]);

      setSites(sitesRes.data || []);
      setCustomers(customersRes.data || []);
      setWorkOrders(workOrdersRes.data || []);
      setServices(servicesRes.data || []);
      setForms(formsRes.data || []);
      setEquipment(equipmentRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error fetching options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/tasks', {
        ...formData,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
      });
      
      router.push('/tasks');
    } catch (error: any) {
      console.error('Error creating task:', error);
      alert(error.response?.data?.detail || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setFormData({
        ...formData,
        checklist: [
          ...formData.checklist,
          {
            id: Date.now().toString(),
            text: newChecklistItem,
            completed: false,
            required: false,
          },
        ],
      });
      setNewChecklistItem('');
    }
  };

  const removeChecklistItem = (id: string) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.filter((item) => item.id !== id),
    });
  };

  const toggleChecklistRequired = (id: string) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.map((item) =>
        item.id === id ? { ...item, required: !item.required } : item
      ),
    });
  };

  const toggleAssignment = (userId: string, userName: string, role: string = 'team_member') => {
    const existing = formData.assigned_to.find((a) => a.user_id === userId);
    if (existing) {
      setFormData({
        ...formData,
        assigned_to: formData.assigned_to.filter((a) => a.user_id !== userId),
      });
    } else {
      setFormData({
        ...formData,
        assigned_to: [
          ...formData.assigned_to,
          {
            user_id: userId,
            name: userName,
            role,
            notify_email: true,
            notify_app: true,
          },
        ],
      });
    }
  };

  const taskTypes = [
    { value: 'general', label: 'General' },
    { value: 'work_order', label: 'Work Order' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'estimate', label: 'Estimate' },
    { value: 'project', label: 'Project' },
    { value: 'emergency', label: 'Emergency' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', icon: '📝', color: 'gray' },
    { value: 'medium', label: 'Medium', icon: '📋', color: 'blue' },
    { value: 'high', label: 'High', icon: '⚡', color: 'orange' },
    { value: 'urgent', label: 'Urgent', icon: '🚨', color: 'red' },
  ];

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchUser.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f72af]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Create Task"
        subtitle="Create a new task with all details"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Tasks', href: '/tasks' },
          { label: 'Create' },
        ]}
        actions={[
          {
            label: 'Cancel',
            onClick: () => router.back(),
            icon: <ArrowLeft className="w-4 h-4 mr-2" />,
            variant: 'secondary' as const,
          },
        ]}
      />

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                  placeholder="Enter task title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                  placeholder="Enter task description..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                  >
                    {taskTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <div className="grid grid-cols-4 gap-2">
                    {priorities.map((priority) => (
                      <button
                        key={priority.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: priority.value })}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          formData.priority === priority.value
                            ? `bg-${priority.color}-500 text-white border-${priority.color}-500`
                            : 'bg-white text-gray-700 border-gray-300 hover:border-[#3f72af]'
                        }`}
                      >
                        {priority.icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af]"
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="billable"
                  checked={formData.billable}
                  onChange={(e) => setFormData({ ...formData, billable: e.target.checked })}
                  className="w-4 h-4 text-[#3f72af] border-gray-300 rounded focus:ring-[#3f72af]"
                />
                <label htmlFor="billable" className="ml-2 text-sm text-gray-700">
                  Billable task
                </label>
              </div>
            </div>
          </div>

          {/* Relations - Continued in next message due to length */}
          
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Task
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
