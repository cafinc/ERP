#!/usr/bin/env python3
"""
Batch JSX Syntax Fix Script
Fixes multiple root element errors in Next.js pages
"""

import os
import re
import sys
from pathlib import Path

# Configuration
WEB_ADMIN_DIR = "/app/web-admin/app"
BACKUP_DIR = "/app/backups/jsx-fix"

# Statistics
stats = {
    'total_files': 0,
    'fixed_files': 0,
    'skipped_files': 0,
    'errors': 0
}

def ensure_backup_dir():
    """Create backup directory if it doesn't exist"""
    Path(BACKUP_DIR).mkdir(parents=True, exist_ok=True)

def backup_file(filepath):
    """Create backup of file before modifying"""
    try:
        backup_path = os.path.join(BACKUP_DIR, os.path.basename(filepath))
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    except Exception as e:
        print(f"  ❌ Backup failed: {e}")
        return False

def has_pageheader_import(content):
    """Check if file imports PageHeader"""
    return 'PageHeader' in content or 'from' in content

def needs_fixing(content):
    """Check if file has the JSX syntax error pattern"""
    # Pattern: return ( <PageHeader followed by other JSX
    pattern = r'return\s*\(\s*<PageHeader[^>]*/>(?:\s*\n)?\s*<(?!\/)'
    return bool(re.search(pattern, content))

def fix_jsx_structure(content):
    """Fix JSX structure by wrapping in parent div"""
    
    # Check if PageHeader import exists, add if missing
    if 'PageHeader' in content and "import PageHeader from '@/components/PageHeader';" not in content:
        # Add import after 'use client' or at the beginning of imports
        if "'use client';" in content:
            content = content.replace("'use client';", "'use client';\n\nimport PageHeader from '@/components/PageHeader';")
        elif 'import' in content:
            first_import = content.find('import')
            content = content[:first_import] + "import PageHeader from '@/components/PageHeader';\n" + content[first_import:]
    
    # Find the return statement with PageHeader
    pattern = r'(return\s*\(\s*)(<PageHeader[^>]*/>)'
    match = re.search(pattern, content)
    
    if not match:
        return content, False
    
    # Find the closing parenthesis of the return statement
    start_pos = match.start()
    open_parens = 0
    in_string = False
    string_char = None
    i = match.end()
    
    # Parse to find matching closing paren
    while i < len(content):
        char = content[i]
        
        # Handle strings
        if char in ['"', "'", '`'] and (i == 0 or content[i-1] != '\\'):
            if not in_string:
                in_string = True
                string_char = char
            elif char == string_char:
                in_string = False
                string_char = None
        
        # Count parentheses outside strings
        if not in_string:
            if char == '(':
                open_parens += 1
            elif char == ')':
                if open_parens == 0:
                    # Found the matching closing paren
                    close_paren_pos = i
                    break
                open_parens -= 1
        
        i += 1
    else:
        return content, False
    
    # Extract the content inside return()
    return_content = content[match.end():close_paren_pos]
    
    # Build the fixed version
    wrapper_div_open = '<div className="min-h-screen bg-gray-50 flex flex-col">\n      '
    wrapper_div_close = '\n    </div>'
    
    # Replace the return statement
    new_return = (
        match.group(1) +
        wrapper_div_open +
        match.group(2) +
        return_content +
        wrapper_div_close
    )
    
    fixed_content = content[:start_pos] + new_return + content[close_paren_pos:]
    
    return fixed_content, True

def process_file(filepath):
    """Process a single file"""
    try:
        # Read file
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if needs fixing
        if not needs_fixing(content):
            stats['skipped_files'] += 1
            return False
        
        # Backup file
        if not backup_file(filepath):
            return False
        
        # Fix the JSX structure
        fixed_content, was_fixed = fix_jsx_structure(content)
        
        if not was_fixed:
            print(f"  ⚠️  Could not automatically fix (complex structure)")
            stats['skipped_files'] += 1
            return False
        
        # Write fixed content
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        
        stats['fixed_files'] += 1
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        stats['errors'] += 1
        return False

def find_tsx_files(directory):
    """Find all .tsx files in directory"""
    tsx_files = []
    for root, dirs, files in os.walk(directory):
        # Skip node_modules and .next directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', 'dist']]
        for file in files:
            if file.endswith('.tsx'):
                tsx_files.append(os.path.join(root, file))
    return tsx_files

def main():
    print("=" * 60)
    print("  JSX SYNTAX BATCH FIX SCRIPT")
    print("=" * 60)
    print()
    
    # Ensure backup directory exists
    ensure_backup_dir()
    print(f"✅ Backup directory: {BACKUP_DIR}")
    print()
    
    # Find all .tsx files
    print(f"🔍 Scanning for .tsx files in {WEB_ADMIN_DIR}...")
    tsx_files = find_tsx_files(WEB_ADMIN_DIR)
    stats['total_files'] = len(tsx_files)
    print(f"   Found {len(tsx_files)} .tsx files")
    print()
    
    # Process each file
    print("🔧 Processing files...")
    print("-" * 60)
    
    for i, filepath in enumerate(tsx_files, 1):
        rel_path = os.path.relpath(filepath, WEB_ADMIN_DIR)
        print(f"[{i}/{len(tsx_files)}] {rel_path}", end=" ")
        
        result = process_file(filepath)
        if result:
            print("✅ FIXED")
        elif stats['errors'] > 0:
            print("")  # Error already printed
        else:
            print("⏭️  SKIPPED")
    
    # Print summary
    print()
    print("=" * 60)
    print("  SUMMARY")
    print("=" * 60)
    print(f"Total files scanned: {stats['total_files']}")
    print(f"✅ Files fixed: {stats['fixed_files']}")
    print(f"⏭️  Files skipped: {stats['skipped_files']}")
    print(f"❌ Errors: {stats['errors']}")
    print()
    
    if stats['fixed_files'] > 0:
        print("✅ Batch fix completed successfully!")
        print(f"   Backups saved in: {BACKUP_DIR}")
        print()
        print("Next steps:")
        print("1. Run: cd /app/web-admin && npm run build")
        print("2. Verify build completes without errors")
        print("3. Test critical pages in browser")
    else:
        print("ℹ️  No files needed fixing or all were skipped")
    
    print()
    return 0 if stats['errors'] == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
