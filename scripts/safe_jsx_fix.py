#!/usr/bin/env python3
"""
Safe JSX Fixer - Only fix obvious patterns
"""
from pathlib import Path
import re

def fix_simple_loading_pattern(file_path):
    """
    Fix only the simplest, most obvious pattern:
    
    if (loading) {
      return (
        <div>
          <PageHeader .../>
          <div>
            <div>
              <RefreshCw/>
            </div>
          
          </div>);    <- Missing closing div for outer container
    }
    """
    with open(file_path, 'r') as f:
        content = f.read()
    
    lines = content.split('\n')
    fixed = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Look for the problematic pattern: whitespace + </div>);
        if re.match(r'^\s+</div>\);$', line):
            # Check if previous lines suggest missing divs
            # Look back for unclosed structure
            indent_level = len(line) - len(line.lstrip())
            
            # Count divs in previous 15 lines
            lookback = lines[max(0, i-15):i]
            opens = sum(l.count('<div') for l in lookback)
            closes = sum(l.count('</div>') for l in lookback)
            
            if opens > closes:
                missing = opens - closes
                # Add missing closing divs with correct indentation
                for _ in range(missing):
                    fixed.append(' ' * indent_level + '</div>')
        
        fixed.append(line)
        i += 1
    
    result = '\n'.join(fixed)
    
    if result != content:
        with open(file_path, 'w') as f:
            f.write(result)
        return True
    return False

# Process all problem files
files = [
    '/app/web-admin/app/equipment/[id]/page.tsx',
    '/app/web-admin/app/equipment/create/page.tsx',
    '/app/web-admin/app/equipment/inspections/schedules/create/page.tsx',
    '/app/web-admin/app/equipment/inspections/schedules/page.tsx',
    '/app/web-admin/app/learning-documents/page.tsx',
    '/app/web-admin/app/settings/equipment-forms/page.tsx',
    '/app/web-admin/app/settings/google/page.tsx',
    '/app/web-admin/app/settings/permissions-matrix/page.tsx',
    '/app/web-admin/app/settings/quickbooks/page.tsx',
    '/app/web-admin/app/settings/ringcentral/page.tsx',
    '/app/web-admin/app/shifts/history/page.tsx',
    '/app/web-admin/app/team/[id]/edit/page.tsx',
    '/app/web-admin/app/team/[id]/page.tsx',
    '/app/web-admin/app/team/create/page.tsx',
    '/app/web-admin/app/templates/[type]/[id]/edit/page.tsx',
    '/app/web-admin/app/templates/[type]/[id]/page.tsx',
    '/app/web-admin/app/tracking/page.tsx',
]

fixed = 0
for f in files:
    p = Path(f)
    if p.exists():
        if fix_simple_loading_pattern(p):
            print(f"Fixed: {p.name}")
            fixed += 1

print(f"\nFixed {fixed} files")
