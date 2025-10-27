#!/usr/bin/env python3
"""
Remove extra closing </div> tags that were incorrectly added.
"""

import os
import sys

FILES_TO_FIX = {
    "./app/crew-portal/communications/page.tsx": 4,  # Remove 4 extra </div>
    "./app/customer-portal/communications/page.tsx": 6,  # Remove 6 extra </div>
    "./app/subcontractor-portal/communications/page.tsx": 6,  # Remove 6 extra </div>
    "./app/design-system-demo/page.tsx": 1,
    "./app/emergency-alert/page.tsx": 1,
    "./app/feedback/page.tsx": 1,
    "./app/forgot-password/page.tsx": 1,
    "./app/learning-documents/page.tsx": 1,
    "./app/legal/privacy/page.tsx": 1,
    "./app/legal/terms/page.tsx": 1,
    "./app/messages/page.tsx": 3,
    "./app/navigation-builder/page.tsx": 1,
    "./app/page-layout-mapper/page.tsx": 1,
    "./app/preview-new-design/page.tsx": 2,
    "./app/reset-password/page.tsx": 1,
    "./app/templates/[type]/[id]/edit/page.tsx": 1,
    "./app/templates/[type]/[id]/page.tsx": 1,
    "./app/templates/new/page.tsx": 1,
    "./app/templates/page.tsx": 1,
    "./app/tracking/page.tsx": 2,
}

def remove_extra_closing_divs(filepath, count):
    """Remove extra closing </div> tags before the final closing brace."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Find lines that are just "    </div>\n" (4 spaces + </div>)
        # Work backwards from the end
        removed = 0
        i = len(lines) - 1
        
        while i >= 0 and removed < count:
            line = lines[i]
            # Check if it's an extra closing div (just whitespace + </div>)
            if line.strip() == '</div>' and (line.startswith('    </div>') or line.startswith('  </div>')):
                # Check the context - we want to remove the ones right before );
                if i < len(lines) - 1:
                    next_line = lines[i + 1].strip() if i + 1 < len(lines) else ""
                    # If next line is another </div>, ); or }, this might be an extra one
                    if next_line in ['</div>', ');', '}', '']:
                        lines.pop(i)
                        removed += 1
            i -= 1
        
        if removed > 0:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.writelines(lines)
            print(f"✅ {filepath}: Removed {removed} extra </div> tags")
            return True
        else:
            print(f"⚠️  {filepath}: No extra </div> tags found to remove")
            return False
        
    except Exception as e:
        print(f"❌ {filepath}: Error - {str(e)}")
        return False

def main():
    base_dir = "/app/web-admin"
    os.chdir(base_dir)
    
    print("🔧 Removing extra closing </div> tags...\n")
    
    fixed_count = 0
    
    for file_path, count_to_remove in FILES_TO_FIX.items():
        full_path = os.path.join(base_dir, file_path.lstrip('./'))
        if os.path.exists(full_path):
            if remove_extra_closing_divs(full_path, count_to_remove):
                fixed_count += 1
        else:
            print(f"⚠️  File not found: {file_path}")
    
    print(f"\n✅ Fixed: {fixed_count} files")
    
    # Run build
    print(f"\n🔨 Running build...")
    import subprocess
    result = subprocess.run(
        ["npm", "run", "build"],
        cwd=base_dir,
        capture_output=True,
        text=True
    )
    
    if "Build error occurred" in result.stdout:
        match = __import__('re').search(r'failed with (\d+) errors', result.stdout)
        if match:
            print(f"❌ Build has {match.group(1)} remaining errors")
        else:
            print(f"❌ Build failed")
        return 1
    else:
        print(f"✅ BUILD SUCCESSFUL!")
        return 0

if __name__ == "__main__":
    sys.exit(main())
