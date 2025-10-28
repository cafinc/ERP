#!/usr/bin/env python3
"""
Bulk JSX Fixer - Fix all files with the same pattern
"""
import re
from pathlib import Path

def fix_loading_pattern(content):
    """Fix the loading/empty state pattern"""
    # Pattern: lines with </div>) or </div>); missing outer closing divs
    lines = content.split('\n')
    fixed = []
    
    for i, line in enumerate(lines):
        # Check if this is a problematic closing pattern
        stripped = line.strip()
        if stripped == '</div>);' or stripped == '</div>)':
            # Look back to see if we're in a loading/empty state
            context = '\n'.join(lines[max(0, i-10):i])
            if 'RefreshCw' in context or 'Loading' in context or 'No ' in context:
                # Check indent
                indent = len(line) - len(line.lstrip())
                # Add missing closing div
                fixed.append(' ' * indent + '</div>')
                fixed.append(' ' * indent + '</div>')
                fixed.append(line.replace('</div>);', ');').replace('</div>)', ')'))
                continue
        
        fixed.append(line)
    
    return '\n'.join(fixed)

def fix_map_pattern(content):
    """Fix the .map() pattern with missing closing divs"""
    lines = content.split('\n')
    fixed = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Look for problematic );  after .map blocks
        if stripped == ');' and i > 0:
            # Look back for unclosed divs
            # Count divs in the last 20 lines
            start = max(0, i - 20)
            block = lines[start:i]
            
            # Find if we're in a map
            in_map = any('.map(' in l for l in block)
            
            if in_map:
                open_divs = 0
                close_divs = 0
                for l in block:
                    open_divs += len(re.findall(r'<div[>\s]', l))
                    close_divs += l.count('</div>')
                
                missing = open_divs - close_divs
                if missing > 0:
                    indent = len(line) - len(line.lstrip())
                    for _ in range(missing):
                        fixed.append(' ' * (indent + 2) + '</div>')
        
        fixed.append(line)
        i += 1
    
    return '\n'.join(fixed)

def fix_file(file_path):
    """Fix a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Apply fixes
        content = fix_loading_pattern(content)
        content = fix_map_pattern(content)
        
        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

# List of remaining files
files = [
    '/app/web-admin/app/equipment/[id]/page.tsx',
    '/app/web-admin/app/equipment/create/page.tsx',
    '/app/web-admin/app/equipment/inspections/schedules/create/page.tsx',
    '/app/web-admin/app/equipment/inspections/schedules/page.tsx',
    '/app/web-admin/app/design-system-demo/page.tsx',
    '/app/web-admin/app/emergency-alert/page.tsx',
    '/app/web-admin/app/feedback/page.tsx',
    '/app/web-admin/app/forgot-password/page.tsx',
    '/app/web-admin/app/forms/[templateId]/fill/page.tsx',
    '/app/web-admin/app/forms/responses/[responseId]/page.tsx',
    '/app/web-admin/app/invoices/[id]/page.tsx',
    '/app/web-admin/app/legal/privacy/page.tsx',
    '/app/web-admin/app/legal/terms/page.tsx',
    '/app/web-admin/app/messages/page.tsx',
    '/app/web-admin/app/navigation-builder/page.tsx',
    '/app/web-admin/app/page-layout-mapper/page.tsx',
    '/app/web-admin/app/photos/page.tsx',
    '/app/web-admin/app/preview-new-design/page.tsx',
    '/app/web-admin/app/projects/[id]/page.tsx',
    '/app/web-admin/app/reset-password/page.tsx',
    '/app/web-admin/app/services/[id]/edit/page.tsx',
    '/app/web-admin/app/settings/equipment-forms/page.tsx',
    '/app/web-admin/app/settings/google/page.tsx',
    '/app/web-admin/app/settings/permissions-matrix/page.tsx',
    '/app/web-admin/app/settings/quickbooks/page.tsx',
    '/app/web-admin/app/settings/ringcentral/page.tsx',
    '/app/web-admin/app/team/[id]/edit/page.tsx',
    '/app/web-admin/app/team/[id]/page.tsx',
    '/app/web-admin/app/team/create/page.tsx',
    '/app/web-admin/app/templates/[type]/[id]/edit/page.tsx',
    '/app/web-admin/app/templates/[type]/[id]/page.tsx',
    '/app/web-admin/app/tracking/page.tsx',
]

fixed_count = 0
for f in files:
    p = Path(f)
    if p.exists():
        if fix_file(p):
            print(f"Fixed: {p.name}")
            fixed_count += 1

print(f"\nFixed {fixed_count} files")
