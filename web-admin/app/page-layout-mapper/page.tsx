"use client";

import PageHeader from '@/components/PageHeader';

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  DollarSign,
  MapPin,
  Briefcase,
  Settings,
  Check,
  Grid3x3,
  Table,
  Columns,
  Trello,
} from "lucide-react";

export default function PageLayoutMapper() {
  const router = useRouter();
  
  // Layout options
  const layoutOptions = [
    {
      id: "cards-grid",
      name: "Cards Grid",
      icon: Grid3x3,
      color: "blue",
      description: "Dashboard-style with stat cards",
      preview: (
        <div className="grid grid-cols-3 gap-1 p-1">
          <div className="bg-blue-200 h-4 rounded"></div>
          <div className="bg-green-200 h-4 rounded"></div>
          <div className="bg-purple-200 h-4 rounded"></div>          <div className="bg-white shadow-sm border h-8 rounded col-span-3 hover:shadow-md transition-shadow">
          </div>
        </div>
      ),
    },
    {
      id: "table-focused",
      name: "Table Focused",
      icon: Table,
      color: "green",
      description: "Data tables with filters",
      preview: (
        <div className="p-1">
          <div className="bg-gray-200 h-2 rounded mb-1"></div>
          <div className="bg-white shadow-sm border rounded p-1 hover:shadow-md transition-shadow">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 h-2 mb-1 rounded"></div>
          ))}
          </div>
        </div>
      ),
    },
    {
      id: "sidebar-detail",
      name: "Sidebar + Detail",
      icon: Columns,
      color: "purple",
      description: "List sidebar with detail panel",
      preview: (
        <div className="flex gap-1 p-1">
          <div className="w-1/3 bg-gray-200 rounded p-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white h-2 mb-1 rounded"></div>
          ))}
          </div>          <div className="flex-1 bg-white border rounded">
          </div>
        </div>
      ),
    },
    {
      id: "kanban",
      name: "Kanban Board",
      icon: Trello,
      color: "orange",
      description: "Column-based workflow",
      preview: (
        <div className="flex gap-1 p-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 bg-gray-200 rounded p-1">
              <div className="bg-white h-3 mb-1 rounded"></div>              <div className="bg-white h-2 rounded">
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  // Page groups with suggested layouts
  const pageGroups = [
    {
      category: "Main Dashboard",
      icon: LayoutDashboard,
      pages: [
        { name: "Dashboard Home", path: "/", suggested: "cards-grid" },
      ],
    },
    {
      category: "Customer Management",
      icon: Users,
      pages: [
        { name: "Customers List", path: "/customers", suggested: "table-focused" },
        { name: "Customer Detail", path: "/customers/[id]", suggested: "sidebar-detail" },
        { name: "Customer Create/Edit", path: "/customers/create", suggested: "sidebar-detail" },
      ],
    },
    {
      category: "Sales & Estimates",
      icon: FileText,
      pages: [
        { name: "Estimates List", path: "/estimates", suggested: "table-focused" },
        { name: "Estimate Detail", path: "/estimates/[id]", suggested: "sidebar-detail" },
        { name: "Contracts List", path: "/contracts", suggested: "table-focused" },
        { name: "Contract Detail", path: "/contracts/[id]", suggested: "sidebar-detail" },
      ],
    },
    {
      category: "Projects & Work",
      icon: FolderOpen,
      pages: [
        { name: "Projects List", path: "/projects", suggested: "table-focused" },
        { name: "Project Detail", path: "/projects/[id]", suggested: "kanban" },
        { name: "Tasks", path: "/tasks", suggested: "kanban" },
        { name: "Dispatch Dashboard", path: "/dispatch/dashboard", suggested: "cards-grid" },
        { name: "Dispatch List", path: "/dispatch", suggested: "table-focused" },
      ],
    },
    {
      category: "Financial",
      icon: DollarSign,
      pages: [
        { name: "Invoices List", path: "/invoices", suggested: "table-focused" },
        { name: "Invoice Detail", path: "/invoices/[id]", suggested: "sidebar-detail" },
        { name: "Finance Dashboard", path: "/finance/dashboard", suggested: "cards-grid" },
        { name: "Payments", path: "/finance/payments", suggested: "table-focused" },
        { name: "Expenses", path: "/finance/expenses", suggested: "table-focused" },
      ],
    },
    {
      category: "Sites & Assets",
      icon: MapPin,
      pages: [
        { name: "Sites List", path: "/sites", suggested: "table-focused" },
        { name: "Site Detail", path: "/sites/[id]", suggested: "sidebar-detail" },
        { name: "Site Maps", path: "/sites/maps", suggested: "cards-grid" },
        { name: "Equipment Dashboard", path: "/equipment/dashboard", suggested: "cards-grid" },
        { name: "Equipment List", path: "/equipment", suggested: "table-focused" },
        { name: "Inventory", path: "/inventory", suggested: "table-focused" },
      ],
    },
    {
      category: "HR Module",
      icon: Briefcase,
      pages: [
        { name: "HR Dashboard", path: "/hr", suggested: "cards-grid" },
        { name: "Employees", path: "/hr/employees", suggested: "table-focused" },
        { name: "Time & Attendance", path: "/hr/time-attendance", suggested: "table-focused" },
        { name: "PTO Management", path: "/hr/pto", suggested: "table-focused" },
        { name: "Training", path: "/hr/training", suggested: "table-focused" },
        { name: "Performance", path: "/hr/performance", suggested: "table-focused" },
        { name: "Payroll", path: "/hr/payroll", suggested: "cards-grid" },
      ],
    },
    {
      category: "Communication",
      icon: Users,
      pages: [
        { name: "Messages", path: "/messages", suggested: "sidebar-detail" },
        { name: "Communication Dashboard", path: "/communication/dashboard", suggested: "cards-grid" },
        { name: "Gmail", path: "/gmail", suggested: "sidebar-detail" },
        { name: "RingCentral", path: "/ringcentral", suggested: "sidebar-detail" },
      ],
    },
    {
      category: "Settings & Admin",
      icon: Settings,
      pages: [
        { name: "Settings Hub", path: "/settings", suggested: "cards-grid" },
        { name: "Account Settings", path: "/settings/account", suggested: "sidebar-detail" },
        { name: "Security", path: "/settings/security", suggested: "sidebar-detail" },
        { name: "Branding", path: "/settings/branding", suggested: "sidebar-detail" },
        { name: "Roles & Permissions", path: "/settings/roles-permissions", suggested: "table-focused" },
        { name: "Integrations", path: "/integrations", suggested: "cards-grid" },
        { name: "Access Dashboard", path: "/access", suggested: "cards-grid" },
      ],
    },
  ];

  const [layoutSelections, setLayoutSelections] = useState<Record<string, string>>(
    pageGroups.reduce((acc, group) => {
      group.pages.forEach((page) => {
        acc[page.path] = page.suggested;
      });
      return acc;
    }, {} as Record<string, string>)
  );

  const updateLayout = (path: string, layoutId: string) => {
    setLayoutSelections({ ...layoutSelections, [path]: layoutId });
  };

  const getLayoutColor = (layoutId: string) => {
    const layout = layoutOptions.find((l) => l.id === layoutId);
    return layout?.color || "gray";
  };

  const colorClasses = {
    blue: "bg-blue-100 text-blue-700 border-blue-300",
    green: "bg-green-100 text-green-700 border-green-300",
    purple: "bg-purple-100 text-purple-700 border-purple-300",
    orange: "bg-orange-100 text-orange-700 border-orange-300",
  };

  return (
    <div>
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Page Layout Mapper"
        subtitle="Manage page layout mapper"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Page Layout Mapper" }]}
      />
      <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              📐 Page-by-Page Layout Mapper
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Assign the best layout to each page based on its purpose
            </p>

            {/* Layout Legend */}
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-4">Layout Options:</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {layoutOptions.map((layout) => {
                  const Icon = layout.icon;
                  return (
                    <div
                      key={layout.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className={`p-2 rounded-lg bg-${layout.color}-100`}>
                        <Icon className={`w-5 h-5 text-${layout.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-900">
                          {layout.name}
                        </h4>
                        <p className="text-xs text-gray-600">{layout.description}</p>
                        <div className="mt-2 bg-white rounded border border-gray-200 h-16">
                          {layout.preview}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
</DashboardLayout>
</div>
</div>
          );
    </DashboardLayout>
                })}
          {/* Page Groups */}
          {pageGroups.map((group) => {
            const CategoryIcon = group.icon;
            return (
              <div key={group.category} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <CategoryIcon className="w-6 h-6 text-[#3f72af]" />
                  <h2 className="text-2xl font-bold text-gray-900">{group.category}</h2>

                <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="divide-y divide-gray-200">
                    {group.pages.map((page) => {
                      const selectedLayout = layoutSelections[page.path];
                      const selectedLayoutOption = layoutOptions.find(
                        (l) => l.id === selectedLayout
        </DashboardLayout>
                      );
                      const SelectedIcon = selectedLayoutOption?.icon || Grid3x3;

                      return (
                        <div
                          key={page.path}
                          className="p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {page.name}
                              </h3>
                              <p className="text-sm text-gray-500">{page.path}</p>

                            <div className="flex items-center gap-3">
                              {/* Current Selection */}
                              <div
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                                  colorClasses[
                                    getLayoutColor(selectedLayout) as keyof typeof colorClasses
                                  ]
                                }`}
                              >
                                <SelectedIcon className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  {selectedLayoutOption?.name}
                                </span>

                              {/* Layout Selector Buttons */}
                              <div className="flex gap-2">
                                {layoutOptions.map((layout) => {
                                  const Icon = layout.icon;
                                  const isSelected = selectedLayout === layout.id;
                                  return (
                                    <button
                                      key={layout.id}
                                      onClick={() => updateLayout(page.path, layout.id)}
                                      className={`p-2 rounded-lg border-2 transition-all ${
                                        isSelected
                                          ? `border-${layout.color}-500 bg-${layout.color}-50`
                                          : "border-gray-200 hover:border-gray-300 bg-white"
                                      }`}
                                      title={layout.name}
                                    >
                                      <Icon
                                        className={`w-5 h-5 ${
                                          isSelected
                                            ? `text-${layout.color}-600`
                                            : "text-gray-400"
                                        }`}
                                      />
</DashboardLayout>
          );
          </DashboardLayout>
                                })}
                              </div></div>
</DashboardLayout>
          );
      </DashboardLayout>
                    })}
                  </div></div>
  </DashboardLayout>
          );
  </DashboardLayout>
          })}

          {/* Summary & Apply */}
          <div className="bg-gradient-to-r from-[#3f72af] to-[#2c5282] rounded-2xl shadow-2xl p-8 text-white">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Layout Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {layoutOptions.map((layout) => {
                  const count = Object.values(layoutSelections).filter(
                    (l) => l === layout.id
                  ).length;
                  const Icon = layout.icon;
                  return (
                    <div
                      key={layout.id}
                      className="bg-white/10 rounded-lg p-3 flex items-center gap-3"
                    >
                      <Icon className="w-5 h-5" />
                      <div>
                        <p className="font-semibold">{layout.name}</p>
                        <p className="text-sm text-blue-200">{count} pages</p>
                      </div></div>
</DashboardLayout>
          );
  </DashboardLayout>
                })}
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <div>
                <p className="text-blue-100 mb-2">
                  Ready to apply layouts + your design system selections?
                </p>
                <p className="text-sm text-blue-200">
                  Includes: Colors, Fonts, Spacing, Cards, Navigation + Page Layouts
                </p>
              <button
                onClick={() => {
                  // Save selections to localStorage or state
                  localStorage.setItem(
                    "layoutSelections",
                    JSON.stringify(layoutSelections)
    </DashboardLayout>
                  );
                  alert(
                    "Layout selections saved! Ready to implement complete design system."
    </DashboardLayout>
                  );
                }}
                className="px-8 py-4 bg-white text-[#3f72af] rounded-xl font-bold text-lg shadow-2xl hover:bg-blue-50 hover:scale-105 transition-all"
              >
                Save & Continue to Implementation
          {/* Info */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-900">
              <strong>💡 Quick Tip:</strong> Click the icon buttons next to each page to change
              its layout. Your suggested layouts are pre-selected based on best practices, but
              feel free to customize!
            </p>
          </div></div>
      </DashboardLayout>
      </DashboardLayout>
          );
}
