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

export default function HRModuleDesignB() {
  const router = useRouter();

  const modules = [
    {
      title: "Employee Management",
      description: "Manage employee profiles, documents, and information",
      icon: Users,
      href: "/hr/employees",
      color: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Time & Attendance",
      description: "Track work hours, clock in/out, and approve timesheets",
      icon: Clock,
      href: "/hr/time-attendance",
      color: "from-teal-500 to-teal-600",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
    },
    {
      title: "PTO Management",
      description: "Manage time off requests, approvals, and balances",
      icon: Calendar,
      href: "/hr/pto",
      color: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Training & Certifications",
      description: "Track employee training programs and certifications",
      icon: Award,
      href: "/hr/training",
      color: "from-teal-500 to-teal-600",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
    },
    {
      title: "Performance Management",
      description: "Conduct performance reviews and set goals",
      icon: TrendingUp,
      href: "/hr/performance",
      color: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Payroll Settings",
      description: "Configure payroll settings and wage calculations",
      icon: DollarSign,
      href: "/hr/payroll",
      color: "from-teal-500 to-teal-600",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-auto p-6">
        {/* Design Selector */}
        <div className="mb-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white p-4 rounded-xl shadow-lg">
          <h2 className="text-lg font-bold mb-2">⭐ Option B: Balanced Professional (RECOMMENDED)</h2>
          <p className="text-sm text-blue-100 mb-3">Modern yet professional. Refined colors, subtle gradients, trust + innovation.</p>
          <div className="flex gap-2">
            <button onClick={() => router.push('/hr/design-option-a')} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm">View Option A</button>
            <span className="px-3 py-1 bg-white/90 text-blue-600 rounded text-sm font-medium">Current</span>
            <button onClick={() => router.push('/hr/design-option-c')} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm">View Option C</button>
            <button onClick={() => router.push('/hr')} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm">Back to Original</button>
          </div>
        </div>

        <PageHeader
        title="Design Option B"
        subtitle="Manage design option b"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Hr", href: "/hr" }, { label: "Design Option B" }]}
        title="HR Module"
          icon={Users}
          badges={[
            { label: "24 Employees", color: "blue" },
            { label: "12 Active", color: "green" },
            { label: "5 PTO Pending", color: "blue" },
          ]}
        />

        {/* Overview Cards - Balanced Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 mt-6">
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
                <p className="text-xs text-green-600 mt-1 font-medium">↑ 3 this month</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-sm">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Time Entries</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
                <p className="text-xs text-gray-500 mt-1">Updated 5 min ago</p>
              </div>
              <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-3 rounded-xl shadow-sm">
                <Clock className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending PTO Requests</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">5</p>
                <p className="text-xs text-amber-600 mt-1 font-medium">Needs review</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-sm">
                <Calendar className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Module Grid - Balanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <div
              key={module.href}
              onClick={() => router.push(module.href)}
              className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer overflow-hidden group hover:shadow-md transition-shadow"
            >
              <div className={`h-1 bg-gradient-to-r ${module.color}`} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${module.iconBg} p-3 rounded-xl`}>
                    <module.icon className={`h-6 w-6 ${module.iconColor}`} />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-600">{module.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions - Balanced */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push("/hr/employees")}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow transition-all"
            >
              <Users className="h-5 w-5" />
              Add Employee
            </button>
            <button
              onClick={() => router.push("/hr/time-attendance")}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 shadow-sm hover:shadow transition-all"
            >
              <Clock className="h-5 w-5" />
              Review Timesheets
            </button>
            <button
              onClick={() => router.push("/hr/pto")}
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
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