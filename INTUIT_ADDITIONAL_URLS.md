# Additional URLs for Intuit Developer Portal Configuration

## Required URLs for App Configuration

---

## 1️⃣ Host Domain

**Field Name:** "Host domain" or "Customer-facing domain"

**Format:** No "https://" protocol needed

**URL to provide:**
```
plowpro-admin.preview.emergentagent.com
```

**What it is:** The main domain where your application is hosted.

---

## 2️⃣ Launch URL

**Field Name:** "Launch URL" or "App Launch URL"

**Format:** Include the "https://" protocol

**URL to provide:**
```
https://erp-modernizer.preview.emergentagent.com/settings/quickbooks
```

**What it is:** The page customers are redirected to after successfully connecting their QuickBooks account. This shows the connection status, sync settings, and activity logs.

**Alternative option (if you prefer dashboard):**
```
https://erp-modernizer.preview.emergentagent.com
```
(Main dashboard - if you want users to start at the home page)

---

## 3️⃣ Disconnect URL

**Field Name:** "Disconnect URL" or "App Disconnect URL"

**Format:** Include the "https://" protocol

**URL to provide:**
```
https://erp-modernizer.preview.emergentagent.com/settings/quickbooks
```

**What it is:** The page customers are redirected to after disconnecting their QuickBooks integration. Same as Launch URL so they can reconnect if needed.

---

## 📋 Complete Configuration Summary

Here's a complete list of ALL URLs you need to configure in Intuit Developer Portal:

### Legal & Compliance
```
Privacy Policy URL:
https://erp-modernizer.preview.emergentagent.com/legal/privacy

End-User License Agreement URL (Terms of Service):
https://erp-modernizer.preview.emergentagent.com/legal/terms
```

### OAuth Configuration
```
Redirect URI:
https://erp-modernizer.preview.emergentagent.com/api/quickbooks/auth/callback
```

### App Configuration
```
Host Domain:
plowpro-admin.preview.emergentagent.com

Launch URL:
https://erp-modernizer.preview.emergentagent.com/settings/quickbooks

Disconnect URL:
https://erp-modernizer.preview.emergentagent.com/settings/quickbooks
```

---

## 🎯 Copy-Paste Ready Format

For quick copy-paste into Intuit forms:

| Field | Value |
|-------|-------|
| **Host Domain** | `plowpro-admin.preview.emergentagent.com` |
| **Launch URL** | `https://erp-modernizer.preview.emergentagent.com/settings/quickbooks` |
| **Disconnect URL** | `https://erp-modernizer.preview.emergentagent.com/settings/quickbooks` |
| **Privacy Policy URL** | `https://erp-modernizer.preview.emergentagent.com/legal/privacy` |
| **Terms of Service URL** | `https://erp-modernizer.preview.emergentagent.com/legal/terms` |
| **Redirect URI** | `https://erp-modernizer.preview.emergentagent.com/api/quickbooks/auth/callback` |

---

## 🔄 User Flow Explanation

### Connection Flow:
1. User clicks "Connect to QuickBooks" in your app (Settings → QuickBooks)
2. User is redirected to QuickBooks login
3. User authorizes the connection
4. **Redirect URI** handles the OAuth callback
5. **Launch URL** - User lands here seeing "Connected" status

### Disconnection Flow:
1. User clicks "Disconnect QuickBooks" in your app
2. Connection is revoked via API
3. **Disconnect URL** - User lands here with option to reconnect

---

## 📝 Alternative URL Options

If you prefer different landing pages, here are alternatives:

### Option 1: QuickBooks Settings Page (Recommended) ✓
```
Launch URL: https://erp-modernizer.preview.emergentagent.com/settings/quickbooks
Disconnect URL: https://erp-modernizer.preview.emergentagent.com/settings/quickbooks
```
**Pros:** 
- Users see immediate connection status
- Can configure sync settings right away
- Can view activity logs
- Consistent experience

### Option 2: Main Dashboard
```
Launch URL: https://erp-modernizer.preview.emergentagent.com
Disconnect URL: https://erp-modernizer.preview.emergentagent.com
```
**Pros:**
- Broader overview of the system
- Good for first-time users
**Cons:**
- Extra clicks to verify connection

### Option 3: Settings Home Page
```
Launch URL: https://erp-modernizer.preview.emergentagent.com/settings
Disconnect URL: https://erp-modernizer.preview.emergentagent.com/settings
```
**Pros:**
- Shows all integration options
**Cons:**
- Not as direct

**Recommendation:** Use Option 1 (QuickBooks settings page) for the best user experience.

---

## ✅ Verification Steps

After configuring all URLs in Intuit portal:

1. **Test Each URL:**
   - [ ] Visit privacy policy URL - should load
   - [ ] Visit terms of service URL - should load
   - [ ] Visit launch URL - should load QuickBooks settings
   - [ ] Visit disconnect URL - should load QuickBooks settings

2. **Test OAuth Flow:**
   - [ ] Click "Connect to QuickBooks" in your app
   - [ ] Complete authorization in QuickBooks
   - [ ] Verify you land on the Launch URL
   - [ ] Check connection status shows "Connected"

3. **Test Disconnect Flow:**
   - [ ] Click "Disconnect" button
   - [ ] Verify you land on the Disconnect URL
   - [ ] Check connection status shows "Not Connected"

---

## 🔧 If You Need to Change URLs Later

URLs can be updated in the Intuit Developer Portal:

1. Go to your app dashboard
2. Navigate to Settings or App Configuration
3. Update the URLs
4. Save changes
5. No code changes needed on your end

---

## 📞 Support Information

Include these in your Intuit app profile:

```
Support Email: support@cafinc.ca
Support Phone: +1 (587) 877-0293
Company: F Property Services
Location: Calgary, Alberta, Canada
```

---

## 🎉 Complete Configuration Checklist

Before submitting or going live:

- [ ] Host domain configured: `plowpro-admin.preview.emergentagent.com`
- [ ] Launch URL configured: `https://erp-modernizer.preview.emergentagent.com/settings/quickbooks`
- [ ] Disconnect URL configured: `https://erp-modernizer.preview.emergentagent.com/settings/quickbooks`
- [ ] Privacy Policy URL configured: `https://erp-modernizer.preview.emergentagent.com/legal/privacy`
- [ ] Terms of Service URL configured: `https://erp-modernizer.preview.emergentagent.com/legal/terms`
- [ ] Redirect URI configured: `https://erp-modernizer.preview.emergentagent.com/api/quickbooks/auth/callback`
- [ ] All URLs tested and accessible
- [ ] OAuth flow tested successfully
- [ ] Disconnect flow tested successfully

---

## 📚 Related Documentation

- **Complete Integration Docs:** `/app/QUICKBOOKS_INTEGRATION_README.md`
- **Setup Guide:** `/app/QUICKBOOKS_SETUP_COMPLETE.md`
- **Developer Portal Setup:** `/app/INTUIT_DEVELOPER_SETUP_GUIDE.md`
- **Legal URLs Info:** `/app/INTUIT_APP_SUBMISSION_INFO.md`

---

## 🚀 You're All Set!

With these URLs, you have everything needed for complete Intuit app configuration:

✅ All required URLs provided  
✅ All pages live and tested  
✅ OAuth flow configured  
✅ Legal compliance complete  
✅ User flows optimized  

**Copy the URLs above and paste them into your Intuit Developer Portal!** 🎉
