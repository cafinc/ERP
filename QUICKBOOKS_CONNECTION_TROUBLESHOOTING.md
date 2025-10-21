# QuickBooks Connection Troubleshooting Guide

## 🔍 Diagnosing Connection Issues

---

## Step 1: Verify Intuit Developer Portal Configuration

### **Check Your Production App Settings:**

1. Go to https://developer.intuit.com
2. Navigate to "My Apps"
3. Select your app
4. Go to "Keys & OAuth" tab

### **✅ Verify These Settings:**

**Production Keys:**
```
Client ID: ABSb9lt1OEqUsOO4tsf3UewtCe9OHGCSgbXTfr7xX56iqhy9i9
Client Secret: qB6XscWqZsKgT3RRdZHojQqS48UjyzjfZd6S4ALA
```

**Redirect URI (CRITICAL):**
```
https://snowmap-admin.preview.emergentagent.com/api/quickbooks/auth/callback
```

**⚠️ Common Issues:**
- ❌ Missing redirect URI
- ❌ Typo in redirect URI
- ❌ Wrong protocol (http vs https)
- ❌ Trailing slash in redirect URI
- ❌ App not published/approved for production

---

## Step 2: Test the OAuth Flow Manually

### **Test Authorization URL Generation:**

```bash
curl 'https://snowmap-admin.preview.emergentagent.com/api/quickbooks/auth/connect?user_id=test_user'
```

**Expected Response:**
```json
{
  "authorization_url": "https://appcenter.intuit.com/connect/oauth2?client_id=ABSb9lt1OEqUsOO4tsf3UewtCe9OHGCSgbXTfr7xX56iqhy9i9..."
}
```

**If this fails:**
- Check backend logs: `sudo supervisorctl tail backend`
- Verify credentials in `/app/backend/.env`

---

## Step 3: Test the Connection Flow

### **Follow These Steps:**

1. **Open Browser Developer Tools** (F12)
2. **Go to:** https://snowmap-admin.preview.emergentagent.com/settings/quickbooks
3. **Click "Connect to QuickBooks"**
4. **Watch the Network tab**

### **What Should Happen:**

**Step 1: Authorization Request**
```
GET /api/quickbooks/auth/connect?user_id=...
Status: 200
Response: { "authorization_url": "..." }
```

**Step 2: Redirect to QuickBooks**
```
Browser redirects to: https://appcenter.intuit.com/connect/oauth2...
```

**Step 3: QuickBooks Login**
- You should see QuickBooks login page
- Enter your QuickBooks credentials
- Select your company
- Click "Authorize"

**Step 4: Callback**
```
GET /api/quickbooks/auth/callback?code=...&state=...&realmId=...
Browser redirects to: /settings/quickbooks?connected=true
```

---

## Step 4: Check for Common Errors

### **Error: "redirect_uri_mismatch"**

**Symptom:** QuickBooks shows error after clicking "Authorize"

**Cause:** Redirect URI in Intuit portal doesn't match your backend

**Fix:**
1. Go to Intuit Developer Portal → Your App → Keys & OAuth
2. Verify redirect URI is EXACTLY:
   ```
   https://snowmap-admin.preview.emergentagent.com/api/quickbooks/auth/callback
   ```
3. Save and try again

---

### **Error: "invalid_client"**

**Symptom:** Error during OAuth flow or can't generate auth URL

**Cause:** Client ID or Client Secret is incorrect

**Fix:**
1. Verify credentials in Intuit portal
2. Update `/app/backend/.env`:
   ```
   QUICKBOOKS_CLIENT_ID=ABSb9lt1OEqUsOO4tsf3UewtCe9OHGCSgbXTfr7xX56iqhy9i9
   QUICKBOOKS_CLIENT_SECRET=qB6XscWqZsKgT3RRdZHojQqS48UjyzjfZd6S4ALA
   ```
3. Restart backend: `sudo supervisorctl restart backend`

---

### **Error: Callback Fails Silently**

**Symptom:** Redirected to QuickBooks, authorize, but nothing happens

**Cause:** Callback endpoint error or database issue

**Fix:**
1. Check backend error logs:
   ```bash
   sudo supervisorctl tail -100 backend | grep -i "error\|exception"
   ```
2. Look for MongoDB connection issues
3. Check if callback endpoint is accessible:
   ```bash
   curl -I https://snowmap-admin.preview.emergentagent.com/api/quickbooks/auth/callback
   ```

---

### **Error: "Production keys not available"**

**Symptom:** Can't use production credentials in Intuit portal

**Cause:** App not approved for production or still in development mode

**Fix:**
1. In Intuit Developer Portal, check app status
2. If still in "Development", you may need to:
   - Complete all required fields
   - Submit for review
   - Or use sandbox credentials for testing

**Note:** Some apps can use production immediately, others require approval.

---

## Step 5: Check Backend Configuration

### **Verify Environment Variables:**

```bash
cd /app/backend
grep QUICKBOOKS .env
```

**Should show:**
```
QUICKBOOKS_CLIENT_ID=ABSb9lt1OEqUsOO4tsf3UewtCe9OHGCSgbXTfr7xX56iqhy9i9
QUICKBOOKS_CLIENT_SECRET=qB6XscWqZsKgT3RRdZHojQqS48UjyzjfZd6S4ALA
QUICKBOOKS_REDIRECT_URI=https://snowmap-admin.preview.emergentagent.com/api/quickbooks/auth/callback
QUICKBOOKS_ENVIRONMENT=production
```

### **Verify Backend is Running:**

```bash
sudo supervisorctl status backend
```

**Should show:**
```
backend    RUNNING   pid 1798, uptime 0:XX:XX
```

---

## Step 6: Test Database Connection

### **Check if MongoDB is accessible:**

```bash
# Test MongoDB connection
python3 -c "
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def test():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    result = await db.command('ping')
    print('MongoDB connected:', result)

asyncio.run(test())
"
```

---

## Step 7: Enable Debug Logging

### **Temporary: Add more logging to see what's happening**

Check backend logs in real-time:

```bash
sudo supervisorctl tail -f backend
```

Then try to connect from the UI and watch the logs.

---

## 🔍 Quick Diagnostics

### **Run This Test:**

```bash
# Test authorization URL generation
curl -s 'https://snowmap-admin.preview.emergentagent.com/api/quickbooks/auth/connect?user_id=test' | python3 -m json.tool

# Check if URL contains production client ID
# Look for: ABSb9lt1OEqUsOO4tsf3UewtCe9OHGCSgbXTfr7xX56iqhy9i9
```

**If the Client ID in the URL is correct:** ✅ Backend is configured properly

**If the Client ID is wrong or missing:** ❌ Check .env and restart backend

---

## 📞 What to Tell Me

If still not working, please provide:

1. **What happens when you click "Connect"?**
   - Browser redirects to QuickBooks? YES/NO
   - Error message shown? What is it?
   - Stuck on loading? YES/NO

2. **After authorizing in QuickBooks:**
   - Redirected back to your app? YES/NO
   - What URL do you see?
   - Any error messages?

3. **Backend Logs:**
   ```bash
   sudo supervisorctl tail -50 backend | grep -i "quickbooks\|error"
   ```
   Share the output

4. **Intuit Portal Status:**
   - Is redirect URI configured? YES/NO
   - App status: Development / Production / Pending?
   - Any warnings in portal?

---

## ✅ Checklist

Before reporting an issue, verify:

- [ ] Production credentials in `.env` file
- [ ] Backend restarted after credential update
- [ ] Redirect URI configured in Intuit portal (exact match)
- [ ] MongoDB accessible
- [ ] Backend running without errors
- [ ] Authorization URL generates correctly
- [ ] Can access QuickBooks login page

---

## 🚨 Most Common Issue

**95% of connection failures are due to redirect URI mismatch!**

Make sure in Intuit Developer Portal:
```
https://snowmap-admin.preview.emergentagent.com/api/quickbooks/auth/callback
```

- ✅ Starts with https:// (not http://)
- ✅ No trailing slash
- ✅ Exact domain match
- ✅ /api/quickbooks/auth/callback (not /quickbooks/auth/callback)
