#!/usr/bin/env python3
"""
Script to identify and list JSX structural errors in Next.js files using TypeScript compiler.
"""

import os
import subprocess
import sys
import re

FILES_TO_CHECK = [
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

def check_file_with_tsc(filepath):
    """Check a file for JSX errors using TypeScript compiler."""
    try:
        result = subprocess.run(
            ["npx", "tsc", "--noEmit", filepath],
            cwd="/app/web-admin",
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # Parse errors
        error_lines = result.stderr.strip().split('\n')
        jsx_errors = []
        
        for line in error_lines:
            if 'JSX element' in line and 'no corresponding closing tag' in line:
                # Extract line number
                match = re.search(r'\((\d+),\d+\)', line)
                if match:
                    line_num = match.group(1)
                    jsx_errors.append(f"Line {line_num}: Missing closing tag")
            elif 'Unexpected token' in line:
                match = re.search(r'\((\d+),\d+\)', line)
                if match:
                    line_num = match.group(1)
                    jsx_errors.append(f"Line {line_num}: Unexpected token")
        
        return jsx_errors
        
    except Exception as e:
        return [f"Error checking file: {str(e)}"]

def main():
    base_dir = "/app/web-admin"
    os.chdir(base_dir)
    
    print("🔍 Checking files for JSX structural errors...\n")
    
    files_with_errors = {}
    
    for file_path in FILES_TO_CHECK:
        full_path = os.path.join(base_dir, file_path.lstrip('./'))
        if os.path.exists(full_path):
            errors = check_file_with_tsc(file_path)
            if errors:
                files_with_errors[file_path] = errors
                print(f"❌ {file_path}:")
                for error in errors:
                    print(f"   {error}")
        else:
            print(f"⚠️  File not found: {file_path}")
    
    print(f"\n📊 Summary:")
    print(f"Files with errors: {len(files_with_errors)}")
    print(f"Total files checked: {len(FILES_TO_CHECK)}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
