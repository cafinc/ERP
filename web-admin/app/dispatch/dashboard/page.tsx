'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import CompactHeader from '@/components/CompactHeader';
import api from '@/lib/api';
import {
  MapPin,
  Map,
  Users,
  CheckCircle,
  Clock,
  LayoutDashboard,
  Navigation,
  AlertCircle,
} from 'lucide-react';

export default function DispatchDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalSites: 0,
    activeSites: 0,
    totalRoutes: 0,
    activeCrews: 0,
    completedToday: 0,
    pending: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const sitesRes = await api.get('/sites');
      const sitesData = sitesRes.data || [];
      
      setStats({
        totalSites: sitesData.length,
        activeSites: sitesData.filter((s: any) => s.active).length,
        totalRoutes: 0, // Will be loaded from routes
        activeCrews: 0, // Will be loaded from tracking
        completedToday: 0,
        pending: 0,
      });
    } catch (error) {
      console.error('Error loading dispatch stats:', error);
    }
  };

  const statCards = [
    {
      label: 'Total Sites',
      value: stats.totalSites,
      icon: MapPin,
      color: 'bg-blue-500',
      href: '/sites',
    },
    {
      label: 'Active Sites',
      value: stats.activeSites,
      icon: CheckCircle,
      color: 'bg-green-500',
      href: '/sites',
    },
    {
      label: 'Total Routes',
      value: stats.totalRoutes,
      icon: Map,
      color: 'bg-purple-500',
      href: '/routes',
    },
    {
      label: 'Active Crews',
      value: stats.activeCrews,
      icon: Users,
      color: 'bg-orange-500',
      href: '/tracking',
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 space-y-6">
        <CompactHeader
          title="Dispatch Dashboard"
          icon={LayoutDashboard}
          badges={[
            { label: `${stats.totalSites} Sites`, color: 'blue' },
            { label: `${stats.activeCrews} Active Crews`, color: 'orange' },
          ]}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Today's Operations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.completedToday}</p>
              <p className="text-xs text-gray-500 mt-1">Sites serviced</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.activeCrews}</p>
              <p className="text-xs text-gray-500 mt-1">Crews working</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-xs text-gray-500 mt-1">Sites remaining</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => router.push('/sites/create')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <MapPin className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Add Site</span>
            </button>
            <button
              onClick={() => router.push('/routes/create')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
            >
              <Navigation className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Create Route</span>
            </button>
            <button
              onClick={() => router.push('/tracking')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              <Users className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Live Tracking</span>
            </button>
            <button
              onClick={() => router.push('/sites')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
            >
              <MapPin className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">View All Sites</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
