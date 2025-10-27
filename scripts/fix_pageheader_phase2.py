#!/usr/bin/env python3
"""
Fix incorrect PageHeader usage and remaining JSX structural issues.
PageHeader should be self-closing, not a wrapper element.
"""

import os
import re
import subprocess
import sys

FILES_WITH_ISSUES = [
    "./app/equipment/[id]/edit/page.tsx",
    "./app/equipment/[id]/history/page.tsx",
    "./app/equipment/[id]/page.tsx",
    "./app/equipment/create/page.tsx",
    "./app/equipment/inspections/schedules/create/page.tsx",
    "./app/equipment/inspections/schedules/page.tsx",
    "./app/forms/[templateId]/fill/page.tsx",
    "./app/forms/responses/[responseId]/page.tsx",
    "./app/invoices/[id]/page.tsx",
    "./app/projects/[id]/page.tsx",
    "./app/services/[id]/edit/page.tsx",
    "./app/settings/equipment-forms/page.tsx",
    "./app/settings/google/page.tsx",
    "./app/settings/quickbooks/page.tsx",
    "./app/settings/ringcentral/page.tsx",
    "./app/shifts/history/page.tsx",
    "./app/team/[id]/edit/page.tsx",
    "./app/team/[id]/page.tsx",
    "./app/team/create/page.tsx",
]

def get_tsc_errors(filepath):
    """Get TypeScript compiler errors for a file."""
    try:
        result = subprocess.run(
            ["npx", "tsc", "--noEmit", filepath],
            cwd="/app/web-admin",
            capture_output=True,
            text=True,
            timeout=10
        )
        return result.stderr
    except Exception as e:
        return f"Error: {str(e)}"

def fix_pageheader_wrapper(filepath):
    """Fix PageHeader being used as wrapper instead of self-closing."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern 1: <PageHeader> used as opening tag (wrapper pattern)
        # Replace with proper structure
        if '<PageHeader>' in content or re.search(r'<PageHeader\s*>', content):
            # Remove opening <PageHeader> wrapper tag
            content = re.sub(r'<PageHeader\s*>\s*\n', '', content)
            # Remove closing </PageHeader> if exists
            content = re.sub(r'\s*</PageHeader>\s*\n', '', content)
            
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"✅ {filepath}: Removed PageHeader wrapper tags")
                return True
        
        return False
        
    except Exception as e:
        print(f"❌ {filepath}: Error - {str(e)}")
        return False

def main():
    base_dir = "/app/web-admin"
    os.chdir(base_dir)
    
    print("🔧 Phase 2: Fixing PageHeader and remaining JSX issues...\n")
    
    fixed_count = 0
    
    # Step 1: Fix PageHeader wrapper issues
    print("Step 1: Fixing PageHeader wrapper usage...")
    for file_path in FILES_WITH_ISSUES:
        full_path = os.path.join(base_dir, file_path.lstrip('./'))
        if os.path.exists(full_path):
            if fix_pageheader_wrapper(full_path):
                fixed_count += 1
    
    print(f"\n✅ Fixed PageHeader in {fixed_count} files\n")
    
    # Step 2: Check for remaining errors with tsc
    print("Step 2: Checking for remaining JSX errors...")
    files_still_with_errors = []
    
    for file_path in FILES_WITH_ISSUES:
        errors = get_tsc_errors(file_path)
        if "error TS" in errors:
            files_still_with_errors.append((file_path, errors))
            print(f"❌ {file_path}: Still has errors")
            # Print first error
            error_lines = errors.split('\n')
            for line in error_lines[:3]:
                if line.strip():
                    print(f"   {line}")
    
    if not files_still_with_errors:
        print("✅ No remaining TypeScript errors detected!")
    
    # Step 3: Run full build
    print(f"\n🔨 Step 3: Running full build...")
    result = subprocess.run(
        ["npm", "run", "build"],
        cwd=base_dir,
        capture_output=True,
        text=True
    )
    
    if "Build error occurred" in result.stdout:
        # Count remaining errors
        match = re.search(r'failed with (\d+) errors', result.stdout)
        if match:
            error_count = match.group(1)
            print(f"❌ Build has {error_count} remaining errors")
            # Show first few errors
            print("\nFirst errors:")
            print(result.stdout[:2000])
        else:
            print(f"❌ Build failed")
            print(result.stdout[:1000])
        return 1
    else:
        print(f"✅ BUILD SUCCESSFUL! All JSX errors fixed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())
