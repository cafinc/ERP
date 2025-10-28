#!/usr/bin/env python3
"""
Comprehensive JSX Error Fixer
Systematically fixes missing closing divs in conditional blocks and ternary operators
"""

import re
from pathlib import Path

def fix_jsx_file(file_path):
    """Fix JSX errors in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        lines = content.split('\n')
        
        # Track if we made any changes
        changes_made = False
        
        # Pattern 1: Find ternary operators with missing closing divs
        # Look for patterns like:  ) : (  or  )} : (
        i = 0
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()
            
            # Check for ternary false branch closing
            if stripped == ')}' or stripped == ')':
                # Look backwards to check if there's a ternary operator
                for j in range(i-1, max(0, i-10), -1):
                    prev_line = lines[j].strip()
                    if ') : (' in prev_line or '} : (' in prev_line:
                        # Found a ternary operator
                        # Count divs between j and i
                        div_count = 0
                        for k in range(j+1, i):
                            check_line = lines[k]
                            div_count += len(re.findall(r'<div[>\s]', check_line))
                            div_count -= check_line.count('</div>')
                        
                        # If there are unclosed divs, add closing divs
                        if div_count > 0:
                            indent = len(lines[i]) - len(lines[i].lstrip())
                            close_indent = ' ' * (indent + 2)
                            for _ in range(div_count):
                                lines.insert(i, close_indent + '</div>')
                                i += 1
                            changes_made = True
                        break
            
            i += 1
        
        if changes_made:
            fixed_content = '\n'.join(lines)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            return True
        
        return False
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    # Get list of files with errors from build output
    files_to_fix = [
        'app/crew-portal/communications/page.tsx',
        'app/customer-portal/communications/page.tsx',
        'app/design-system-demo/page.tsx',
        'app/emergency-alert/page.tsx',
        'app/equipment/[id]/edit/page.tsx',
        'app/equipment/[id]/history/page.tsx',
        'app/equipment/[id]/page.tsx',
        'app/equipment/create/page.tsx',
        'app/equipment/inspections/schedules/create/page.tsx',
        'app/equipment/inspections/schedules/page.tsx',
        'app/feedback/page.tsx',
        'app/forgot-password/page.tsx',
        'app/forms/[templateId]/fill/page.tsx',
        'app/forms/responses/[responseId]/page.tsx',
        'app/invoices/[id]/page.tsx',
        'app/learning-documents/page.tsx',
        'app/legal/privacy/page.tsx',
        'app/legal/terms/page.tsx',
        'app/messages/page.tsx',
        'app/navigation-builder/page.tsx',
        'app/page-layout-mapper/page.tsx',
        'app/photos/page.tsx',
        'app/preview-new-design/page.tsx',
        'app/projects/[id]/page.tsx',
        'app/reset-password/page.tsx',
        'app/services/[id]/edit/page.tsx',
        'app/settings/equipment-forms/page.tsx',
        'app/settings/google/page.tsx',
        'app/settings/permissions-matrix/page.tsx',
        'app/settings/quickbooks/page.tsx',
        'app/settings/ringcentral/page.tsx',
        'app/shifts/history/page.tsx',
        'app/subcontractor-portal/communications/page.tsx',
        'app/team/[id]/edit/page.tsx',
        'app/team/[id]/page.tsx',
        'app/team/create/page.tsx',
        'app/templates/[type]/[id]/edit/page.tsx',
        'app/templates/[type]/[id]/page.tsx',
        'app/tracking/page.tsx',
    ]
    
    web_admin_dir = Path('/app/web-admin')
    
    print("=" * 70)
    print("JSX Error Fixer - Systematic Approach")
    print("=" * 70)
    print(f"\nProcessing {len(files_to_fix)} files...\n")
    
    fixed_count = 0
    for file_rel_path in files_to_fix:
        file_path = web_admin_dir / file_rel_path
        if file_path.exists():
            print(f"Processing {file_path.name}...", end=' ')
            if fix_jsx_file(file_path):
                print("✓ Fixed")
                fixed_count += 1
            else:
                print("- No changes needed")
        else:
            print(f"✗ {file_rel_path} - File not found")
    
    print(f"\n" + "=" * 70)
    print(f"Summary: {fixed_count} files modified")
    print("=" * 70)

if __name__ == "__main__":
    main()
