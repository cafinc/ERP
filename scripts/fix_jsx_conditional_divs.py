#!/usr/bin/env python3
"""
Smart JSX Fixer - Identifies and fixes missing closing divs in conditional blocks
Specifically targets the pattern where divs are opened after { condition && ( but not closed before )}
"""

import re
import sys
from pathlib import Path

def count_unclosed_divs_in_conditional(lines, start_idx):
    """
    Count unclosed divs within a conditional block starting at start_idx
    Returns: (end_idx, missing_div_count)
    """
    depth = 0
    paren_depth = 1  # Start with 1 because we're inside the opening (
    div_count = 0
    in_conditional = False
    
    for i in range(start_idx, len(lines)):
        line = lines[i]
        stripped = line.strip()
        
        # Track parentheses
        paren_depth += line.count('(') - line.count(')')
        
        # Track div tags
        # Count opening divs (but not self-closing or closing)
        opening_divs = len(re.findall(r'<div[>\s]', line))
        closing_divs = line.count('</div>')
        
        div_count += opening_divs - closing_divs
        
        # Check if we've reached the end of the conditional
        if paren_depth == 0 and stripped.endswith('}'):
            # This is the closing of the conditional
            return i, div_count
        
        if paren_depth < 0:
            break
    
    return -1, 0

def fix_conditional_divs(content):
    """
    Find and fix conditional blocks with missing closing divs
    """
    lines = content.split('\n')
    fixed_lines = []
    i = 0
    fixes_made = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Look for pattern: {something && (
        if re.search(r'\{[^}]+&&\s*\(', line):
            # Found a conditional, check if it has unclosed divs
            end_idx, missing_divs = count_unclosed_divs_in_conditional(lines, i + 1)
            
            if end_idx > 0 and missing_divs > 0:
                # We have missing divs, add them before the closing )}
                fixed_lines.append(line)
                
                # Add all lines up to (but not including) the closing )}
                for j in range(i + 1, end_idx):
                    fixed_lines.append(lines[j])
                
                # Get the closing line
                closing_line = lines[end_idx]
                
                # Find the indentation of the closing )}
                indent = len(closing_line) - len(closing_line.lstrip())
                base_indent = ' ' * indent
                
                # Add the missing closing divs with proper indentation
                for _ in range(missing_divs):
                    fixed_lines.append(base_indent + '  </div>')
                    fixes_made += 1
                
                # Add the closing )}
                fixed_lines.append(closing_line)
                
                i = end_idx + 1
                continue
        
        fixed_lines.append(line)
        i += 1
    
    return '\n'.join(fixed_lines), fixes_made

def fix_file(file_path):
    """Fix a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        # Try to fix
        fixed_content, fixes_made = fix_conditional_divs(original_content)
        
        if fixes_made == 0:
            print(f"✓ {file_path.name} - No fixes needed")
            return True
        
        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        
        print(f"✓ {file_path.name} - Fixed {fixes_made} missing closing div(s)")
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
    
    print("=" * 70)
    print("JSX Conditional Divs Fixer - Smart Pattern Detection")
    print("=" * 70)
    print(f"\nProcessing {len(files_to_fix)} files...\n")
    
    success_count = 0
    for file_rel_path in files_to_fix:
        file_path = web_admin_dir / file_rel_path
        if file_path.exists():
            if fix_file(file_path):
                success_count += 1
        else:
            print(f"✗ {file_rel_path} - File not found")
    
    print(f"\n" + "=" * 70)
    print(f"Summary: {success_count}/{len(files_to_fix)} files processed")
    print("=" * 70)
    
    return success_count == len(files_to_fix)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
