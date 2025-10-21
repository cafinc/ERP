'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import CompactHeader from '@/components/CompactHeader';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  Users,
  FileText,
  Calendar,
  HardHat,
} from 'lucide-react';

export default function SafetyDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    incidents: { total: 12, thisMonth: 2, resolved: 10 },
    inspections: { completed: 45, pending: 3, overdue: 1 },
    training: { certified: 28, expiring: 5, expired: 2 },
    meetings: { thisMonth: 8, attendance: 95 },
  });

  return (
    <DashboardLayout>
      <div className="p-4">
        {/* Compact Header */}
        <CompactHeader
          title="Safety Dashboard"
          icon={Shield}
          badges={[
            { label: 'COR Compliant', color: 'green' },
            { label: `${stats.incidents.thisMonth} Incidents This Month`, color: stats.incidents.thisMonth > 0 ? 'orange' : 'green' },
          ]}
        />

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mx-6 mt-6">
          {/* Incidents */}
          <div 
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push('/safety/incidents')}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.incidents.total}</p>
                <p className="text-sm text-gray-600">Total Incidents</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">This Month:</span>
                <span className="font-semibold text-orange-600">{stats.incidents.thisMonth}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Resolved:</span>
                <span className="font-semibold text-green-600">{stats.incidents.resolved}</span>
              </div>
            </div>
          </div>

          {/* Inspections */}
          <div 
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push('/safety/inspections')}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.inspections.completed}</p>
                <p className="text-sm text-gray-600">Inspections Done</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pending:</span>
                <span className="font-semibold text-blue-600">{stats.inspections.pending}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Overdue:</span>
                <span className="font-semibold text-red-600">{stats.inspections.overdue}</span>
              </div>
            </div>
          </div>

          {/* Training */}
          <div 
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push('/safety/training')}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.training.certified}</p>
                <p className="text-sm text-gray-600">Certified Staff</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Expiring Soon:</span>
                <span className="font-semibold text-yellow-600">{stats.training.expiring}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Expired:</span>
                <span className="font-semibold text-red-600">{stats.training.expired}</span>
              </div>
            </div>
          </div>

          {/* Safety Meetings */}
          <div 
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push('/safety/meetings')}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.meetings.thisMonth}</p>
                <p className="text-sm text-gray-600">Meetings This Month</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg Attendance:</span>
                <span className="font-semibold text-green-600">{stats.meetings.attendance}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mx-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/safety/hazards')}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow text-left"
            >
              <FileText className="w-8 h-8 text-orange-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Hazard Assessments</h3>
              <p className="text-sm text-gray-600 mt-1">Manage job hazard analysis</p>
            </button>

            <button
              onClick={() => router.push('/safety/ppe')}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow text-left"
            >
              <HardHat className="w-8 h-8 text-yellow-600 mb-2" />
              <h3 className="font-semibold text-gray-900">PPE Management</h3>
              <p className="text-sm text-gray-600 mt-1">Track protective equipment</p>
            </button>

            <button
              onClick={() => router.push('/safety/policies')}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow text-left"
            >
              <FileText className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Safety Policies</h3>
              <p className="text-sm text-gray-600 mt-1">View policies & procedures</p>
            </button>

            <button
              onClick={() => router.push('/safety/emergency')}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow text-left"
            >
              <AlertTriangle className="w-8 h-8 text-red-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Emergency Plans</h3>
              <p className="text-sm text-gray-600 mt-1">Emergency response procedures</p>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
