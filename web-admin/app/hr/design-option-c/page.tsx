"use client";

import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from '@/components/PageHeader';
import {
  Users,
  Clock,
  Calendar,
  Award,
  TrendingUp,
  DollarSign,
  ArrowRight,
} from "lucide-react";

export default function HRModuleDesignC() {
  const router = useRouter();

  const modules = [
    {
      title: "Employee Management",
      description: "Manage employee profiles, documents, and information",
      icon: Users,
      href: "/hr/employees",
      color: "bg-blue-500",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Time & Attendance",
      description: "Track work hours, clock in/out, and approve timesheets",
      icon: Clock,
      href: "/hr/time-attendance",
      color: "bg-teal-500",
      gradient: "from-teal-500 to-teal-600",
    },
    {
      title: "PTO Management",
      description: "Manage time off requests, approvals, and balances",
      icon: Calendar,
      href: "/hr/pto",
      color: "bg-purple-500",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      title: "Training & Certifications",
      description: "Track employee training programs and certifications",
      icon: Award,
      href: "/hr/training",
      color: "bg-blue-500",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Performance Management",
      description: "Conduct performance reviews and set goals",
      icon: TrendingUp,
      href: "/hr/performance",
      color: "bg-teal-500",
      gradient: "from-teal-500 to-teal-600",
    },
    {
      title: "Payroll Settings",
      description: "Configure payroll settings and wage calculations",
      icon: DollarSign,
      href: "/hr/payroll",
      color: "bg-purple-500",
      gradient: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 overflow-auto p-6">
        {/* Design Selector */}
        <div className="mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 text-white p-4 rounded-2xl shadow-lg">
          <h2 className="text-lg font-bold mb-2">🎨 Option C: Modern Professional (Refined Current)</h2>
          <p className="text-sm text-blue-100 mb-3">Energetic, modern, approachable. Vibrant but cohesive color system.</p>
          <div className="flex gap-2">
            <button onClick={() => router.push('/hr/design-option-a')} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm">View Option A</button>
            <button onClick={() => router.push('/hr/design-option-b')} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm">View Option B</button>
            <span className="px-3 py-1 bg-white/90 text-purple-600 rounded text-sm font-medium">Current</span>
            <button onClick={() => router.push('/hr')} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm">Back to Original</button>
          </div>
        </div>

        <PageHeader
        title="Design Option C"
        subtitle="Manage design option c"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Hr", href: "/hr" }, { label: "Design Option C" }]}
        title="HR Module"
          icon={Users}
          badges={[
            { label: "24 Employees", color: "blue" },
            { label: "12 Active", color: "green" },
            { label: "5 PTO Pending", color: "purple" },
          ]}
        />

        {/* Overview Cards - Modern Vibrant */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 mt-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Total Employees</p>
                <p className="text-4xl font-bold mt-2">24</p>
                <p className="text-xs text-blue-200 mt-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  3 new this month
                </p>
              </div>
              <Users className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-teal-100">Active Time Entries</p>
                <p className="text-4xl font-bold mt-2">12</p>
                <p className="text-xs text-teal-200 mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Updated 5 min ago
                </p>
              </div>
              <Clock className="h-12 w-12 text-teal-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Pending PTO Requests</p>
                <p className="text-4xl font-bold mt-2">5</p>
                <p className="text-xs text-purple-200 mt-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                  Needs review
                </p>
              </div>
              <Calendar className="h-12 w-12 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Module Grid - Modern Vibrant */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <div
              key={module.href}
              onClick={() => router.push(module.href)}
              className="bg-white rounded-2xl shadow-md border-2 border-gray-100 hover:shadow-xl hover:border-transparent hover:-translate-y-1 transition-all cursor-pointer overflow-hidden group"
            >
              <div className={`h-2 bg-gradient-to-r ${module.gradient}`} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${module.color} bg-opacity-10 p-3 rounded-xl`}>
                    <module.icon className={`h-6 w-6 ${module.color.replace('bg-', 'text-')}`} />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-600">{module.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions - Modern Vibrant */}
        <div className="mt-6 bg-white rounded-2xl shadow-md border-2 border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">⚡ Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push("/hr/employees")}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
              <Users className="h-5 w-5" />
              Add Employee
            </button>
            <button
              onClick={() => router.push("/hr/time-attendance")}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl hover:from-teal-700 hover:to-teal-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
              <Clock className="h-5 w-5" />
              Review Timesheets
            </button>
            <button
              onClick={() => router.push("/hr/pto")}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
              <Calendar className="h-5 w-5" />
              Approve PTO
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}