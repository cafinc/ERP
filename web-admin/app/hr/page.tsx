"use client";

import { useState } from "react";
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

export default function HRModulePage() {
  const router = useRouter();

  const modules = [
    {
      title: "Employee Management",
      description: "Manage employee profiles, documents, and information",
      icon: Users,
      href: "/hr/employees",
      color: "bg-[#5b8ec4]",
    },
    {
      title: "Time & Attendance",
      description: "Track work hours, clock in/out, and approve timesheets",
      icon: Clock,
      href: "/hr/time-attendance",
      color: "bg-green-500",
    },
    {
      title: "PTO Management",
      description: "Manage time off requests, approvals, and balances",
      icon: Calendar,
      href: "/hr/pto",
      color: "bg-purple-500",
    },
    {
      title: "Training & Certifications",
      description: "Track employee training programs and certifications",
      icon: Award,
      href: "/hr/training",
      color: "bg-orange-500",
    },
    {
      title: "Performance Management",
      description: "Conduct performance reviews and set goals",
      icon: TrendingUp,
      href: "/hr/performance",
      color: "bg-pink-500",
    },
    {
      title: "Payroll Settings",
      description: "Configure payroll settings and wage calculations",
      icon: DollarSign,
      href: "/hr/payroll",
      color: "bg-indigo-500",
    },
  ];

  return (
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-6">
        <PageHeader
        title="Hr"
        subtitle="Manage hr"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Hr" }]}
        title="HR Module"
          icon={Users}
          badges={[
            { label: "24 Employees", color: "blue" },
            { label: "12 Active", color: "green" },
            { label: "5 PTO Pending", color: "purple" },
          ]}
        />

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900">24</p>
              </div>
              <Users className="h-12 w-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Time Entries</p>
                <p className="text-3xl font-bold text-gray-900">12</p>
              </div>
              <Clock className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending PTO Requests</p>
                <p className="text-3xl font-bold text-gray-900">5</p>
              </div>
              <Calendar className="h-12 w-12 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => (
            <div
              key={module.href}
              onClick={() => router.push(module.href)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer overflow-hidden group"
            >
              <div className={`${module.color} h-2`} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${module.color} bg-opacity-10 p-3 rounded-lg`}>
                    <module.icon className={`h-6 w-6 ${module.color.replace('bg-', 'text-')}`} />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-600">{module.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push("/hr/employees")}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors"
            >
              <Users className="h-5 w-5" />
              Add Employee
            </button>
            <button
              onClick={() => router.push("/hr/time-attendance")}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Clock className="h-5 w-5" />
              Review Timesheets
            </button>
            <button
              onClick={() => router.push("/hr/pto")}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Calendar className="h-5 w-5" />
              Approve PTO
            </button>
          </div>
        </div>
      </div>
    );
}
