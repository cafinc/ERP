'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';
import api from '@/lib/api';
import {
  Users,
  Shield,
  Clock,
  CheckCircle,
  LayoutDashboard,
  UserPlus,
  Calendar,
  MapPin,
} from 'lucide-react';

export default function AccessDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalTeam: 0,
    activeCrew: 0,
    onlineNow: 0,
    totalShifts: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Load team stats
      const teamRes = await api.get('/team');
      const teamData = teamRes.data?.team || [];
      
      setStats({
        totalTeam: teamData.length,
        activeCrew: teamData.filter((m: any) => m.role === 'crew' && m.active).length,
        onlineNow: 0, // Will be loaded from tracking
        totalShifts: 0, // Will be loaded from shift history
      });
    } catch (error) {
      console.error('Error loading access stats:', error);
    }
  };

  const statCards = [
    {
      label: 'Total Team Members',
      value: stats.totalTeam,
      icon: Users,
      color: 'bg-[#5b8ec4]',
      href: '/team',
    },
    {
      label: 'Active Crew',
      value: stats.activeCrew,
      icon: Users,
      color: 'bg-green-500',
      href: '/crew',
    },
    {
      label: 'Online Now',
      value: stats.onlineNow,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      href: '/tracking',
    },
    {
      label: 'Total Shifts',
      value: stats.totalShifts,
      icon: Clock,
      color: 'bg-purple-500',
      href: '/shift-history',
    },
  ];

  return (
    <HybridNavigationTopBar>
      <div className="p-4 space-y-6">
        <CompactHeader
          title="Access Dashboard"
          icon={LayoutDashboard}
          badges={[
            { label: `${stats.totalTeam} Team`, color: 'blue' },
            { label: `${stats.activeCrew} Crew`, color: 'green' },
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

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => router.push('/team/create')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <UserPlus className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Add Team Member</span>
            </button>
            <button
              onClick={() => router.push('/crew')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              <Users className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">View Crew</span>
            </button>
            <button
              onClick={() => router.push('/shift-history')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
            >
              <Calendar className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Shift History</span>
            </button>
            <button
              onClick={() => router.push('/tracking')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
            >
              <MapPin className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Live Tracking</span>
            </button>
          </div>
        </div>

        {/* Team Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <p className="text-sm text-gray-600">Total Team</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTeam}</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-green-500" />
                <p className="text-sm text-gray-600">Mobile Crew</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.activeCrew}</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <p className="text-sm text-gray-600">Active Now</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.onlineNow}</p>
            </div>
          </div>
        </div>
      </div>
    </HybridNavigationTopBar>
  );
}
