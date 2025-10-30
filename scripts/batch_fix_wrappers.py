#!/usr/bin/env python3
"""
Batch fix all JSX pages with missing wrapper pattern
"""
import re
from pathlib import Path

def fix_page_wrapper(file_path, title, subtitle):
    """Fix missing page wrapper in return statement"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Pattern: Find main return with inner div only
    # Match: return (\n    <div className="p-8"> or space-y-6 etc
    pattern = r'(  return \()\n(\s+)(<div className="(?:p-8|space-y-6|p-6)")'
    
    if not re.search(pattern, content):
        return False, "No pattern match"
    
    # Add wrapper
    replacement = f'''\\1
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="{title}"
        subtitle="{subtitle}"
        breadcrumbs={{[{{ label: "Home", href: "/" }}, {{ label: "{title}" }}]}}
      />
      <div className="flex-1 overflow-auto p-6">
\\2\\3'''
    
    content = re.sub(pattern, replacement, content)
    
    # Fix closing - add extra closing divs before );
    # Find the pattern where we have closing divs but missing wrappers
    content = re.sub(r'(\n      </div>)\n(\s+)\);\n}$', r'\1\n      </div>\n    </div>\n  );\n}', content, flags=re.MULTILINE)
    
    with open(file_path, 'w') as f:
        f.write(content)
    
    return True, "Fixed"

# Batch fix all remaining files
files = [
    ('app/team/[id]/page.tsx', 'Team Member', 'View member details'),
    ('app/team/[id]/edit/page.tsx', 'Edit Team Member', 'Update information'),
    ('app/team/create/page.tsx', 'Create Team Member', 'Add new member'),
    ('app/services/[id]/edit/page.tsx', 'Edit Service', 'Update service details'),
    ('app/forms/[templateId]/fill/page.tsx', 'Fill Form', 'Complete form template'),
    ('app/forms/responses/[responseId]/page.tsx', 'Form Response', 'View submission'),
    ('app/templates/[type]/[id]/page.tsx', 'Template', 'View template'),
    ('app/templates/[type]/[id]/edit/page.tsx', 'Edit Template', 'Update template'),
    ('app/crew-portal/communications/page.tsx', 'Crew Communications', 'Team messaging'),
    ('app/customer-portal/communications/page.tsx', 'Customer Portal', 'Customer messages'),
    ('app/subcontractor-portal/communications/page.tsx', 'Subcontractor Portal', 'Contractor messages'),
    ('app/equipment/inspections/schedules/page.tsx', 'Inspection Schedules', 'Manage schedules'),
    ('app/equipment/inspections/schedules/create/page.tsx', 'Create Schedule', 'New inspection schedule'),
    ('app/settings/equipment-forms/page.tsx', 'Equipment Forms', 'Form templates'),
    ('app/settings/google/page.tsx', 'Google Integration', 'Configure Google services'),
    ('app/settings/permissions-matrix/page.tsx', 'Permissions Matrix', 'User permissions'),
    ('app/settings/quickbooks/page.tsx', 'QuickBooks Integration', 'Accounting sync'),
    ('app/settings/ringcentral/page.tsx', 'RingCentral Integration', 'Phone system'),
    ('app/shifts/history/page.tsx', 'Shift History', 'View shift records'),
    ('app/messages/page.tsx', 'Messages', 'Internal messaging'),
    ('app/feedback/page.tsx', 'Feedback', 'User feedback'),
    ('app/forgot-password/page.tsx', 'Forgot Password', 'Reset your password'),
    ('app/reset-password/page.tsx', 'Reset Password', 'Create new password'),
    ('app/legal/privacy/page.tsx', 'Privacy Policy', 'Privacy terms'),
    ('app/legal/terms/page.tsx', 'Terms of Service', 'Service terms'),
    ('app/design-system-demo/page.tsx', 'Design System', 'Component showcase'),
    ('app/emergency-alert/page.tsx', 'Emergency Alerts', 'Alert management'),
    ('app/navigation-builder/page.tsx', 'Navigation Builder', 'Build nav'),
    ('app/page-layout-mapper/page.tsx', 'Layout Mapper', 'Page layouts'),
    ('app/photos/page.tsx', 'Photos', 'Photo gallery'),
    ('app/preview-new-design/page.tsx', 'Design Preview', 'Preview designs'),
    ('app/tracking/page.tsx', 'Tracking', 'Track items'),
]

base = Path('/app/web-admin')
fixed = 0
skipped = 0

for file_rel, title, subtitle in files:
    file_path = base / file_rel
    if file_path.exists():
        success, msg = fix_page_wrapper(file_path, title, subtitle)
        if success:
            print(f"✓ {file_rel}")
            fixed += 1
        else:
            print(f"- {file_rel}: {msg}")
            skipped += 1
    else:
        print(f"✗ {file_rel}: Not found")
        skipped += 1

print(f"\n✓ Fixed: {fixed}")
print(f"- Skipped: {skipped}")
