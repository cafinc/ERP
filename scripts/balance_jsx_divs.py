#!/usr/bin/env python3
"""
Comprehensive JSX Div Balancer
Uses a stack-based approach to balance divs in JSX/TSX files
"""

import re
import sys
from pathlib import Path
from collections import deque

def balance_divs_in_jsx(content):
    """
    Balance divs in JSX using stack-based parsing
    """
    lines = content.split('\n')
    fixed_lines = []
    fixes_made = 0
    
    for i, line in enumerate(lines):
        # Check if line has jsx/tsx markers that indicate it might need balancing
        # Look for patterns like })} or )} at end of line that close a map or conditional
        
        stripped = line.strip()
        
        # Pattern 1: .map closing  - something like })} 
        # Pattern 2: Conditional closing - something like )}
        if re.search(r'\}\)\s*$', stripped) or re.search(r'\)\)\s*$', stripped):
            # Look backwards to count unclosed divs in this block
            open_count = 0
            close_count = 0
            
            # Scan backwards to find the start of this block
            for j in range(i, -1, -1):
                prev_line = lines[j]
                # Count divs
                open_count += len(re.findall(r'<div[>\s]', prev_line))
                close_count += prev_line.count('</div>')
                
                # Stop at block boundaries
                if re.search(r'\{.*\(', prev_line) or re.search(r'\.map\(', prev_line) or re.search(r'&&\s*\(', prev_line):
                    break
            
            missing_divs = open_count - close_count
            
            if missing_divs > 0:
                # Add missing closing divs before the current line
                indent = len(line) - len(line.lstrip())
                base_indent = ' ' * indent
                
                for _ in range(missing_divs):
                    fixed_lines.append(base_indent + '</div>')
                    fixes_made += 1
        
        fixed_lines.append(line)
    
    return '\n'.join(fixed_lines), fixes_made

def fix_file(file_path):
    """Fix a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        # Try to fix
        fixed_content, fixes_made = balance_divs_in_jsx(original_content)
        
        if fixes_made == 0:
            print(f"✓ {file_path.name} - No fixes needed")
            return True
        
        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        
        print(f"✓ {file_path.name} - Added {fixes_made} missing closing div(s)")
        return True
        
    except Exception as e:
        print(f"✗ {file_path.name} - Error: {str(e)}")
        return False

def main():
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
    print("Comprehensive JSX Div Balancer")
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
