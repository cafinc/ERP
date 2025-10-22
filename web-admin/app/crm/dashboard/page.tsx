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
            label: "New Customer",
            icon: <Users className="w-4 h-4 mr-2" />,
            variant: "secondary",
            onClick: () => router.push('/customers/create'),
          },
          {
            label: "New Lead",
            icon: <Users className="w-4 h-4 mr-2" />,
            variant: "secondary",
            onClick: () => router.push('/leads/create'),
          },
          {
            label: "New Estimate",
            icon: <FileText className="w-4 h-4 mr-2" />,
            variant: "secondary",
            onClick: () => router.push('/estimates/create'),
          },
          {
            label: "New Project",
            icon: <FolderOpen className="w-4 h-4 mr-2" />,
            variant: "secondary",
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

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity Feed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">New customer added</p>
                  <p className="text-xs text-gray-600">John Smith - Residential</p>
                  <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Estimate sent</p>
                  <p className="text-xs text-gray-600">EST-2024-156 - $4,500</p>
                  <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Project started</p>
                  <p className="text-xs text-gray-600">Maple Street Property</p>
                  <p className="text-xs text-gray-400 mt-1">Yesterday</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Payment received</p>
                  <p className="text-xs text-gray-600">INV-2024-089 - $3,200</p>
                  <p className="text-xs text-gray-400 mt-1">2 days ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700">Add Task</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Follow up: Smith Estimate</p>
                  <p className="text-xs text-gray-600 mt-1">Call customer about EST-2024-156</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="w-3 h-3 text-orange-600" />
                    <span className="text-xs text-orange-600 font-medium">Due Today</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Send estimate</p>
                  <p className="text-xs text-gray-600 mt-1">Oak Avenue Commercial Property</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="w-3 h-3 text-gray-600" />
                    <span className="text-xs text-gray-600">Tomorrow</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Site inspection</p>
                  <p className="text-xs text-gray-600 mt-1">Elm Street Parking Lot</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="w-3 h-3 text-gray-600" />
                    <span className="text-xs text-gray-600">Jan 26</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Contract renewal</p>
                  <p className="text-xs text-gray-600 mt-1">Downtown Plaza - Season 2025</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="w-3 h-3 text-gray-600" />
                    <span className="text-xs text-gray-600">Jan 28</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Calendar</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700">View Full</button>
            </div>
            <div className="mb-4">
              <div className="text-center mb-3">
                <p className="text-sm text-gray-600">January 2025</p>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                <div className="text-gray-500 font-medium">S</div>
                <div className="text-gray-500 font-medium">M</div>
                <div className="text-gray-500 font-medium">T</div>
                <div className="text-gray-500 font-medium">W</div>
                <div className="text-gray-500 font-medium">T</div>
                <div className="text-gray-500 font-medium">F</div>
                <div className="text-gray-500 font-medium">S</div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map(day => (
                  <div
                    key={day}
                    className={`aspect-square flex items-center justify-center rounded ${
                      day === 22 
                        ? 'bg-blue-600 text-white font-bold' 
                        : day === 23 || day === 26 
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-gray-700">Today (22nd)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-gray-700">Has appointments</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
