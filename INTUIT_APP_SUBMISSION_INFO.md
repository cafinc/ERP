# Intuit Developer Portal - App Configuration URLs

## Required URLs for Your QuickBooks App

When setting up your QuickBooks app in the Intuit Developer Portal, you'll need to provide these URLs:

---

## 📄 End-User License Agreement (EULA) / Terms of Service

**URL to provide:**
```
https://snowconnect.preview.emergentagent.com/legal/terms
```

**What it contains:**
- Complete Terms of Service
- QuickBooks integration terms
- User responsibilities
- Data ownership
- Service limitations
- Subscription and payment terms

**Page created at:** `/app/web-admin/app/legal/terms/page.tsx`

---

## 🔒 Privacy Policy

**URL to provide:**
```
https://snowconnect.preview.emergentagent.com/legal/privacy
```

**What it contains:**
- How we collect and use data
- QuickBooks integration data handling
- Data security measures
- User rights and choices
- PIPEDA compliance information
- Contact information

**Page created at:** `/app/web-admin/app/legal/privacy/page.tsx`

---

## 🔄 OAuth Redirect URI

**URL to provide:**
```
https://snowconnect.preview.emergentagent.com/api/quickbooks/auth/callback
```

**Important:**
- Must be HTTPS
- Must match exactly (no trailing slash)
- Already configured in your backend
- This handles the OAuth callback after authorization

---

## ✅ Complete Intuit App Configuration

Fill in these fields in the Intuit Developer Portal:

### App Information Tab
```
App Name: F Property Services Snow Removal System
App Description: Comprehensive snow removal management system with QuickBooks integration for automatic syncing of customers, invoices, payments, and estimates.
Category: Business Management / Field Services
```

### Keys & OAuth Tab
```
Redirect URIs:
  ✓ https://snowconnect.preview.emergentagent.com/api/quickbooks/auth/callback

Scopes:
  ✓ com.intuit.quickbooks.accounting (already configured)
```

### Legal & Compliance Tab
```
End-User License Agreement URL:
  https://snowconnect.preview.emergentagent.com/legal/terms

Privacy Policy URL:
  https://snowconnect.preview.emergentagent.com/legal/privacy

App Logo: (optional - upload your company logo)

Support Email: support@cafinc.ca
Support Phone: +1 (587) 877-0293
```

---

## 📋 Step-by-Step Instructions

### 1. Log into Intuit Developer Portal
- Go to https://developer.intuit.com
- Sign in with your account
- Navigate to "My Apps"
- Select your app

### 2. Configure Keys & OAuth
- Go to "Keys & OAuth" tab
- Under "Redirect URIs", click "Add URI"
- Enter: `https://snowconnect.preview.emergentagent.com/api/quickbooks/auth/callback`
- Click "Save"

### 3. Configure App Settings
- Go to "Settings" tab
- Fill in the app information above
- Save changes

### 4. Add Legal URLs
Look for fields labeled:
- "End-user license agreement URL" or "Terms of Service URL"
- "Privacy policy URL"

Enter the URLs provided above.

### 5. Save All Changes
- Click "Save" or "Update" buttons
- Verify all URLs are accessible (click to test)

---

## ✅ Verification Checklist

Before submitting or connecting, verify:

- [ ] Privacy Policy URL loads correctly
  - Visit: https://snowconnect.preview.emergentagent.com/legal/privacy
  - Should display privacy policy page
  
- [ ] Terms of Service URL loads correctly
  - Visit: https://snowconnect.preview.emergentagent.com/legal/terms
  - Should display terms page
  
- [ ] Redirect URI is exactly as specified
  - `https://snowconnect.preview.emergentagent.com/api/quickbooks/auth/callback`
  - No typos, no trailing slash, HTTPS protocol
  
- [ ] All changes are saved in Intuit portal
  
- [ ] App status shows as "Development" (for testing)

---

## 🧪 Testing After Configuration

1. **Test the OAuth Flow:**
   - Go to Settings → QuickBooks in your admin panel
   - Click "Connect to QuickBooks"
   - You should be redirected to QuickBooks login
   - After authorizing, you should be redirected back successfully

2. **If Connection Fails:**
   - Check browser console for errors
   - Verify redirect URI matches exactly
   - Check backend logs: `sudo supervisorctl tail backend`
   - Review sync logs in the UI

---

## 📞 Support Contacts for Legal Pages

The legal pages include these contact details:

**Email:**
- General: support@cafinc.ca
- Privacy: privacy@cafinc.ca

**Phone:**
- +1 (587) 877-0293

**Address:**
- Calgary, Alberta, Canada

**Note:** You can update these contact details by editing the page files:
- Privacy Policy: `/app/web-admin/app/legal/privacy/page.tsx`
- Terms of Service: `/app/web-admin/app/legal/terms/page.tsx`

---

## 🎯 Quick Copy-Paste

For quick copy-paste into Intuit forms:

**Privacy Policy URL:**
```
https://snowconnect.preview.emergentagent.com/legal/privacy
```

**Terms of Service URL:**
```
https://snowconnect.preview.emergentagent.com/legal/terms
```

**Redirect URI:**
```
https://snowconnect.preview.emergentagent.com/api/quickbooks/auth/callback
```

---

## 🚀 You're Ready!

With these URLs configured in the Intuit Developer Portal:
1. ✅ Privacy Policy - Created and accessible
2. ✅ Terms of Service - Created and accessible
3. ✅ Redirect URI - Already configured in backend
4. ✅ OAuth credentials - Already in .env file

**Next Step:** Copy the URLs above into your Intuit app configuration and test the connection!

---

## 📝 Notes

- Both legal pages are professionally written and comprehensive
- They include specific sections about QuickBooks integration
- They comply with Canadian privacy laws (PIPEDA, PIPA)
- They meet Intuit's requirements for app developers
- Pages are styled to match your admin dashboard design
- All pages are publicly accessible (no login required)

---

**Need to update the legal pages?** Edit these files:
- `/app/web-admin/app/legal/privacy/page.tsx`
- `/app/web-admin/app/legal/terms/page.tsx`

Then restart the web-admin if needed (Next.js hot reload should work automatically).
