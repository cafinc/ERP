#!/usr/bin/env python3
"""
Batch fix script for missing closing </div> tags in JSX files.
Counts opening and closing div tags and adds missing closures.
"""

import os
import re
import sys

FILES_TO_FIX = [
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

def fix_div_balance(filepath):
    """Fix missing closing div tags by counting and balancing."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Count opening and closing div tags
        opening_divs = len(re.findall(r'<div[\s>]', content))
        closing_divs = len(re.findall(r'</div>', content))
        
        missing_closures = opening_divs - closing_divs
        
        if missing_closures == 0:
            print(f"✓ {filepath}: Balanced ({opening_divs} opening, {closing_divs} closing)")
            return True
        elif missing_closures < 0:
            print(f"⚠️  {filepath}: More closing than opening tags! (opening:{opening_divs}, closing:{closing_divs})")
            return False
        
        # Find the closing brace } of the component
        lines = content.split('\n')
        
        # Find the last non-empty line that's just a closing brace
        last_brace_idx = -1
        for i in range(len(lines) - 1, -1, -1):
            if lines[i].strip() == '}':
                last_brace_idx = i
                break
        
        if last_brace_idx == -1:
            print(f"❌ {filepath}: Could not find closing brace")
            return False
        
        # Insert the missing </div> tags before the closing brace
        insert_idx = last_brace_idx
        
        # Find the best insertion point (before ); if present)
        for i in range(last_brace_idx - 1, max(0, last_brace_idx - 5), -1):
            if lines[i].strip() == ');':
                insert_idx = i
                break
        
        # Add the missing closing divs
        indent = '    '  # 4 spaces
        for j in range(missing_closures):
            lines.insert(insert_idx, f"{indent}</div>")
        
        # Write back
        new_content = '\n'.join(lines)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✅ {filepath}: Fixed - added {missing_closures} missing </div> tag(s)")
        return True
        
    except Exception as e:
        print(f"❌ {filepath}: Error - {str(e)}")
        return False

def main():
    base_dir = "/app/web-admin"
    os.chdir(base_dir)
    
    fixed_count = 0
    failed_count = 0
    
    print("🔧 Starting batch div-balance fix script...\n")
    
    for file_path in FILES_TO_FIX:
        full_path = os.path.join(base_dir, file_path.lstrip('./'))
        if os.path.exists(full_path):
            if fix_div_balance(full_path):
                fixed_count += 1
            else:
                failed_count += 1
        else:
            print(f"⚠️  File not found: {file_path}")
            failed_count += 1
    
    print(f"\n✅ Fixed: {fixed_count} files")
    print(f"❌ Failed/Skipped: {failed_count} files")
    
    # Run build to verify
    print(f"\n🔨 Running build to verify fixes...")
    import subprocess
    result = subprocess.run(
        ["npm", "run", "build"],
        cwd=base_dir,
        capture_output=True,
        text=True
    )
    
    if "Build error occurred" in result.stdout or result.returncode != 0:
        print(f"❌ Build still has errors")
        print(result.stdout[:1000])
        return 1
    else:
        print(f"✅ Build successful!")
        return 0

if __name__ == "__main__":
    sys.exit(main())
