'use client';

import PageHeader from '@/components/PageHeader';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  Clock,
  Calendar,
  User,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react';

interface Shift {
  id: string;
  user_id: string;
  user_name: string;
  clock_in: string;
  clock_out?: string;
  duration_minutes?: number;
  status: string;
}

export default function ShiftHistoryPage() {
  const router = useRouter();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadShifts();
  }, [filter]);

  const loadShifts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/shifts');
      let shiftData = response.data || [];
      
      if (filter === 'active') {
        shiftData = shiftData.filter((s: Shift) => s.status === 'active');
      } else if (filter === 'completed') {
        shiftData = shiftData.filter((s: Shift) => s.status === 'completed');
      }
      
      // Sort by clock_in desc
      shiftData.sort((a: Shift, b: Shift) => 
        new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime()
      );
      
      setShifts(shiftData);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'In progress';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const totalHours = shifts
    .filter(s => s.duration_minutes)
    .reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="History"
        subtitle="Manage history"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Shifts", href: "/shifts" }, { label: "History" }]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3f72af]" />
        </div>
    
    </div>);
  }

  const handleExport = () => {
    // Create CSV content
    const headers = ['Team Member', 'Date', 'Clock In', 'Clock Out', 'Duration', 'Status'];
    const csvRows = [headers.join(',')];

    filteredShifts.forEach(shift => {
      const row = [
        shift.team_member_name,
        new Date(shift.start_time).toLocaleDateString(),
        new Date(shift.start_time).toLocaleTimeString(),
        shift.end_time ? new Date(shift.end_time).toLocaleTimeString() : 'Active',
        shift.duration || 'In Progress',
        shift.status
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shift_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Shift History"
        subtitle="View shift records"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Shift History" }]}
      />
      <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shift History</h1>
            <p className="text-gray-600 mt-1">Track team member clock in/out times</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-3">
                <Calendar className="w-6 h-6 text-[#3f72af]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{shifts.length}</p>
                <p className="text-sm text-gray-600">Total Shifts</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-3">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
                <p className="text-sm text-gray-600">Total Hours</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-lg p-3">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(shifts.map(s => s.user_id)).size}
                </p>
                <p className="text-sm text-gray-600">Team Members</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All Shifts
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'completed' ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Completed
              </button>
            </div>

        {/* Shifts Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Shift Records</h2>
          </div>

          {shifts.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900">No Shift Records</p>
              <p className="text-sm text-gray-600 mt-2">Shift history will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {shifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-gray-50 transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{shift.user_name || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {formatDateTime(shift.clock_in)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {shift.clock_out ? formatDateTime(shift.clock_out) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {formatDuration(shift.duration_minutes)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${shift.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {shift.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
  );
}
