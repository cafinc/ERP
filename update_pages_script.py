#!/usr/bin/env python3
"""
Script to systematically update all web-admin pages with PageHeader and branding
"""

import os
import re
from pathlib import Path

# Brand color
BRAND_COLOR = "#3f72af"

# Page configurations with their breadcrumbs and metadata
PAGE_CONFIGS = {
    # CRM Pages
    "/app/web-admin/app/customers/page.tsx": {
        "title": "Customers",
        "subtitle": "Manage your customer relationships and contacts",
        "breadcrumbs": ["Home", "CRM", "Customers"],
        "section": "crm"
    },
    "/app/web-admin/app/leads/page.tsx": {
        "title": "Leads",
        "subtitle": "Track and convert potential customers",
        "breadcrumbs": ["Home", "CRM", "Leads"],
        "section": "crm"
    },
    "/app/web-admin/app/estimates/page.tsx": {
        "title": "Estimates",
        "subtitle": "Create and manage service estimates",
        "breadcrumbs": ["Home", "CRM", "Estimates"],
        "section": "crm"
    },
    "/app/web-admin/app/projects/page.tsx": {
        "title": "Projects",
        "subtitle": "Manage your service projects and milestones",
        "breadcrumbs": ["Home", "CRM", "Projects"],
        "section": "crm"
    },
    
    # Operations Pages
    "/app/web-admin/app/operations/page.tsx": {
        "title": "Operations Dashboard",
        "subtitle": "Monitor and manage daily operations",
        "breadcrumbs": ["Home", "Operations"],
        "section": "operations"
    },
    "/app/web-admin/app/work-orders/page.tsx": {
        "title": "Work Orders",
        "subtitle": "Track and manage service work orders",
        "breadcrumbs": ["Home", "Operations", "Work Orders"],
        "section": "operations"
    },
    "/app/web-admin/app/purchase-orders/page.tsx": {
        "title": "Purchase Orders",
        "subtitle": "Manage inventory and equipment purchases",
        "breadcrumbs": ["Home", "Operations", "Purchase Orders"],
        "section": "operations"
    },
    
    # Finance Pages
    "/app/web-admin/app/invoices/page.tsx": {
        "title": "Invoices",
        "subtitle": "Manage customer invoices and billing",
        "breadcrumbs": ["Home", "Finance", "Invoices"],
        "section": "finance"
    },
    "/app/web-admin/app/finance/expenses/page.tsx": {
        "title": "Expenses",
        "subtitle": "Track and categorize business expenses",
        "breadcrumbs": ["Home", "Finance", "Expenses"],
        "section": "finance"
    },
    "/app/web-admin/app/finance/payments/page.tsx": {
        "title": "Payments",
        "subtitle": "Monitor payment transactions and receipts",
        "breadcrumbs": ["Home", "Finance", "Payments"],
        "section": "finance"
    },
    "/app/web-admin/app/finance/reports/page.tsx": {
        "title": "Financial Reports",
        "subtitle": "View financial analytics and reports",
        "breadcrumbs": ["Home", "Finance", "Reports"],
        "section": "finance"
    },
    
    # Access Pages
    "/app/web-admin/app/access/page.tsx": {
        "title": "Access Control",
        "subtitle": "Manage user access and permissions",
        "breadcrumbs": ["Home", "Access"],
        "section": "access"
    },
    "/app/web-admin/app/access/master/page.tsx": {
        "title": "Master Users",
        "subtitle": "Manage master administrator accounts",
        "breadcrumbs": ["Home", "Access", "Master Users"],
        "section": "access"
    },
    "/app/web-admin/app/access/admins/page.tsx": {
        "title": "Administrators",
        "subtitle": "Manage admin users and their roles",
        "breadcrumbs": ["Home", "Access", "Administrators"],
        "section": "access"
    },
    "/app/web-admin/app/access/crew/page.tsx": {
        "title": "Crew Members",
        "subtitle": "Manage field crew and operators",
        "breadcrumbs": ["Home", "Access", "Crew"],
        "section": "access"
    },
    "/app/web-admin/app/access/subcontractors/page.tsx": {
        "title": "Subcontractors",
        "subtitle": "Manage subcontractor accounts and access",
        "breadcrumbs": ["Home", "Access", "Subcontractors"],
        "section": "access"
    },
    "/app/web-admin/app/access/customers/page.tsx": {
        "title": "Customer Access",
        "subtitle": "Manage customer portal access",
        "breadcrumbs": ["Home", "Access", "Customers"],
        "section": "access"
    },
    "/app/web-admin/app/access/vendors/page.tsx": {
        "title": "Vendors",
        "subtitle": "Manage vendor accounts and permissions",
        "breadcrumbs": ["Home", "Access", "Vendors"],
        "section": "access"
    },
    
    # Assets Pages
    "/app/web-admin/app/equipment/page.tsx": {
        "title": "Equipment",
        "subtitle": "Manage your snow removal equipment inventory",
        "breadcrumbs": ["Home", "Assets", "Equipment"],
        "section": "assets"
    },
    "/app/web-admin/app/assets/vehicles/page.tsx": {
        "title": "Vehicles",
        "subtitle": "Track and manage your vehicle fleet",
        "breadcrumbs": ["Home", "Assets", "Vehicles"],
        "section": "assets"
    },
    "/app/web-admin/app/assets/trailers/page.tsx": {
        "title": "Trailers",
        "subtitle": "Manage trailer inventory and assignments",
        "breadcrumbs": ["Home", "Assets", "Trailers"],
        "section": "assets"
    },
    "/app/web-admin/app/assets/tools/page.tsx": {
        "title": "Tools",
        "subtitle": "Track tools and small equipment",
        "breadcrumbs": ["Home", "Assets", "Tools"],
        "section": "assets"
    },
    "/app/web-admin/app/inventory/page.tsx": {
        "title": "Inventory",
        "subtitle": "Manage parts and supplies inventory",
        "breadcrumbs": ["Home", "Assets", "Inventory"],
        "section": "assets"
    },
    "/app/web-admin/app/equipment/maintenance/page.tsx": {
        "title": "Maintenance",
        "subtitle": "Track equipment maintenance and repairs",
        "breadcrumbs": ["Home", "Assets", "Maintenance"],
        "section": "assets"
    },
    "/app/web-admin/app/equipment/inspections/page.tsx": {
        "title": "Inspections",
        "subtitle": "Schedule and track equipment inspections",
        "breadcrumbs": ["Home", "Assets", "Inspections"],
        "section": "assets"
    },
    
    # Dispatch Pages
    "/app/web-admin/app/dispatch/page.tsx": {
        "title": "Dispatch",
        "subtitle": "Coordinate and manage service dispatch",
        "breadcrumbs": ["Home", "Dispatch"],
        "section": "dispatch"
    },
    "/app/web-admin/app/sites/page.tsx": {
        "title": "Sites",
        "subtitle": "Manage service locations and properties",
        "breadcrumbs": ["Home", "Dispatch", "Sites"],
        "section": "dispatch"
    },
    "/app/web-admin/app/routes/page.tsx": {
        "title": "Routes",
        "subtitle": "Plan and manage service routes",
        "breadcrumbs": ["Home", "Dispatch", "Routes"],
        "section": "dispatch"
    },
    "/app/web-admin/app/routes/optimize/page.tsx": {
        "title": "Route Optimization",
        "subtitle": "Optimize routes for efficiency",
        "breadcrumbs": ["Home", "Dispatch", "Route Optimization"],
        "section": "dispatch"
    },
    "/app/web-admin/app/geofence/page.tsx": {
        "title": "Geofencing",
        "subtitle": "Manage location-based boundaries",
        "breadcrumbs": ["Home", "Dispatch", "Geofence"],
        "section": "dispatch"
    },
    "/app/web-admin/app/tracking/page.tsx": {
        "title": "Fleet Tracking",
        "subtitle": "Real-time tracking of vehicles and equipment",
        "breadcrumbs": ["Home", "Dispatch", "Tracking"],
        "section": "dispatch"
    },
    "/app/web-admin/app/consumables/page.tsx": {
        "title": "Consumables",
        "subtitle": "Track salt, sand, and other consumable materials",
        "breadcrumbs": ["Home", "Dispatch", "Consumables"],
        "section": "dispatch"
    },
    "/app/web-admin/app/consumables/analytics/page.tsx": {
        "title": "Consumables Analytics",
        "subtitle": "Analyze material usage and trends",
        "breadcrumbs": ["Home", "Dispatch", "Consumables Analytics"],
        "section": "dispatch"
    },
    "/app/web-admin/app/services/page.tsx": {
        "title": "Services",
        "subtitle": "Manage service offerings and pricing",
        "breadcrumbs": ["Home", "Dispatch", "Services"],
        "section": "dispatch"
    },
    "/app/web-admin/app/weather/page.tsx": {
        "title": "Weather",
        "subtitle": "Monitor weather conditions and forecasts",
        "breadcrumbs": ["Home", "Dispatch", "Weather"],
        "section": "dispatch"
    },
    
    # Communications Pages
    "/app/web-admin/app/communication/page.tsx": {
        "title": "Messages",
        "subtitle": "Unified communications center",
        "breadcrumbs": ["Home", "Communications", "Messages"],
        "section": "comms"
    },
    "/app/web-admin/app/ringcentral/page.tsx": {
        "title": "RingCentral",
        "subtitle": "Manage phone system and calls",
        "breadcrumbs": ["Home", "Communications", "RingCentral"],
        "section": "comms"
    },
    "/app/web-admin/app/emergency-alert/page.tsx": {
        "title": "Emergency Alerts",
        "subtitle": "Send urgent notifications to team members",
        "breadcrumbs": ["Home", "Communications", "Emergency Alert"],
        "section": "comms"
    },
    "/app/web-admin/app/feedback/page.tsx": {
        "title": "Customer Feedback",
        "subtitle": "View and manage customer feedback",
        "breadcrumbs": ["Home", "Communications", "Feedback"],
        "section": "comms"
    },
    
    # Safety Pages
    "/app/web-admin/app/safety/incidents/page.tsx": {
        "title": "Incident Reporting",
        "subtitle": "Document and track safety incidents",
        "breadcrumbs": ["Home", "Safety", "Incidents"],
        "section": "safety"
    },
    "/app/web-admin/app/safety/inspections/page.tsx": {
        "title": "Safety Inspections",
        "subtitle": "Schedule and conduct safety inspections",
        "breadcrumbs": ["Home", "Safety", "Inspections"],
        "section": "safety"
    },
    "/app/web-admin/app/safety/hazards/page.tsx": {
        "title": "Hazard Assessments",
        "subtitle": "Identify and mitigate workplace hazards",
        "breadcrumbs": ["Home", "Safety", "Hazards"],
        "section": "safety"
    },
    "/app/web-admin/app/safety/training/page.tsx": {
        "title": "Safety Training",
        "subtitle": "Manage safety training programs",
        "breadcrumbs": ["Home", "Safety", "Training"],
        "section": "safety"
    },
    "/app/web-admin/app/safety/meetings/page.tsx": {
        "title": "Safety Meetings",
        "subtitle": "Schedule and document safety meetings",
        "breadcrumbs": ["Home", "Safety", "Meetings"],
        "section": "safety"
    },
    "/app/web-admin/app/safety/ppe/page.tsx": {
        "title": "PPE Management",
        "subtitle": "Track personal protective equipment",
        "breadcrumbs": ["Home", "Safety", "PPE"],
        "section": "safety"
    },
    "/app/web-admin/app/safety/policies/page.tsx": {
        "title": "Safety Policies",
        "subtitle": "Maintain safety policy documentation",
        "breadcrumbs": ["Home", "Safety", "Policies"],
        "section": "safety"
    },
    "/app/web-admin/app/safety/emergency/page.tsx": {
        "title": "Emergency Plans",
        "subtitle": "Manage emergency response procedures",
        "breadcrumbs": ["Home", "Safety", "Emergency Plans"],
        "section": "safety"
    },
    
    # Standalone Pages
    "/app/web-admin/app/automation/page.tsx": {
        "title": "Automation",
        "subtitle": "Configure automated workflows and triggers",
        "breadcrumbs": ["Home", "Automation"],
        "section": "standalone"
    },
    "/app/web-admin/app/tasks/page.tsx": {
        "title": "Tasks",
        "subtitle": "Manage and assign tasks to team members",
        "breadcrumbs": ["Home", "Tasks"],
        "section": "standalone"
    },
    "/app/web-admin/app/forms/page.tsx": {
        "title": "Forms",
        "subtitle": "Create and manage custom forms",
        "breadcrumbs": ["Home", "Forms"],
        "section": "standalone"
    },
    "/app/web-admin/app/photos/page.tsx": {
        "title": "Photos",
        "subtitle": "Manage job site photos and documentation",
        "breadcrumbs": ["Home", "Photos"],
        "section": "standalone"
    },
    "/app/web-admin/app/analytics/page.tsx": {
        "title": "Analytics",
        "subtitle": "Business intelligence and data insights",
        "breadcrumbs": ["Home", "Analytics"],
        "section": "standalone"
    },
    "/app/web-admin/app/reports/page.tsx": {
        "title": "Reports",
        "subtitle": "Generate and view business reports",
        "breadcrumbs": ["Home", "Reports"],
        "section": "standalone"
    },
    
    # HR Pages
    "/app/web-admin/app/hr/employees/page.tsx": {
        "title": "Employees",
        "subtitle": "Manage employee records and information",
        "breadcrumbs": ["Home", "HR", "Employees"],
        "section": "hr"
    },
    "/app/web-admin/app/hr/time-attendance/page.tsx": {
        "title": "Time & Attendance",
        "subtitle": "Track employee hours and attendance",
        "breadcrumbs": ["Home", "HR", "Time & Attendance"],
        "section": "hr"
    },
    "/app/web-admin/app/hr/pto/page.tsx": {
        "title": "PTO Management",
        "subtitle": "Manage paid time off requests",
        "breadcrumbs": ["Home", "HR", "PTO"],
        "section": "hr"
    },
    "/app/web-admin/app/hr/training/page.tsx": {
        "title": "Training",
        "subtitle": "Employee training and development",
        "breadcrumbs": ["Home", "HR", "Training"],
        "section": "hr"
    },
    "/app/web-admin/app/hr/performance/page.tsx": {
        "title": "Performance",
        "subtitle": "Employee performance reviews and goals",
        "breadcrumbs": ["Home", "HR", "Performance"],
        "section": "hr"
    },
    "/app/web-admin/app/hr/payroll/page.tsx": {
        "title": "Payroll Settings",
        "subtitle": "Configure payroll and compensation",
        "breadcrumbs": ["Home", "HR", "Payroll"],
        "section": "hr"
    },
}

def check_if_needs_update(file_path):
    """Check if file needs to be updated"""
    if not os.path.exists(file_path):
        return False, "File does not exist"
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Check if already using PageHeader
    if 'from \'@/components/PageHeader\'' in content or 'from "@/components/PageHeader"' in content:
        # Check if it has the proper structure
        if 'min-h-screen bg-gray-50 flex flex-col' in content:
            return False, "Already updated with PageHeader"
    
    return True, "Needs update"

def main():
    """Main function to check which files need updates"""
    print("=== Page Update Analysis ===\n")
    
    needs_update = []
    already_updated = []
    not_found = []
    
    for file_path, config in PAGE_CONFIGS.items():
        needs, reason = check_if_needs_update(file_path)
        
        if "does not exist" in reason:
            not_found.append((file_path, config))
        elif needs:
            needs_update.append((file_path, config))
        else:
            already_updated.append((file_path, config))
    
    print(f"✅ Already Updated: {len(already_updated)} pages")
    for path, _ in already_updated:
        print(f"   {path}")
    
    print(f"\n⚠️  Missing Files: {len(not_found)} pages")
    for path, _ in not_found:
        print(f"   {path}")
    
    print(f"\n🔨 Needs Update: {len(needs_update)} pages")
    for path, config in needs_update:
        print(f"   {path} - {config['title']}")
    
    print(f"\n📊 Summary:")
    print(f"   Total Configured: {len(PAGE_CONFIGS)}")
    print(f"   Already Updated: {len(already_updated)}")
    print(f"   Needs Update: {len(needs_update)}")
    print(f"   Not Found: {len(not_found)}")

if __name__ == "__main__":
    main()
