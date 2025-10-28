#!/usr/bin/env python3
"""
Fix JSX Closing Div Issues
Removes consecutive duplicate closing </div> tags that were added by faulty scripts
"""

import re
import sys
from pathlib import Path

def fix_consecutive_closing_divs(content):
    """
    Remove consecutive duplicate closing div tags
    Keep only one </div> when there are multiple consecutive ones
    """
    # Pattern to match multiple consecutive </div> tags with optional whitespace
    # This will match patterns like:
    #     </div>
    #     </div>
    #     </div>
    
    lines = content.split('\n')
    fixed_lines = []
    prev_line_was_closing_div = False
    closing_div_count = 0
    
    for line in lines:
        stripped = line.strip()
        
        # Check if this line is just a closing div
        if stripped == '</div>':
            if prev_line_was_closing_div:
                # This is a consecutive closing div - skip it for now
                closing_div_count += 1
                continue
            else:
                # This is the first closing div in a sequence
                prev_line_was_closing_div = True
                closing_div_count = 1
                fixed_lines.append(line)
        else:
            # Not a closing div line
            prev_line_was_closing_div = False
            closing_div_count = 0
            fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)

def fix_file(file_path):
    """Fix a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        # Count consecutive closing divs before fix
        lines = original_content.split('\n')
        max_consecutive = 0
        current_consecutive = 0
        
        for line in lines:
            if line.strip() == '</div>':
                current_consecutive += 1
                max_consecutive = max(max_consecutive, current_consecutive)
            else:
                current_consecutive = 0
        
        if max_consecutive <= 1:
            print(f"✓ {file_path.name} - No consecutive closing divs found")
            return True
        
        # Fix the content
        fixed_content = fix_consecutive_closing_divs(original_content)
        
        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        
        print(f"✓ {file_path.name} - Fixed (removed {max_consecutive-1} consecutive closing divs)")
        return True
        
    except Exception as e:
        print(f"✗ {file_path.name} - Error: {str(e)}")
        return False

def main():
    # List of files with JSX errors
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
    
    print("=" * 60)
    print("JSX Closing Div Fixer")
    print("=" * 60)
    print(f"\nProcessing {len(files_to_fix)} files...\n")
    
    success_count = 0
    for file_rel_path in files_to_fix:
        file_path = web_admin_dir / file_rel_path
        if file_path.exists():
            if fix_file(file_path):
                success_count += 1
        else:
            print(f"✗ {file_rel_path} - File not found")
    
    print(f"\n" + "=" * 60)
    print(f"Summary: {success_count}/{len(files_to_fix)} files processed successfully")
    print("=" * 60)
    
    return success_count == len(files_to_fix)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
