'use client';

import PageHeader from '@/components/PageHeader';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Palette,
  Layout,
  MousePointer,
  Check,
  Home,
  Users,
  Settings,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

export default function DesignSystemDemo() {
  const router = useRouter();
  const [selectedNav, setSelectedNav] = useState('sidebar');
  const [selectedTheme, setSelectedTheme] = useState('professional-blue');

  const colorPalettes = [
    {
      id: 'header-inspired',
      name: 'Header Inspired ⭐',
      description: 'Matches your Enhanced Header (#3f72af)',
      primary: '#3f72af',
      secondary: '#2c5282',
      accent: '#5b8ec4',
      gradient: 'from-[#3f72af] to-[#2c5282]',
      sample: 'bg-gradient-to-r from-[#3f72af] to-[#2c5282]',
    },
    {
      id: 'professional-blue',
      name: 'Professional Blue',
      description: 'Trust & Innovation',
      primary: '#2563eb',
      secondary: '#0d9488',
      accent: '#3b82f6',
      gradient: 'from-blue-600 to-teal-600',
      sample: 'bg-gradient-to-r from-blue-600 to-blue-700',
    },
    {
      id: 'arctic-frost',
      name: 'Arctic Frost',
      description: 'Cool & Modern (Snow Theme)',
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      accent: '#38bdf8',
      gradient: 'from-sky-500 to-cyan-500',
      sample: 'bg-gradient-to-r from-sky-500 to-cyan-600',
    },
    {
      id: 'deep-navy',
      name: 'Deep Navy',
      description: 'Corporate & Professional',
      primary: '#1e40af',
      secondary: '#475569',
      accent: '#3b82f6',
      gradient: 'from-blue-900 to-slate-700',
      sample: 'bg-gradient-to-r from-blue-900 to-slate-700',
    },
    {
      id: 'forest-green',
      name: 'Forest Green',
      description: 'Natural & Trustworthy',
      primary: '#059669',
      secondary: '#0d9488',
      accent: '#10b981',
      gradient: 'from-emerald-600 to-teal-600',
      sample: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    },
    {
      id: 'sunset-orange',
      name: 'Sunset Orange',
      description: 'Energetic & Bold',
      primary: '#ea580c',
      secondary: '#f59e0b',
      accent: '#fb923c',
      gradient: 'from-orange-600 to-amber-500',
      sample: 'bg-gradient-to-r from-orange-600 to-amber-500',
    },
    {
      id: 'royal-purple',
      name: 'Royal Purple',
      description: 'Premium & Elegant',
      primary: '#7c3aed',
      secondary: '#a855f7',
      accent: '#9333ea',
      gradient: 'from-violet-600 to-purple-600',
      sample: 'bg-gradient-to-r from-violet-600 to-purple-600',
    },
  ];

  const navigationTypes = [
    {
      id: 'sidebar',
      name: 'Left Sidebar',
      description: 'Traditional (Current)',
      preview: (
        <div className="w-full h-32 bg-white border-2 border-gray-300 rounded-lg overflow-hidden flex">
          <div className="w-16 bg-gray-800 flex flex-col items-center py-2 gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded"></div>
            <div className="w-8 h-8 bg-gray-600 rounded"></div>
            <div className="w-8 h-8 bg-gray-600 rounded"></div>
          </div>
          <div className="flex-1 bg-gray-50 p-2">
            <div className="h-3 bg-gray-300 rounded mb-2 w-3/4"></div>
            <div className="h-16 bg-white rounded border border-gray-200"></div>
          </div>
        </div>
      ),
    },
    {
      id: 'top-nav',
      name: 'Top Navigation',
      description: 'Modern & Clean',
      preview: (
        <div className="w-full h-32 bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
          <div className="h-12 bg-gray-800 flex items-center px-3 gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded"></div>
            <div className="w-16 h-4 bg-gray-600 rounded"></div>
            <div className="w-16 h-4 bg-gray-600 rounded"></div>
            <div className="w-16 h-4 bg-gray-600 rounded"></div>
          </div>
          <div className="bg-gray-50 p-2 h-20">
            <div className="h-16 bg-white rounded border border-gray-200"></div>
          </div>
        </div>
      ),
    },
    {
      id: 'hybrid',
      name: 'Hybrid Navigation',
      description: 'Top + Collapsed Sidebar',
      preview: (
        <div className="w-full h-32 bg-white border-2 border-gray-300 rounded-lg overflow-hidden flex">
          <div className="w-12 bg-gray-800 flex flex-col items-center py-2 gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded"></div>
            <div className="w-6 h-6 bg-gray-600 rounded"></div>
            <div className="w-6 h-6 bg-gray-600 rounded"></div>
          </div>
          <div className="flex-1">
            <div className="h-10 bg-gray-700 flex items-center px-2 gap-2">
              <div className="w-12 h-3 bg-gray-500 rounded"></div>
              <div className="w-12 h-3 bg-gray-500 rounded"></div>
            </div>
            <div className="bg-gray-50 p-2 h-22">
              <div className="h-14 bg-white rounded border border-gray-200"></div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'minimal-top',
      name: 'Minimal Top Bar',
      description: 'Maximum Content Space',
      preview: (
        <div className="w-full h-32 bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
          <div className="h-10 bg-white border-b-2 border-gray-200 flex items-center px-3 gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded"></div>
            <div className="flex-1"></div>
            <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
          </div>
          <div className="bg-gray-50 p-2">
            <div className="h-16 bg-white rounded border border-gray-200"></div>
          </div>
        </div>
      ),
    },
  ];

  const buttonStyles = [
    {
      category: 'Primary Actions',
      buttons: [
        { name: 'Solid', className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium' },
        { name: 'Gradient', className: 'px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium' },
        { name: 'Shadow', className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-xl font-medium transform hover:-translate-y-0.5 transition-all' },
        { name: 'Pill', className: 'px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 font-medium' },
      ],
    },
    {
      category: 'Secondary Actions',
      buttons: [
        { name: 'Outlined', className: 'px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium' },
        { name: 'Ghost', className: 'px-4 py-2 text-blue-600 rounded-lg hover:bg-blue-50 font-medium' },
        { name: 'Subtle', className: 'px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium' },
      ],
    },
    {
      category: 'Destructive Actions',
      buttons: [
        { name: 'Danger', className: 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium' },
        { name: 'Danger Outlined', className: 'px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 font-medium' },
      ],
    },
    {
      category: 'Icon Buttons',
      buttons: [
        { name: 'Icon Only', className: 'p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700', icon: true },
        { name: 'Icon Circle', className: 'p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700', icon: true },
        { name: 'Icon Ghost', className: 'p-2 text-blue-600 rounded-lg hover:bg-blue-50', icon: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Design System Demo"
        subtitle="Manage design system demo"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Design System Demo" }]}
      />
      <DashboardLayout>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Design System Customization</h1>
          </div>
          <p className="text-gray-600">Choose your navigation style, color palette, and button preferences</p>
          <button
            onClick={() => router.push('/hr')}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Back to HR Module
          </button>
        </div>

        {/* Color Palettes Section */}
        <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 mb-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Color Palettes</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Choose a color theme that matches your brand identity</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {colorPalettes.map((palette) => (
              <div
                key={palette.id}
                onClick={() => setSelectedTheme(palette.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedTheme === palette.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{palette.name}</h3>
                    <p className="text-xs text-gray-500">{palette.description}</p>
                  </div>
                  {selectedTheme === palette.id && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                
                {/* Color Preview */}
                <div className={`h-16 rounded-lg ${palette.sample} mb-3`}></div>
                
                {/* Color Swatches */}
                <div className="flex gap-2">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: palette.primary }}
                  ></div>
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: palette.secondary }}
                  ></div>
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: palette.accent }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Layouts Section */}
        <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 mb-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <Layout className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Navigation Layouts</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Choose how users navigate your dashboard</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {navigationTypes.map((nav) => (
              <div
                key={nav.id}
                onClick={() => setSelectedNav(nav.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedNav === nav.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{nav.name}</h3>
                    <p className="text-xs text-gray-500">{nav.description}</p>
                  </div>
                  {selectedNav === nav.id && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                
                {/* Preview */}
                {nav.preview}
              </div>
            ))}
          </div>
        </div>

        {/* Button Styles Section */}
        <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-6 mb-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <MousePointer className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Button Styles</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Preview different button styles for your interface</p>
          
          <div className="space-y-6">
            {buttonStyles.map((category) => (
              <div key={category.category}>
                <h3 className="font-semibold text-gray-700 mb-3">{category.category}</h3>
                <div className="flex flex-wrap gap-3">
                  {category.buttons.map((button) => (
                    <div key={button.name} className="flex flex-col items-center gap-2">
                      <button className={button.className}>
                        {button.icon ? <Settings className="w-5 h-5" /> : button.name}
                      </button>
                      <span className="text-xs text-gray-500">{button.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Apply Button */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-1">Ready to Apply Your Design?</h3>
              <p className="text-blue-100 text-sm">
                Selected: <span className="font-semibold">{colorPalettes.find(p => p.id === selectedTheme)?.name}</span> + 
                <span className="font-semibold"> {navigationTypes.find(n => n.id === selectedNav)?.name}</span>
              </p>
            </div>
            <button className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-semibold shadow-lg">
              Apply Design System
            </button>
          </div>
        </div>

        {/* Note */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> This is a preview page. To implement the selected design system across your entire dashboard,
            I'll need to create a theme configuration system and update all components. Let me know which combination you prefer!
          </p>
        </div>
      </div>
      </div>
    </div>
    </DashboardLayout>
    </div>
  );
}
