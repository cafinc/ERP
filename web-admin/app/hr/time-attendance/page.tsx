"use client";

import { useState, useEffect } from "react";
import PageHeader from '@/components/PageHeader';
import {
  Clock,
  PlayCircle,
  StopCircle,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Calendar,
  User,
  MapPin,
} from "lucide-react";

export default function TimeAttendancePage() {
  const [timeEntries, setTimeEntries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadEmployees();
    loadTimeEntries();
  }, [filterStatus, filterEmployee, dateRange]);

  const loadEmployees = async () => {
    try {
      const response = await fetch("/api/hr/employees?status=active");
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  };

  const loadTimeEntries = async () => {
    try {
      let url = `/api/hr/time-entries?start_date=${dateRange.start}&end_date=${dateRange.end}`;
      if (filterStatus !== "all") url += `&status=${filterStatus}`;
      if (filterEmployee !== "all") url += `&employee_id=${filterEmployee}`;

      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setTimeEntries(data.time_entries || []);
      }
    } catch (error) {
      console.error("Error loading time entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (entryId: string) => {
    try {
      const response = await fetch(`/api/hr/time-entries/${entryId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved_by: "admin" }), // TODO: Use actual user ID
      });
      const data = await response.json();
      if (data.success) {
        loadTimeEntries();
      }
    } catch (error) {
      console.error("Error approving time entry:", error);
    }
  };

  const handleReject = async (entryId: string) => {
    if (!confirm("Are you sure you want to reject this time entry?")) return;

    try {
      const response = await fetch(`/api/hr/time-entries/${entryId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved_by: "admin" }), // TODO: Use actual user ID
      });
      const data = await response.json();
      if (data.success) {
        loadTimeEntries();
      }
    } catch (error) {
      console.error("Error rejecting time entry:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const formatDuration = (hours: number | null) => {
    if (!hours) return "In Progress";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateStats = () => {
    const pending = timeEntries.filter((e: any) => e.status === "pending").length;
    const approved = timeEntries.filter((e: any) => e.status === "approved").length;
    const totalHours = timeEntries
      .filter((e: any) => e.total_hours)
      .reduce((sum: number, e: any) => sum + (e.total_hours || 0), 0);
    const avgHours = timeEntries.length > 0 ? totalHours / timeEntries.length : 0;

    return { pending, approved, totalHours, avgHours };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Time & Attendance"
        subtitle="Track employee hours and attendance"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "HR", href: "/hr" }, { label: "Time & Attendance" }]}
        title="Time & Attendance" backUrl="/hr" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-500" />
            </div></div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div></div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-3xl font-bold text-[#3f72af]">
                  {stats.totalHours.toFixed(1)}
                </p>
              </div>
              <Clock className="h-12 w-12 text-blue-500" />
            </div></div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Hours/Entry</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.avgHours.toFixed(1)}
                </p>
              </div>
              <Calendar className="h-12 w-12 text-purple-500" />
            </div></div></div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee
              </label>
              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Employees</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div></div>

          <div className="flex justify-end mt-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
              <Download className="h-4 w-4" />
              Export Timesheet
            </button></div></div>

        {/* Time Entries List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Time Entries</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading time entries...</div>
          ) : timeEntries.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No time entries found</p>
              <p className="text-sm text-gray-400">
                Adjust your filters or date range to see more entries
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clock In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clock Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeEntries.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-[#5b8ec4] flex items-center justify-center text-white font-semibold">
                              {entry.employee_name?.charAt(0) || "?"}
                            </div></div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {entry.employee_name || "Unknown"}
                            </div></div></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <PlayCircle className="h-4 w-4 text-green-500 mr-2" />
                          {formatDateTime(entry.clock_in)}
                        </div>
                        {entry.location_in && (
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            GPS Tracked
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.clock_out ? (
                          <>
                            <div className="flex items-center text-sm text-gray-900">
                              <StopCircle className="h-4 w-4 text-red-500 mr-2" />
                              {formatDateTime(entry.clock_out)}
                            </div>
                            {entry.location_out && (
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                GPS Tracked
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">In Progress</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatDuration(entry.total_hours)}
                        </div>
                        {entry.break_duration_minutes > 0 && (
                          <div className="text-xs text-gray-500">
                            Break: {entry.break_duration_minutes}m
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {entry.entry_type?.replace("_", " ").toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            entry.status
                          )}`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {entry.status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(entry.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleReject(entry.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <XCircle className="h-5 w-5" />
                            </button></div>
                        )}
                        {entry.status === "approved" && (
                          <span className="text-green-600">✓ Approved</span>
                        )}
                        {entry.status === "rejected" && (
                          <span className="text-red-600">✗ Rejected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {stats.pending > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-[#3f72af]" />
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">{stats.pending}</span> time entries
                  pending approval
                </p>
              </div>
              <button className="px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors text-sm">
                Approve All Pending
              </button></div></div>
        )}
      </div></div>
  );
}
