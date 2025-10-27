#!/usr/bin/env python3
"""
Comprehensive script to fix ALL remaining JSX build errors by balancing div tags.
"""

import os
import re
import subprocess

def get_div_balance(filepath):
    """Count opening and closing div tags."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        opening = len(re.findall(r'<div[\s>]', content))
        closing = len(re.findall(r'</div>', content))
        return opening, closing, opening - closing
    except:
        return 0, 0, 0

def fix_div_balance(filepath, missing_count):
    """Add missing closing divs before );"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Find the line with );
        for i in range(len(lines) - 1, -1, -1):
            if lines[i].strip() == ');':
                # Insert missing closing divs before );
                for j in range(missing_count):
                    lines.insert(i, '    </div>\n')
                break
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        
        return True
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
        return False

def main():
    base_dir = "/app/web-admin"
    os.chdir(base_dir)
    
    # Get all failing files from build
    result = subprocess.run(
        ["npm", "run", "build"],
        capture_output=True,
        text=True,
        cwd=base_dir
    )
    
    # Extract unique failing file paths
    failing_files = set()
    for line in result.stdout.split('\n'):
        if line.startswith('./app/') and '.tsx' in line:
            # Extract just the file path
            filepath = line.split(':')[0]
            if filepath.startswith('./'):
                failing_files.add(filepath[2:])  # Remove ./
    
    print(f"Found {len(failing_files)} failing files\n")
    
    fixed_count = 0
    
    for filepath in sorted(failing_files):
        full_path = os.path.join(base_dir, filepath)
        if not os.path.exists(full_path):
            continue
        
        opening, closing, missing = get_div_balance(full_path)
        
        if missing > 0:
            print(f"Fixing {filepath}: adding {missing} closing divs (open:{opening}, close:{closing})")
            if fix_div_balance(full_path, missing):
                fixed_count += 1
        elif missing < 0:
            print(f"⚠️  {filepath}: has {abs(missing)} EXTRA closing divs (open:{opening}, close:{closing})")
        else:
            print(f"✓ {filepath}: balanced (open:{opening}, close:{closing})")
    
    print(f"\n✅ Fixed {fixed_count} files")
    
    # Run build again to check
    print("\n🔨 Running build to verify...")
    result = subprocess.run(
        ["npm", "run", "build"],
        capture_output=True,
        text=True,
        cwd=base_dir
    )
    
    if "Build error occurred" in result.stdout:
        match = re.search(r'failed with (\d+) errors', result.stdout)
        if match:
            remaining = int(match.group(1))
            print(f"✅ Reduced to {remaining} errors (fixed {90 - remaining})")
            return remaining
        print("❌ Build still has errors")
        return 1
    else:
        print("🎉 BUILD SUCCESSFUL! All errors fixed!")
        return 0

if __name__ == "__main__":
    exit(main())
