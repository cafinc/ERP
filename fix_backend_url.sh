#!/bin/bash
# Fix NEXT_PUBLIC_BACKEND_URL to NEXT_PUBLIC_API_URL

find /app/web-admin -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/NEXT_PUBLIC_BACKEND_URL/NEXT_PUBLIC_API_URL/g' {} +

echo "Fixed all occurrences of NEXT_PUBLIC_BACKEND_URL to NEXT_PUBLIC_API_URL"
