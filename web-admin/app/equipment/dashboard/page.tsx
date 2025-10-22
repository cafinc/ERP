'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CompactHeader from '@/components/CompactHeader';
import api from '@/lib/api';
import {
  Truck,
  Wrench,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  LayoutDashboard,
  Plus,
} from 'lucide-react';

export default function EquipmentDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalEquipment: 0,
    operational: 0,
    maintenance: 0,
    inspectionsDue: 0,
    inspectionsCompleted: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const equipmentRes = await api.get('/equipment');
      const equipmentData = equipmentRes.data?.equipment || [];
      
      setStats({
        totalEquipment: equipmentData.length,
        operational: equipmentData.filter((e: any) => e.status === 'operational').length,
        maintenance: equipmentData.filter((e: any) => e.status === 'maintenance').length,
        inspectionsDue: 0, // Will be calculated from inspections
        inspectionsCompleted: 0,
      });
    } catch (error) {
      console.error('Error loading equipment stats:', error);
    }
  };

  const statCards = [
    {
      label: 'Total Equipment',
      value: stats.totalEquipment,
      icon: Truck,
      color: 'bg-[#5b8ec4]',
      href: '/equipment',
    },
    {
      label: 'Operational',
      value: stats.operational,
      icon: CheckCircle,
      color: 'bg-green-500',
      href: '/equipment',
    },
    {
      label: 'In Maintenance',
      value: stats.maintenance,
      icon: Wrench,
      color: 'bg-orange-500',
      href: '/equipment/maintenance',
    },
    {
      label: 'Inspections Due',
      value: stats.inspectionsDue,
      icon: AlertTriangle,
      color: 'bg-red-500',
      href: '/equipment/inspections',
    },
  ];

  return (
    <HybridNavigationTopBar>
      <div className="p-4 space-y-6">
        <CompactHeader
          title="Equipment Dashboard"
          icon={LayoutDashboard}
          badges={[
            { label: `${stats.totalEquipment} Total`, color: 'blue' },
            { label: `${stats.operational} Operational`, color: 'green' },
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

        {/* Equipment Status Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Equipment Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-sm text-gray-600">Operational</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.operational}</p>
              <p className="text-xs text-gray-500 mt-1">Ready for deployment</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Wrench className="w-5 h-5 text-orange-500" />
                <p className="text-sm text-gray-600">In Maintenance</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.maintenance}</p>
              <p className="text-xs text-gray-500 mt-1">Under repair or service</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-red-500" />
                <p className="text-sm text-gray-600">Inspections Due</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.inspectionsDue}</p>
              <p className="text-xs text-gray-500 mt-1">Requires inspection</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => router.push('/equipment/create')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Truck className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Add Equipment</span>
            </button>
            <button
              onClick={() => router.push('/equipment/maintenance')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
            >
              <Wrench className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Schedule Maintenance</span>
            </button>
            <button
              onClick={() => router.push('/equipment/inspections')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
            >
              <ClipboardList className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">View Inspections</span>
            </button>
            <button
              onClick={() => router.push('/equipment')}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              <Truck className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">All Equipment</span>
            </button>
          </div>
        </div>
      </div>
    </HybridNavigationTopBar>
  );
}
