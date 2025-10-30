"use client";

import PageHeader from '@/components/PageHeader';

import { useRouter } from "next/navigation";
import HybridNavigationLayout from "@/components/HybridNavigationLayout";
import {
  Users,
  Clock,
  Calendar,
  Award,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Plus,
  Download,
  Settings,
} from "lucide-react";

export default function PreviewNewDesign() {
  const router = useRouter();

  const modules = [
    {
      title: "Employee Management",
      description: "Manage employee profiles, documents, and information",
      icon: Users,
      href: "/hr/employees",
      gradient: "from-[#3f72af] to-[#2c5282]",
      iconBg: "bg-[#3f72af]/10",
      iconColor: "text-[#3f72af]",
    },
    {
      title: "Time & Attendance",
      description: "Track work hours, clock in/out, and approve timesheets",
      icon: Clock,
      href: "/hr/time-attendance",
      gradient: "from-[#5b8ec4] to-[#3f72af]",
      iconBg: "bg-[#5b8ec4]/10",
      iconColor: "text-[#5b8ec4]",
    },
    {
      title: "PTO Management",
      description: "Manage time off requests, approvals, and balances",
      icon: Calendar,
      href: "/hr/pto",
      gradient: "from-[#3f72af] to-[#2c5282]",
      iconBg: "bg-[#3f72af]/10",
      iconColor: "text-[#3f72af]",
    },
    {
      title: "Training & Certifications",
      description: "Track employee training programs and certifications",
      icon: Award,
      href: "/hr/training",
      gradient: "from-[#5b8ec4] to-[#3f72af]",
      iconBg: "bg-[#5b8ec4]/10",
      iconColor: "text-[#5b8ec4]",
    },
    {
      title: "Performance Management",
      description: "Conduct performance reviews and set goals",
      icon: TrendingUp,
      href: "/hr/performance",
      gradient: "from-[#3f72af] to-[#2c5282]",
      iconBg: "bg-[#3f72af]/10",
      iconColor: "text-[#3f72af]",
    },
    {
      title: "Payroll Settings",
      description: "Configure payroll settings and wage calculations",
      icon: DollarSign,
      href: "/hr/payroll",
      gradient: "from-[#5b8ec4] to-[#3f72af]",
      iconBg: "bg-[#5b8ec4]/10",
      iconColor: "text-[#5b8ec4]",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Preview New Design"
        subtitle="Manage preview new design"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Preview New Design" }]}
      />
      <HybridNavigationLayout>
      <div className="p-6">
        {/* Banner */}
        <div className="mb-6 bg-gradient-to-r from-[#3f72af] to-[#2c5282] text-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-2">🎨 New Design System Preview</h2>
          <p className="text-blue-100 mb-4">
            <strong>Header Inspired</strong> color palette + <strong>Hybrid Navigation</strong> + New button styles
          </p>
          <div className="flex gap-3">
            <span className="px-3 py-1 bg-white/20 rounded-lg text-sm font-medium">Color: #3f72af</span>
            <span className="px-3 py-1 bg-white/20 rounded-lg text-sm font-medium">Navigation: Hybrid</span>
            <span className="px-3 py-1 bg-white/20 rounded-lg text-sm font-medium">Buttons: Shadow/Outlined</span>
          </div>

        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">HR Module Dashboard</h1>
          <p className="text-gray-600">Comprehensive employee management and HR operations</p>
        </div>

        {/* Stats Overview - Header Inspired Colors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
                <p className="text-xs text-green-600 mt-1 font-medium">↑ 3 this month</p>
              </div>
              <div className="bg-gradient-to-br from-[#3f72af] to-[#2c5282] p-3 rounded-xl shadow-sm">
                <Users className="h-8 w-8 text-white" />
              </div>

          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Time Entries</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
                <p className="text-xs text-gray-500 mt-1">Updated 5 min ago</p>
              </div>
              <div className="bg-gradient-to-br from-[#5b8ec4] to-[#3f72af] p-3 rounded-xl shadow-sm">
                <Clock className="h-8 w-8 text-white" />
              </div>

          <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending PTO Requests</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">5</p>
                <p className="text-xs text-amber-600 mt-1 font-medium">Needs review</p>
              </div>
              <div className="bg-gradient-to-br from-[#3f72af] to-[#2c5282] p-3 rounded-xl shadow-sm">
                <Calendar className="h-8 w-8 text-white" />
              </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {modules.map((module) => (
            <div
              key={module.href}
              onClick={() => router.push(module.href)}
              className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 hover:shadow-lg hover:border-[#3f72af] transition-all cursor-pointer overflow-hidden group hover:shadow-md transition-shadow"
            >
              <div className={`h-1 bg-gradient-to-r ${module.gradient}`} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${module.iconBg} p-3 rounded-xl`}>
                    <module.icon className={`h-6 w-6 ${module.iconColor}`} />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-[#3f72af] group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-600">{module.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Button Styles Showcase */}
        <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 mb-6 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">New Button Styles</h3>
          
          <div className="space-y-6">
            {/* Primary Actions - Shadow Style */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Primary Actions (Shadow Style)</h4>
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] shadow-lg hover:shadow-xl font-medium transform hover:-translate-y-0.5 transition-all">
                  <Plus className="h-4 w-4" />
                  Add Employee
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#5b8ec4] text-white rounded-lg hover:bg-[#3f72af] shadow-lg hover:shadow-xl font-medium transform hover:-translate-y-0.5 transition-all">
                  <Download className="h-4 w-4" />
                  Export Data
                </button>
              </div>
            {/* Secondary Actions - Outlined Style */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Secondary Actions (Outlined Style)</h4>
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 px-4 py-2 border-2 border-[#3f72af] text-[#3f72af] rounded-lg hover:bg-[#3f72af] hover:text-white font-medium transition-all">
                  <Clock className="h-4 w-4" />
                  Review Timesheets
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border-2 border-[#5b8ec4] text-[#5b8ec4] rounded-lg hover:bg-[#5b8ec4] hover:text-white font-medium transition-all">
                  <Calendar className="h-4 w-4" />
                  View Calendar
                </button>
              </div>
            {/* Danger Actions */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Danger Actions</h4>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                  Delete Employee
                </button>
                <button className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white font-medium transition-all">
                  Terminate Contract
                </button>
              </div>
            {/* Icon Buttons */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Icon Buttons (Icon Only & Ghost)</h4>
              <div className="flex flex-wrap gap-3 items-center">
                <button className="p-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] shadow-md hover:shadow-lg transition-all">
                  <Settings className="h-5 w-5" />
                </button>
                <button className="p-2 bg-[#3f72af] text-white rounded-full hover:bg-[#2c5282] shadow-md hover:shadow-lg transition-all">
                  <Plus className="h-5 w-5" />
                </button>
                <button className="p-2 text-[#3f72af] rounded-lg hover:bg-[#3f72af]/10 transition-all">
                  <Download className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
                  <Settings className="h-5 w-5" />
                </button>
              </div>
        {/* Navigation Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="font-semibold text-amber-900 mb-2">🧭 Hybrid Navigation Features:</h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• <strong>Collapsed Sidebar</strong> (left) - Icon-only menu for quick access</li>
            <li>• <strong>Top Sub-Navigation</strong> - Appears when you click menu items with submenus</li>
            <li>• <strong>More Screen Space</strong> - Maximum content area with easy navigation</li>
            <li>• <strong>Hover Tooltips</strong> - Sidebar icons show labels on hover</li>
          </ul>
        </div></div>
      </HybridNavigationLayout>
    </div>
  </div>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
  );
}
