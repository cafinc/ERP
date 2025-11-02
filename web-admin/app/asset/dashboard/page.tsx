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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Filter,
  Download,
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

// Color palette for charts
const CHART_COLORS = {
  primary: '#5b8ec4',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  purple: '#a855f7',
  indigo: '#6366f1',
};

const PIE_COLORS = ['#5b8ec4', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#6366f1'];

export default function AssetDashboardPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [dateRange, setDateRange] = useState('30d'); // 7d, 30d, 90d, 1y
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

  // Analytics data
  const [utilizationData, setUtilizationData] = useState<any[]>([]);
  const [costData, setCostData] = useState<any[]>([]);
  const [maintenanceData, setMaintenanceData] = useState<any[]>([]);
  const [assetDistribution, setAssetDistribution] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    generateAnalyticsData();
  }, [dateRange]);

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

  const generateAnalyticsData = () => {
    // Generate utilization trend data (last 7 days/weeks/months based on range)
    const periods = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 12 : 12;
    const utilizationTrend = [];
    for (let i = periods - 1; i >= 0; i--) {
      const label = dateRange === '7d' ? `Day ${periods - i}` : 
                    dateRange === '30d' ? `Day ${periods - i}` :
                    dateRange === '90d' ? `Week ${periods - i}` : `Month ${periods - i}`;
      utilizationTrend.push({
        name: label,
        utilization: Math.floor(Math.random() * 30 + 60), // 60-90%
        idle: Math.floor(Math.random() * 20 + 5), // 5-25%
        maintenance: Math.floor(Math.random() * 15 + 5), // 5-20%
      });
    }
    setUtilizationData(utilizationTrend);

    // Generate cost analysis data
    const costTrend = [];
    for (let i = 5; i >= 0; i--) {
      const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][5 - i];
      costTrend.push({
        name: month,
        operational: Math.floor(Math.random() * 20000 + 30000),
        maintenance: Math.floor(Math.random() * 10000 + 5000),
        repairs: Math.floor(Math.random() * 8000 + 2000),
      });
    }
    setCostData(costTrend);

    // Generate maintenance schedule data
    const maintenanceTrend = [];
    for (let i = 5; i >= 0; i--) {
      const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][5 - i];
      maintenanceTrend.push({
        name: month,
        scheduled: Math.floor(Math.random() * 15 + 10),
        completed: Math.floor(Math.random() * 12 + 8),
        overdue: Math.floor(Math.random() * 3),
      });
    }
    setMaintenanceData(maintenanceTrend);

    // Asset distribution by type
    setAssetDistribution([
      { name: 'Equipment', value: stats.equipment || 25 },
      { name: 'Vehicles', value: stats.vehicles || 18 },
      { name: 'Trailers', value: stats.trailers || 12 },
      { name: 'Tools', value: stats.tools || 45 },
    ]);

    // Asset status distribution
    setStatusDistribution([
      { name: 'Operational', value: stats.operational || 75 },
      { name: 'Maintenance', value: stats.maintenance || 15 },
      { name: 'Idle', value: Math.floor((stats.totalAssets || 100) * 0.1) },
      { name: 'Out of Service', value: Math.floor((stats.totalAssets || 100) * 0.05) },
    ]);
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
        title="Asset Analytics Dashboard"
        subtitle="Real-time insights and analytics for all assets"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Assets", href: "/asset/dashboard" }, { label: "Analytics" }]}
        actions={[
          { 
            label: 'Add Asset', 
            onClick: () => router.push('/asset/create'), 
            variant: 'primary',
            icon: <Plus className="w-4 h-4" />
          },
          { 
            label: 'All Assets', 
            onClick: () => router.push('/asset'), 
            variant: 'secondary'
          },
        ]}
      />

      {/* Date Range Filter */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
        </div>
        <div className="flex space-x-2">
          {['7d', '30d', '90d', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dateRange === range
                  ? 'bg-[#5b8ec4] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : range === '90d' ? 'Last 90 Days' : 'Last Year'}
            </button>
          ))}
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all">
          <Download className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Export Report</span>
        </button>
      </div>

      {/* Key Metrics Stats Grid */}
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
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">+12%</span>
                </div>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Charts Row 1: Utilization & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Utilization Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Asset Utilization Trend</h2>
              <p className="text-sm text-gray-500">Daily utilization rates across all assets</p>
            </div>
            <Activity className="w-6 h-6 text-[#5b8ec4]" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={utilizationData}>
              <defs>
                <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="utilization" 
                stroke={CHART_COLORS.primary} 
                fillOpacity={1} 
                fill="url(#colorUtil)" 
                name="Utilization %"
              />
              <Area 
                type="monotone" 
                dataKey="idle" 
                stroke={CHART_COLORS.accent} 
                fill={CHART_COLORS.accent} 
                fillOpacity={0.6}
                name="Idle %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Distribution Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Asset Distribution</h2>
              <p className="text-sm text-gray-500">Assets by category</p>
            </div>
            <PieChart className="w-6 h-6 text-[#5b8ec4]" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={assetDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {assetDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RePieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Cost Analysis & Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Analysis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Cost Analysis</h2>
              <p className="text-sm text-gray-500">Monthly operational costs breakdown</p>
            </div>
            <DollarSign className="w-6 h-6 text-[#5b8ec4]" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value) => `$${value.toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="operational" fill={CHART_COLORS.primary} name="Operational" radius={[8, 8, 0, 0]} />
              <Bar dataKey="maintenance" fill={CHART_COLORS.accent} name="Maintenance" radius={[8, 8, 0, 0]} />
              <Bar dataKey="repairs" fill={CHART_COLORS.danger} name="Repairs" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Maintenance Schedule */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Maintenance Tracking</h2>
              <p className="text-sm text-gray-500">Scheduled vs completed maintenance</p>
            </div>
            <Wrench className="w-6 h-6 text-[#5b8ec4]" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={maintenanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="scheduled" 
                stroke={CHART_COLORS.primary} 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Scheduled"
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke={CHART_COLORS.secondary} 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Completed"
              />
              <Line 
                type="monotone" 
                dataKey="overdue" 
                stroke={CHART_COLORS.danger} 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Overdue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Distribution & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Status Overview</h2>
              <p className="text-sm text-gray-500">Current asset status</p>
            </div>
            <CheckCircle className="w-6 h-6 text-[#5b8ec4]" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <RePieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RePieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {statusDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Insights & Recommendations */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Insights & Recommendations</h2>
              <p className="text-sm text-gray-500">AI-powered analytics and suggestions</p>
            </div>
            <Zap className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="space-y-4">
            {/* Insight Cards */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-green-900">Asset Utilization Improving</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Overall utilization increased by 12% this month. Equipment category showing highest gains.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-yellow-900">Maintenance Schedule Attention</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    3 vehicles require scheduled maintenance within the next 7 days. Review maintenance calendar.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-blue-900">Cost Optimization Opportunity</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Maintenance costs decreased by 8% after implementing predictive maintenance. Consider expanding program.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-purple-900">Inspection Due Reminder</h3>
                  <p className="text-sm text-purple-700 mt-1">
                    12 assets approaching inspection deadlines. Schedule inspections to maintain compliance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
