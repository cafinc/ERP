#!/usr/bin/env python3
"""
Fix JSX pages with missing PageHeader wrapper
Targets the pattern where return ( starts directly with inner content div instead of page container
"""
from pathlib import Path
import re

def fix_missing_page_wrapper(file_path, page_title, subtitle):
    """Fix files missing the outer page wrapper"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Pattern: return ( followed by a content div without page wrapper
    # Look for: return (\n    <div className="p-8"> or similar
    pattern = r'(  return \()\n(\s+)<div className="(?:p-8|space-y-6)'
    
    if re.search(pattern, content):
        # Add proper page wrapper
        replacement = f'''\\1
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="{page_title}"
        subtitle="{subtitle}"
        breadcrumbs={{[{{ label: "Home", href: "/" }}, {{ label: "{page_title}" }}]}}
      />
      <div className="flex-1 overflow-auto p-6">
\\2<div className="'''
        
        content = re.sub(pattern, replacement, content)
        
        # Also need to close the wrappers at the end
        # Find the last closing before final );
        content = re.sub(r'(      </div>)\n(\s+)\);\n}$', r'\1\n      </div>\n    </div>\n  );\n}', content, flags=re.MULTILINE)
        
        with open(file_path, 'w') as f:
            f.write(content)
        return True
    return False

# Fix critical pages
files_to_fix = [
    ('/app/web-admin/app/invoices/[id]/page.tsx', 'Invoice Details', 'View and manage invoice'),
    ('/app/web-admin/app/projects/[id]/page.tsx', 'Project Details', 'View and manage project'),
    ('/app/web-admin/app/team/[id]/page.tsx', 'Team Member', 'View member details'),
    ('/app/web-admin/app/team/[id]/edit/page.tsx', 'Edit Team Member', 'Update member information'),
    ('/app/web-admin/app/team/create/page.tsx', 'Create Team Member', 'Add new member'),
]

for file_path, title, subtitle in files_to_fix:
    p = Path(file_path)
    if p.exists():
        if fix_missing_page_wrapper(p, title, subtitle):
            print(f"Fixed: {p.name}")
        else:
            print(f"Skipped (no pattern match): {p.name}")

print("\nDone!")
