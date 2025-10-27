#!/usr/bin/env python3
"""
Script to automatically fix JSX parsing errors in Next.js files.
Specifically targets "Unexpected token" errors caused by missing closing braces.
"""

import os
import re
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

def fix_jsx_file(filepath):
    """Fix JSX parsing errors in a file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        lines = content.split('\n')
        
        # Check if the file ends with the component export pattern
        # Look for patterns like:
        # return (
        #   <Component>...</Component>
        # );
        # }
        
        # Find the last closing brace
        last_brace_line = -1
        for i in range(len(lines) - 1, -1, -1):
            line = lines[i].strip()
            if line == '}':
                last_brace_line = i
                break
        
        if last_brace_line == -1:
            print(f"❌ {filepath}: No closing brace found")
            return False
        
        # Check if there's a return statement with JSX before the closing brace
        # Count opening and closing braces to detect imbalance
        brace_count = 0
        paren_count = 0
        in_jsx = False
        
        for i, line in enumerate(lines):
            # Skip comments
            if '//' in line:
                line = line[:line.index('//')]
            
            # Count braces and parentheses
            brace_count += line.count('{') - line.count('}')
            paren_count += line.count('(') - line.count(')')
            
            # Detect JSX return statements
            if 'return (' in line:
                in_jsx = True
        
        # If we're at the end and have imbalanced braces, we might need to add one
        if last_brace_line == len(lines) - 1:
            # Check if the line before has );
            if last_brace_line > 0:
                prev_line = lines[last_brace_line - 1].strip()
                if prev_line.endswith(');'):
                    # This might be the issue - we need to add a closing brace for the component function
                    # But first, let's check the brace balance
                    
                    # Count all braces in the file
                    total_open = content.count('{')
                    total_close = content.count('}')
                    
                    if total_open > total_close:
                        # We're missing closing braces
                        missing = total_open - total_close
                        print(f"✓ {filepath}: Adding {missing} missing closing brace(s)")
                        
                        # Add the missing braces after the last line
                        for _ in range(missing):
                            lines.append('}')
                        
                        content = '\n'.join(lines)
                        
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(content)
                        
                        return True
        
        print(f"⚠️  {filepath}: No obvious fix found (might be a different issue)")
        return False
        
    except Exception as e:
        print(f"❌ {filepath}: Error - {str(e)}")
        return False

def main():
    base_dir = "/app/web-admin"
    os.chdir(base_dir)
    
    fixed_count = 0
    failed_count = 0
    
    print("🔧 Starting JSX error fix script...\n")
    
    for file_path in FILES_TO_FIX:
        full_path = os.path.join(base_dir, file_path.lstrip('./'))
        if os.path.exists(full_path):
            if fix_jsx_file(full_path):
                fixed_count += 1
            else:
                failed_count += 1
        else:
            print(f"⚠️  File not found: {file_path}")
            failed_count += 1
    
    print(f"\n✅ Fixed: {fixed_count} files")
    print(f"❌ Failed: {failed_count} files")
    
    return 0 if failed_count == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
