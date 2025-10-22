'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import CompactHeader from '@/components/CompactHeader';
import api from '@/lib/api';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Mail,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';

interface ReportConfig {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  icon: any;
  color: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const reportTypes: ReportConfig[] = [
    {
      id: 'daily_operations',
      name: 'Daily Operations Summary',
      description: 'Daily dispatch activities, services completed, crew performance',
      type: 'daily',
      icon: Activity,
      color: 'bg-blue-500',
    },
    {
      id: 'weekly_financial',
      name: 'Weekly Financial Report',
      description: 'Revenue, invoices, payments, outstanding balances',
      type: 'weekly',
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      id: 'monthly_customer',
      name: 'Monthly Customer Analytics',
      description: 'Customer growth, retention rates, service history',
      type: 'monthly',
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      id: 'project_performance',
      name: 'Project Performance',
      description: 'Project completion rates, timeline analysis, profitability',
      type: 'custom',
      icon: BarChart3,
      color: 'bg-orange-500',
    },
    {
      id: 'service_analytics',
      name: 'Service Analytics',
      description: 'Service types breakdown, seasonal trends, efficiency metrics',
      type: 'custom',
      icon: PieChart,
      color: 'bg-indigo-500',
    },
    {
      id: 'crew_productivity',
      name: 'Crew Productivity Report',
      description: 'Hours logged, tasks completed, performance metrics',
      type: 'custom',
      icon: TrendingUp,
      color: 'bg-teal-500',
    },
  ];

  const handleGenerateReport = async (reportId: string) => {
    try {
      setLoading(true);
      const response = await api.post('/reports/generate', {
        report_type: reportId,
        start_date: dateRange.start,
        end_date: dateRange.end,
      });

      // For now, download as JSON
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportId}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);

      alert('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Feature coming soon!');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleReport = async (reportId: string) => {
    try {
      const frequency = prompt('Schedule frequency (daily/weekly/monthly):', 'weekly');
      if (!frequency) return;

      const email = prompt('Send to email:', '');
      if (!email) return;

      await api.post('/reports/schedule', {
        report_type: reportId,
        frequency,
        email,
        active: true,
      });

      alert(`Report scheduled successfully! Will be sent ${frequency} to ${email}`);
    } catch (error) {
      console.error('Error scheduling report:', error);
      alert('Failed to schedule report. Feature coming soon!');
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        {/* Compact Header */}
        <CompactHeader
          title="Automated Reports"
          icon={FileText}
          badges={[
            { label: `${reportTypes.length} Report Types`, color: 'blue' },
            { label: 'Export Ready', color: 'green' },
          ]}
        />

        {/* Date Range Selector */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 rounded-t-lg mt-6 mx-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Date Range:</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={() => setDateRange({
                  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  end: new Date().toISOString().split('T')[0],
                })}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
              >
                Last 30 Days
              </button>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mx-6 mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Automated Report Scheduling</h3>
              <p className="text-sm text-blue-700">
                Schedule reports to be automatically generated and emailed on a daily, weekly, or monthly basis. 
                Perfect for keeping stakeholders informed without manual effort.
              </p>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-6 mt-6">
          {reportTypes.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden"
            >
              {/* Card Header */}
              <div className={`${report.color} p-4`}>
                <div className="flex items-center justify-between text-white">
                  <report.icon className="w-8 h-8" />
                  <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                    {report.type.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {report.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {report.description}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-[#2c5282] text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Generate
                  </button>
                  <button
                    onClick={() => handleScheduleReport(report.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm"
                  >
                    <Mail className="w-4 h-4" />
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scheduled Reports Section */}
        <div className="mx-6 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Scheduled Reports</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No scheduled reports yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Click "Schedule" on any report above to set up automatic delivery.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
