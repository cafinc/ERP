'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  User,
  Calendar,
  FileText,
  Briefcase,
  MapPin,
  Search,
} from 'lucide-react';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Estimate {
  _id: string;
  estimate_number: string;
  customer_id: string;
  customer_name: string;
  total_amount: number;
  status: string;
}

export default function ProjectCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const estimateId = searchParams?.get('estimate_id');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [filteredEstimates, setFilteredEstimates] = useState<Estimate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [projectForm, setProjectForm] = useState({
    name: '',
    customer_id: '',
    estimate_id: estimateId || '',
    description: '',
    start_date: '',
    status: 'planning',
  });

  useEffect(() => {
    loadCustomers();
    loadEstimates();
  }, []);

  useEffect(() => {
    if (projectForm.customer_id) {
      const filtered = estimates.filter(e => e.customer_id === projectForm.customer_id);
      setFilteredEstimates(filtered);
    } else {
      setFilteredEstimates(estimates);
    }
  }, [projectForm.customer_id, estimates]);

  useEffect(() => {
    if (estimateId && estimates.length > 0) {
      const estimate = estimates.find(e => e._id === estimateId);
      if (estimate) {
        setProjectForm(prev => ({
          ...prev,
          customer_id: estimate.customer_id,
          name: `Project for ${estimate.customer_name}`,
        }));
      }
    }
  }, [estimateId, estimates]);

  const loadCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadEstimates = async () => {
    try {
      const response = await api.get('/estimates');
      // Filter accepted estimates only
      const acceptedEstimates = (response.data.estimates || []).filter(
        (e: Estimate) => e.status === 'accepted'
      );
      setEstimates(acceptedEstimates);
      setFilteredEstimates(acceptedEstimates);
    } catch (error) {
      console.error('Error loading estimates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectForm.name || !projectForm.customer_id || !projectForm.estimate_id) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      // Create project
      const response = await api.post('/projects', projectForm);
      
      alert('Project created successfully!');
      router.push(`/projects/${response.data._id}`);
    } catch (error: any) {
      console.error('Error creating project:', error);
      alert(error.response?.data?.detail || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    setProjectForm(prev => ({
      ...prev,
      customer_id: customerId,
      estimate_id: '', // Reset estimate when customer changes
    }));

    // Auto-fill project name with customer name
    const customer = customers.find(c => c._id === customerId);
    if (customer && !projectForm.name) {
      setProjectForm(prev => ({
        ...prev,
        name: `Project for ${customer.name}`,
      }));
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center space-x-4">
          <button
            onClick={() => router.push('/projects')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
            <p className="text-gray-600 mt-1">Fill in the details to create a new project</p>
          </div>
        </div>

        <div className="max-w-3xl">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            {/* Customer Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={projectForm.customer_id}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} - {customer.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Estimate Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimate *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={projectForm.estimate_id}
                  onChange={(e) => setProjectForm({ ...projectForm, estimate_id: e.target.value })}
                  required
                  disabled={!projectForm.customer_id}
                  className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {projectForm.customer_id ? 'Select an accepted estimate' : 'Select a customer first'}
                  </option>
                  {filteredEstimates.map((estimate) => (
                    <option key={estimate._id} value={estimate._id}>
                      {estimate.estimate_number} - ${estimate.total_amount.toLocaleString()} ({estimate.customer_name})
                    </option>
                  ))}
                </select>
              </div>
              {projectForm.customer_id && filteredEstimates.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  No accepted estimates found for this customer. Please create and accept an estimate first.
                </p>
              )}
            </div>

            {/* Project Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter project name"
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Enter project description (optional)"
              />
            </div>

            {/* Start Date */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={projectForm.start_date}
                  onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Status */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Status
              </label>
              <select
                value={projectForm.status}
                onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving || !projectForm.customer_id || !projectForm.estimate_id}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-600/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Create Project</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push('/projects')}
                className="flex-1 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Project Creation Notes:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Projects must be linked to an accepted estimate</li>
              <li>• You can add tasks and track progress after creating the project</li>
              <li>• The project will inherit financial details from the linked estimate</li>
              <li>• You can update project status and details at any time</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
