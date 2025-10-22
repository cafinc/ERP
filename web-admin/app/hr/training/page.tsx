"use client";

import { useState, useEffect } from "react";
import CompactHeader from "@/components/CompactHeader";
import {
  Award,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  X,
  Calendar,
} from "lucide-react";

export default function TrainingPage() {
  const [trainings, setTrainings] = useState([]);
  const [employeeTrainings, setEmployeeTrainings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("programs"); // programs or assignments
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<any>(null);
  const [programForm, setProgramForm] = useState({
    name: "",
    description: "",
    category: "",
    duration_hours: "",
    expiration_months: "",
    is_required: false,
  });
  const [assignForm, setAssignForm] = useState({
    employee_id: "",
    training_id: "",
    notes: "",
  });

  useEffect(() => {
    loadTrainings();
    loadEmployeeTrainings();
    loadEmployees();
  }, []);

  const loadTrainings = async () => {
    try {
      const response = await fetch("/api/hr/trainings");
      const data = await response.json();
      if (data.success) {
        setTrainings(data.trainings || []);
      }
    } catch (error) {
      console.error("Error loading trainings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeTrainings = async () => {
    try {
      const response = await fetch("/api/hr/employee-trainings");
      const data = await response.json();
      if (data.success) {
        setEmployeeTrainings(data.employee_trainings || []);
      }
    } catch (error) {
      console.error("Error loading employee trainings:", error);
    }
  };

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

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/hr/trainings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(programForm),
      });
      const data = await response.json();
      if (data.success) {
        setShowProgramModal(false);
        loadTrainings();
        resetProgramForm();
      }
    } catch (error) {
      console.error("Error creating training program:", error);
    }
  };

  const handleAssignTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/hr/employee-trainings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignForm),
      });
      const data = await response.json();
      if (data.success) {
        setShowAssignModal(false);
        loadEmployeeTrainings();
        resetAssignForm();
      }
    } catch (error) {
      console.error("Error assigning training:", error);
    }
  };

  const handleUpdateStatus = async (trainingId: string, status: string) => {
    try {
      const updateData: any = { status };
      if (status === "completed") {
        updateData.completion_date = new Date().toISOString();
      } else if (status === "in_progress") {
        updateData.start_date = new Date().toISOString();
      }

      const response = await fetch(`/api/hr/employee-trainings/${trainingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      if (data.success) {
        loadEmployeeTrainings();
      }
    } catch (error) {
      console.error("Error updating training status:", error);
    }
  };

  const resetProgramForm = () => {
    setProgramForm({
      name: "",
      description: "",
      category: "",
      duration_hours: "",
      expiration_months: "",
      is_required: false,
    });
    setEditingProgram(null);
  };

  const resetAssignForm = () => {
    setAssignForm({
      employee_id: "",
      training_id: "",
      notes: "",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateStats = () => {
    const totalPrograms = trainings.length;
    const totalAssignments = employeeTrainings.length;
    const completed = employeeTrainings.filter(
      (t: any) => t.status === "completed"
    ).length;
    const inProgress = employeeTrainings.filter(
      (t: any) => t.status === "in_progress"
    ).length;
    const scheduled = employeeTrainings.filter(
      (t: any) => t.status === "scheduled"
    ).length;

    return { totalPrograms, totalAssignments, completed, inProgress, scheduled };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <CompactHeader title="Training & Certifications" backUrl="/hr" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Programs</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalPrograms}
                </p>
              </div>
              <BookOpen className="h-12 w-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {stats.scheduled}
                </p>
              </div>
              <Clock className="h-12 w-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-[#3f72af]">
                  {stats.inProgress}
                </p>
              </div>
              <Clock className="h-12 w-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.completed}
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.totalAssignments > 0
                    ? Math.round((stats.completed / stats.totalAssignments) * 100)
                    : 0}
                  %
                </p>
              </div>
              <Award className="h-12 w-12 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab("programs")}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === "programs"
                    ? "border-blue-500 text-[#3f72af]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Training Programs ({stats.totalPrograms})
              </button>
              <button
                onClick={() => setActiveTab("assignments")}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === "assignments"
                    ? "border-blue-500 text-[#3f72af]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Employee Assignments ({stats.totalAssignments})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "programs" ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Training Programs
                  </h3>
                  <button
                    onClick={() => setShowProgramModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#5b8ec4] text-white rounded-lg hover:bg-[#3f72af]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Program
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading training programs...
                  </div>
                ) : trainings.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No training programs yet</p>
                    <button
                      onClick={() => setShowProgramModal(true)}
                      className="text-blue-500 hover:text-[#3f72af]"
                    >
                      Create your first training program
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trainings.map((training: any) => (
                      <div
                        key={training.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                              {training.name}
                            </h4>
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                              {training.category}
                            </span>
                            {training.is_required && (
                              <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                                Required
                              </span>
                            )}
                          </div>
                        </div>

                        {training.description && (
                          <p className="text-sm text-gray-600 mb-4">
                            {training.description}
                          </p>
                        )}

                        <div className="space-y-2 text-sm text-gray-600">
                          {training.duration_hours && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>Duration: {training.duration_hours} hours</span>
                            </div>
                          )}
                          {training.expiration_months && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Expires in: {training.expiration_months} months</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => {
                              setAssignForm({ ...assignForm, training_id: training.id });
                              setShowAssignModal(true);
                            }}
                            className="w-full px-4 py-2 bg-[#5b8ec4] text-white rounded-lg hover:bg-[#3f72af] text-sm"
                          >
                            Assign to Employee
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Employee Assignments
                  </h3>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#5b8ec4] text-white rounded-lg hover:bg-[#3f72af]"
                  >
                    <Plus className="h-4 w-4" />
                    Assign Training
                  </button>
                </div>

                {employeeTrainings.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No training assignments yet</p>
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="text-blue-500 hover:text-[#3f72af]"
                    >
                      Assign training to an employee
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {employeeTrainings.map((assignment: any) => (
                      <div
                        key={assignment.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 rounded-full bg-[#5b8ec4] flex items-center justify-center text-white font-semibold">
                                {assignment.employee_name?.charAt(0) || "?"}
                              </div>
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-semibold text-gray-900">
                                  {assignment.employee_name}
                                </h4>
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                    assignment.status
                                  )}`}
                                >
                                  {assignment.status}
                                </span>
                              </div>

                              <p className="text-sm text-gray-600 mb-3">
                                <strong>Training:</strong> {assignment.training_name}
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                                <div>
                                  <strong>Assigned:</strong>{" "}
                                  {formatDate(assignment.assigned_date)}
                                </div>
                                {assignment.start_date && (
                                  <div>
                                    <strong>Started:</strong>{" "}
                                    {formatDate(assignment.start_date)}
                                  </div>
                                )}
                                {assignment.completion_date && (
                                  <div>
                                    <strong>Completed:</strong>{" "}
                                    {formatDate(assignment.completion_date)}
                                  </div>
                                )}
                              </div>

                              {assignment.expiration_date && (
                                <div className="mt-2 text-sm text-orange-600">
                                  <AlertCircle className="h-4 w-4 inline mr-1" />
                                  Expires: {formatDate(assignment.expiration_date)}
                                </div>
                              )}

                              {assignment.notes && (
                                <p className="mt-2 text-sm text-gray-600">
                                  <strong>Notes:</strong> {assignment.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            {assignment.status === "scheduled" && (
                              <button
                                onClick={() =>
                                  handleUpdateStatus(assignment.id, "in_progress")
                                }
                                className="px-4 py-2 bg-[#5b8ec4] text-white rounded-lg hover:bg-[#3f72af] text-sm"
                              >
                                Start Training
                              </button>
                            )}
                            {assignment.status === "in_progress" && (
                              <button
                                onClick={() =>
                                  handleUpdateStatus(assignment.id, "completed")
                                }
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                              >
                                Mark Complete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Program Modal */}
      {showProgramModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Create Training Program
              </h3>
              <button
                onClick={() => {
                  setShowProgramModal(false);
                  resetProgramForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Training Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={programForm.name}
                    onChange={(e) =>
                      setProgramForm({ ...programForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={programForm.description}
                    onChange={(e) =>
                      setProgramForm({ ...programForm, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Safety, Equipment, Compliance"
                    value={programForm.category}
                    onChange={(e) =>
                      setProgramForm({ ...programForm, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={programForm.duration_hours}
                    onChange={(e) =>
                      setProgramForm({ ...programForm, duration_hours: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiration (months)
                  </label>
                  <input
                    type="number"
                    placeholder="Leave empty if doesn't expire"
                    value={programForm.expiration_months}
                    onChange={(e) =>
                      setProgramForm({
                        ...programForm,
                        expiration_months: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_required"
                    checked={programForm.is_required}
                    onChange={(e) =>
                      setProgramForm({ ...programForm, is_required: e.target.checked })
                    }
                    className="h-4 w-4 text-[#3f72af] focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_required" className="ml-2 text-sm text-gray-700">
                    Required Training
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowProgramModal(false);
                    resetProgramForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#5b8ec4] text-white rounded-lg hover:bg-[#3f72af]"
                >
                  Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Training Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Assign Training to Employee
              </h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  resetAssignForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAssignTraining} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee *
                  </label>
                  <select
                    required
                    value={assignForm.employee_id}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, employee_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} - {emp.job_title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Training Program *
                  </label>
                  <select
                    required
                    value={assignForm.training_id}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, training_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Training</option>
                    {trainings.map((training: any) => (
                      <option key={training.id} value={training.id}>
                        {training.name} ({training.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={assignForm.notes}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    resetAssignForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#5b8ec4] text-white rounded-lg hover:bg-[#3f72af]"
                >
                  Assign Training
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
