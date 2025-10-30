"use client";

import PageHeader from '@/components/PageHeader';
import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Palette,
  Layout,
  Type,
  Square,
  Menu,
  AlignLeft,
  Grid3x3,
  Check,
  Eye,
} from "lucide-react";

export default function CompleteDesignSelector() {
  const router = useRouter();
  const [selections, setSelections] = useState({
    header: "enhanced",
    mainLayout: "cards-grid",
    submenuLayout: "tabs-content",
    font: "inter",
    spacing: "comfortable",
    cardStyle: "modern",
  });

  const updateSelection = (category: string, value: string) => {
    setSelections({ ...selections, [category]: value });
  };

  // Header Options
  const headerOptions = [
    {
      id: "enhanced",
      name: "Enhanced Header (Current)",
      preview: "Colored header with date/time, search, notifications",
      image: "bg-[#3f72af] h-16 rounded-t-lg flex items-center px-4 text-white text-sm font-medium",
      pros: ["Branded", "Feature-rich", "Shows context"],
      cons: ["Takes vertical space"],
    },
    {
      id: "minimal",
      name: "Minimal Header",
      preview: "Clean white header with logo and user menu only",
      image: "bg-white border-b h-12 rounded-t-lg flex items-center px-4 text-sm",
      pros: ["Maximum space", "Clean", "Modern"],
      cons: ["Less context", "Fewer quick actions"],
    },
    {
      id: "compact",
      name: "Compact Header",
      preview: "Slim header with essential elements only",
      image: "bg-gray-800 h-10 rounded-t-lg flex items-center px-4 text-white text-xs",
      pros: ["Space efficient", "Focused"],
      cons: ["Limited features"],
    },
    {
      id: "split",
      name: "Split Header",
      preview: "Top brand bar + bottom navigation bar",
      image: "bg-gradient-to-b from-[#3f72af] to-gray-100 h-20 rounded-t-lg",
      pros: ["Separate concerns", "Organized"],
      cons: ["More vertical space"],
    },
  ];

  // Main Page Layout Options
  const mainLayoutOptions = [
    {
      id: "cards-grid",
      name: "Cards Grid (Recommended)",
      description: "Dashboard-style with stat cards and quick actions",
      preview: (
        <div className="grid grid-cols-3 gap-2 p-2">
          <div className="bg-blue-100 h-8 rounded"></div>
          <div className="bg-green-100 h-8 rounded"></div>
          <div className="bg-purple-100 h-8 rounded"></div>
          <div className="bg-white shadow-sm border h-16 rounded col-span-3 hover:shadow-md transition-shadow"></div></div>
      ),
      bestFor: "Dashboards, Overview pages, Analytics",
    },
    {
      id: "table-focused",
      name: "Table Focused",
      description: "Emphasis on data tables with filters",
      preview: (
        <div className="p-2">
          <div className="bg-gray-100 h-4 rounded mb-2"></div>
          <div className="bg-white shadow-sm border rounded p-1 hover:shadow-md transition-shadow">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-50 h-3 mb-1 rounded"></div>
            ))}
          </div>
        </div>
      ),
      bestFor: "Customers, Projects, Invoices",
    },
    {
      id: "sidebar-detail",
      name: "Sidebar + Detail",
      description: "List sidebar with detail panel",
      preview: (
        <div className="flex gap-2 p-2">
          <div className="w-1/3 bg-gray-100 rounded p-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white h-3 mb-1 rounded"></div>
            ))}
          </div>
          <div className="flex-1 bg-white border rounded"></div></div>
      ),
      bestFor: "Messages, Contacts, Documents",
    },
    {
      id: "kanban",
      name: "Kanban Board",
      description: "Column-based workflow view",
      preview: (
        <div className="flex gap-2 p-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 bg-gray-100 rounded p-1">
              <div className="bg-white h-4 mb-1 rounded"></div>
              <div className="bg-white h-3 rounded"></div></div>
          ))}
        </div>
      ),
      bestFor: "Projects, Tasks, Workflows",
    },
  ];

  // Submenu Page Layouts
  const submenuLayoutOptions = [
    {
      id: "tabs-content",
      name: "Tabs + Content (Recommended)",
      description: "Horizontal tabs with content below",
      preview: (
        <div className="p-2">
          <div className="flex gap-1 mb-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`px-2 py-1 rounded text-xs ${i === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                Tab {i}
              </div>
            ))}
          </div>
          <div className="bg-white shadow-sm border rounded h-16 hover:shadow-md transition-shadow"></div></div>
      ),
      bestFor: "Settings, HR sections, Multi-view pages",
    },
    {
      id: "vertical-nav",
      name: "Vertical Side Navigation",
      description: "Left nav + right content",
      preview: (
        <div className="flex gap-2 p-2">
          <div className="w-1/4 bg-gray-100 rounded p-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 h-2 mb-1 rounded"></div>
            ))}
          </div>
          <div className="flex-1 bg-white border rounded"></div></div>
      ),
      bestFor: "Complex settings, Wizards",
    },
    {
      id: "accordion",
      name: "Accordion Sections",
      description: "Expandable sections stacked vertically",
      preview: (
        <div className="p-2 space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 h-4 rounded"></div>
          ))}
        </div>
      ),
      bestFor: "FAQ, Documentation, Long forms",
    },
  ];

  // Font Options
  const fontOptions = [
    {
      id: "inter",
      name: "Inter (Recommended)",
      style: "font-sans",
      description: "Modern, clean, excellent readability",
      sample: "The quick brown fox jumps over the lazy dog",
      bestFor: "Professional dashboards, SaaS products",
    },
    {
      id: "system",
      name: "System Default",
      style: "font-sans",
      description: "Native OS fonts, fast loading",
      sample: "The quick brown fox jumps over the lazy dog",
      bestFor: "Performance, Familiar feel",
    },
    {
      id: "roboto",
      name: "Roboto",
      style: "font-sans",
      description: "Google Material Design standard",
      sample: "The quick brown fox jumps over the lazy dog",
      bestFor: "Android-like, Technical apps",
    },
    {
      id: "poppins",
      name: "Poppins",
      style: "font-sans",
      description: "Friendly, geometric, modern",
      sample: "The quick brown fox jumps over the lazy dog",
      bestFor: "Marketing pages, Consumer apps",
    },
  ];

  // Spacing Options
  const spacingOptions = [
    {
      id: "compact",
      name: "Compact",
      description: "Tight spacing, more content visible",
      padding: "p-4",
      gap: "gap-3",
      bestFor: "Data-heavy apps, Power users",
    },
    {
      id: "comfortable",
      name: "Comfortable (Recommended)",
      description: "Balanced spacing, easy to scan",
      padding: "p-6",
      gap: "gap-6",
      bestFor: "Most applications, General use",
    },
    {
      id: "spacious",
      name: "Spacious",
      description: "Generous whitespace, clean look",
      padding: "p-8",
      gap: "gap-8",
      bestFor: "Executive dashboards, Presentations",
    },
  ];

  // Card Style Options
  const cardStyleOptions = [
    {
      id: "modern",
      name: "Modern (Current)",
      description: "Rounded corners, subtle shadows",
      className: "rounded-xl shadow-sm border border-gray-200",
      preview: <div className="h-16 rounded-xl shadow-sm border border-gray-200 bg-white"></div>,
    },
    {
      id: "flat",
      name: "Flat",
      description: "No shadows, borders only",
      className: "rounded-lg border-2 border-gray-300",
      preview: <div className="h-16 rounded-lg border-2 border-gray-300 bg-white"></div>,
    },
    {
      id: "elevated",
      name: "Elevated",
      description: "Strong shadows, floating effect",
      className: "rounded-2xl shadow-lg",
      preview: <div className="h-16 rounded-2xl shadow-lg bg-white"></div>,
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "Subtle borders, very clean",
      className: "rounded-lg border border-gray-100",
      preview: <div className="h-16 rounded-lg border border-gray-100 bg-white"></div>,
    },
  ];

  const allSelectionsComplete = Object.values(selections).every((v) => v !== null);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Complete Design Selector"
        subtitle="Manage complete design selector"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Complete Design Selector" }]}
      />
      <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              🎨 Complete Design System Selector
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Choose all your design preferences now. We'll apply everything in one go.
            </p>
            
            {/* Selection Summary */}
            <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-3">Your Selections:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(selections).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500 capitalize">{key}</p>
                      <p className="text-sm font-medium capitalize">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 1. Header Options */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Menu className="w-6 h-6 text-[#3f72af]" />
              <h2 className="text-2xl font-bold text-gray-900">1. Header Style</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {headerOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => updateSelection("header", option.id)}
                  className={`bg-white rounded-xl border-2 cursor-pointer transition-all p-4 ${
                    selections.header === option.id
                      ? "border-[#3f72af] ring-2 ring-[#3f72af]/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={option.image}>
                    {option.name}
                  </div>
                  <div className="mt-3">
                    <h3 className="font-semibold text-gray-900 mb-1">{option.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{option.preview}</p>
                    <div className="flex gap-4 text-xs">
                      <div>
                        <span className="text-green-600 font-semibold">Pros:</span>
                        <ul className="ml-2">{option.pros.map((p, i) => <li key={i}>• {p}</li>)}</ul>
                      </div>
                      <div>
                        <span className="text-amber-600 font-semibold">Cons:</span>
                        <ul className="ml-2">{option.cons.map((c, i) => <li key={i}>• {c}</li>)}</ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Main Page Layouts */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Layout className="w-6 h-6 text-[#3f72af]" />
              <h2 className="text-2xl font-bold text-gray-900">2. Main Page Layout</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mainLayoutOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => updateSelection("mainLayout", option.id)}
                  className={`bg-white rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${
                    selections.mainLayout === option.id
                      ? "border-[#3f72af] ring-2 ring-[#3f72af]/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="bg-gray-50 h-32">{option.preview}</div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{option.name}</h3>
                    <p className="text-xs text-gray-600 mb-2">{option.description}</p>
                    <p className="text-xs text-[#3f72af] font-medium">
                      Best for: {option.bestFor}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Submenu Page Layouts */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <AlignLeft className="w-6 h-6 text-[#3f72af]" />
              <h2 className="text-2xl font-bold text-gray-900">3. Submenu Page Layout</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {submenuLayoutOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => updateSelection("submenuLayout", option.id)}
                  className={`bg-white rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${
                    selections.submenuLayout === option.id
                      ? "border-[#3f72af] ring-2 ring-[#3f72af]/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="bg-gray-50 h-32">{option.preview}</div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{option.name}</h3>
                    <p className="text-xs text-gray-600 mb-2">{option.description}</p>
                    <p className="text-xs text-[#3f72af] font-medium">
                      Best for: {option.bestFor}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Typography */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Type className="w-6 h-6 text-[#3f72af]" />
              <h2 className="text-2xl font-bold text-gray-900">4. Typography / Font</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fontOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => updateSelection("font", option.id)}
                  className={`bg-white rounded-xl border-2 cursor-pointer transition-all p-6 ${
                    selections.font === option.id
                      ? "border-[#3f72af] ring-2 ring-[#3f72af]/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{option.name}</h3>
                  <p className={`text-2xl mb-3 ${option.style}`}>{option.sample}</p>
                  <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                  <p className="text-xs text-[#3f72af] font-medium">
                    Best for: {option.bestFor}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Spacing */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Grid3x3 className="w-6 h-6 text-[#3f72af]" />
              <h2 className="text-2xl font-bold text-gray-900">5. Spacing Density</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {spacingOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => updateSelection("spacing", option.id)}
                  className={`bg-white rounded-xl border-2 cursor-pointer transition-all p-6 ${
                    selections.spacing === option.id
                      ? "border-[#3f72af] ring-2 ring-[#3f72af]/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{option.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                  <div className={`${option.padding} ${option.gap} border border-gray-200 rounded`}>
                    <div className="bg-blue-100 h-8 rounded"></div></div>
                  <p className="text-xs text-[#3f72af] font-medium mt-3">
                    Best for: {option.bestFor}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 6. Card Styles */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Square className="w-6 h-6 text-[#3f72af]" />
              <h2 className="text-2xl font-bold text-gray-900">6. Card Styles</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {cardStyleOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => updateSelection("cardStyle", option.id)}
                  className={`bg-white rounded-xl border-2 cursor-pointer transition-all p-4 ${
                    selections.cardStyle === option.id
                      ? "border-[#3f72af] ring-2 ring-[#3f72af]/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{option.name}</h3>
                  {option.preview}
                  <p className="text-sm text-gray-600 mt-3">{option.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Apply Button */}
          <div className="bg-gradient-to-r from-[#3f72af] to-[#2c5282] rounded-2xl shadow-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">Ready to Apply Your Design System?</h3>
                <p className="text-blue-100">
                  This will update all 150+ pages with your selected preferences
                </p>
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-semibold">Navigation</p>
                    <p className="text-blue-200">✓ Already applied</p>
                  </div>
                  <div>
                    <p className="font-semibold">Colors</p>
                    <p className="text-blue-200">726 instances to update</p>
                  </div>
                  <div>
                    <p className="font-semibold">Components</p>
                    <p className="text-blue-200">All pages</p>
                  </div>
                </div>
              </div>
              <button
                disabled={!allSelectionsComplete}
                className={`px-8 py-4 rounded-xl font-bold text-lg shadow-2xl transition-all ${
                  allSelectionsComplete
                    ? "bg-white text-[#3f72af] hover:bg-blue-50 hover:scale-105"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Eye className="w-6 h-6 inline mr-2" />
                Apply Complete Design System
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-900">
              <strong>💡 Pro Tip:</strong> Take your time reviewing each option. Once you click "Apply",
              we'll implement everything across your entire platform in one comprehensive update.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  </div>
  );
}
