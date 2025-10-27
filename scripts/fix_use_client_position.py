#!/usr/bin/env python3
"""
Script to fix "use client" directive position in Next.js files.
The "use client" directive must be the FIRST line of the file.
"""

import os
import sys

FILES_TO_FIX = [
    "./app/complete-design-selector/page.tsx",
    "./app/crew-portal/communications/page.tsx",
    "./app/crew-portal/page.tsx",
    "./app/customer-portal/communications/page.tsx",
    "./app/design-system-demo/page.tsx",
    "./app/emergency-alert/page.tsx",
    "./app/equipment/[id]/edit/page.tsx",
    "./app/equipment/[id]/history/page.tsx",
    "./app/equipment/[id]/page.tsx",
    "./app/equipment/create/page.tsx",
    "./app/equipment/inspections/schedules/create/page.tsx",
    "./app/equipment/inspections/schedules/page.tsx",
    "./app/feedback/page.tsx",
    "./app/forgot-password/page.tsx",
    "./app/forms/[templateId]/fill/page.tsx",
    "./app/forms/responses/[responseId]/page.tsx",
    "./app/invoices/[id]/page.tsx",
    "./app/learning-documents/page.tsx",
    "./app/legal/privacy/page.tsx",
    "./app/legal/terms/page.tsx",
    "./app/messages/page.tsx",
    "./app/navigation-builder/page.tsx",
    "./app/page-layout-mapper/page.tsx",
    "./app/photos/page.tsx",
    "./app/preview-new-design/page.tsx",
    "./app/projects/[id]/page.tsx",
    "./app/reset-password/page.tsx",
    "./app/services/[id]/edit/page.tsx",
    "./app/settings/equipment-forms/page.tsx",
    "./app/settings/google/page.tsx",
    "./app/settings/permissions-matrix/page.tsx",
    "./app/settings/quickbooks/page.tsx",
    "./app/settings/ringcentral/page.tsx",
    "./app/shifts/history/page.tsx",
    "./app/subcontractor-portal/communications/page.tsx",
    "./app/team/[id]/edit/page.tsx",
    "./app/team/[id]/page.tsx",
    "./app/team/create/page.tsx",
    "./app/templates/[type]/[id]/edit/page.tsx",
    "./app/templates/[type]/[id]/page.tsx",
    "./app/templates/new/page.tsx",
    "./app/templates/page.tsx",
    "./app/tracking/page.tsx",
]

def fix_use_client_position(filepath):
    """Move 'use client' directive to the first line."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        lines = content.split('\n')
        
        # Find the "use client" line
        use_client_line_idx = -1
        for i, line in enumerate(lines):
            if '"use client"' in line or "'use client'" in line:
                use_client_line_idx = i
                break
        
        if use_client_line_idx == -1:
            print(f"⚠️  {filepath}: No 'use client' directive found")
            return False
        
        # If it's already the first line, skip
        if use_client_line_idx == 0:
            print(f"✓ {filepath}: Already correct")
            return True
        
        # Extract the use client line
        use_client_line = lines[use_client_line_idx].strip()
        
        # Remove the use client line from its current position
        lines.pop(use_client_line_idx)
        
        # Insert it at the beginning
        lines.insert(0, use_client_line)
        lines.insert(1, '')  # Add a blank line after
        
        # Write back
        new_content = '\n'.join(lines)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✅ {filepath}: Fixed - moved 'use client' to line 1")
        return True
        
    except Exception as e:
        print(f"❌ {filepath}: Error - {str(e)}")
        return False

def main():
    base_dir = "/app/web-admin"
    os.chdir(base_dir)
    
    fixed_count = 0
    failed_count = 0
    skipped_count = 0
    
    print("🔧 Starting 'use client' position fix script...\n")
    
    for file_path in FILES_TO_FIX:
        full_path = os.path.join(base_dir, file_path.lstrip('./'))
        if os.path.exists(full_path):
            result = fix_use_client_position(full_path)
            if result:
                fixed_count += 1
            else:
                failed_count += 1
        else:
            print(f"⚠️  File not found: {file_path}")
            failed_count += 1
    
    print(f"\n✅ Fixed: {fixed_count} files")
    print(f"❌ Failed: {failed_count} files")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
