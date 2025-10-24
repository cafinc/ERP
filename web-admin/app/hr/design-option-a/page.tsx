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

export default function HRModuleDesignA() {
  const router = useRouter();

  const modules = [
    {
      title: "Employee Management",
      description: "Manage employee profiles, documents, and information",
      icon: Users,
      href: "/hr/employees",
    },
    {
      title: "Time & Attendance",
      description: "Track work hours, clock in/out, and approve timesheets",
      icon: Clock,
      href: "/hr/time-attendance",
    },
    {
      title: "PTO Management",
      description: "Manage time off requests, approvals, and balances",
      icon: Calendar,
      href: "/hr/pto",
    },
    {
      title: "Training & Certifications",
      description: "Track employee training programs and certifications",
      icon: Award,
      href: "/hr/training",
    },
    {
      title: "Performance Management",
      description: "Conduct performance reviews and set goals",
      icon: TrendingUp,
      href: "/hr/performance",
    },
    {
      title: "Payroll Settings",
      description: "Configure payroll settings and wage calculations",
      icon: DollarSign,
      href: "/hr/payroll",
    },
  ];

  return (
    <DashboardLayout>
      <div className="h-screen bg-gray-50 overflow-auto p-6">
        {/* Design Selector */}
        <div className="mb-4 bg-blue-900 text-white p-4 rounded-lg">
          <h2 className="text-lg font-bold mb-2">🎨 Option A: Conservative Modern (ServiceTitan-Inspired)</h2>
          <p className="text-sm text-blue-200 mb-3">Professional, corporate, trust-focused. Muted colors, minimal gradients.</p>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-blue-800 rounded text-sm font-medium">Current</span>
            <button onClick={() => router.push('/hr/design-option-b')} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">View Option B</button>
            <button onClick={() => router.push('/hr/design-option-c')} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">View Option C</button>
            <button onClick={() => router.push('/hr')} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">Back to Original</button>
          </div>
        </div>

        <PageHeader
        title="Design Option A"
        subtitle="Manage design option a"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Hr", href: "/hr" }, { label: "Design Option A" }]}
        title="HR Module"
          icon={Users}
          badges={[
            { label: "24 Employees", color: "blue" },
            { label: "12 Active", color: "blue" },
            { label: "5 PTO Pending", color: "blue" },
          ]}
        />

        {/* Overview Cards - Conservative Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-6">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Users className="h-8 w-8 text-blue-900" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Active Time Entries</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Clock className="h-8 w-8 text-blue-900" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Pending PTO Requests</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">5</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-blue-900" />
              </div>
            </div>
          </div>
        </div>

        {/* Module Grid - Conservative */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => (
            <div
              key={module.href}
              onClick={() => router.push(module.href)}
              className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md hover:border-blue-900 transition-all cursor-pointer p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <module.icon className="h-6 w-6 text-gray-700" />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {module.title}
              </h3>
              <p className="text-sm text-gray-600">{module.description}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions - Conservative */}
        <div className="mt-6 bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push("/hr/employees")}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              <Users className="h-5 w-5" />
              Add Employee
            </button>
            <button
              onClick={() => router.push("/hr/time-attendance")}
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <Clock className="h-5 w-5" />
              Review Timesheets
            </button>
            <button
              onClick={() => router.push("/hr/pto")}
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
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