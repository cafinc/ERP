"use client";

import { useRouter } from "next/navigation";
import { Users, LayoutDashboard, ArrowRight, Zap } from "lucide-react";

export default function TestTopBar() {
  const router = useRouter();

  return (
    <PageHeader>
      <div className="p-6">
        {/* Banner */}
        <div className="mb-6 bg-gradient-to-r from-blue-600 to-teal-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Top Bar Navigation</h2>
          </div>
          <p className="text-blue-100 mb-4">
            Click sidebar icons with submenus to see the top bar appear below the header
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/test-slideout')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Switch to Slide-out Version
            </button>
            <button
              onClick={() => router.push('/submenu-options')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              View All Options
            </button></div></div>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 mb-6 hover:shadow-md transition-shadow">
          <h3 className="text-xl font-bold text-gray-900 mb-4">🧭 How to Test:</h3>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#3f72af] text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>Click the <strong>briefcase icon</strong> (HR Module) in the left sidebar</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#3f72af] text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>Watch the <strong>top bar</strong> appear with all submenu options</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#3f72af] text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>Notice how content pushes down to make room</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#3f72af] text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>Click any submenu button to navigate</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#3f72af] text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
              <span>Try <strong>Settings icon</strong> (gear) to see another top bar</span>
            </li>
          </ol>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-6 border border-blue-200">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#3f72af]" />
              Top Bar Features
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Horizontal bar below header</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>All options visible at once</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Easy to scan quickly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Content auto-adjusts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Active item highlighted</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Familiar navigation pattern</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-[#3f72af]" />
              Perfect For
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-[#3f72af] mt-0.5" />
                <span>Menus with 3-8 items</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-[#3f72af] mt-0.5" />
                <span>When you want everything visible</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-[#3f72af] mt-0.5" />
                <span>Traditional enterprise users</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-[#3f72af] mt-0.5" />
                <span>Desktop-first applications</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-[#3f72af] mt-0.5" />
                <span>Clean, simple navigation</span>
              </li>
            </ul>
          </div></div>

        {/* Sample Content */}
        <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Sample Dashboard Content</h3>
          <p className="text-gray-600 mb-4">
            This is your main content area. The top bar takes a bit of vertical space when active,
            but everything is immediately visible without extra clicks.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-[#3f72af] to-[#2c5282] text-white rounded-lg p-4">
              <p className="text-sm text-blue-100">Total Users</p>
              <p className="text-3xl font-bold">1,234</p>
            </div>
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg p-4">
              <p className="text-sm text-teal-100">Active Projects</p>
              <p className="text-3xl font-bold">42</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4">
              <p className="text-sm text-blue-100">Pending Tasks</p>
              <p className="text-3xl font-bold">18</p>
            </div></div></div></div>
    </PageHeader>
  );
}