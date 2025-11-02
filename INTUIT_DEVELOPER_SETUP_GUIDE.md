# Intuit Developer Portal Setup Guide

## Overview

This guide will walk you through setting up your QuickBooks app in the Intuit Developer Portal. You'll learn about the difference between sandbox and production, and how to configure your app correctly.

---

## 📝 Understanding Sandbox vs Production

### Sandbox Environment (Testing)
- **Purpose**: For development and testing
- **Free**: No cost to use
- **Isolated**: Uses test QuickBooks companies with fake data
- **Safe**: No real financial transactions
- **Use when**: Building, testing, debugging your integration

### Production Environment (Live)
- **Purpose**: For real business use
- **Live data**: Connects to actual QuickBooks companies
- **Real transactions**: Creates actual invoices, payments, etc.
- **Use when**: Integration is tested and ready for customers

### Important Note
**The same app provides BOTH sandbox and production keys!** You don't need separate apps. You just switch between them using the same Client ID and Client Secret.

---

## 🚀 Step-by-Step Setup

### Step 1: Create Intuit Developer Account

1. Go to https://developer.intuit.com
2. Click **"Sign Up"** or **"Get Started"**
3. Sign in with:
   - Your existing Intuit account (if you have QuickBooks), OR
   - Create a new account with email/password
4. Complete email verification

### Step 2: Create Your App

1. Once logged in, click **"My Apps"** in the top navigation
2. Click **"Create an app"** button
3. You'll see two options:

   **Option A: QuickBooks Online Accounting**
   - Choose this for accounting features (invoices, customers, payments)
   - This is what you want! ✓

   **Option B: QuickBooks Payments**
   - For payment processing only
   - Not needed unless you want to process credit cards

4. Click **"Select APIs"** under "QuickBooks Online Accounting"

### Step 3: Configure Your App

Fill in the app details:

**App Name:**
```
F Property Services Snow Removal System
```
(Or whatever name you prefer - this is just for your reference)

**App Description:**
```
Snow removal management system with QuickBooks integration for automatic syncing of customers, invoices, payments, and estimates.
```

**App Category:**
- Select **"Business Management"** or **"Construction/Field Services"**

Click **"Create app"**

### Step 4: Configure Keys & OAuth Settings

After creating your app, you'll be taken to the app dashboard. Follow these steps:

1. Click on the **"Keys & OAuth"** tab in the left sidebar

You'll see two sections:

#### Section 1: Development Keys (Sandbox)
```
Client ID: ABdknRlnQfJGNRNMkuSmvAFCSJwYK1ulX1ov9YsFuEPLaS7A9t
Client Secret: j1wT3lTiuv6XjLwsDweWNulPa6Ml69d9VZ1YYSbG
```
**These are your SANDBOX credentials** (already configured in your .env file) ✓

#### Section 2: Production Keys
These are initially hidden. You'll see a message like:
```
"Production keys will be available after your app is published"
```

**Important:** Production keys use the **SAME Client ID and Client Secret** as sandbox! The difference is just in the environment setting.

### Step 5: Configure Redirect URIs

This is **CRITICAL** - if this isn't set correctly, OAuth won't work!

Scroll down to **"Redirect URIs"** section:

1. Click **"Add URI"**
2. Enter **EXACTLY** this URL:
   ```
   https://asset-admin-1.preview.emergentagent.com/api/quickbooks/auth/callback
   ```
3. Click **"Save"**

**Important Notes:**
- ✓ Must be HTTPS (not HTTP)
- ✓ No trailing slash
- ✓ Must match exactly what's in your .env file
- ✓ This URI works for BOTH sandbox and production

You can add multiple redirect URIs if you have different environments:
- Development: `http://localhost:8000/api/quickbooks/auth/callback`
- Staging: `https://staging.yourdomain.com/api/quickbooks/auth/callback`
- Production: `https://yourdomain.com/api/quickbooks/auth/callback`

---

## 🔑 What Keys Do You Need?

### For Testing (Current Setup) ✓

You already have everything you need!

```
Client ID: ABdknRlnQfJGNRNMkuSmvAFCSJwYK1ulX1ov9YsFuEPLaS7A9t
Client Secret: j1wT3lTiuv6XjLwsDweWNulPa6Ml69d9VZ1YYSbG
Environment: sandbox
```

These credentials work with:
- Sandbox QuickBooks companies
- Test data only
- Perfect for development and testing

### For Production (Future)

When you're ready to go live with real customers:

**Same credentials, different environment!**

```
Client ID: ABdknRlnQfJGNRNMkuSmvAFCSJwYK1ulX1ov9YsFuEPLaS7A9t
Client Secret: j1wT3lTiuv6XjLwsDweWNulPa6Ml69d9VZ1YYSbG
Environment: production  ← Just change this!
```

**How to switch to production:**
1. In `/app/backend/.env`, change:
   ```
   QUICKBOOKS_ENVIRONMENT=sandbox
   ```
   to:
   ```
   QUICKBOOKS_ENVIRONMENT=production
   ```
2. Restart backend: `sudo supervisorctl restart backend`
3. Reconnect to QuickBooks
4. Now you're using REAL QuickBooks companies!

---

## 🧪 Testing Your Setup

### Step 1: Verify Your App Configuration

Go to your app in the developer portal:

1. **Keys & OAuth tab**
   - [ ] Client ID is visible
   - [ ] Client Secret is visible (click "Show" to reveal)
   - [ ] Redirect URI is configured: `https://asset-admin-1.preview.emergentagent.com/api/quickbooks/auth/callback`

2. **Settings tab**
   - [ ] App name is set
   - [ ] App description is set

### Step 2: Create a Sandbox Test Company

You need a QuickBooks sandbox company to test with:

1. In the developer portal, go to **"Sandbox"** in the left menu
2. Click **"Create sandbox company"** (if you don't have one)
3. Choose a company type:
   - **Service-based business** ← Choose this for snow removal
   - Retail/Product business
   - Other
4. Click **"Create"**

This creates a fake QuickBooks company with sample data you can test with.

### Step 3: Test the OAuth Connection

1. Open your web admin: https://asset-admin-1.preview.emergentagent.com
2. Go to **Settings → QuickBooks**
3. Click **"Connect to QuickBooks"**
4. You should see the QuickBooks login page
5. Sign in with your Intuit Developer account credentials
6. Select your sandbox company
7. Click **"Connect"** or **"Authorize"**
8. You should be redirected back to your settings page with "Connected" status

**If it works:** ✓ Your setup is correct!

**If it fails:** See troubleshooting below

---

## ❌ Common Issues & Solutions

### Issue 1: "Redirect URI Mismatch"

**Error:** `redirect_uri_mismatch` or `invalid_redirect_uri`

**Solution:**
1. Go to Intuit Developer Portal → Your App → Keys & OAuth
2. Check that the redirect URI is **EXACTLY**:
   ```
   https://asset-admin-1.preview.emergentagent.com/api/quickbooks/auth/callback
   ```
3. Common mistakes:
   - ❌ `http://` instead of `https://`
   - ❌ Trailing slash: `.../callback/`
   - ❌ Different domain
   - ❌ Typos in the path
4. Save and try again

### Issue 2: "Invalid Client"

**Error:** `invalid_client` or authentication fails

**Solution:**
1. Verify your Client ID and Client Secret in `/app/backend/.env`
2. Make sure there are no extra spaces or quotes
3. Copy directly from the developer portal (click "Show" to reveal secret)
4. Restart backend after updating .env

### Issue 3: Can't See Production Keys

**This is normal!** Production keys are the same as development keys. You just change the environment setting.

### Issue 4: "App Not Found" or "Invalid App"

**Solution:**
1. Make sure your app status is "Development" or "Published"
2. If the app is deleted or suspended, create a new one
3. Check that you're signed in with the correct Intuit account

---

## 📋 Checklist for Going Live (Production)

Before switching to production:

- [ ] **Test thoroughly in sandbox**
  - [ ] Create customers successfully
  - [ ] Create invoices successfully
  - [ ] Record payments successfully
  - [ ] View sync logs (all operations show success)

- [ ] **Security review**
  - [ ] Tokens stored securely in database
  - [ ] HTTPS enabled everywhere
  - [ ] No credentials in logs or error messages
  - [ ] Authentication middleware active

- [ ] **User training**
  - [ ] Train staff on how to use the integration
  - [ ] Document your workflow
  - [ ] Create backup procedures

- [ ] **Production configuration**
  - [ ] Change `QUICKBOOKS_ENVIRONMENT=production` in .env
  - [ ] Update redirect URI in production environment (if different domain)
  - [ ] Add production redirect URI to Intuit app settings
  - [ ] Restart backend with new configuration

- [ ] **Monitoring**
  - [ ] Set up sync log monitoring
  - [ ] Create alerts for sync failures
  - [ ] Document troubleshooting procedures

---

## 🎓 Understanding OAuth Scopes

When users connect to QuickBooks, they're asked to authorize specific permissions (scopes):

### What You're Currently Using:

**`com.intuit.quickbooks.accounting`** - This gives you access to:
- Customers (create, read, update)
- Invoices (create, read, update)
- Payments (create, read, update)
- Estimates (create, read, update)
- Items (read for invoice line items)
- Accounts (read for accounting)

This is all you need for the current integration! ✓

### Other Available Scopes (Future):

If you need additional features later:

- `com.intuit.quickbooks.payment` - Process credit card payments
- `openid` - Get user profile information
- `email` - Access user's email address
- `profile` - Access user's name and profile

---

## 📞 Intuit Support Resources

### Developer Documentation
- Main docs: https://developer.intuit.com/app/developer/qbo/docs/get-started
- API Explorer: https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/customer
- Community: https://help.developer.intuit.com/s/

### Getting Help

1. **Developer Forums**
   - https://help.developer.intuit.com/s/
   - Search for similar issues
   - Post questions with error details

2. **Support Tickets**
   - In developer portal: Contact Support
   - Include: App name, error messages, steps to reproduce

3. **Status Page**
   - https://developer.intuit.com/app/developer/qbo/docs/api/accounting/status
   - Check if there are ongoing API issues

---

## 🎯 Quick Reference

### What You Currently Have (Working)

```
Environment: Sandbox (Testing)
Client ID: ABdknRlnQfJGNRNMkuSmvAFCSJwYK1ulX1ov9YsFuEPLaS7A9t
Client Secret: j1wT3lTiuv6XjLwsDweWNulPa6Ml69d9VZ1YYSbG
Redirect URI: https://asset-admin-1.preview.emergentagent.com/api/quickbooks/auth/callback
Scope: com.intuit.quickbooks.accounting
Status: ✓ Working - Ready to test!
```

### What You'll Use for Production (Same Keys!)

```
Environment: Production (Live)
Client ID: ABdknRlnQfJGNRNMkuSmvAFCSJwYK1ulX1ov9YsFuEPLaS7A9t ← Same!
Client Secret: j1wT3lTiuv6XjLwsDweWNulPa6Ml69d9VZ1YYSbG ← Same!
Redirect URI: https://asset-admin-1.preview.emergentagent.com/api/quickbooks/auth/callback ← Same!
Scope: com.intuit.quickbooks.accounting ← Same!
Only difference: Change QUICKBOOKS_ENVIRONMENT in .env
```

---

## ✅ Your Current Setup Status

Based on the credentials you provided:

- ✅ You have valid Client ID and Client Secret
- ✅ Credentials are configured in .env
- ✅ Backend is running with QuickBooks integration
- ✅ API endpoints are working (tested successfully)
- ✅ Frontend UI is ready
- ⚠️ **ONLY REMAINING STEP:** Verify redirect URI in Intuit Developer Portal

---

## 🚀 Next Action Items

1. **Verify Redirect URI** (Most Important!)
   - Log into https://developer.intuit.com
   - Go to your app → Keys & OAuth
   - Confirm redirect URI is: `https://asset-admin-1.preview.emergentagent.com/api/quickbooks/auth/callback`
   - If not there, add it and save

2. **Create Sandbox Company** (if you don't have one)
   - Developer portal → Sandbox
   - Create a test company

3. **Test Connection**
   - Settings → QuickBooks
   - Click "Connect to QuickBooks"
   - Should work! 🎉

---

## 💡 Pro Tips

1. **Bookmark these URLs:**
   - Developer Portal: https://developer.intuit.com/app/developer/myapps
   - Your App Dashboard: (go to My Apps → click your app)
   - API Explorer: https://developer.intuit.com/app/developer/qbo/docs/api/accounting

2. **Keep credentials safe:**
   - Never commit .env to git
   - Don't share Client Secret publicly
   - Use environment variables in production

3. **Test in sandbox first:**
   - Always test new features in sandbox
   - Create test scenarios
   - Only move to production when confident

4. **Monitor sync logs:**
   - Check regularly for errors
   - Set up alerts for failures
   - Review logs after major changes

---

## 📧 Need Help?

If you're stuck:

1. **Check this guide first** - Most issues are covered above
2. **Check backend logs**: `sudo supervisorctl tail backend`
3. **Test API directly** with curl (examples in QUICKBOOKS_INTEGRATION_README.md)
4. **Check Intuit Developer Portal** for any error messages
5. **Review sync logs** in the UI for specific error details

---

**You're almost there!** Just verify the redirect URI in the Intuit portal and you'll be ready to connect! 🚀
