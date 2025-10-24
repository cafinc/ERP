"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Users,
  Clock,
  Calendar,
  Award,
  TrendingUp,
  DollarSign,
  Settings,
  MapPin,
  Briefcase,
  ChevronRight,
  X,
} from "lucide-react";

export default function SubmenuOptions() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [demoMenu, setDemoMenu] = useState<string | null>(null);

  const hrSubmenu = [
    { label: "Overview", href: "/hr", icon: Briefcase },
    { label: "Employees", href: "/hr/employees", icon: Users },
    { label: "Time & Attendance", href: "/hr/time-attendance", icon: Clock },
    { label: "PTO", href: "/hr/pto", icon: Calendar },
    { label: "Training", href: "/hr/training", icon: Award },
    { label: "Performance", href: "/hr/performance", icon: TrendingUp },
    { label: "Payroll", href: "/hr/payroll", icon: DollarSign },
  ];

  const menuOptions = [
    {
      id: "top-bar",
      name: "Top Bar (Current)",
      description: "Horizontal bar below header with all submenu items",
      pros: ["Clean", "Shows all options", "Easy to scan"],
      cons: ["Takes vertical space", "Can feel crowded with many items"],
    },
    {
      id: "slide-panel",
      name: "Slide-out Panel",
      description: "Right-side panel that slides in with submenu",
      pros: ["Doesn't block content", "More space for descriptions", "Modern feel"],
      cons: ["Covers some content", "Extra click to close"],
    },
    {
      id: "dropdown",
      name: "Dropdown Menu",
      description: "Traditional dropdown next to the sidebar icon",
      pros: ["Familiar pattern", "Compact", "Quick access"],
      cons: ["Can be missed", "Limited space"],
    },
    {
      id: "mega-menu",
      name: "Mega Menu Overlay",
      description: "Full-screen overlay with cards for each submenu",
      pros: ["Visual appeal", "Room for icons/descriptions", "Modern"],
      cons: ["Takes over screen", "Might be overkill for simple menus"],
    },
    {
      id: "breadcrumb-bar",
      name: "Breadcrumb Bar",
      description: "Compact breadcrumb-style at the top",
      pros: ["Minimal space", "Shows context", "Clean"],
      cons: ["Less discoverable", "Requires knowing structure"],
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Submenu Display Options
            </h1>
            <p className="text-gray-600">
              Choose how submenus appear when clicking sidebar icons
            </p>
          </div>

          {/* Option Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {menuOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`bg-white rounded-xl shadow-sm border-2 cursor-pointer transition-all p-6 ${
                  selectedOption === option.id
                    ? "border-[#3f72af] bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {option.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{option.description}</p>

                <div className="space-y-2 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-green-600 mb-1">
                      ✓ Pros:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {option.pros.map((pro, idx) => (
                        <li key={idx}>• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-600 mb-1">
                      ⚠ Cons:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {option.cons.map((con, idx) => (
                        <li key={idx}>• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDemoMenu(option.id);
                  }}
                  className="w-full px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] text-sm font-medium transition-colors"
                >
                  Preview Demo
                </button>
              </div>
            ))}
          </div>

          {/* Demo Previews */}
          {demoMenu && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {menuOptions.find((o) => o.id === demoMenu)?.name} - Preview
                  </h2>
                  <button
                    onClick={() => setDemoMenu(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6">
                  {/* Top Bar Demo */}
                  {demoMenu === "top-bar" && (
                    <div className="space-y-4">
                      <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300">
                        <p className="text-sm text-gray-600 mb-2">
                          📍 Appears below header, spans full width
                        </p>
                        <div className="bg-white shadow-sm border-b border-gray-200 shadow-md p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 flex-wrap">
                            {hrSubmenu.map((item) => (
                              <button
                                key={item.href}
                                className="px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] text-sm font-medium transition-colors"
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Best For:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• When you want all options visible at once</li>
                          <li>• Menus with 3-8 items</li>
                          <li>• Users who prefer horizontal navigation</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Slide Panel Demo */}
                  {demoMenu === "slide-panel" && (
                    <div className="space-y-4">
                      <div className="relative bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300 h-96">
                        <p className="text-sm text-gray-600 mb-2">
                          📍 Slides in from right side
                        </p>
                        <div className="absolute top-0 right-0 w-80 h-full bg-white shadow-2xl border-l border-gray-200 rounded-l-lg">
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="text-lg font-semibold text-gray-900">
                                HR Module
                              </h3>
                              <button className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                            <div className="space-y-2">
                              {hrSubmenu.map((item) => {
                                const Icon = item.icon;
                                return (
                                  <button
                                    key={item.href}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition-colors text-left"
                                  >
                                    <Icon className="w-5 h-5 text-[#3f72af]" />
                                    <span className="font-medium text-gray-900">
                                      {item.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Best For:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Apps with many submenu items</li>
                          <li>• When you want icons + descriptions</li>
                          <li>• Modern, app-like experience</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Dropdown Demo */}
                  {demoMenu === "dropdown" && (
                    <div className="space-y-4">
                      <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300">
                        <p className="text-sm text-gray-600 mb-2">
                          📍 Appears next to sidebar icon
                        </p>
                        <div className="flex gap-4">
                          <div className="w-16 bg-gray-800 rounded-lg p-2">
                            <div className="p-2 bg-[#3f72af] rounded">
                              <Briefcase className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-2">
                            {hrSubmenu.slice(0, 5).map((item) => (
                              <button
                                key={item.href}
                                className="w-full px-3 py-2 hover:bg-gray-100 rounded text-left text-sm font-medium text-gray-700"
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Best For:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Traditional enterprise apps</li>
                          <li>• Users familiar with standard menus</li>
                          <li>• Compact, space-efficient design</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Mega Menu Demo */}
                  {demoMenu === "mega-menu" && (
                    <div className="space-y-4">
                      <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300">
                        <p className="text-sm text-gray-600 mb-2">
                          📍 Full overlay with visual cards
                        </p>
                        <div className="bg-white/95 backdrop-blur rounded-lg p-6">
                          <h3 className="text-2xl font-bold text-gray-900 mb-6">
                            HR Module
                          </h3>
                          <div className="grid grid-cols-3 gap-4">
                            {hrSubmenu.map((item) => {
                              const Icon = item.icon;
                              return (
                                <div
                                  key={item.href}
                                  className="bg-white shadow-sm border-2 border-gray-200 rounded-xl p-4 hover:border-[#3f72af] hover:shadow-lg transition-all cursor-pointer hover:shadow-md transition-shadow"
                                >
                                  <div className="bg-[#3f72af]/10 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                                    <Icon className="w-6 h-6 text-[#3f72af]" />
                                  </div>
                                  <h4 className="font-semibold text-gray-900 mb-1">
                                    {item.label}
                                  </h4>
                                  <p className="text-xs text-gray-600">
                                    Manage and track
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Best For:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Visual, card-based interfaces</li>
                          <li>• Complex apps with many modules</li>
                          <li>• When you want to showcase features</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Breadcrumb Bar Demo */}
                  {demoMenu === "breadcrumb-bar" && (
                    <div className="space-y-4">
                      <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300">
                        <p className="text-sm text-gray-600 mb-2">
                          📍 Compact breadcrumb navigation
                        </p>
                        <div className="bg-white shadow-sm border-b border-gray-200 p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">HR Module</span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                            <select className="border border-gray-300 rounded px-3 py-1 font-medium text-[#3f72af] focus:outline-none focus:ring-2 focus:ring-[#3f72af]">
                              {hrSubmenu.map((item) => (
                                <option key={item.href}>{item.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Best For:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Minimal, content-focused design</li>
                          <li>• Power users who know the structure</li>
                          <li>• Maximum screen space for content</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="bg-gradient-to-r from-[#3f72af] to-[#2c5282] text-white rounded-xl p-6">
            <h3 className="text-xl font-bold mb-2">💡 My Recommendation</h3>
            <p className="text-blue-100 mb-4">
              For your snow removal platform, I recommend either:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-lg p-4">
                <h4 className="font-semibold mb-2">1. Slide-out Panel (Best)</h4>
                <p className="text-sm text-blue-100">
                  Modern, doesn't crowd the interface, works great with your hybrid nav. Perfect for mobile too.
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <h4 className="font-semibold mb-2">2. Top Bar (Current)</h4>
                <p className="text-sm text-blue-100">
                  Clean, simple, all options visible. Good if you keep menus under 8 items.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
