"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  User,
  X,
  Upload,
  File,
  Image as ImageIcon,
  Paperclip,
  DollarSign,
  FileText,
  Users,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { formatPhoneNumber } from "@/lib/utils/formatters";

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, type: string, size: number, data: string}>>([]);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    job_title: "",
    department: "",
    employment_type: "full_time",
    hire_date: new Date().toISOString().split("T")[0],
    hourly_rate: "",
    salary: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
  });

  useEffect(() => {
    loadEmployees();
  }, [statusFilter]);

  const loadEmployees = async () => {
    try {
      const url = statusFilter === "all" 
        ? "/api/hr/employees" 
        : `/api/hr/employees?status=${statusFilter}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error("Error loading employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingEmployee
        ? `/api/hr/employees/${editingEmployee.id}`
        : "/api/hr/employees";
      
      const response = await fetch(url, {
        method: editingEmployee ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        loadEmployees();
        resetForm();
      }
    } catch (error) {
      console.error("Error saving employee:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to terminate this employee?")) return;
    
    try {
      const response = await fetch(`/api/hr/employees/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        loadEmployees();
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  };

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee);
    setFormData({
      first_name: employee.first_name || "",
      last_name: employee.last_name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      job_title: employee.job_title || "",
      department: employee.department || "",
      employment_type: employee.employment_type || "full_time",
      hire_date: employee.hire_date?.split("T")[0] || "",
      hourly_rate: employee.hourly_rate || "",
      salary: employee.salary || "",
      emergency_contact_name: employee.emergency_contact_name || "",
      emergency_contact_phone: employee.emergency_contact_phone || "",
      emergency_contact_relationship: employee.emergency_contact_relationship || "",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      job_title: "",
      department: "",
      employment_type: "full_time",
      hire_date: new Date().toISOString().split("T")[0],
      hourly_rate: "",
      salary: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relationship: "",
    });
    setEditingEmployee(null);
    setUploadedFiles([]);
  };

  const handlePhoneChange = (field: 'phone' | 'emergency_contact_phone', value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData({ ...formData, [field]: formatted });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      if (file.size > 500 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 500KB per file.`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          type: file.type,
          size: file.size,
          data: result
        }]);
      };
      reader.onerror = () => {
        alert(`Error reading file ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
    
    event.target.value = '';
  };
  
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (type.includes('pdf')) return <File className="w-5 h-5 text-red-500" />;
    return <Paperclip className="w-5 h-5 text-gray-500" />;
  };

  const filteredEmployees = employees.filter((emp: any) =>
    `${emp.first_name} ${emp.last_name} ${emp.email} ${emp.job_title}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "on_leave":
        return "bg-yellow-100 text-yellow-800";
      case "terminated":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Employee Management"
        subtitle="Manage your team members, roles, and access permissions"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "HR Module", href: "/hr" },
          { label: "Employees" },
        ]}
        actions={[
          {
            label: "Export",
            icon: <Download className="w-4 h-4 mr-2" />,
            variant: "secondary",
            onClick: () => alert("Export functionality"),
          },
          {
            label: "Add Employee",
            icon: <Plus className="w-4 h-4 mr-2" />,
            variant: "primary",
            onClick: () => {
              resetForm();
              setShowModal(true);
            },
          },
        ]}
        tabs={[
          { label: "Active", value: "active", count: employees.filter((e: any) => e.employment_status === "active").length },
          { label: "On Leave", value: "on_leave", count: employees.filter((e: any) => e.employment_status === "on_leave").length },
          { label: "Terminated", value: "terminated", count: employees.filter((e: any) => e.employment_status === "terminated").length },
          { label: "All", value: "all", count: employees.length },
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        showSearch={true}
        searchPlaceholder="Search employees..."
        onSearch={setSearchQuery}
        showFilter={true}
        onFilterClick={() => alert("Filter functionality")}
      />

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 mt-6">
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600">Total Employees</p>
            <p className="text-3xl font-bold text-gray-900">{employees.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-3xl font-bold text-green-600">
              {employees.filter((e: any) => e.employment_status === "active").length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600">On Leave</p>
            <p className="text-3xl font-bold text-yellow-600">
              {employees.filter((e: any) => e.employment_status === "on_leave").length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600">Departments</p>
            <p className="text-3xl font-bold text-[#3f72af]">
              {new Set(employees.map((e: any) => e.department)).size}
            </p>
          </div>
        </div>

        {/* Employee List */}
        <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading employees...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">No employees found</p>
              <button
                onClick={() => setShowModal(true)}
                className="text-blue-500 hover:text-[#3f72af]"
              >
                Add your first employee
              </button>
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
                      Job Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
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
                  {filteredEmployees.map((employee: any) => (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-[#5b8ec4] flex items-center justify-center text-white font-semibold">
                              {employee.first_name?.[0]}{employee.last_name?.[0]}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.job_title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.department || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.employment_type?.replace("_", " ").toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(employee.employment_status)}`}>
                          {employee.employment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="text-[#3f72af] hover:text-blue-900 mr-4"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-3xl w-full shadow-2xl border border-white/40 animate-slideUp my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-[#3f72af] to-[#2c5282] rounded-xl p-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingEmployee ? "Edit Employee" : "Add New Employee"}
                  </h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {editingEmployee ? "Update employee information" : "Add a new team member"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form id="employeeForm" onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto">
              {/* Personal Information Card */}
              <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                  <User className="w-5 h-5 text-[#3f72af] mr-2" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                      placeholder="Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => handlePhoneChange('phone', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment Information Card */}
              <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                  <Briefcase className="w-5 h-5 text-[#3f72af] mr-2" />
                  Employment Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.job_title}
                      onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                      placeholder="Snow Plow Operator"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                      placeholder="Operations"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Employment Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.employment_type}
                      onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] bg-white transition-all"
                    >
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="seasonal">Seasonal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <Calendar className="w-4 h-4 inline-block mr-1 text-[#3f72af]" />
                      Hire Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <DollarSign className="w-4 h-4 inline-block mr-1 text-[#3f72af]" />
                      Hourly Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                      placeholder="25.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <DollarSign className="w-4 h-4 inline-block mr-1 text-[#3f72af]" />
                      Annual Salary
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                      placeholder="50000.00"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact Card */}
              <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                  <Phone className="w-5 h-5 text-[#3f72af] mr-2" />
                  Emergency Contact
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Contact Name</label>
                    <input
                      type="text"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                      placeholder="Jane Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Contact Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => handlePhoneChange('emergency_contact_phone', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Relationship</label>
                    <input
                      type="text"
                      value={formData.emergency_contact_relationship}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3f72af] focus:border-[#3f72af] transition-all"
                      placeholder="Spouse"
                    />
                  </div>
                </div>
              </div>

              {/* Document Upload Card */}
              <div className="bg-white/60 rounded-2xl shadow-lg border border-white/40 p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                  <Upload className="w-5 h-5 text-[#3f72af] mr-2" />
                  Documents & Attachments
                </h3>
                
                <div className="space-y-4">
                  {/* Upload Button */}
                  <div>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#3f72af] hover:bg-blue-50 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-600">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">Contracts, Certifications, ID (Max 500KB per file)</p>
                      </div>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                      />
                    </label>
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700">
                        Uploaded Files ({uploadedFiles.length})
                      </p>
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {getFileIcon(file.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200/50">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-5 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="employeeForm"
                className="flex items-center gap-2 px-5 py-2 text-sm bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-all shadow-sm hover:shadow-md font-semibold"
              >
                <CheckCircle className="w-4 h-4" />
                {editingEmployee ? "Update Employee" : "Add Employee"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
