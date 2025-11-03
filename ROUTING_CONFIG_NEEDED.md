# Kubernetes Ingress Routing Configuration Required

## Issue
The main preview URL is currently showing the Expo mobile app instead of the web-admin dashboard.

## Required Configuration

### Current Services
- **web-admin** (Next.js): Running on port `3000`
- **backend** (FastAPI): Running on port `8001`  
- **expo** (React Native): Running on port `3001` (should be QR code only)

### Required Ingress Rules

```yaml
# Main web interface - web-admin
Route: /
Target: localhost:3000 (web-admin service)

# API endpoints
Route: /api/*
Target: localhost:8001 (backend service)

# Expo mobile app (optional, for QR code generation)
Route: /mobile (or QR code only)
Target: localhost:3001 (expo service)
```

### Expected Behavior
1. Visiting `https://[preview-url]/` → Shows web-admin dashboard (Next.js)
2. Visiting `https://[preview-url]/api/customers` → Calls backend API
3. Mobile app accessed via Expo Go QR code (not web browser)

### Current Incorrect Behavior
- Main URL shows Expo app interface (which is for mobile only)
- Should show web-admin (Next.js business dashboard)

## Platform Configuration Needed
This requires updating the Kubernetes ingress configuration at the Emergent platform level to route the default "/" path to port 3000 instead of the current routing.

## Services Status
All services are running correctly:
- ✅ web-admin: RUNNING on port 3000
- ✅ backend: RUNNING on port 8001
- ✅ expo: RUNNING on port 3001

The issue is purely routing/ingress configuration.
