#!/bin/bash

# Pre-Deployment Security Check Script
# Run this script before deploying to production

echo "======================================"
echo "  PRE-DEPLOYMENT SECURITY CHECK"
echo "======================================"
echo ""

ERRORS=0
WARNINGS=0

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to print error
error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ERRORS=$((ERRORS + 1))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# Function to print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo "1. Checking environment files..."

# Check if .env files exist
if [ ! -f "/app/backend/.env" ]; then
    error "Backend .env file not found"
else
    success "Backend .env file exists"
    
    # Check JWT_SECRET_KEY
    if grep -q "JWT_SECRET_KEY=" /app/backend/.env; then
        JWT_SECRET=$(grep "JWT_SECRET_KEY=" /app/backend/.env | cut -d '=' -f2)
        if [ ${#JWT_SECRET} -lt 32 ]; then
            error "JWT_SECRET_KEY is too short (minimum 32 characters)"
        else
            success "JWT_SECRET_KEY has adequate length"
        fi
    else
        error "JWT_SECRET_KEY not found in .env"
    fi
    
    # Check for MONGO_URL
    if grep -q "MONGO_URL=" /app/backend/.env; then
        success "MONGO_URL is configured"
    else
        error "MONGO_URL not found in .env"
    fi
    
    # Check for Google Maps API key
    if grep -q "GOOGLE_MAPS_API_KEY=" /app/backend/.env; then
        success "GOOGLE_MAPS_API_KEY is configured"
    else
        warning "GOOGLE_MAPS_API_KEY not found"
    fi
fi

if [ ! -f "/app/web-admin/.env.local" ]; then
    warning "Web admin .env.local file not found"
else
    success "Web admin .env.local file exists"
fi

echo ""
echo "2. Checking for hardcoded credentials..."

# Search for potential hardcoded credentials
HARDCODED=$(grep -r -i "password.*=.*\"" /app/backend --include="*.py" --exclude-dir=venv | grep -v "# " | wc -l)
if [ $HARDCODED -gt 0 ]; then
    warning "Found $HARDCODED potential hardcoded passwords in backend code"
else
    success "No hardcoded passwords found in backend"
fi

echo ""
echo "3. Checking database indexes..."

if [ -f "/app/backend/create_indexes.py" ]; then
    success "Database index script exists"
    echo "   Run: python /app/backend/create_indexes.py"
else
    error "Database index script not found"
fi

echo ""
echo "4. Checking security implementations..."

# Check for password hashing
if grep -q "bcrypt" /app/backend/user_access_service.py; then
    success "Password hashing implemented (bcrypt)"
else
    error "Password hashing not found"
fi

# Check for rate limiting
if grep -q "rate_limiter" /app/backend/server.py; then
    success "Rate limiting is enabled"
else
    warning "Rate limiting may not be enabled"
fi

# Check for WebSocket authentication
if grep -q "validate_token" /app/backend/websocket_routes.py; then
    success "WebSocket authentication implemented"
else
    warning "WebSocket authentication may not be implemented"
fi

echo ""
echo "5. Checking for console.log statements..."

# Check for console.log in production code
CONSOLE_LOGS=$(grep -r "console.log" /app/web-admin/app --include="*.tsx" --include="*.ts" | wc -l)
if [ $CONSOLE_LOGS -gt 0 ]; then
    warning "Found $CONSOLE_LOGS console.log statements in web-admin"
else
    success "No console.log statements in web-admin"
fi

echo ""
echo "6. Checking file permissions..."

# Check critical file permissions
if [ -f "/app/backend/.env" ]; then
    PERMS=$(stat -c "%a" /app/backend/.env)
    if [ "$PERMS" != "600" ] && [ "$PERMS" != "400" ]; then
        warning ".env file permissions are $PERMS (should be 600 or 400)"
    else
        success ".env file permissions are secure ($PERMS)"
    fi
fi

echo ""
echo "7. Checking for TODO and FIXME comments..."

TODOS=$(grep -r "TODO\|FIXME" /app/backend --include="*.py" | wc -l)
if [ $TODOS -gt 0 ]; then
    warning "Found $TODOS TODO/FIXME comments in backend code"
else
    success "No outstanding TODO/FIXME comments"
fi

echo ""
echo "8. Checking dependencies..."

# Check if requirements are installed
if [ -f "/app/backend/requirements.txt" ]; then
    success "Backend requirements.txt exists"
else
    error "Backend requirements.txt not found"
fi

if [ -f "/app/web-admin/package.json" ]; then
    success "Web admin package.json exists"
else
    error "Web admin package.json not found"
fi

echo ""
echo "======================================"
echo "  SECURITY CHECK SUMMARY"
echo "======================================"
echo -e "${RED}Errors: $ERRORS${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ DEPLOYMENT BLOCKED - Fix errors before deploying${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  WARNINGS FOUND - Review before deploying${NC}"
    exit 0
else
    echo -e "${GREEN}✅ ALL CHECKS PASSED - Ready for deployment${NC}"
    exit 0
fi
