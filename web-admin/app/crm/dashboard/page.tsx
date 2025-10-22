'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import {
  Users,
  FileText,
  FolderOpen,
  Receipt,
  FileSignature,
  TrendingUp,
  DollarSign,
  Calendar,
  LayoutDashboard,
  Plus,
} from 'lucide-react';

export default function CRMDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    customers: 0,
    estimates: 0,
    projects: 0,
    invoices: 0,
    agreements: 0,
    revenue: 0,
    outstanding: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Load CRM stats
      const [customersRes, projectsRes, invoicesRes] = await Promise.all([
        api.get('/customers'),
        api.get('/projects'),
        api.get('/invoices'),
      ]);

      const invoiceData = Array.isArray(invoicesRes.data) 
        ? invoicesRes.data 
        : (invoicesRes.data?.invoices || []);

      const totalRevenue = invoiceData.reduce((sum: number, inv: any) => 
        sum + (inv.amount_paid || 0), 0
      );
      
      const outstanding = invoiceData.reduce((sum: number, inv: any) => 
        sum + (inv.amount_due || 0), 0
      );

      setStats({
        customers: customersRes.data?.customers?.length || 0,
        estimates: 0, // Will be loaded when estimates API is ready
        projects: projectsRes.data?.projects?.length || 0,
        invoices: invoiceData.length,
        agreements: 0, // Will be loaded when contracts API is ready
        revenue: totalRevenue,
        outstanding: outstanding,
      });
    } catch (error) {
      console.error('Error loading CRM stats:', error);
    }
  };

  const statCards = [
    {
      label: 'Total Customers',
      value: stats.customers,
      icon: Users,
      color: 'bg-[#5b8ec4]',
      href: '/customers',
    },
    {
      label: 'Active Estimates',
      value: stats.estimates,
      icon: FileText,
      color: 'bg-purple-500',
      href: '/estimates',
    },
    {
      label: 'Active Projects',
      value: stats.projects,
      icon: FolderOpen,
      color: 'bg-green-500',
      href: '/projects',
    },
    {
      label: 'Total Invoices',
      value: stats.invoices,
      icon: Receipt,
      color: 'bg-orange-500',
      href: '/invoices',
    },
    {
      label: 'Agreements',
      value: stats.agreements,
      icon: FileSignature,
      color: 'bg-indigo-500',
      href: '/contracts',
    },
    {
      label: 'Total Revenue',
      value: `$${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      href: '/invoices',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="CRM Dashboard"
        subtitle="Manage customers, leads, estimates, projects, and revenue"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "CRM Dashboard" },
        ]}
        actions={[
          {
            label: "Customer",
            icon: <Users className="w-4 h-4 mr-2" />,
            variant: "secondary",
            onClick: () => router.push('/customers/create'),
          },
          {
            label: "Lead",
            icon: <Users className="w-4 h-4 mr-2" />,
            variant: "secondary",
            onClick: () => router.push('/leads/create'),
          },
          {
            label: "Estimate",
            icon: <FileText className="w-4 h-4 mr-2" />,
            variant: "secondary",
            onClick: () => router.push('/estimates/create'),
          },
          {
            label: "Project",
            icon: <FolderOpen className="w-4 h-4 mr-2" />,
            variant: "primary",
            onClick: () => router.push('/projects/create'),
          },
        ]}
      />
      
      <div className="p-6 space-y-6">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((stat) => (
            <button
              key={stat.label}
              onClick={() => router.push(stat.href)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Revenue Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">${stats.revenue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Outstanding</p>
              <p className="text-3xl font-bold text-orange-600">${stats.outstanding.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => router.push('/customers/create')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Users className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">New Customer</span>
            </button>
            <button
              onClick={() => router.push('/estimates/create')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
            >
              <FileText className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">New Estimate</span>
            </button>
            <button
              onClick={() => router.push('/projects/create')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              <FolderOpen className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">New Project</span>
            </button>
            <button
              onClick={() => router.push('/invoices/create')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
            >
              <Receipt className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">New Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
