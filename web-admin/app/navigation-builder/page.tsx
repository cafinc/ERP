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
  UserCog,
  Link2,
  Truck,
  Wrench,
  MessageSquare,
  TrendingUp,
  Package,
  Shield,
  Calendar,
  Phone,
  FileCheck,
  Route,
  Cloud,
  BarChart3,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Eye,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface NavPage {
  name: string;
  path: string;
  icon?: any;
}

interface NavSection {
  id: string;
  label: string;
  icon: any;
  type: 'single' | 'submenu';
  href?: string;
  submenu?: NavPage[];
  color?: string;
}

export default function NavigationBuilder() {
  const router = useRouter();
  
  // All available pages organized by category
  const availablePages = {
    dashboard: { name: "Dashboard", path: "/", icon: LayoutDashboard },
    
    customers: [
      { name: "All Customers", path: "/customers" },
      { name: "Customer Detail", path: "/customers/[id]" },
      { name: "Create Customer", path: "/customers/create" },
    ],
    
    estimates: [
      { name: "All Estimates", path: "/estimates" },
      { name: "Estimate Detail", path: "/estimates/[id]" },
      { name: "Create Estimate", path: "/estimates/create" },
    ],
    
    projects: [
      { name: "All Projects", path: "/projects" },
      { name: "Project Detail", path: "/projects/[id]" },
      { name: "Create Project", path: "/projects/create" },
    ],
    
    invoices: [
      { name: "All Invoices", path: "/invoices" },
      { name: "Invoice Detail", path: "/invoices/[id]" },
      { name: "Create Invoice", path: "/invoices/create" },
    ],
    
    dispatch: [
      { name: "Dispatch Dashboard", path: "/dispatch/dashboard" },
      { name: "All Dispatches", path: "/dispatch" },
      { name: "Create Dispatch", path: "/dispatch/create" },
    ],
    
    sites: [
      { name: "All Sites", path: "/sites" },
      { name: "Site Detail", path: "/sites/[id]" },
      { name: "Site Maps", path: "/sites/maps" },
      { name: "Create Site", path: "/sites/create" },
    ],
    
    equipment: [
      { name: "Equipment Dashboard", path: "/equipment/dashboard" },
      { name: "All Equipment", path: "/equipment" },
      { name: "Inspections", path: "/equipment/inspections" },
      { name: "Maintenance", path: "/equipment/maintenance" },
      { name: "Create Equipment", path: "/equipment/create" },
    ],
    
    assets: [
      { name: "Vehicles", path: "/assets/vehicles" },
      { name: "Trailers", path: "/assets/trailers" },
      { name: "Tools", path: "/assets/tools" },
    ],
    
    inventory: [
      { name: "Inventory List", path: "/inventory" },
      { name: "Consumables", path: "/consumables" },
      { name: "Analytics", path: "/consumables/analytics" },
      { name: "Add Inventory", path: "/inventory/add" },
    ],
    
    hr: [
      { name: "HR Dashboard", path: "/hr" },
      { name: "Employees", path: "/hr/employees" },
      { name: "Time & Attendance", path: "/hr/time-attendance" },
      { name: "PTO", path: "/hr/pto" },
      { name: "Training", path: "/hr/training" },
      { name: "Performance", path: "/hr/performance" },
      { name: "Payroll", path: "/hr/payroll" },
    ],
    
    team: [
      { name: "Team Members", path: "/team" },
      { name: "Crew", path: "/crew" },
      { name: "Shifts", path: "/shifts" },
      { name: "Shift History", path: "/shifts/history" },
    ],
    
    finance: [
      { name: "Finance Dashboard", path: "/finance/dashboard" },
      { name: "Payments", path: "/finance/payments" },
      { name: "Expenses", path: "/finance/expenses" },
      { name: "Reports", path: "/finance/reports" },
    ],
    
    communication: [
      { name: "Communication Dashboard", path: "/communication/dashboard" },
      { name: "Messages", path: "/messages" },
      { name: "Gmail", path: "/gmail" },
      { name: "Feedback", path: "/feedback" },
    ],
    
    ringcentral: [
      { name: "RingCentral Hub", path: "/ringcentral" },
      { name: "Active Calls", path: "/ringcentral/active-calls" },
      { name: "Messaging", path: "/ringcentral/messaging" },
      { name: "SMS", path: "/ringcentral/sms" },
      { name: "Recordings", path: "/ringcentral/recordings" },
      { name: "Analytics", path: "/ringcentral/analytics" },
      { name: "Contacts", path: "/ringcentral/contacts" },
    ],
    
    contracts: [
      { name: "All Contracts", path: "/contracts" },
      { name: "Contract Detail", path: "/contracts/[id]" },
      { name: "Create Contract", path: "/contracts/create" },
    ],
    
    agreements: [
      { name: "All Agreements", path: "/agreements" },
      { name: "Templates", path: "/agreements/templates" },
      { name: "Create Agreement", path: "/agreements/create" },
    ],
    
    automation: [
      { name: "Workflows", path: "/automation/workflows" },
      { name: "Analytics", path: "/automation/analytics" },
      { name: "Create Workflow", path: "/automation/workflows/create" },
    ],
    
    safety: [
      { name: "Safety Dashboard", path: "/safety/dashboard" },
      { name: "Incidents", path: "/safety/incidents" },
      { name: "Inspections", path: "/safety/inspections" },
      { name: "Training", path: "/safety/training" },
      { name: "Hazards", path: "/safety/hazards" },
      { name: "Meetings", path: "/safety/meetings" },
      { name: "Policies", path: "/safety/policies" },
      { name: "PPE", path: "/safety/ppe" },
    ],
    
    forms: [
      { name: "All Forms", path: "/forms" },
      { name: "Form Builder", path: "/forms/builder" },
      { name: "Responses", path: "/forms/responses" },
    ],
    
    routes: [
      { name: "All Routes", path: "/routes" },
      { name: "Optimize Routes", path: "/routes/optimize" },
    ],
    
    access: [
      { name: "Access Dashboard", path: "/access" },
      { name: "Master Users", path: "/access/master" },
      { name: "Admins", path: "/access/admins" },
      { name: "Crew", path: "/access/crew" },
      { name: "Customers", path: "/access/customers" },
      { name: "Subcontractors", path: "/access/subcontractors" },
      { name: "Vendors", path: "/access/vendors" },
    ],
    
    settings: [
      { name: "Settings Hub", path: "/settings" },
      { name: "Account", path: "/settings/account" },
      { name: "Profile", path: "/settings/profile" },
      { name: "Company", path: "/settings/company" },
      { name: "Security", path: "/settings/security" },
      { name: "Branding", path: "/settings/branding" },
      { name: "Service Areas", path: "/settings/service-areas" },
      { name: "Roles & Permissions", path: "/settings/roles-permissions" },
      { name: "Permissions Matrix", path: "/settings/permissions-matrix" },
      { name: "Billing", path: "/settings/billing" },
      { name: "Notifications", path: "/settings/notifications" },
      { name: "Email Config", path: "/settings/email-config" },
      { name: "Email Templates", path: "/settings/email-templates" },
      { name: "SMS Config", path: "/settings/sms-config" },
      { name: "API", path: "/settings/api" },
      { name: "Webhooks", path: "/settings/webhooks" },
      { name: "Google", path: "/settings/google" },
      { name: "QuickBooks", path: "/settings/quickbooks" },
      { name: "RingCentral", path: "/settings/ringcentral" },
      { name: "Preferences", path: "/settings/preferences" },
      { name: "Equipment Forms", path: "/settings/equipment-forms" },
      { name: "Support", path: "/settings/support" },
    ],
    
    integrations: { name: "Integration Hub", path: "/integrations" },
    weather: { name: "Weather", path: "/weather" },
    tracking: { name: "Tracking", path: "/tracking" },
    reports: { name: "Reports", path: "/reports" },
    analytics: { name: "Analytics", path: "/analytics" },
    tasks: { name: "Tasks", path: "/tasks" },
    crm: [
      { name: "CRM Dashboard", path: "/crm/dashboard" },
    ],
    leads: { name: "Leads", path: "/leads" },
    services: [
      { name: "All Services", path: "/services" },
      { name: "Create Service", path: "/services/create" },
    ],
  };

  const iconMap: Record<string, any> = {
    dashboard: LayoutDashboard,
    customers: Users,
    estimates: FileText,
    projects: FolderOpen,
    invoices: DollarSign,
    dispatch: Truck,
    sites: MapPin,
    equipment: Wrench,
    assets: Wrench,
    inventory: Package,
    hr: Briefcase,
    team: Users,
    finance: DollarSign,
    communication: MessageSquare,
    ringcentral: Phone,
    contracts: FileCheck,
    agreements: FileCheck,
    automation: TrendingUp,
    safety: Shield,
    forms: FileText,
    routes: Route,
    access: UserCog,
    settings: Settings,
    integrations: Link2,
    weather: Cloud,
    tracking: MapPin,
    reports: BarChart3,
    analytics: BarChart3,
    tasks: FileText,
    crm: TrendingUp,
    leads: Users,
    services: Wrench,
  };

  // Default navigation structure
  const [navigation, setNavigation] = useState<NavSection[]>([
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, type: 'single', href: '/' },
    { id: 'customers', label: 'Customers', icon: Users, type: 'single', href: '/customers' },
    { id: 'estimates', label: 'Estimates', icon: FileText, type: 'single', href: '/estimates' },
    { id: 'projects', label: 'Projects', icon: FolderOpen, type: 'single', href: '/projects' },
    { id: 'invoices', label: 'Invoices', icon: DollarSign, type: 'single', href: '/invoices' },
    {
      id: 'sites',
      label: 'Sites',
      icon: MapPin,
      type: 'submenu',
      submenu: [
        { name: 'All Sites', path: '/sites' },
        { name: 'Site Maps', path: '/sites/maps' },
      ],
    },
    {
      id: 'hr',
      label: 'HR Module',
      icon: Briefcase,
      type: 'submenu',
      submenu: [
        { name: 'Overview', path: '/hr' },
        { name: 'Employees', path: '/hr/employees' },
        { name: 'Time & Attendance', path: '/hr/time-attendance' },
        { name: 'PTO', path: '/hr/pto' },
        { name: 'Training', path: '/hr/training' },
        { name: 'Performance', path: '/hr/performance' },
        { name: 'Payroll', path: '/hr/payroll' },
      ],
    },
    { id: 'integrations', label: 'Integrations', icon: Link2, type: 'single', href: '/integrations' },
    { id: 'access', label: 'Access', icon: UserCog, type: 'single', href: '/access' },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      type: 'submenu',
      submenu: [
        { name: 'Account', path: '/settings/account' },
        { name: 'Security', path: '/settings/security' },
        { name: 'Branding', path: '/settings/branding' },
        { name: 'Roles & Permissions', path: '/settings/roles-permissions' },
        { name: 'API', path: '/settings/api' },
      ],
    },
  ]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setExpandedSections({ ...expandedSections, [id]: !expandedSections[id] });
  };

  const addNewSection = () => {
    const newSection: NavSection = {
      id: `section-${Date.now()}`,
      label: 'New Section',
      icon: LayoutDashboard,
      type: 'single',
      href: '/',
    };
    setNavigation([...navigation, newSection]);
  };

  const removeSection = (id: string) => {
    setNavigation(navigation.filter(s => s.id !== id));
  };

  const updateSection = (id: string, updates: Partial<NavSection>) => {
    setNavigation(navigation.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const addSubmenuItem = (sectionId: string, page: NavPage) => {
    setNavigation(navigation.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          type: 'submenu' as const,
          submenu: [...(s.submenu || []), page],
        };
      }
      return s;
    }));
  };

  const handlePageClick = (page: any, isArray: boolean = false) => {
    if (!selectedSection) {
      alert('Please select a section first by clicking "Add to this section" button');
      return;
    }
    
    if (isArray) {
      addSubmenuItem(selectedSection, page);
    } else {
      addSubmenuItem(selectedSection, { name: page.name, path: page.path });
    }
  };

  const removeSubmenuItem = (sectionId: string, path: string) => {
    setNavigation(navigation.map(s => {
      if (s.id === sectionId && s.submenu) {
        return {
          ...s,
          submenu: s.submenu.filter(item => item.path !== path),
        };
      }
      return s;
    }));
  };

  const saveNavigation = () => {
    localStorage.setItem('customNavigation', JSON.stringify(navigation));
    alert('Navigation structure saved! Ready to implement.');
  };

  const exportCode = () => {
    console.log('Navigation structure:', JSON.stringify(navigation, null, 2));
    alert('Navigation structure logged to console. Check browser console!');
  };

  return (
    <div>
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Navigation Builder"
        subtitle="Manage navigation builder"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Navigation Builder" }]}
      />
      <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🧭 Navigation Builder
            </h1>
            <p className="text-gray-600">
              Organize your sidebar navigation. Add sections, create submenus, reorder items.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Available Pages Library */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-4 sticky top-4 hover:shadow-md transition-shadow">
                <h3 className="font-bold text-gray-900 mb-3">📚 Available Pages</h3>
                <p className="text-xs text-gray-600 mb-4">
                  Click a category below to see pages you can add
                </p>
                <div className="space-y-2 max-h-[600px] overflow-auto">
                  {Object.entries(availablePages).map(([key, value]) => (
                    <details key={key} className="group">
                      <summary className="cursor-pointer p-2 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                        {iconMap[key] && (
                          <span className="text-[#3f72af]">
                            {(() => {
                              const Icon = iconMap[key];
                              return <Icon className="w-4 h-4" />;
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DashboardLayout>
            </div>
          </div>
                            })()}
                          </span>
                        )}
                        <span className="font-medium capitalize text-sm">{key}</span>
                        <ChevronRight className="w-4 h-4 ml-auto group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="ml-4 mt-1 space-y-1">
                        {Array.isArray(value) ? (
                          value.map((page, idx) => (
                            <div
                              key={idx}
                              onClick={() => handlePageClick(page, true)}
                              className="text-xs p-2 bg-gray-50 rounded hover:bg-[#3f72af] hover:text-white cursor-pointer transition-colors"
                            >
                              {page.name}                              <div className="text-gray-500 hover:text-blue-200 text-[10px]">{page.path}
                              </div>
                            </div>
        </div>
</DashboardLayout>
          ))
                        ) : (
                          <div
                            onClick={() => handlePageClick(value, false)}
                            className="text-xs p-2 bg-gray-50 rounded hover:bg-[#3f72af] hover:text-white cursor-pointer transition-colors"
                          >
                            {value.name}                            <div className="text-gray-500 hover:text-blue-200 text-[10px]">{value.path}
                            </div></div>
          )}
                      </div>                    </details>
    </DashboardLayout>
                  ))}

            {/* Right: Navigation Structure Builder */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">🔧 Your Navigation Structure</h3>
                  <button
                    onClick={addNewSection}
                    className="flex items-center gap-2 px-3 py-1 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Section
                <div className="space-y-2 mb-6">
                  {navigation.map((section, idx) => {
                    const Icon = section.icon;
                    return (
                      <div
                        key={section.id}
                        className="border-2 border-gray-200 rounded-lg p-3 hover:border-[#3f72af] transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <GripVertical className="w-5 h-5 text-gray-400 cursor-move mt-1" />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Icon className="w-5 h-5 text-[#3f72af]" />
                              <input
                                type="text"
                                value={section.label}
                                onChange={(e) => updateSection(section.id, { label: e.target.value })}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-medium"
                              />
                              
                              <select
                                value={section.type}
                                onChange={(e) => updateSection(section.id, { type: e.target.value as 'single' | 'submenu' })}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="single">Single Page</option>
                                <option value="submenu">Has Submenu</option>
                              </select>

                              <button
                                onClick={() => removeSection(section.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                            {section.type === 'single' && (
                              <input
                                type="text"
                                value={section.href || ''}
                                onChange={(e) => updateSection(section.id, { href: e.target.value })}
                                placeholder="/path"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            )}

                            {section.type === 'submenu' && (
                              <div className="mt-2 ml-8 space-y-1">
                                {section.submenu?.map((item, itemIdx) => (
                                  <div key={itemIdx} className="flex items-center gap-2 text-sm">
                                    <div className="flex-1 px-2 py-1 bg-gray-50 rounded">
                                      {item.name} <span className="text-gray-500 text-xs">→ {item.path}</span>
                                    <button
                                      onClick={() => removeSubmenuItem(section.id, item.path)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="w-3 h-3" />
</DashboardLayout>
          ))}
                                <button
                                  onClick={() => setSelectedSection(section.id)}
                                  className={`mt-2 px-3 py-1 text-xs rounded transition-colors ${
                                    selectedSection === section.id
                                      ? 'bg-[#3f72af] text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {selectedSection === section.id ? '✓ Selected - Click pages on left to add' : 'Add pages to this section'}
                                </button></div>
          )}
                          </div></div>
</DashboardLayout>
          );
</DashboardLayout>
                  })}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={saveNavigation}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#3f72af] to-[#2c5282] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    <Save className="w-5 h-5" />
                    Save Navigation Structure
                  <button
                    onClick={exportCode}
                    className="flex items-center gap-2 px-4 py-3 border-2 border-[#3f72af] text-[#3f72af] rounded-xl font-semibold hover:bg-blue-50"
                  >
                    <Eye className="w-5 h-5" />
                    Export Code
              {/* Preview */}
              <div className="mt-6 bg-gray-800 rounded-xl p-4">
                <h4 className="text-white font-semibold mb-3">Preview: Sidebar Navigation</h4>
                <div className="space-y-1">
                  {navigation.map((section) => {
                    const Icon = section.icon;
                    return (
                      <div key={section.id}>
                        <div className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg cursor-pointer">
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{section.label}</span>
                          {section.type === 'submenu' && (
                            <span className="ml-auto text-xs bg-[#3f72af] hover:bg-[#3f72af]/90 text-white px-2 py-0 rounded-lg font-medium transition-all shadow-sm hover:shadow-md.5 rounded">
                              {section.submenu?.length || 0}
                            </span>
                          )}
                        </div></div>
</DashboardLayout>
          );
</DashboardLayout>
                  })}
                </div></div>
            </DashboardLayout>
</DashboardLayout>
          );
}
