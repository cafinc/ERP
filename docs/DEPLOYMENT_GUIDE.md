# Deployment Guide - Field Service Management ERP System

**Version:** 1.0  
**Date:** June 2025  
**Status:** Production Ready

## Table of Contents

1. [System Overview](#system-overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Security Hardening](#security-hardening)
8. [Performance Optimization](#performance-optimization)
9. [Monitoring & Logging](#monitoring--logging)
10. [Post-Deployment Verification](#post-deployment-verification)

---

## System Overview

### Technology Stack
- **Backend:** FastAPI (Python 3.10+)
- **Frontend (Web):** Next.js 14 (React 18+)
- **Frontend (Mobile):** Expo (React Native)
- **Database:** MongoDB 6.0+
- **Authentication:** JWT-based
- **Rate Limiting:** SlowAPI
- **Real-time:** WebSocket

### Architecture
```
┌─────────────────┐       ┌─────────────────┐
│   Web Admin     │◄─────►│   FastAPI       │
│   (Next.js)     │       │   Backend       │
└─────────────────┘       │   (Port 8001)   │
                          └────────┬────────┘
┌─────────────────┐               │
│   Mobile App    │               │
│   (Expo)        │◄──────────────┤
└─────────────────┘               │
                          ┌───────▼────────┐
                          │   MongoDB      │
                          │   Database     │
                          └────────────────┘
```

---

## Pre-Deployment Checklist

### 1. Security Review
- [ ] All passwords are hashed using bcrypt
- [ ] JWT secret key is strong and unique
- [ ] WebSocket connections require authentication
- [ ] Rate limiting is enabled on all endpoints
- [ ] CORS is properly configured
- [ ] Environment variables are not hardcoded

### 2. Database Optimization
- [ ] Database indexes are created (see `create_indexes.py`)
- [ ] Connection pooling is configured
- [ ] Backup strategy is in place

### 3. Code Quality
- [ ] All tests pass
- [ ] No console.log statements in production code
- [ ] Error logging is configured
- [ ] Build process completes without errors

### 4. Infrastructure
- [ ] Domain name is configured
- [ ] SSL certificates are ready
- [ ] CDN is set up (for static assets)
- [ ] Load balancer is configured (if needed)

---

## Environment Configuration

### Backend Environment Variables (.env)

**CRITICAL:** These must be set before deployment:

```bash
# MongoDB Configuration
MONGO_URL=mongodb://mongodb:27017/field_service_erp

# JWT Authentication
JWT_SECRET_KEY=<GENERATE_A_STRONG_SECRET_KEY>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# API Configuration
API_HOST=0.0.0.0
API_PORT=8001
CORS_ORIGINS=["https://yourdomain.com", "https://admin.yourdomain.com"]

# Google Maps API
GOOGLE_MAPS_API_KEY=<YOUR_GOOGLE_MAPS_API_KEY>

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000

# Background Tasks
SCHEDULER_ENABLED=true
```

**Generate JWT Secret:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Frontend Environment Variables (web-admin/.env.local)

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<YOUR_GOOGLE_MAPS_API_KEY>
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com/ws
```

### Mobile App Environment Variables (frontend/.env)

```bash
EXPO_PUBLIC_BACKEND_URL=https://api.yourdomain.com
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<YOUR_GOOGLE_MAPS_API_KEY>
EXPO_PACKAGER_PROXY_URL=http://yourserver:3000
EXPO_PACKAGER_HOSTNAME=yourserver
```

---

## Database Setup

### 1. Create Database Indexes

Run the index creation script to optimize query performance:

```bash
cd /app/backend
python create_indexes.py
```

**Indexes Created:**
- `service_history`: site_id, service_date, service_type, status
- `site_maps`: site_id, is_current, version
- `customers`: email, phone, company_name
- `sites`: customer_id, site_type
- `work_orders`: site_id, status, scheduled_start
- `users`: username, email

### 2. Database Backup Configuration

Set up automated backups:

```bash
# Daily backup cron job
0 2 * * * mongodump --uri="mongodb://localhost:27017/field_service_erp" --out="/backups/$(date +\%Y\%m\%d)"

# Weekly full backup
0 1 * * 0 mongodump --uri="mongodb://localhost:27017/field_service_erp" --archive="/backups/weekly/backup-$(date +\%Y\%m\%d).gz" --gzip
```

### 3. Database Performance Settings

Edit MongoDB configuration (`/etc/mongod.conf`):

```yaml
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 4  # Adjust based on available RAM
    collectionConfig:
      blockCompressor: snappy

net:
  maxIncomingConnections: 1000
  compression:
    compressors: snappy

operationProfiling:
  mode: slowOp
  slowOpThresholdMs: 100
```

---

## Backend Deployment

### 1. Install Dependencies

```bash
cd /app/backend
pip install -r requirements.txt
```

### 2. Initialize Database Indexes

```bash
python create_indexes.py
```

### 3. Production Server Configuration

Use **Gunicorn** with **Uvicorn workers** for production:

```bash
# Install Gunicorn
pip install gunicorn

# Run with 4 workers
gunicorn server:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8001 \
  --timeout 120 \
  --access-logfile /var/log/api/access.log \
  --error-logfile /var/log/api/error.log \
  --log-level info
```

### 4. Systemd Service Configuration

Create `/etc/systemd/system/field-service-api.service`:

```ini
[Unit]
Description=Field Service ERP API
After=network.target mongodb.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/app/backend
Environment="PATH=/app/backend/venv/bin"
ExecStart=/app/backend/venv/bin/gunicorn server:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8001 \
  --timeout 120

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable field-service-api
sudo systemctl start field-service-api
sudo systemctl status field-service-api
```

---

## Frontend Deployment

### Web Admin (Next.js)

#### 1. Build for Production

```bash
cd /app/web-admin
npm install
npm run build
```

#### 2. Start Production Server

```bash
npm start
```

Or use **PM2** for process management:

```bash
npm install -g pm2
pm2 start npm --name "web-admin" -- start
pm2 save
pm2 startup
```

#### 3. Nginx Configuration

Create `/etc/nginx/sites-available/web-admin`:

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/admin.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }

    location /ws {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/web-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Mobile App (Expo)

#### 1. Build for iOS

```bash
cd /app/frontend
eas build --platform ios --profile production
```

#### 2. Build for Android

```bash
eas build --platform android --profile production
```

#### 3. Submit to App Stores

```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

---

## Security Hardening

### 1. Rotate JWT Secret Key

**CRITICAL:** Change the JWT secret key before deployment:

```bash
# Generate new secret
NEW_SECRET=$(python -c "import secrets; print(secrets.token_urlsafe(32))")

# Update .env file
echo "JWT_SECRET_KEY=$NEW_SECRET" >> /app/backend/.env
```

### 2. Enable HTTPS Only

Update backend CORS settings in `server.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://admin.yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Rate Limiting Configuration

Ensure rate limiting is active:

```python
# In middleware/rate_limiter.py
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60/minute", "1000/hour"]
)
```

### 4. Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct access to backend and MongoDB
sudo ufw deny 8001/tcp
sudo ufw deny 27017/tcp

# Enable firewall
sudo ufw enable
```

---

## Performance Optimization

### 1. Database Query Optimization

All critical indexes have been created. Verify with:

```bash
python create_indexes.py
```

### 2. API Response Caching

Consider adding Redis for caching:

```python
# Install Redis
pip install redis

# Example caching configuration
CACHE_CONFIG = {
    "sites_list": {"ttl": 300},  # 5 minutes
    "customers_list": {"ttl": 300},
    "service_history": {"ttl": 60},  # 1 minute
}
```

### 3. Frontend Optimization

- Enable Next.js image optimization
- Use CDN for static assets
- Enable gzip compression in Nginx

### 4. Load Balancing (Optional)

For high traffic, add load balancing:

```nginx
upstream backend {
    least_conn;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
    server 127.0.0.1:8003;
}
```

---

## Monitoring & Logging

### 1. Application Logs

**Backend Logs:**
```bash
# Real-time logs
tail -f /var/log/api/error.log
tail -f /var/log/api/access.log

# Search for errors
grep -i "error" /var/log/api/error.log
```

**Frontend Logs:**
```bash
# PM2 logs
pm2 logs web-admin

# Next.js logs
tail -f /app/web-admin/.next/server/logs/production.log
```

### 2. Database Monitoring

```bash
# MongoDB slow queries
tail -f /var/log/mongodb/mongod.log | grep "slow"

# Database stats
mongo --eval "db.stats()"
```

### 3. System Health Checks

Create `/app/scripts/health_check.sh`:

```bash
#!/bin/bash

# Check backend API
curl -f http://localhost:8001/health || echo "Backend API down!"

# Check frontend
curl -f http://localhost:3000 || echo "Frontend down!"

# Check MongoDB
mongo --eval "db.adminCommand('ping')" || echo "MongoDB down!"
```

Set up cron job:
```bash
*/5 * * * * /app/scripts/health_check.sh
```

### 4. Error Tracking

Consider integrating:
- **Sentry** for error tracking
- **DataDog** for APM
- **Prometheus** + **Grafana** for metrics

---

## Post-Deployment Verification

### 1. API Health Check

```bash
curl https://api.yourdomain.com/health
# Expected: {"status": "healthy"}
```

### 2. Authentication Test

```bash
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### 3. Frontend Access

Visit: `https://admin.yourdomain.com`
- [ ] Login page loads
- [ ] Authentication works
- [ ] Dashboard displays correctly

### 4. Mobile App Testing

- [ ] Download from App Store/Play Store
- [ ] Login functionality works
- [ ] API calls are successful
- [ ] Real-time features work

### 5. Performance Verification

Run load tests:

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test API performance
ab -n 1000 -c 10 https://api.yourdomain.com/health
```

**Target Metrics:**
- Response time: < 200ms
- Success rate: > 99%
- Concurrent users: 100+

---

## Rollback Plan

If issues arise, rollback steps:

### 1. Database Rollback

```bash
# Restore from backup
mongorestore --uri="mongodb://localhost:27017/field_service_erp" \
  --archive="/backups/pre-deployment.gz" --gzip
```

### 2. Application Rollback

```bash
# Backend
sudo systemctl stop field-service-api
cd /app/backend
git checkout <previous-version-tag>
sudo systemctl start field-service-api

# Frontend
pm2 stop web-admin
cd /app/web-admin
git checkout <previous-version-tag>
npm install && npm run build
pm2 restart web-admin
```

---

## Support & Maintenance

### Daily Tasks
- Monitor error logs
- Check system health
- Review slow queries

### Weekly Tasks
- Database backup verification
- Security updates
- Performance review

### Monthly Tasks
- Full system audit
- Rotate credentials
- Update dependencies

---

## Contact Information

**Production Issues:** support@yourdomain.com  
**Emergency Contact:** +1-XXX-XXX-XXXX  
**Documentation:** https://docs.yourdomain.com

---

**Document Version:** 1.0  
**Last Updated:** June 2025  
**Next Review:** July 2025
