"use client";

import { useState, useEffect } from "react";
import CompactHeader from "@/components/CompactHeader";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Plus,
  Filter,
  Download,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

export default function PTOManagementPage() {
  const [ptoRequests, setPtoRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employeeBalance, setEmployeeBalance] = useState<any>(null);

  useEffect(() => {
    loadEmployees();
    loadPTORequests();
  }, [filterStatus, filterEmployee]);

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

  const loadPTORequests = async () => {
    try {
      let url = "/api/hr/pto-requests?";
      if (filterStatus !== "all") url += `status=${filterStatus}&`;
      if (filterEmployee !== "all") url += `employee_id=${filterEmployee}&`;

      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setPtoRequests(data.pto_requests || []);
      }
    } catch (error) {
      console.error("Error loading PTO requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeBalance = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/hr/pto-balance/${employeeId}`);
      const data = await response.json();
      if (data.success) {
        setEmployeeBalance(data.pto_balance);
      }
    } catch (error) {
      console.error("Error loading PTO balance:", error);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const response = await fetch(`/api/hr/pto-requests/${requestId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewed_by: "admin",
          review_notes: "Approved via admin dashboard",
        }),
      });
      const data = await response.json();
      if (data.success) {
        loadPTORequests();
      }
    } catch (error) {
      console.error("Error approving PTO request:", error);
    }
  };

  const handleDeny = async (requestId: string) => {
    const reason = prompt("Reason for denial:");
    if (!reason) return;

    try {
      const response = await fetch(`/api/hr/pto-requests/${requestId}/deny`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewed_by: "admin",
          review_notes: reason,
        }),
      });
      const data = await response.json();
      if (data.success) {
        loadPTORequests();
      }
    } catch (error) {
      console.error("Error denying PTO request:", error);
    }
  };

  const handleViewBalance = async (employee: any) => {
    setSelectedEmployee(employee);
    await loadEmployeeBalance(employee.id);
    setShowBalanceModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "denied":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getPTOTypeColor = (type: string) => {
    switch (type) {
      case "vacation":
        return "bg-blue-100 text-blue-800";
      case "sick":
        return "bg-red-100 text-red-800";
      case "personal":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateStats = () => {
    const pending = ptoRequests.filter((r: any) => r.status === "pending").length;
    const approved = ptoRequests.filter((r: any) => r.status === "approved").length;
    const denied = ptoRequests.filter((r: any) => r.status === "denied").length;
    const totalDays = ptoRequests
      .filter((r: any) => r.status === "approved")
      .reduce((sum: number, r: any) => sum + (r.total_days || 0), 0);

    return { pending, approved, denied, totalDays };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <CompactHeader title="PTO Management" backUrl="/hr" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Denied</p>
                <p className="text-3xl font-bold text-red-600">{stats.denied}</p>
              </div>
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Days Off</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalDays}</p>
              </div>
              <Calendar className="h-12 w-12 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1 w-full md:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Employees</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* PTO Requests List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">PTO Requests</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading PTO requests...</div>
          ) : ptoRequests.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No PTO requests found</p>
              <p className="text-sm text-gray-400">Adjust your filters to see more requests</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {ptoRequests.map((request: any) => (
                <div key={request.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                          {request.employee_name?.charAt(0) || "?"}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {request.employee_name}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getPTOTypeColor(
                              request.pto_type
                            )}`}
                          >
                            {request.pto_type?.toUpperCase()}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {request.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              <strong>From:</strong> {formatDate(request.start_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              <strong>To:</strong> {formatDate(request.end_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              <strong>Duration:</strong> {request.total_days} day(s)
                            </span>
                          </div>
                        </div>

                        {request.reason && (
                          <div className="text-sm text-gray-600 mb-2">
                            <strong>Reason:</strong> {request.reason}
                          </div>
                        )}

                        {request.review_notes && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-2">
                            <strong>Review Notes:</strong> {request.review_notes}
                          </div>
                        )}

                        {request.reviewed_at && (
                          <div className="text-xs text-gray-500 mt-2">
                            Reviewed on {formatDate(request.reviewed_at)} by{" "}
                            {request.reviewed_by}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {request.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleDeny(request.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                          >
                            <XCircle className="h-4 w-4" />
                            Deny
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          const employee = employees.find(
                            (e: any) => e.id === request.employee_id
                          );
                          if (employee) handleViewBalance(employee);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-[#3f72af] transition-colors text-sm"
                      >
                        <TrendingUp className="h-4 w-4" />
                        View Balance
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Alert */}
        {stats.pending > 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">{stats.pending}</span> PTO request(s)
                awaiting your review
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Balance Modal */}
      {showBalanceModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                PTO Balance - {selectedEmployee.first_name} {selectedEmployee.last_name}
              </h3>
              <button
                onClick={() => {
                  setShowBalanceModal(false);
                  setSelectedEmployee(null);
                  setEmployeeBalance(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="px-6 py-4">
              {employeeBalance ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">Vacation</span>
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {employeeBalance.vacation_balance} days
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Accrued: {employeeBalance.vacation_accrued} days
                    </p>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-red-900">Sick Leave</span>
                      <Calendar className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-900">
                      {employeeBalance.sick_balance} days
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      Accrued: {employeeBalance.sick_accrued} days
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-900">
                        Personal Leave
                      </span>
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-900">
                      {employeeBalance.personal_balance} days
                    </p>
                    <p className="text-xs text-purple-700 mt-1">
                      Accrued: {employeeBalance.personal_accrued} days
                    </p>
                  </div>

                  <div className="text-xs text-gray-500 text-center pt-2">
                    Year: {employeeBalance.year} • Last Updated:{" "}
                    {new Date(employeeBalance.updated_at).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Loading balance information...
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowBalanceModal(false);
                  setSelectedEmployee(null);
                  setEmployeeBalance(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
