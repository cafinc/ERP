#!/bin/bash

# Production Deployment Script
# This script prepares the application for production deployment

echo "========================================"
echo "  PRODUCTION DEPLOYMENT PREPARATION"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Generate new JWT secret
echo -e "${BLUE}Step 1: Generating new JWT secret key...${NC}"
NEW_JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
echo "New JWT Secret: $NEW_JWT_SECRET"
echo -e "${YELLOW}⚠️  IMPORTANT: Update JWT_SECRET_KEY in /app/backend/.env with this value${NC}"
echo ""

# Step 2: Create database indexes
echo -e "${BLUE}Step 2: Creating database indexes...${NC}"
cd /app/backend
python3 create_indexes.py
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database indexes created successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Failed to create indexes - check MongoDB connection${NC}"
fi
echo ""

# Step 3: Build frontend
echo -e "${BLUE}Step 3: Building web admin frontend...${NC}"
cd /app/web-admin
npm install
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
else
    echo "❌ Frontend build failed"
    exit 1
fi
echo ""

# Step 4: Test backend health
echo -e "${BLUE}Step 4: Testing backend API health...${NC}"
HEALTH_CHECK=$(curl -s http://localhost:8001/health | grep -o '"status":"healthy"')
if [ ! -z "$HEALTH_CHECK" ]; then
    echo -e "${GREEN}✅ Backend API is healthy${NC}"
else
    echo "❌ Backend API health check failed"
fi
echo ""

# Step 5: Create backup
echo -e "${BLUE}Step 5: Creating database backup...${NC}"
BACKUP_DIR="/app/backups/pre-deployment-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
mongodump --uri="mongodb://mongodb:27017/field_service_erp" --out="$BACKUP_DIR"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database backup created: $BACKUP_DIR${NC}"
else
    echo -e "${YELLOW}⚠️  Database backup failed${NC}"
fi
echo ""

# Step 6: Security fixes
echo -e "${BLUE}Step 6: Applying security fixes...${NC}"

# Fix .env permissions
chmod 600 /app/backend/.env
echo -e "${GREEN}✅ Fixed .env file permissions (now 600)${NC}"

# Remove console.log statements (commented out for safety)
# echo "Removing console.log statements..."
# find /app/web-admin/app -name "*.tsx" -o -name "*.ts" | xargs sed -i '/console\.log/d'

echo ""

# Step 7: Generate deployment checklist
echo -e "${BLUE}Step 7: Generating final deployment checklist...${NC}"

cat > /app/DEPLOYMENT_CHECKLIST.md << 'EOF'
# Final Deployment Checklist

## Pre-Deployment (DO BEFORE DEPLOYING)

### Security
- [ ] **CRITICAL:** Rotate JWT_SECRET_KEY in `/app/backend/.env`
- [ ] Update CORS origins in `server.py` to production domains
- [ ] Remove all `console.log` statements from production code
- [ ] Verify .env file permissions are 600
- [ ] Review and fix all TODO/FIXME comments

### Environment Configuration
- [ ] Set production MongoDB URL
- [ ] Configure Google Maps API key (with production restrictions)
- [ ] Set up production domain in environment variables
- [ ] Configure SSL certificates

### Database
- [ ] Run `python /app/backend/create_indexes.py`
- [ ] Create database backup
- [ ] Test database connection from production server

### Application
- [ ] Build frontend: `cd /app/web-admin && npm run build`
- [ ] Test backend health: `curl http://localhost:8001/health`
- [ ] Verify rate limiting is working
- [ ] Test WebSocket authentication

## Deployment Steps

1. **Stop Services**
   ```bash
   sudo systemctl stop field-service-api
   sudo systemctl stop nginx
   ```

2. **Deploy Code**
   ```bash
   cd /app
   git pull origin main  # or copy files
   ```

3. **Update Dependencies**
   ```bash
   cd /app/backend
   pip install -r requirements.txt
   
   cd /app/web-admin
   npm install
   npm run build
   ```

4. **Apply Database Migrations**
   ```bash
   python /app/backend/create_indexes.py
   ```

5. **Start Services**
   ```bash
   sudo systemctl start field-service-api
   sudo systemctl start nginx
   ```

6. **Verify Deployment**
   ```bash
   curl https://api.yourdomain.com/health
   curl https://admin.yourdomain.com
   ```

## Post-Deployment Verification

- [ ] Login to web admin works
- [ ] Dashboard loads correctly
- [ ] API endpoints respond properly
- [ ] Database queries are fast (check indexes)
- [ ] WebSocket connections work
- [ ] Mobile app can connect
- [ ] Check error logs for issues
- [ ] Monitor performance for 30 minutes

## Rollback Plan (If Issues Occur)

1. Stop services
2. Restore database backup:
   ```bash
   mongorestore --uri="mongodb://localhost:27017/field_service_erp" \
     --archive="/app/backups/pre-deployment-YYYYMMDD-HHMMSS/dump.gz" --gzip
   ```
3. Checkout previous version:
   ```bash
   git checkout <previous-tag>
   ```
4. Restart services

## Monitoring

- [ ] Set up error tracking (Sentry)
- [ ] Configure performance monitoring
- [ ] Set up automated backups
- [ ] Create alert rules for critical errors
- [ ] Monitor API response times
- [ ] Track database query performance

## Documentation

- [ ] Update API documentation
- [ ] Document any configuration changes
- [ ] Update README with production setup
- [ ] Create runbook for common issues

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Version:** _____________  
**Rollback Point:** _____________
EOF

echo -e "${GREEN}✅ Deployment checklist created: /app/DEPLOYMENT_CHECKLIST.md${NC}"
echo ""

echo "========================================"
echo "  DEPLOYMENT PREPARATION COMPLETE"
echo "========================================"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Update JWT_SECRET_KEY in /app/backend/.env"
echo "2. Review /app/DEPLOYMENT_CHECKLIST.md"
echo "3. Run pre-deployment check: bash /app/scripts/pre_deployment_check.sh"
echo "4. Follow deployment steps in DEPLOYMENT_GUIDE.md"
echo ""
echo -e "${YELLOW}⚠️  Remember: Always test in staging before production!${NC}"
echo ""
