'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
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
  Car,
  Package,
  Hammer,
} from 'lucide-react';

export default function AssetDashboardPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [stats, setStats] = useState({
    totalAssets: 0,
    operational: 0,
    maintenance: 0,
    inspectionsDue: 0,
    equipment: 0,
    vehicles: 0,
    trailers: 0,
    tools: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const equipmentRes = await api.get('/equipment');
      const equipmentData = equipmentRes.data?.equipment || [];
      
      // Categorize assets
      const equipment = equipmentData.filter((e: any) => e.type === 'equipment' || !e.type);
      const vehicles = equipmentData.filter((e: any) => e.type === 'vehicle');
      const trailers = equipmentData.filter((e: any) => e.type === 'trailer');
      const tools = equipmentData.filter((e: any) => e.type === 'tool');
      
      setStats({
        totalAssets: equipmentData.length,
        operational: equipmentData.filter((e: any) => e.status === 'operational').length,
        maintenance: equipmentData.filter((e: any) => e.status === 'maintenance').length,
        inspectionsDue: 0,
        equipment: equipment.length,
        vehicles: vehicles.length,
        trailers: trailers.length,
        tools: tools.length,
      });
    } catch (error) {
      console.error('Error loading asset stats:', error);
    }
  };

  const categoryTabs = [
    { label: 'All Assets', value: 'all', count: stats.totalAssets },
    { label: 'Equipment', value: 'equipment', count: stats.equipment },
    { label: 'Vehicles', value: 'vehicles', count: stats.vehicles },
    { label: 'Trailers', value: 'trailers', count: stats.trailers },
    { label: 'Tools', value: 'tools', count: stats.tools },
  ];

  const statCards = [
    {
      label: 'Total Assets',
      value: stats.totalAssets,
      icon: Package,
      color: 'bg-[#5b8ec4]',
      href: '/asset',
    },
    {
      label: 'Equipment',
      value: stats.equipment,
      icon: Truck,
      color: 'bg-blue-500',
      href: '/asset',
    },
    {
      label: 'Vehicles',
      value: stats.vehicles,
      icon: Car,
      color: 'bg-purple-500',
      href: '/asset',
    },
    {
      label: 'Trailers',
      value: stats.trailers,
      icon: Truck,
      color: 'bg-indigo-500',
      href: '/asset',
    },
    {
      label: 'Tools',
      value: stats.tools,
      icon: Hammer,
      color: 'bg-orange-500',
      href: '/asset',
    },
    {
      label: 'Operational',
      value: stats.operational,
      icon: CheckCircle,
      color: 'bg-green-500',
      href: '/asset',
    },
    {
      label: 'In Maintenance',
      value: stats.maintenance,
      icon: Wrench,
      color: 'bg-red-500',
      href: '/asset/maintenance',
    },
    {
      label: 'Inspections Due',
      value: stats.inspectionsDue,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      href: '/asset/inspections',
    },
  ];

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Asset Dashboard"
        subtitle="Manage equipment, vehicles, trailers, and tools"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Assets", href: "/asset/dashboard" }, { label: "Dashboard" }]}
        actions={[
          { 
            label: 'Add Asset', 
            onClick: () => router.push('/asset/create'), 
            variant: 'primary'
          },
          { 
            label: 'Schedule Maintenance', 
            onClick: () => router.push('/asset/maintenance'), 
            variant: 'secondary'
          },
          { 
            label: 'View Inspections', 
            onClick: () => router.push('/asset/inspections'), 
            variant: 'secondary'
          },
          { 
            label: 'All Assets', 
            onClick: () => router.push('/asset'), 
            variant: 'secondary'
          },
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

        {/* Asset Categories Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Asset Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Truck className="w-5 h-5 text-blue-500" />
                <p className="text-sm text-gray-600">Equipment</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.equipment}</p>
              <p className="text-xs text-gray-500 mt-1">Heavy machinery</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Car className="w-5 h-5 text-purple-500" />
                <p className="text-sm text-gray-600">Vehicles</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.vehicles}</p>
              <p className="text-xs text-gray-500 mt-1">Cars and trucks</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Truck className="w-5 h-5 text-indigo-500" />
                <p className="text-sm text-gray-600">Trailers</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.trailers}</p>
              <p className="text-xs text-gray-500 mt-1">Transport trailers</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Hammer className="w-5 h-5 text-orange-500" />
                <p className="text-sm text-gray-600">Tools</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.tools}</p>
              <p className="text-xs text-gray-500 mt-1">Hand and power tools</p>
            </div>
          </div>
        </div>

        {/* Equipment Status Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Asset Status</h2>
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
                <Wrench className="w-5 h-5 text-red-500" />
                <p className="text-sm text-gray-600">In Maintenance</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.maintenance}</p>
              <p className="text-xs text-gray-500 mt-1">Under repair or service</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <p className="text-sm text-gray-600">Inspections Due</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.inspectionsDue}</p>
              <p className="text-xs text-gray-500 mt-1">Requires inspection</p>
            </div>
          </div>
        </div>
      </div>
  );
}
