#!/bin/bash

# Fix all files that use PageHeader as a wrapper instead of self-closing

echo "Fixing PageHeader wrapper usage..."

# Get list of all files with PageHeader used as wrapper
FILES=$(cd /app/web-admin && grep -rl "<PageHeader>" app/ --include="*.tsx" 2>/dev/null || echo "")

if [ -z "$FILES" ]; then
  echo "No files found with PageHeader wrapper pattern"
  exit 0
fi

COUNT=0
for file in $FILES; do
  filepath="/app/web-admin/$file"
  echo "Checking: $file"
  
  # Check if file actually has the wrapper pattern
  if grep -q "return.*<PageHeader>" "$filepath"; then
    echo "  ⚠️  Has PageHeader wrapper - needs manual fix"
    COUNT=$((COUNT + 1))
  fi
done

echo ""
echo "Found $COUNT files with PageHeader wrapper pattern"
echo "These files need to be converted to use PageHeader as self-closing component"

