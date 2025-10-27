#!/usr/bin/env python3
"""
FINAL comprehensive fix for all JSX errors. 
Directly processes all error files identified from build output.
"""

import os
import re

# All files with imbalanced divs (missing closing divs)
FILES_TO_FIX = {
    "app/crew-portal/communications/page.tsx": 4,
    "app/customer-portal/communications/page.tsx": 6,
    "app/design-system-demo/page.tsx": 1,
    "app/emergency-alert/page.tsx": 1,
    "app/equipment/[id]/edit/page.tsx": 1,
    "app/equipment/[id]/history/page.tsx": 1,
    "app/equipment/[id]/page.tsx": 1,
    "app/equipment/create/page.tsx": 1,
    "app/equipment/inspections/schedules/create/page.tsx": 1,
    "app/equipment/inspections/schedules/page.tsx": 1,
    "app/feedback/page.tsx": 1,
    "app/forgot-password/page.tsx": 1,
    "app/forms/[templateId]/fill/page.tsx": 1,
    "app/forms/responses/[responseId]/page.tsx": 1,
    "app/invoices/[id]/page.tsx": 1,
    "app/learning-documents/page.tsx": 1,
    "app/legal/privacy/page.tsx": 1,
    "app/legal/terms/page.tsx": 1,
    "app/messages/page.tsx": 3,
    "app/navigation-builder/page.tsx": 1,
    "app/page-layout-mapper/page.tsx": 1,
    "app/photos/page.tsx": 1,
    "app/preview-new-design/page.tsx": 2,
    "app/projects/[id]/page.tsx": 1,
    "app/reset-password/page.tsx": 1,
    "app/services/[id]/edit/page.tsx": 1,
    "app/settings/equipment-forms/page.tsx": 1,
    "app/settings/google/page.tsx": 1,
    "app/settings/permissions-matrix/page.tsx": 1,
    "app/settings/quickbooks/page.tsx": 1,
    "app/settings/ringcentral/page.tsx": 1,
    "app/shifts/history/page.tsx": 1,
    "app/subcontractor-portal/communications/page.tsx": 6,
    "app/team/[id]/edit/page.tsx": 1,
    "app/team/[id]/page.tsx": 1,
    "app/team/create/page.tsx": 1,
    "app/templates/[type]/[id]/edit/page.tsx": 1,
    "app/templates/[type]/[id]/page.tsx": 1,
    "app/templates/new/page.tsx": 1,
    "app/templates/page.tsx": 1,
    "app/tracking/page.tsx": 2,
}

def fix_file(filepath, missing_divs):
    """Add missing closing divs before );"""
    try:
        full_path = f"/app/web-admin/{filepath}"
        with open(full_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Find the line with );
        insert_idx = -1
        for i in range(len(lines) - 1, -1, -1):
            if lines[i].strip() == ');':
                insert_idx = i
                break
        
        if insert_idx == -1:
            print(f"❌ {filepath}: Could not find ); line")
            return False
        
        # Insert missing closing divs
        for j in range(missing_divs):
            lines.insert(insert_idx, '    </div>\n')
        
        with open(full_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        
        print(f"✅ {filepath}: Added {missing_divs} closing div(s)")
        return True
        
    except Exception as e:
        print(f"❌ {filepath}: Error - {e}")
        return False

def main():
    print("🔧 Fixing ALL 90 JSX errors systematically...\n")
    
    fixed_count = 0
    
    for filepath, missing_count in FILES_TO_FIX.items():
        if fix_file(filepath, missing_count):
            fixed_count += 1
    
    print(f"\n✅ Fixed {fixed_count} files")
    print(f"❌ Failed {len(FILES_TO_FIX) - fixed_count} files")
    
    # Verify build
    print("\n🔨 Running build verification...")
    import subprocess
    result = subprocess.run(
        ["npm", "run", "build"],
        cwd="/app/web-admin",
        capture_output=True,
        text=True
    )
    
    if "Build error occurred" in result.stdout:
        match = re.search(r'failed with (\d+) errors', result.stdout)
        if match:
            errors = int(match.group(1))
            print(f"📊 Remaining errors: {errors}/90")
            if errors == 0:
                print("🎉 BUILD SUCCESS!")
            return errors
    else:
        print("🎉 BUILD SUCCESSFUL!")
        return 0

if __name__ == "__main__":
    exit(main())
